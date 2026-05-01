import "dotenv/config";
import express from "express";
import { setupDatabaseListener } from "./config/db-listener";
import { createGatewayHandler } from "./proxy/proxy-handler";
import { errorHandler } from "./middleware/error-handler";
import { loadRoutesFromDatabase, buildRouteTable } from "./config/routes";
import { createRateLimiter } from "./middleware/rate-limiter";
import { createCircuitBreaker } from "./middleware/circuit-breaker";
import { RouteTableContainer } from "./types/index";

import { redis } from "./lib/redis";
import { createAuthEnforcer } from "./middleware/auth-enforcer";

import { createRequestTransformer } from "./middleware/request-transformers";

const PORT = process.env.PORT ?? 3000;

async function bootstrap(): Promise<void> {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    try {
        // 1. THE COLD BOOT
        const initialRoutes = await loadRoutesFromDatabase();

        // 2. Build the initial Map
        const container: RouteTableContainer = {
            table: buildRouteTable(initialRoutes),
            lastReloadAt: new Date()
        };

        // 3. THE HOT RELOAD
        await setupDatabaseListener(container);
        // const routeTable = container.table;

        // 👇 2. Make the health check async
        app.get("/gateway/health", async (_req, res) => {
            try {
                // Fetch health data for all routes in parallel
                const routesHealth = await Promise.all(
                    Array.from(container.table.values()).map(async (route) => {
                        // If the route doesn't have a CB configured, skip the Redis checks
                        if (!route.cbFailureThreshold) {
                            return {
                                id: route.id,
                                path: route.path,
                                circuitBreaker: "DISABLED"
                            };
                        }

                        const stateKey = `cb:state:${route.id}`;
                        const cooldownKey = `cb:cooldown:${route.id}`;
                        const outcomesKey = `cb:outcomes:${route.id}`;

                        // Read the current state (default to CLOSED)
                        const state = (await redis.get(stateKey)) || "CLOSED";

                        let cooldownRemainingMs: number | undefined;
                        let recentFailureRate: number | undefined;

                        if (state === "OPEN") {
                            // If OPEN, get the exact time left on the egg timer
                            const pttl = await redis.pttl(cooldownKey);
                            cooldownRemainingMs = pttl > 0 ? pttl : 0;
                        } else {
                            // If CLOSED or HALF_OPEN, calculate the failure rate
                            const outcomes = await redis.lrange(outcomesKey, 0, -1);
                            if (outcomes.length > 0) {
                                const failures = outcomes.filter(o => o === "FAILURE").length;
                                // e.g., 2 failures / 10 total = 0.2 (20% failure rate)
                                recentFailureRate = failures / outcomes.length;
                            } else {
                                recentFailureRate = 0;
                            }
                        }

                        return {
                            id: route.id,
                            path: route.path,
                            circuitBreaker: state,
                            ...(cooldownRemainingMs !== undefined && { cooldownRemainingMs }),
                            ...(recentFailureRate !== undefined && { recentFailureRate })
                        };
                    })
                );

                res.json({
                    status: "ok",
                    routeCount: container.table.size,
                    timestamp: new Date().toISOString(),
                    lastReloadAt: container.lastReloadAt?.toISOString(),
                    routes: routesHealth
                });

            } catch (error) {
                console.error("Health check error:", error);
                res.status(500).json({ status: "error", message: "Failed to fetch health status" });
            }
        });

        app.use(createRateLimiter(container));
        app.use(createAuthEnforcer(container));
        app.use(createCircuitBreaker(container));
        app.use(createRequestTransformer(container));
        app.use(createGatewayHandler(container));
        app.use(errorHandler);

        app.listen(PORT, () => {
            console.info(`🚀 Gateway running on port ${PORT}`);
            console.info(`✅ Routes loaded: ${container.table.size}`);
        });

    } catch (error) {
        console.error("❌ CRITICAL: Failed to start the API Gateway.", error);
        process.exit(1);
    }
}

bootstrap();