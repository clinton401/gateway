export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

export interface RouteConfig {
    id: string;
    path: string;               // e.g. "/api/users"
    method: HttpMethod | "ALL"; // "ALL" matches any method
    upstream: string;           // e.g. "http://localhost:4001"
    stripPath?: string;         // strip this prefix before forwarding
    enabled: boolean;
    rateLimitMax?: number | null;
    rateLimitWindowMs?: number | null;
    rateLimitKeyBy?: string | null;
    rateLimitKeyHeader?: string | null;
    cbFailureThreshold?: number | null;
    cbWindowSize?: number | null;
    cbCooldownMs?: number | null;
    cbSuccessThreshold?: number | null;
    authMode: AuthMode;
    authJwtSecret: string | null;
    authJwtRequiredClaims: Record<string, string> | null;
    authKeyHeader: string | null;
    transform?: TransformConfig;
}

export interface RequestLog {
    routeId: string;
    method: string;
    incomingPath: string;
    upstreamUrl: string;
    statusCode: number;
    latencyMs: number;
    timestamp: Date;
    error?: string;
}

export interface GatewayError extends Error {
    statusCode: number;
    code: string;
}

export interface RateLimitConfig {
    windowMs: number;
    max: number;
    keyBy: "ip" | "apiKey" | "header";
    keyHeader?: string;
}
export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";


export interface RouteTableContainer {
    table: Map<string, RouteConfig>;
    lastReloadAt?: Date;
}

export type AuthMode = "none" | "apiKey" | "jwt";


export type HeaderOpType = "set" | "remove" | "rename";

export interface HeaderOperation {
    op: HeaderOpType;
    header?: string;
    from?: string;
    to?: string;
    value?: string;
}

export type BodyOpType = "set" | "remove" | "rename";

export interface BodyOperation {
    op: BodyOpType;
    field?: string;
    from?: string;
    to?: string;
    value?: string;
}

export interface PathRewriteConfig {
    stripPrefix?: string;
    addPrefix?: string;
    rewrite?: {
        pattern: string;
        replacement: string;
    };
}

// 🟢 NEW: Group them all together
export interface TransformConfig {
    requestHeaders?: HeaderOperation[];
    requestBody?: BodyOperation[];
    requestPath?: PathRewriteConfig;
    responseHeaders?: HeaderOperation[];
    responseBody?: BodyOperation[];
}