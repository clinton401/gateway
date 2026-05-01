import { InterpolationContext, interpolate } from "./interpolate";
import type { HeaderOperation, BodyOperation, PathRewriteConfig } from "../types";

export function applyHeaderTransforms(
    headers: Record<string, string | string[] | undefined>,
    operations: HeaderOperation[],
    context: InterpolationContext
): Record<string, string | string[] | undefined> {
    const result = { ...headers };

    for (const op of operations) {
        if (op.op === "set" && op.header && op.value) {
            result[op.header.toLowerCase()] = interpolate(op.value, context);
        } else if (op.op === "remove" && op.header) {
            delete result[op.header.toLowerCase()];
        } else if (op.op === "rename" && op.from && op.to) {
            const fromLower = op.from.toLowerCase();
            const toLower = op.to.toLowerCase();
            if (result[fromLower] !== undefined) {
                result[toLower] = result[fromLower];
                delete result[fromLower];
            }
        }
    }
    return result;
}

export function applyBodyTransforms(
    body: Record<string, unknown>,
    operations: BodyOperation[],
    context: InterpolationContext
): Record<string, unknown> {
    const result = { ...body };

    for (const op of operations) {
        if (op.op === "set" && op.field && op.value) {
            result[op.field] = interpolate(op.value, context);
        } else if (op.op === "remove" && op.field) {
            delete result[op.field];
        } else if (op.op === "rename" && op.from && op.to) {
            if (result[op.from] !== undefined) {
                result[op.to] = result[op.from];
                delete result[op.from];
            }
        }
    }
    return result;
}

export function applyPathRewrite(path: string, config: PathRewriteConfig): string {
    let newPath = path;

    if (config.stripPrefix && newPath.startsWith(config.stripPrefix)) {
        newPath = newPath.slice(config.stripPrefix.length);
        if (newPath === "") newPath = "/";
    }

    if (config.addPrefix) {
        newPath = config.addPrefix + (newPath === "/" ? "" : newPath);
    }

    if (config.rewrite?.pattern && config.rewrite?.replacement) {
        try {
            const regex = new RegExp(config.rewrite.pattern);
            newPath = newPath.replace(regex, config.rewrite.replacement);
        } catch (e) {
            console.warn("⚠️ Invalid regex in path rewrite. Skipping.");
        }
    }

    return newPath;
}