import crypto from "crypto";
import { Options, createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { RouteTableContainer, RequestLog } from "../types/index";
import { matchRoute } from "./route-matcher";
import { applyHeaderTransforms, applyBodyTransforms } from "../lib/transformers";
import type { InterpolationContext } from "../lib/interpolate";

export function createGatewayHandler(
    container: RouteTableContainer
): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const startTime = Date.now();

        const route = matchRoute(req.method, req.path, container.table);

        if (route === null) {
            res.status(404).json({
                error: "NO_ROUTE_FOUND",
                message: `No route configured for ${req.method} ${req.path}`,
            });
            return;
        }

        const upstreamPath = route.stripPath
            ? req.path.replace(route.stripPath, "") || "/"
            : req.path;

        const proxyOptions: Options = {
            target: route.upstream,
            changeOrigin: true,

            selfHandleResponse: !!route.transform?.responseBody,
            proxyTimeout: 10000,
            timeout: 10000,

            on: {
                proxyReq: fixRequestBody,

                error: (err, _req, _res) => {
                    const latencyMs = Date.now() - startTime;

                    const recordOutcome = (res as Response).locals?.recordOutcome;
                    if (recordOutcome) {
                        recordOutcome(false);
                    }

                    const log: RequestLog = {
                        routeId: route.id,
                        method: req.method,
                        incomingPath: req.path,
                        upstreamUrl: `${route.upstream}${upstreamPath}`,
                        statusCode: 502,
                        latencyMs,
                        timestamp: new Date(),
                        error: err.message,
                    };

                    logRequest(log);

                    if (!res.headersSent) {
                        res.status(502).json({
                            error: "UPSTREAM_UNAVAILABLE",
                            message: "The upstream service failed to respond",
                            routeId: route.id,
                        });
                    }
                },

                proxyRes: (proxyRes, _req, _res) => {
                    const originalReq = _req as Request;
                    const originalRes = _res as Response;
                    const latencyMs = Date.now() - startTime;

                    const recordOutcome = originalRes.locals?.recordOutcome;
                    if (recordOutcome) {
                        const isSuccess = proxyRes.statusCode ? proxyRes.statusCode < 500 : false;
                        recordOutcome(isSuccess);
                    }

                    const log: RequestLog = {
                        routeId: route.id,
                        method: originalReq.method,
                        incomingPath: originalReq.path,
                        upstreamUrl: `${route.upstream}${upstreamPath}`,
                        statusCode: proxyRes.statusCode ?? 0,
                        latencyMs,
                        timestamp: new Date(),
                    };

                    logRequest(log);

                    const requestId = originalRes.locals.requestId ?? crypto.randomUUID();
                    const context: InterpolationContext = {
                        requestId,
                        timestamp: new Date().toISOString(),
                        requestHeaders: originalReq.headers as Record<string, string>,
                    };

                    proxyRes.headers["x-gateway-request-id"] = requestId;
                    proxyRes.headers["x-gateway-route-id"] = route.id;
                    proxyRes.headers["x-gateway-latency-ms"] = String(latencyMs);

                    if (!route.transform) return;

                    // 1. Response Header Transforms (Stream-Safe)
                    if (route.transform.responseHeaders) {
                        proxyRes.headers = applyHeaderTransforms(
                            proxyRes.headers,
                            route.transform.responseHeaders,
                            context
                        ) as any;
                    }

                    if (route.transform.responseBody) {
                      

                        const chunks: Buffer[] = [];

                        proxyRes.on("data", (chunk: Buffer) => {
                            chunks.push(chunk);
                        });

                        proxyRes.on("end", () => {
                            const rawBody = Buffer.concat(chunks).toString("utf8");
                            let body: Record<string, unknown>;

                            try {
                                body = JSON.parse(rawBody);
                            } catch {
                                Object.keys(proxyRes.headers).forEach(k => {
                                    if (proxyRes.headers[k] !== undefined) {
                                        originalRes.setHeader(k, proxyRes.headers[k] as string | string[]);
                                    }
                                });
                                originalRes.status(proxyRes.statusCode || 200).end(rawBody);
                                return;
                            }

                            const transformed = applyBodyTransforms(body, route.transform!.responseBody!, context);
                            const newBody = JSON.stringify(transformed);

                            Object.keys(proxyRes.headers).forEach(key => {
                                if (key !== "content-length" && key !== "transfer-encoding" && proxyRes.headers[key] !== undefined) {
                                    originalRes.setHeader(key, proxyRes.headers[key] as string | string[]);
                                }
                            });
                            originalRes.setHeader("content-length", Buffer.byteLength(newBody).toString());
                            originalRes.status(proxyRes.statusCode || 200).end(newBody);
                        });
                    }
                },
            },
        };

        if (route.stripPath && req.url === req.originalUrl) {
            proxyOptions.pathRewrite = { [`^${route.stripPath}`]: "" };
        }

        const proxy = createProxyMiddleware(proxyOptions);
        proxy(req, res, next);
    };
}

function logRequest(log: RequestLog): void {
    const status = log.error ? "ERROR" : "OK";
    const logLine = `[${log.timestamp.toISOString()}] ${status} ${log.method} ${log.incomingPath} → ${log.upstreamUrl} | ${log.statusCode} | ${log.latencyMs}ms`;

    if (log.error) {
        console.error(logLine, log.error);
    } else {
        console.info(logLine);
    }
}