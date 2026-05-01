import { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { matchRoute } from "../proxy/route-matcher";
import type { RouteTableContainer } from "../types";
import type { ApiKey } from "@prisma/client";

export async function invalidateApiKeyCache(keyHash: string): Promise<void> {
    await redis.del(`auth:key:${keyHash}`);
}

export const createAuthEnforcer = (container: RouteTableContainer): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const route = matchRoute(req.method, req.path, container.table);

            if (!route || !route.authMode || route.authMode === "none") {
                return next();
            }
            if (route.authMode === "apiKey") {
                const headerName = route.authKeyHeader ?? "x-api-key";
                const key = req.get(headerName);

                if (!key) {
                    res.status(401).json({
                        error: "MISSING_API_KEY",
                        message: `This route requires an API key. Provide it in the ${headerName} header.`,
                    });
                    return;
                }

                const keyHash = crypto.createHash("sha256").update(key, "utf8").digest("hex");
                const CACHE_PREFIX = "auth:key:";
                let apiKey: ApiKey | null = null;

            
                try {
                    const cached = await redis.get(CACHE_PREFIX + keyHash);
                    if (cached) {
                        apiKey = JSON.parse(cached) as ApiKey;
                    }
                } catch (err) {
                    console.warn("Redis cache read failed during auth:", err);
                }

                if (!apiKey) {
                    apiKey = await prisma.apiKey.findUnique({
                        where: { keyHash },
                    });

                    if (!apiKey) {
                        res.status(401).json({ error: "INVALID_API_KEY", message: "Invalid API key." });
                        return;
                    }

                    await redis.set(CACHE_PREFIX + keyHash, JSON.stringify(apiKey), "EX", 300).catch(() => { });
                }

                if (!apiKey.enabled) {
                    res.status(401).json({ error: "KEY_DISABLED", message: "This API key is disabled." });
                    return;
                }

                const expiryDate = apiKey.expiresAt ? new Date(apiKey.expiresAt) : null;
                if (expiryDate && expiryDate.getTime() <= Date.now()) {
                    res.status(401).json({ error: "KEY_EXPIRED", message: "This API key has expired." });
                    return;
                }

                if (apiKey.routeScope.length > 0 && !apiKey.routeScope.includes(route.id)) {
                    res.status(403).json({
                        error: "KEY_NOT_AUTHORIZED_FOR_ROUTE",
                        message: "This API key lacks permissions for this route.",
                    });
                    return;
                }

                prisma.apiKey.update({
                    where: { id: apiKey.id },
                    data: { lastUsedAt: new Date() },
                }).catch(err => console.error("Failed to update key usage:", err));

                req.headers["x-gateway-key-id"] = apiKey.id;
                req.headers["x-gateway-key-prefix"] = apiKey.keyPrefix;
                req.headers["x-gateway-scope"] = apiKey.routeScope.join(",");
                delete req.headers[headerName.toLowerCase()]; 

                return next();
            }

            if (route.authMode === "jwt") {
                const authHeader = req.get("authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    res.status(401).json({
                        error: "MISSING_TOKEN",
                        message: "Provide a valid JWT in the Authorization: Bearer header.",
                    });
                    return;
                }

                const token = authHeader.split(" ")[1];
                const secret = route.authJwtSecret;

                if (!secret) {
                    console.error(`Route ${route.id} is configured for JWT but missing a secret.`);
                    res.status(500).json({ error: "GATEWAY_CONFIG_ERROR", message: "Invalid auth configuration." });
                    return;
                }

                try {
                    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

                    if (route.authJwtRequiredClaims) {
                        for (const [claim, expectedValue] of Object.entries(route.authJwtRequiredClaims)) {
                            if (decoded[claim] !== expectedValue) {
                                res.status(403).json({
                                    error: "INSUFFICIENT_CLAIMS",
                                    message: `Required claim '${claim}' not satisfied.`,
                                });
                                return;
                            }
                        }
                    }

                    req.headers["x-gateway-user-id"] = String(decoded.sub ?? "");
                    if (decoded.role) req.headers["x-gateway-user-role"] = String(decoded.role);
                    req.headers["x-gateway-token-exp"] = String(decoded.exp ?? "");
                    delete req.headers["authorization"];

                    return next();

                } catch (error) {
                    if (error instanceof jwt.TokenExpiredError) {
                        res.status(401).json({ error: "TOKEN_EXPIRED", message: "The provided JWT has expired." });
                        return;
                    }
                    res.status(401).json({ error: "INVALID_TOKEN", message: "The provided JWT is invalid." });
                    return;
                }
            }

        } catch (error) {
            console.error("❌ CRITICAL: Auth Enforcer middleware crashed.", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Auth verification failed." });
        }
    };
};