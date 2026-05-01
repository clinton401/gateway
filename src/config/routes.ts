import type { RouteConfig, HttpMethod, HeaderOperation, BodyOperation, PathRewriteConfig, TransformConfig } from "../types/index";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";


const VALID_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "ALL"]);

function parseHeaderOps(data: Prisma.JsonValue, routeId: string, type: string): HeaderOperation[] | undefined {
    if (!data) return undefined;
    if (!Array.isArray(data)) {
        console.warn(`⚠️ [Route: ${routeId}] Malformed ${type}: Expected an array. Ignoring.`);
        return undefined;
    }
    const valid = data.every(item => item && typeof item === "object" && "op" in item);
    if (!valid) {
        console.warn(`⚠️ [Route: ${routeId}] Malformed ${type}: Missing 'op' field in array items. Ignoring.`);
        return undefined;
    }
    return data as unknown as  HeaderOperation[];
}

function parseBodyOps(data: Prisma.JsonValue, routeId: string, type: string): BodyOperation[] | undefined {
    if (!data) return undefined;
    if (!Array.isArray(data)) {
        console.warn(`⚠️ [Route: ${routeId}] Malformed ${type}: Expected an array. Ignoring.`);
        return undefined;
    }
    const valid = data.every(item => item && typeof item === "object" && "op" in item);
    if (!valid) {
        console.warn(`⚠️ [Route: ${routeId}] Malformed ${type}: Missing 'op' field. Ignoring.`);
        return undefined;
    }
    return data as unknown as  BodyOperation[];
}

function parsePathRewrite(data: Prisma.JsonValue, routeId: string): PathRewriteConfig | undefined {
    if (!data) return undefined;
    if (typeof data !== "object" || Array.isArray(data)) {
        console.warn(`⚠️ [Route: ${routeId}] Malformed requestPathTransform: Expected an object. Ignoring.`);
        return undefined;
    }
    return data as PathRewriteConfig;
}

export const loadRoutesFromDatabase = async (): Promise<RouteConfig[]> => {
    // 2. Fetch from DB
    const dbRoutes = await prisma.route.findMany({
        where: { enabled: true }
    });

    const safeRoutes: RouteConfig[] = [];

    // 3. Loop and validate each one manually
    for (const dbRoute of dbRoutes) {

        // --- THE SAFETY CHECK ---
        if (!VALID_METHODS.has(dbRoute.method)) {
            console.error(`🚨 CRITICAL: Invalid HTTP method "${dbRoute.method}" found for route ID ${dbRoute.id}. Skipping this route to prevent crash.`);
            // We 'continue' instead of 'throw' so the rest of the gateway still boots!
            continue;
        }
        const requestHeaders = parseHeaderOps(dbRoute.requestHeaderTransform, dbRoute.id, "requestHeaderTransform");
        const responseHeaders = parseHeaderOps(dbRoute.responseHeaderTransform, dbRoute.id, "responseHeaderTransform");
        const requestBody = parseBodyOps(dbRoute.requestBodyTransform, dbRoute.id, "requestBodyTransform");
        const responseBody = parseBodyOps(dbRoute.responseBodyTransform, dbRoute.id, "responseBodyTransform");
        const requestPath = parsePathRewrite(dbRoute.requestPathTransform, dbRoute.id);

        // 2. Build the TransformConfig object ONLY if needed
        let transform: TransformConfig | undefined = undefined;
        if (requestHeaders || responseHeaders || requestBody || responseBody || requestPath) {
            transform = {
                ...(requestHeaders && { requestHeaders }),
                ...(responseHeaders && { responseHeaders }),
                ...(requestBody && { requestBody }),
                ...(responseBody && { responseBody }),
                ...(requestPath && { requestPath }),
            };
        }

        // 4. Safely push to the array. 
        // We only cast 'dbRoute.method' here because we JUST mathematically proved it is valid.
        safeRoutes.push({
            id: dbRoute.id,
            path: dbRoute.path,
            method: dbRoute.method as HttpMethod | "ALL",
            upstream: dbRoute.upstream,
            stripPath: dbRoute.stripPath || "", // Handle Prisma's nulls gracefully
            enabled: dbRoute.enabled,
            rateLimitMax: dbRoute.rateLimitMax,
            rateLimitWindowMs: dbRoute.rateLimitWindowMs,
            rateLimitKeyBy: dbRoute.rateLimitKeyBy,
            rateLimitKeyHeader: dbRoute.rateLimitKeyHeader,
            cbFailureThreshold: dbRoute.cbFailureThreshold,
            cbWindowSize: dbRoute.cbWindowSize,
            cbCooldownMs: dbRoute.cbCooldownMs,
            cbSuccessThreshold: dbRoute.cbSuccessThreshold,
            authMode: dbRoute.authMode,
            authJwtSecret: dbRoute.authJwtSecret,   
            authJwtRequiredClaims: dbRoute.authJwtRequiredClaims as Record<string, string> | null,
            authKeyHeader: dbRoute.authKeyHeader,
            ...(transform ? { transform } : {})
        });
    }

    return safeRoutes;
}
// Build a lookup Map at startup, not at request time.
// O(1) route resolution on every request.
export function buildRouteTable(configs: RouteConfig[]): Map<string, RouteConfig> {
    const table = new Map<string, RouteConfig>();

    for (const route of configs) {
        if (!route.enabled) continue;
        // Key is "METHOD:path" — unambiguous
        const key = `${route.method}:${route.path}`;
        table.set(key, route);
    }

    return table;
}