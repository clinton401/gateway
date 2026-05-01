export interface InterpolationContext {
    requestId: string;
    timestamp: string;
    requestHeaders: Record<string, string | string[] | undefined>;
}

export function interpolate(value: string, context: InterpolationContext): string {
    return value.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
        if (token === "requestId") return context.requestId;
        if (token === "timestamp") return context.timestamp;

        if (token.startsWith("req.header.")) {
            const headerName = token.replace("req.header.", "").toLowerCase();
            const headerVal = context.requestHeaders[headerName];
            return headerVal ? String(headerVal) : match;
        }

        // Unrecognized token: return it unchanged (graceful degradation)
        return match;
    });
}