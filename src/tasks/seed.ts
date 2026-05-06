
import { createHash } from "crypto";
import { subDays, subHours, subMinutes, addDays } from "date-fns";
import {prisma} from "../lib/prisma";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashKey(plaintext: string): string {
    return createHash("sha256").update(plaintext).digest("hex");
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomLatency(statusCode: number): number {
    if (statusCode >= 500) return randomInt(400, 1200);
    if (statusCode === 429) return randomInt(5, 20);
    if (statusCode >= 400) return randomInt(30, 150);
    return randomInt(12, 380);
}

function weightedStatusCode(): number {
    const roll = Math.random();
    if (roll < 0.68) return 200;
    if (roll < 0.74) return 201;
    if (roll < 0.78) return 204;
    if (roll < 0.82) return 400;
    if (roll < 0.85) return 401;
    if (roll < 0.87) return 403;
    if (roll < 0.89) return 404;
    if (roll < 0.92) return 429;
    if (roll < 0.95) return 500;
    if (roll < 0.98) return 502;
    return 503;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// 120 routes across 25 microservices
// ---------------------------------------------------------------------------

const ROUTES = [

    // =========================================================================
    // USER SERVICE  :4000
    // =========================================================================
    {
        path: "/api/v1/users",
        method: "GET",
        upstream: "http://user-service:4000",
        stripPath: "/api/v1",
        enabled: true,
        rateLimitMax: 1000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const,
        authJwtSecret: "user-service-secret-min-32-chars-long",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: [
            { op: "set", header: "X-Service-Version", value: "v1" },
            { op: "set", header: "X-Request-Source", value: "gateway" },
        ],
        responseHeaderTransform: [
            { op: "remove", header: "X-Powered-By" },
            { op: "remove", header: "Server" },
        ],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/users",
        method: "POST",
        upstream: "http://user-service:4000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "user-service-secret-min-32-chars-long",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: [
            { op: "rename", from: "userId", to: "user_id" },
            { op: "set", field: "createdVia", value: "gateway" },
        ],
        responseBodyTransform: [
            { op: "remove", field: "passwordHash" },
            { op: "remove", field: "internalId" },
        ],
        requestPathTransform: null,
    },
    {
        path: "/api/v1/users/:id",
        method: "GET",
        upstream: "http://user-service:4000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 500, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "user-service-secret-min-32-chars-long",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/users/:id",
        method: "PATCH",
        upstream: "http://user-service:4000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "user-service-secret-min-32-chars-long",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/users/:id",
        method: "DELETE",
        upstream: "http://user-service:4000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "user-service-secret-min-32-chars-long",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/users/:id/avatar",
        method: "PUT",
        upstream: "http://user-service:4000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 30000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "user-service-secret-min-32-chars-long",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/users/:id/preferences",
        method: "GET",
        upstream: "http://user-service:4000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "user-service-secret-min-32-chars-long",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/users/:id/preferences",
        method: "PATCH",
        upstream: "http://user-service:4000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "user-service-secret-min-32-chars-long",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // PRODUCT SERVICE  :5000
    // =========================================================================
    {
        path: "/api/v1/products",
        method: "GET",
        upstream: "http://product-service:5000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 2000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 10, cbWindowSize: 20, cbCooldownMs: 15000, cbSuccessThreshold: 3,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "public, max-age=300" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/products",
        method: "POST",
        upstream: "http://product-service:5000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/products/:id",
        method: "GET",
        upstream: "http://product-service:5000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 3000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 10, cbWindowSize: 20, cbCooldownMs: 15000, cbSuccessThreshold: 3,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "public, max-age=600" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/products/:id",
        method: "PUT",
        upstream: "http://product-service:5000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/products/:id",
        method: "DELETE",
        upstream: "http://product-service:5000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/products/:id/images",
        method: "POST",
        upstream: "http://product-service:5000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/products/:id/variants",
        method: "GET",
        upstream: "http://product-service:5000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 1000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 15000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // ORDER SERVICE  :6000
    // =========================================================================
    {
        path: "/api/v1/orders",
        method: "GET",
        upstream: "http://order-service:6000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 500, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 45000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: [{ op: "set", header: "X-Gateway-Version", value: "2.0" }],
        responseHeaderTransform: null, requestBodyTransform: null,
        responseBodyTransform: [
            { op: "remove", field: "internalOrderId" },
            { op: "remove", field: "processorRef" },
        ],
        requestPathTransform: null,
    },
    {
        path: "/api/v1/orders",
        method: "POST",
        upstream: "http://order-service:6000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: [
            { op: "set", field: "source", value: "gateway" },
            { op: "rename", from: "customerId", to: "customer_id" },
        ],
        responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/orders/:id",
        method: "GET",
        upstream: "http://order-service:6000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 300, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 45000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/orders/:id",
        method: "PATCH",
        upstream: "http://order-service:6000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/orders/:id/cancel",
        method: "POST",
        upstream: "http://order-service:6000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/orders/:id/refund",
        method: "POST",
        upstream: "http://order-service:6000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 120000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: [{ op: "set", header: "X-Idempotency-Source", value: "gateway" }],
        responseHeaderTransform: null, requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/orders/:id/items",
        method: "GET",
        upstream: "http://order-service:6000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 400, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 45000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // PAYMENT SERVICE  :7000
    // =========================================================================
    {
        path: "/api/v1/payments",
        method: "POST",
        upstream: "http://payment-service:7000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 120000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: [{ op: "set", header: "X-Idempotency-Source", value: "gateway" }],
        responseHeaderTransform: null, requestBodyTransform: null,
        responseBodyTransform: [
            { op: "remove", field: "processorSecret" },
            { op: "remove", field: "rawResponse" },
        ],
        requestPathTransform: null,
    },
    {
        path: "/api/v1/payments/:id",
        method: "GET",
        upstream: "http://payment-service:7000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 60000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/payments/:id/refund",
        method: "POST",
        upstream: "http://payment-service:7000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 120000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: [{ op: "set", header: "X-Idempotency-Source", value: "gateway" }],
        responseHeaderTransform: null, requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/payments/webhook",
        method: "POST",
        upstream: "http://payment-service:7000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 10, cbWindowSize: 20, cbCooldownMs: 30000, cbSuccessThreshold: 3,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/payments/methods",
        method: "GET",
        upstream: "http://payment-service:7000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 300, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 60000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/payments/methods",
        method: "POST",
        upstream: "http://payment-service:7000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // NOTIFICATION SERVICE  :8000
    // =========================================================================
    {
        path: "/api/v1/notifications",
        method: "POST",
        upstream: "http://notification-service:8000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 300, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/notifications",
        method: "GET",
        upstream: "http://notification-service:8000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 500, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "notification-service-jwt-secret-32c",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/notifications/:id/read",
        method: "PATCH",
        upstream: "http://notification-service:8000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "notification-service-jwt-secret-32c",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/notifications/batch",
        method: "POST",
        upstream: "http://notification-service:8000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // SEARCH SERVICE  :9000
    // =========================================================================
    {
        path: "/api/v1/search",
        method: "GET",
        upstream: "http://search-service:9000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 500, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 20000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "private, max-age=60" }],
        requestBodyTransform: null, responseBodyTransform: null,
        requestPathTransform: { stripPrefix: "/api/v1/search", addPrefix: "/v2/search" },
    },
    {
        path: "/api/v1/search/suggest",
        method: "GET",
        upstream: "http://search-service:9000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 1000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 20000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "public, max-age=30" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/search/trending",
        method: "GET",
        upstream: "http://search-service:9000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 2000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 20000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "public, max-age=300" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/search/index",
        method: "POST",
        upstream: "http://search-service:9000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // ANALYTICS SERVICE  :10000
    // =========================================================================
    {
        path: "/api/v1/analytics/overview",
        method: "GET",
        upstream: "http://analytics-service:10000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "analytics-service-secret-32-chars!",
        authJwtRequiredClaims: { role: "analyst" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/analytics/events",
        method: "POST",
        upstream: "http://analytics-service:10000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 5000, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 10, cbWindowSize: 20, cbCooldownMs: 30000, cbSuccessThreshold: 3,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: [{ op: "set", header: "X-Analytics-Source", value: "gateway" }],
        responseHeaderTransform: null, requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/analytics/events",
        method: "GET",
        upstream: "http://analytics-service:10000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "analytics-service-secret-32-chars!",
        authJwtRequiredClaims: { role: "analyst" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/analytics/funnel",
        method: "GET",
        upstream: "http://analytics-service:10000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "analytics-service-secret-32-chars!",
        authJwtRequiredClaims: { role: "analyst" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/analytics/retention",
        method: "GET",
        upstream: "http://analytics-service:10000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "analytics-service-secret-32-chars!",
        authJwtRequiredClaims: { role: "analyst" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // ADMIN SERVICE  :3000
    // =========================================================================
    {
        path: "/admin",
        method: "ALL",
        upstream: "http://admin-service:3000",
        stripPath: null, enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "admin-service-jwt-secret-32-chars!!",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: [{ op: "set", header: "X-Admin-Gateway", value: "true" }],
        responseHeaderTransform: null, requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/admin/users",
        method: "GET",
        upstream: "http://admin-service:3000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "admin-service-jwt-secret-32-chars!!",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/admin/users/:id",
        method: "PATCH",
        upstream: "http://admin-service:3000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "admin-service-jwt-secret-32-chars!!",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/admin/users/:id",
        method: "DELETE",
        upstream: "http://admin-service:3000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "admin-service-jwt-secret-32-chars!!",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // FILE SERVICE  :11000
    // =========================================================================
    {
        path: "/api/v1/files/upload",
        method: "POST",
        upstream: "http://file-service:11000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "file-service-jwt-secret-32-chars!!!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/files",
        method: "GET",
        upstream: "http://file-service:11000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 500, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "file-service-jwt-secret-32-chars!!!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/files/:id",
        method: "GET",
        upstream: "http://file-service:11000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 1000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "file-service-jwt-secret-32-chars!!!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/files/:id",
        method: "DELETE",
        upstream: "http://file-service:11000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "file-service-jwt-secret-32-chars!!!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // INVENTORY SERVICE  :8080
    // =========================================================================
    {
        path: "/api/v1/inventory",
        method: "GET",
        upstream: "http://inventory-service:8080",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 800, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/inventory",
        method: "PUT",
        upstream: "http://inventory-service:8080",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/inventory/:sku",
        method: "GET",
        upstream: "http://inventory-service:8080",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 1000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "public, max-age=30" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/inventory/bulk",
        method: "POST",
        upstream: "http://inventory-service:8080",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // AUTH SERVICE  :13000
    // =========================================================================
    {
        path: "/api/v1/auth/login",
        method: "POST",
        upstream: "http://auth-service:13000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null,
        responseBodyTransform: [{ op: "remove", field: "internalSessionId" }],
        requestPathTransform: null,
    },
    {
        path: "/api/v1/auth/logout",
        method: "POST",
        upstream: "http://auth-service:13000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "auth-service-jwt-secret-32-chars!!!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/auth/refresh",
        method: "POST",
        upstream: "http://auth-service:13000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/auth/verify",
        method: "POST",
        upstream: "http://auth-service:13000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/auth/password-reset",
        method: "POST",
        upstream: "http://auth-service:13000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 5, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // REVIEW SERVICE  :14000
    // =========================================================================
    {
        path: "/api/v1/reviews",
        method: "GET",
        upstream: "http://review-service:14000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 1000, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "public, max-age=120" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/reviews",
        method: "POST",
        upstream: "http://review-service:14000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "review-service-jwt-secret-32-chars!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/reviews/:id",
        method: "PATCH",
        upstream: "http://review-service:14000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "review-service-jwt-secret-32-chars!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/reviews/:id",
        method: "DELETE",
        upstream: "http://review-service:14000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "review-service-jwt-secret-32-chars!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // CART SERVICE  :15000
    // =========================================================================
    {
        path: "/api/v1/cart",
        method: "GET",
        upstream: "http://cart-service:15000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 500, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "cart-service-jwt-secret-min-32-ch",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/cart/items",
        method: "POST",
        upstream: "http://cart-service:15000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "cart-service-jwt-secret-min-32-ch",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: [{ op: "set", field: "addedVia", value: "gateway" }],
        responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/cart/items/:itemId",
        method: "PATCH",
        upstream: "http://cart-service:15000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "cart-service-jwt-secret-min-32-ch",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/cart/items/:itemId",
        method: "DELETE",
        upstream: "http://cart-service:15000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "cart-service-jwt-secret-min-32-ch",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/cart/checkout",
        method: "POST",
        upstream: "http://cart-service:15000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "cart-service-jwt-secret-min-32-ch",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // SHIPPING SERVICE  :16000
    // =========================================================================
    {
        path: "/api/v1/shipping/rates",
        method: "POST",
        upstream: "http://shipping-service:16000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "private, max-age=300" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/shipping/shipments",
        method: "POST",
        upstream: "http://shipping-service:16000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: [{ op: "set", header: "X-Idempotency-Source", value: "gateway" }],
        responseHeaderTransform: null, requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/shipping/track/:trackingId",
        method: "GET",
        upstream: "http://shipping-service:16000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 500, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "public, max-age=60" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // COUPON SERVICE  :17000
    // =========================================================================
    {
        path: "/api/v1/coupons/validate",
        method: "POST",
        upstream: "http://coupon-service:17000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "coupon-service-jwt-secret-32-char",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/coupons/apply",
        method: "POST",
        upstream: "http://coupon-service:17000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "coupon-service-jwt-secret-32-char",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/coupons",
        method: "GET",
        upstream: "http://coupon-service:17000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/coupons",
        method: "POST",
        upstream: "http://coupon-service:17000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // SUBSCRIPTION SERVICE  :18000
    // =========================================================================
    {
        path: "/api/v1/subscriptions",
        method: "GET",
        upstream: "http://subscription-service:18000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 45000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/subscriptions",
        method: "POST",
        upstream: "http://subscription-service:18000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: [{ op: "set", header: "X-Idempotency-Source", value: "gateway" }],
        responseHeaderTransform: null, requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/subscriptions/:id",
        method: "PATCH",
        upstream: "http://subscription-service:18000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/subscriptions/:id/cancel",
        method: "POST",
        upstream: "http://subscription-service:18000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 120000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/subscriptions/webhook",
        method: "POST",
        upstream: "http://subscription-service:18000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 10, cbWindowSize: 20, cbCooldownMs: 30000, cbSuccessThreshold: 3,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // REPORTING SERVICE  :19000
    // =========================================================================
    {
        path: "/api/v1/reports",
        method: "GET",
        upstream: "http://report-service:19000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "report-service-jwt-secret-32-char!",
        authJwtRequiredClaims: { role: "analyst" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/reports/generate",
        method: "POST",
        upstream: "http://report-service:19000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "report-service-jwt-secret-32-char!",
        authJwtRequiredClaims: { role: "analyst" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/reports/:id/download",
        method: "GET",
        upstream: "http://report-service:19000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "report-service-jwt-secret-32-char!",
        authJwtRequiredClaims: { role: "analyst" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // AUDIT SERVICE  :20000
    // =========================================================================
    {
        path: "/api/v1/audit/logs",
        method: "GET",
        upstream: "http://audit-service:20000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "audit-service-jwt-secret-32-chars!",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/audit/logs/export",
        method: "POST",
        upstream: "http://audit-service:20000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 5, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "audit-service-jwt-secret-32-chars!",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // CONFIG SERVICE  :21000
    // =========================================================================
    {
        path: "/api/v1/config",
        method: "GET",
        upstream: "http://config-service:21000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 500, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "private, max-age=60" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/config",
        method: "PATCH",
        upstream: "http://config-service:21000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/config/reset",
        method: "POST",
        upstream: "http://config-service:21000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 5, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "config-service-jwt-secret-32-chars",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // FEATURE FLAG SERVICE  :22000
    // =========================================================================
    {
        path: "/api/v1/flags",
        method: "GET",
        upstream: "http://feature-flag-service:22000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 5000, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 10, cbWindowSize: 20, cbCooldownMs: 15000, cbSuccessThreshold: 3,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null,
        responseHeaderTransform: [{ op: "set", header: "Cache-Control", value: "private, max-age=10" }],
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/flags/evaluate",
        method: "POST",
        upstream: "http://feature-flag-service:22000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10000, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 10, cbWindowSize: 20, cbCooldownMs: 15000, cbSuccessThreshold: 3,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/flags/:key",
        method: "PATCH",
        upstream: "http://feature-flag-service:22000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "feature-flag-jwt-secret-32-chars!!",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // EMAIL SERVICE  :23000
    // =========================================================================
    {
        path: "/api/v1/email/send",
        method: "POST",
        upstream: "http://email-service:23000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: [{ op: "set", header: "X-Idempotency-Source", value: "gateway" }],
        responseHeaderTransform: null, requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/email/batch",
        method: "POST",
        upstream: "http://email-service:23000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/email/templates",
        method: "GET",
        upstream: "http://email-service:23000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // SMS SERVICE  :24000
    // =========================================================================
    {
        path: "/api/v1/sms/send",
        method: "POST",
        upstream: "http://sms-service:24000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/sms/status/:id",
        method: "GET",
        upstream: "http://sms-service:24000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // WEBHOOK SERVICE  :25000
    // =========================================================================
    {
        path: "/api/v1/webhooks",
        method: "GET",
        upstream: "http://webhook-service:25000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/webhooks",
        method: "POST",
        upstream: "http://webhook-service:25000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/webhooks/:id",
        method: "PATCH",
        upstream: "http://webhook-service:25000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/webhooks/:id",
        method: "DELETE",
        upstream: "http://webhook-service:25000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/webhooks/:id/test",
        method: "POST",
        upstream: "http://webhook-service:25000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // EXPORT SERVICE  :26000
    // =========================================================================
    {
        path: "/api/v1/export",
        method: "POST",
        upstream: "http://export-service:26000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "export-service-jwt-secret-32-chars",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/export/:jobId/status",
        method: "GET",
        upstream: "http://export-service:26000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "export-service-jwt-secret-32-chars",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/export/:jobId/download",
        method: "GET",
        upstream: "http://export-service:26000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "export-service-jwt-secret-32-chars",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // IMPORT SERVICE  :27000
    // =========================================================================
    {
        path: "/api/v1/import/upload",
        method: "POST",
        upstream: "http://import-service:27000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 5, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/import/:jobId/status",
        method: "GET",
        upstream: "http://import-service:27000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/import/:jobId/errors",
        method: "GET",
        upstream: "http://import-service:27000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // METRICS SERVICE  :28000
    // =========================================================================
    {
        path: "/api/v1/metrics",
        method: "GET",
        upstream: "http://metrics-service:28000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/metrics/timeseries",
        method: "GET",
        upstream: "http://metrics-service:28000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "apiKey", rateLimitKeyHeader: "x-api-key",
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "apiKey" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: "x-api-key",
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null,
        requestPathTransform: { stripPrefix: "/api/v1/metrics", addPrefix: "/v3/metrics" },
    },
    {
        path: "/api/v1/metrics/flush",
        method: "POST",
        upstream: "http://metrics-service:28000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 10, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "metrics-service-jwt-secret-32-ch!",
        authJwtRequiredClaims: { role: "admin" }, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // ALERT SERVICE  :29000
    // =========================================================================
    {
        path: "/api/v1/alerts",
        method: "GET",
        upstream: "http://alert-service:29000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 200, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "alert-service-jwt-secret-32-chars!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/alerts",
        method: "POST",
        upstream: "http://alert-service:29000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 30, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "alert-service-jwt-secret-32-chars!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/alerts/:id/resolve",
        method: "POST",
        upstream: "http://alert-service:29000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "jwt", rateLimitKeyHeader: null,
        cbFailureThreshold: 3, cbWindowSize: 5, cbCooldownMs: 60000, cbSuccessThreshold: 1,
        authMode: "jwt" as const, authJwtSecret: "alert-service-jwt-secret-32-chars!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // ADDRESS SERVICE  :30000
    // =========================================================================
    {
        path: "/api/v1/addresses",
        method: "GET",
        upstream: "http://address-service:30000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 300, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "address-service-jwt-secret-32-ch!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/addresses",
        method: "POST",
        upstream: "http://address-service:30000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "address-service-jwt-secret-32-ch!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/addresses/:id",
        method: "PATCH",
        upstream: "http://address-service:30000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 50, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "address-service-jwt-secret-32-ch!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/addresses/:id",
        method: "DELETE",
        upstream: "http://address-service:30000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 20, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "address-service-jwt-secret-32-ch!",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/addresses/validate",
        method: "POST",
        upstream: "http://address-service:30000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // WISHLIST SERVICE  :31000
    // =========================================================================
    {
        path: "/api/v1/wishlist",
        method: "GET",
        upstream: "http://wishlist-service:31000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 300, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "wishlist-service-jwt-secret-32-ch",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/wishlist/items",
        method: "POST",
        upstream: "http://wishlist-service:31000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "wishlist-service-jwt-secret-32-ch",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/wishlist/items/:productId",
        method: "DELETE",
        upstream: "http://wishlist-service:31000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: 100, rateLimitWindowMs: 60000, rateLimitKeyBy: "ip", rateLimitKeyHeader: null,
        cbFailureThreshold: 5, cbWindowSize: 10, cbCooldownMs: 30000, cbSuccessThreshold: 2,
        authMode: "jwt" as const, authJwtSecret: "wishlist-service-jwt-secret-32-ch",
        authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // HEALTH + SYSTEM
    // =========================================================================
    {
        path: "/health",
        method: "GET",
        upstream: "http://health-service:12000",
        stripPath: null, enabled: true,
        rateLimitMax: null, rateLimitWindowMs: null, rateLimitKeyBy: null, rateLimitKeyHeader: null,
        cbFailureThreshold: null, cbWindowSize: null, cbCooldownMs: null, cbSuccessThreshold: null,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/api/v1/status",
        method: "GET",
        upstream: "http://health-service:12000",
        stripPath: "/api/v1", enabled: true,
        rateLimitMax: null, rateLimitWindowMs: null, rateLimitKeyBy: null, rateLimitKeyHeader: null,
        cbFailureThreshold: null, cbWindowSize: null, cbCooldownMs: null, cbSuccessThreshold: null,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },

    // =========================================================================
    // DEPRECATED (disabled)
    // =========================================================================
    {
        path: "/deprecated/v0/users",
        method: "ALL",
        upstream: "http://legacy-service:9999",
        stripPath: null, enabled: false,
        rateLimitMax: null, rateLimitWindowMs: null, rateLimitKeyBy: null, rateLimitKeyHeader: null,
        cbFailureThreshold: null, cbWindowSize: null, cbCooldownMs: null, cbSuccessThreshold: null,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/deprecated/v0/orders",
        method: "ALL",
        upstream: "http://legacy-service:9999",
        stripPath: null, enabled: false,
        rateLimitMax: null, rateLimitWindowMs: null, rateLimitKeyBy: null, rateLimitKeyHeader: null,
        cbFailureThreshold: null, cbWindowSize: null, cbCooldownMs: null, cbSuccessThreshold: null,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/deprecated/v0/products",
        method: "ALL",
        upstream: "http://legacy-service:9999",
        stripPath: null, enabled: false,
        rateLimitMax: null, rateLimitWindowMs: null, rateLimitKeyBy: null, rateLimitKeyHeader: null,
        cbFailureThreshold: null, cbWindowSize: null, cbCooldownMs: null, cbSuccessThreshold: null,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/deprecated/v0/payments",
        method: "ALL",
        upstream: "http://legacy-service:9999",
        stripPath: null, enabled: false,
        rateLimitMax: null, rateLimitWindowMs: null, rateLimitKeyBy: null, rateLimitKeyHeader: null,
        cbFailureThreshold: null, cbWindowSize: null, cbCooldownMs: null, cbSuccessThreshold: null,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/v1/search",
        method: "GET",
        upstream: "http://legacy-service:9999",
        stripPath: null, enabled: false,
        rateLimitMax: null, rateLimitWindowMs: null, rateLimitKeyBy: null, rateLimitKeyHeader: null,
        cbFailureThreshold: null, cbWindowSize: null, cbCooldownMs: null, cbSuccessThreshold: null,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
    {
        path: "/v1/users",
        method: "GET",
        upstream: "http://legacy-service:9999",
        stripPath: null, enabled: false,
        rateLimitMax: null, rateLimitWindowMs: null, rateLimitKeyBy: null, rateLimitKeyHeader: null,
        cbFailureThreshold: null, cbWindowSize: null, cbCooldownMs: null, cbSuccessThreshold: null,
        authMode: "none" as const, authJwtSecret: null, authJwtRequiredClaims: null, authKeyHeader: null,
        requestHeaderTransform: null, responseHeaderTransform: null,
        requestBodyTransform: null, responseBodyTransform: null, requestPathTransform: null,
    },
];

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

const API_KEY_DEFINITIONS = [
    {
        name: "Production Web App",
        plaintext: "gw_live_prod_web_app_key_abc123xyz789",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: true,
        lastUsedAt: subMinutes(new Date(), 8),
    },
    {
        name: "Mobile Client iOS",
        plaintext: "gw_live_mobile_ios_key_def456uvw012",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: true,
        lastUsedAt: subMinutes(new Date(), 22),
    },
    {
        name: "Mobile Client Android",
        plaintext: "gw_live_mobile_android_key_ghi789rst345",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: true,
        lastUsedAt: subHours(new Date(), 1),
    },
    {
        name: "Third Party Logistics",
        plaintext: "gw_live_logistics_partner_jkl012opq678",
        routeScope: [] as string[],
        expiresAt: addDays(new Date(), 90),
        enabled: true,
        lastUsedAt: subHours(new Date(), 3),
    },
    {
        name: "Payment Processor Webhook",
        plaintext: "gw_live_payment_webhook_mno345lmn901",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: true,
        lastUsedAt: subMinutes(new Date(), 45),
    },
    {
        name: "Analytics Pipeline",
        plaintext: "gw_live_analytics_pipe_pqr678ijk234",
        routeScope: [] as string[],
        expiresAt: addDays(new Date(), 180),
        enabled: true,
        lastUsedAt: subHours(new Date(), 6),
    },
    {
        name: "Internal CI Runner",
        plaintext: "gw_live_ci_runner_internal_stu901fed567",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: true,
        lastUsedAt: subHours(new Date(), 12),
    },
    {
        name: "Staging Environment",
        plaintext: "gw_test_staging_env_vwx234cba890",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: true,
        lastUsedAt: subHours(new Date(), 2),
    },
    {
        name: "Partner Integration Alpha",
        plaintext: "gw_live_partner_alpha_yza567xyz123",
        routeScope: [] as string[],
        expiresAt: addDays(new Date(), 30),
        enabled: true,
        lastUsedAt: subDays(new Date(), 1),
    },
    {
        name: "Partner Integration Beta",
        plaintext: "gw_live_partner_beta_bcd890wvu456",
        routeScope: [] as string[],
        expiresAt: addDays(new Date(), 60),
        enabled: true,
        lastUsedAt: subDays(new Date(), 2),
    },
    {
        name: "Data Warehouse Sync",
        plaintext: "gw_live_warehouse_sync_efg123tsr789",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: true,
        lastUsedAt: subHours(new Date(), 4),
    },
    {
        name: "Monitoring Agent",
        plaintext: "gw_live_monitoring_agent_hij456qpo012",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: true,
        lastUsedAt: subMinutes(new Date(), 5),
    },
    {
        name: "Deprecated SDK v1",
        plaintext: "gw_live_deprecated_sdk_v1_klm789nml345",
        routeScope: [] as string[],
        expiresAt: subDays(new Date(), 30),
        enabled: true,
        lastUsedAt: subDays(new Date(), 31),
    },
    {
        name: "Old Partner Key",
        plaintext: "gw_live_old_partner_decommission_nop012kji678",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: false,
        lastUsedAt: subDays(new Date(), 60),
    },
    {
        name: "Load Test Runner",
        plaintext: "gw_test_load_test_runner_qrs345hgf901",
        routeScope: [] as string[],
        expiresAt: null,
        enabled: false,
        lastUsedAt: subDays(new Date(), 14),
    },
];

// ---------------------------------------------------------------------------
// Log generation config
// ---------------------------------------------------------------------------

const CLIENT_IPS = [
    "192.168.1.1",
    "192.168.1.45",
    "45.76.12.102",
    "45.76.12.198",
    "12.231.45.6",
    "12.231.45.89",
    "172.16.0.5",
    "172.16.0.23",
    "104.21.45.67",
    "104.21.45.234",
    "198.51.100.14",
    "203.0.113.42",
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function runGatewaySeed() {
    console.log("Clearing existing gateway data...");

    await prisma.requestLog.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.route.deleteMany();
    // Add to prisma/seed.ts
    await prisma.gatewaySetting.createMany({
        data: [
            { key: "gateway_name", value: "Production Gateway" },
            { key: "gateway_url", value: "http://localhost:3001" },
        ],
        skipDuplicates: true,
    });

    console.log("Seeding routes...");

    const createdRoutes = await Promise.all(
        ROUTES.map((r) =>
            prisma.route.create({
                data: {
                    path: r.path,
                    method: r.method,
                    upstream: r.upstream,
                    stripPath: r.stripPath,
                    enabled: r.enabled,
                    rateLimitMax: r.rateLimitMax,
                    rateLimitWindowMs: r.rateLimitWindowMs,
                    rateLimitKeyBy: r.rateLimitKeyBy,
                    rateLimitKeyHeader: r.rateLimitKeyHeader,
                    cbFailureThreshold: r.cbFailureThreshold,
                    cbWindowSize: r.cbWindowSize,
                    cbCooldownMs: r.cbCooldownMs,
                    cbSuccessThreshold: r.cbSuccessThreshold,
                    authMode: r.authMode,
                    authJwtSecret: r.authJwtSecret,
                    authJwtRequiredClaims: r.authJwtRequiredClaims ?? (undefined as any),
                    authKeyHeader: r.authKeyHeader,
                    requestHeaderTransform: r.requestHeaderTransform ?? (undefined as any),
                    responseHeaderTransform: r.responseHeaderTransform ?? (undefined as any),
                    requestBodyTransform: r.requestBodyTransform ?? (undefined as any),
                    responseBodyTransform: r.responseBodyTransform ?? (undefined as any),
                    requestPathTransform: r.requestPathTransform ?? (undefined as any),
                },
            })
        )
    );

    console.log(`Created ${createdRoutes.length} routes`);

    console.log("Seeding API keys...");

    // After routes are created, scope some keys to specific routes
    const enabledRoutes = createdRoutes.filter((r) => r.enabled);

    const createdKeys = await Promise.all(
        API_KEY_DEFINITIONS.map((k, i) => {
            // Scope every 3rd key to a subset of routes
            const routeScope =
                i % 3 === 0
                    ? []
                    : enabledRoutes
                        .slice(0, randomInt(1, 4))
                        .map((r) => r.id);

            return prisma.apiKey.create({
                data: {
                    name: k.name,
                    keyHash: hashKey(k.plaintext),
                    keyPrefix: k.plaintext.slice(0, 20),
                    routeScope,
                    expiresAt: k.expiresAt,
                    enabled: k.enabled,
                    lastUsedAt: k.lastUsedAt,
                },
            });
        })
    );

    console.log(`Created ${createdKeys.length} API keys`);

    console.log("Seeding request logs (this takes a moment)...");

    // Generate logs spread across the last 7 days
    // Heavy traffic during business hours, light overnight
    const LOG_COUNT = 2000;
    const now = new Date();

    const logs = Array.from({ length: LOG_COUNT }, (_, i) => {
        const route = randomItem(createdRoutes.filter((r) => r.enabled));

        // Distribute timestamps across last 7 days with realistic hour weighting
        const daysAgo = Math.random() * 7;
        const hoursAgo = daysAgo * 24;
        const timestamp = subHours(now, hoursAgo);

        // More traffic during business hours (8am-8pm)
        const hour = timestamp.getHours();
        const isBusinessHours = hour >= 8 && hour <= 20;
        if (!isBusinessHours && Math.random() > 0.25) {
            // 75% chance of skipping off-hours slots to create realistic distribution
            // Just reuse a business-hours timestamp instead
            timestamp.setHours(randomInt(8, 20));
        }

        const statusCode = weightedStatusCode();
        const latencyMs = randomLatency(statusCode);
        const isError = statusCode >= 500;
        const isRateLimited = statusCode === 429;

        const pathSuffixes = ["", "/1", "/2", "/abc", "/xyz789", "?page=1", "?limit=20"];
        const incomingPath = route.path + randomItem(pathSuffixes);

        return {
            routeId: route.id,
            method: route.method === "ALL" ? randomItem(["GET", "POST", "PUT", "DELETE"]) : route.method,
            incomingPath,
            upstreamUrl: route.upstream + incomingPath.replace(route.stripPath ?? "", ""),
            statusCode,
            latencyMs,
            error: isError
                ? randomItem([
                    "Upstream connection timeout",
                    "Upstream refused connection",
                    "Read timeout after 10000ms",
                    "Connection reset by peer",
                    "SSL handshake failed",
                ])
                : null,
            timestamp,
        };
    });

    // Insert in batches of 200 to avoid overwhelming the connection
    const BATCH_SIZE = 200;
    for (let i = 0; i < logs.length; i += BATCH_SIZE) {
        const batch = logs.slice(i, i + BATCH_SIZE);
        await prisma.requestLog.createMany({ data: batch });
        console.log(`  Inserted logs ${i + 1} to ${Math.min(i + BATCH_SIZE, logs.length)}`);
    }

    console.log(`Created ${LOG_COUNT} request logs`);
    console.log("\nDone. Summary:");
    console.log(`  Routes:       ${createdRoutes.length} (${createdRoutes.filter(r => r.enabled).length} enabled)`);
    console.log(`  API Keys:     ${createdKeys.length} (${createdKeys.filter(k => k.enabled).length} enabled)`);
    console.log(`  Request Logs: ${LOG_COUNT}`);
    console.log("\nTest API keys (plaintext -- save these):");
    API_KEY_DEFINITIONS.slice(0, 3).forEach(k => {
        console.log(`  ${k.name}: ${k.plaintext}`);
    });
}

if (require.main === module) {
    runGatewaySeed()
        .catch((err) => {
            console.error("Seed failed:", err);
            process.exit(1);
        })
        .finally(() => prisma.$disconnect());
}