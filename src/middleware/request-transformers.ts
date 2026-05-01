import { Request, Response, NextFunction, RequestHandler } from "express";
import crypto from "crypto";
import { matchRoute } from "../proxy/route-matcher";
import type { RouteTableContainer } from "../types";
import { applyHeaderTransforms, applyBodyTransforms, applyPathRewrite } from "../lib/transformers";
import { InterpolationContext } from "../lib/interpolate";

export const createRequestTransformer = (container: RouteTableContainer): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const route = matchRoute(req.method, req.path, container.table);
        if (!route) return next();

        // 1. Generate Request ID and Context
        const requestId = crypto.randomUUID();
        res.locals.requestId = requestId; // Save for the Response Transformer and Logger

        if (!route.transform) return next();

        const context: InterpolationContext = {
            requestId,
            timestamp: new Date().toISOString(),
            requestHeaders: req.headers
        };

        // 2. Transform Path
        if (route.transform.requestPath) {
            req.url = applyPathRewrite(req.url, route.transform.requestPath);
        }

        // 3. Transform Headers
        if (route.transform.requestHeaders) {
            req.headers = applyHeaderTransforms(req.headers, route.transform.requestHeaders, context) as any;
        }

        // 4. Transform Body
        if (route.transform.requestBody && req.body && typeof req.body === "object") {
            const newBody = applyBodyTransforms(req.body as Record<string, unknown>, route.transform.requestBody, context);
            req.body = newBody;

            // CRITICAL: We must update Content-Length, or the upstream will crash/truncate!
            const bodyString = JSON.stringify(newBody);
            req.headers["content-length"] = Buffer.byteLength(bodyString).toString();
        }

        next();
    };
};