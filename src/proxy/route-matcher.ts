import type { RouteConfig } from "../types/index";

export function matchRoute(
    method: string,
    path: string,
    routeTable: Map<string, RouteConfig>
): RouteConfig | null {
    // Try exact match first — "ALL" method wildcard
    const exactAllKey = `ALL:${path}`;
    if (routeTable.has(exactAllKey)) {
        return routeTable.get(exactAllKey)!;
    }

    // Try exact match with specific method
    const exactMethodKey = `${method}:${path}`;
    if (routeTable.has(exactMethodKey)) {
        return routeTable.get(exactMethodKey)!;
    }

    // Prefix match — find the most specific matching prefix
    // /api/users/123 should match /api/users, not /api
    let bestMatch: RouteConfig | null = null;
    let bestMatchLength = 0;

    for (const [, route] of routeTable) {
        const routeMatchesMethod =
            route.method === "ALL" || route.method === method;

        if (!routeMatchesMethod) continue;

        if (
            path.startsWith(route.path) &&
            route.path.length > bestMatchLength
        ) {
            bestMatch = route;
            bestMatchLength = route.path.length;
        }
    }

    return bestMatch;
}