import type { Request, Response, NextFunction } from "express";

interface ExpressError extends Error {
    statusCode?: number;
    status?: number;
}

export function errorHandler(
    err: ExpressError,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err.statusCode ?? err.status ?? 500;

    res.status(statusCode).json({
        error: "GATEWAY_ERROR",
        message:
            process.env.NODE_ENV === "production"
                ? "An internal error occurred"
                : err.message,
        path: req.path,
        method: req.method,
    });
}