import type { Request, Response, NextFunction, RequestHandler } from "express";
import { redis } from "../lib/redis";
import type { RouteConfig, RouteTableContainer } from "../types/index";
import { matchRoute } from "../proxy/route-matcher";
import crypto from "crypto";

// --- THE LUA SCRIPT ---
// Written exactly to the spec.
// ARGV: [now, windowMs, maxLimit, uniqueId]
const SLIDING_WINDOW_LUA = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowMs = tonumber(ARGV[2])
    local maxLimit = tonumber(ARGV[3])
    local uniqueMember = ARGV[4]

    -- 1. Remove entries older than the sliding window
    local minScore = now - windowMs
    redis.call('ZREMRANGEBYSCORE', key, '-inf', minScore)

    -- 2. Add the current request (Score = timestamp, Member = unique string)
    redis.call('ZADD', key, now, uniqueMember)

    -- 3. Set expiry to auto-clean memory if the user stops sending requests
    redis.call('PEXPIRE', key, windowMs)

    -- 4. Count the total members and return it
    local currentCount = redis.call('ZCARD', key)
    
    return currentCount
`;

// Helper function to extract the correct client identifier
function getClientIdentifier(req: Request, route: RouteConfig): string | null {
    const keyBy = route.rateLimitKeyBy || "ip"; // Default to IP if not specified

    if (keyBy === "ip") {
        // Handle load balancers and proxies first
        const forwardedFor = req.headers["x-forwarded-for"];
        if (forwardedFor) {
            // x-forwarded-for can be a comma-separated list. The first one is the real client.
            return typeof forwardedFor === "string"
                ? forwardedFor.split(",")[0].trim()
                : forwardedFor[0].split(",")[0].trim();
        }
        return req.ip || req.socket.remoteAddress || "unknown_ip";
    }

    if (keyBy === "apiKey") {
        const apiKey = req.headers["x-api-key"];
        return typeof apiKey === "string" ? apiKey : null;
    }

    if (keyBy === "header" && route.rateLimitKeyHeader) {
        const headerValue = req.headers[route.rateLimitKeyHeader.toLowerCase()];
        return typeof headerValue === "string" ? headerValue : null;
    }

    return null;
}

// --- THE MIDDLEWARE FACTORY ---
export function createRateLimiter(container: RouteTableContainer): RequestHandler {

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 1. Find the matched route
            const route = matchRoute(req.method, req.path, container.table);

            if (!route) {
                // Let the proxy handler deal with the 404
                return next();
            }

            // 2. Check if the route has rate limit config
            if (!route.rateLimitMax || !route.rateLimitWindowMs) {
                return next();
            }

            // 3. Determine the client identifier
            const clientIdentifier = getClientIdentifier(req, route);

            if (!clientIdentifier) {
                res.status(400).json({
                    error: "BAD_REQUEST",
                    message: `Missing required identification. Route requires: ${route.rateLimitKeyBy === 'header' ? route.rateLimitKeyHeader : route.rateLimitKeyBy}`
                });
                return;
            }

            // 4. Build the Redis key
            const redisKey = `rl:${route.id}:${clientIdentifier}`;

            // 5. Run the Lua script
            const now = Date.now();
            const uniqueId = `${now}-${crypto.randomUUID()}`; // Guarantee uniqueness

            const currentCount = await redis.eval(
                SLIDING_WINDOW_LUA,
                1, // Number of KEYS
                redisKey,
                now,
                route.rateLimitWindowMs,
                route.rateLimitMax,
                uniqueId
            ) as number;

            // 6. Decide
            if (currentCount > route.rateLimitMax) {

                // Spec Requirement: Calculate precise Retry-After
                // ZRANGE key 0 0 WITHSCORES gets the oldest entry in the current window
                const oldestEntry = await redis.zrange(redisKey, 0, 0, "WITHSCORES");

                let retryAfterSeconds = Math.ceil(route.rateLimitWindowMs / 1000); // Fallback

                if (oldestEntry && oldestEntry.length === 2) {
                    const oldestTimestamp = parseInt(oldestEntry[1], 10);
                    retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + route.rateLimitWindowMs - now) / 1000));
                }

                // Set headers and block
                res.setHeader("Retry-After", String(retryAfterSeconds));
                res.status(429).json({
                    error: "RATE_LIMIT_EXCEEDED",
                    limit: route.rateLimitMax,
                    windowMs: route.rateLimitWindowMs,
                    retryAfterSeconds: retryAfterSeconds
                });
                return;
            }

            // 7. If within limit, set propagation headers and proceed
            res.setHeader("X-RateLimit-Limit", String(route.rateLimitMax));
            res.setHeader("X-RateLimit-Remaining", String(route.rateLimitMax - currentCount));
            res.setHeader("X-RateLimit-Window", String(route.rateLimitWindowMs));

            return next();

        } catch (error) {
            console.error("❌ CRITICAL: Rate Limiter crashed.", error);
            // Senior Pattern: Fail Open. Don't take down the gateway if Redis blips.
            return next();
        }
    };
}