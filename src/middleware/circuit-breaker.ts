import type { Request, Response, NextFunction, RequestHandler } from "express";
import { redis } from "../lib/redis";
import type { RouteConfig, RouteTableContainer } from "../types/index";
import { matchRoute } from "../proxy/route-matcher";

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

const getKeys = (routeId: string) => ({
    state: `cb:state:${routeId}`,
    cooldown: `cb:cooldown:${routeId}`,
    probe: `cb:probe:${routeId}`,
    outcomes: `cb:outcomes:${routeId}`
});

const OUTCOME_LUA = `
    local stateKey = KEYS[1]
    local outcomesKey = KEYS[2]
    local cooldownKey = KEYS[3]
    local probeKey = KEYS[4]

    local outcome = ARGV[1]
    local windowSize = tonumber(ARGV[2])
    local threshold = tonumber(ARGV[3])
    local cooldownMs = tonumber(ARGV[4])

    local currentState = redis.call('GET', stateKey)
    if not currentState then currentState = 'CLOSED' end

    redis.call('LPUSH', outcomesKey, outcome)
    redis.call('LTRIM', outcomesKey, 0, windowSize - 1)

    if currentState == 'HALF_OPEN' then
        redis.call('DEL', probeKey) 
        
        if outcome == 'SUCCESS' then
            redis.call('SET', stateKey, 'CLOSED')
            redis.call('DEL', outcomesKey) 
        else
            redis.call('SET', stateKey, 'OPEN')
            redis.call('PSETEX', cooldownKey, cooldownMs, '1')
        end

    elseif currentState == 'CLOSED' and outcome == 'FAILURE' then
      
        local recentOutcomes = redis.call('LRANGE', outcomesKey, 0, -1)
        local fails = 0
        
        for i=1, #recentOutcomes do
            if recentOutcomes[i] == 'FAILURE' then
                fails = fails + 1
            end
        end

        if fails >= threshold then
            redis.call('SET', stateKey, 'OPEN')
            redis.call('PSETEX', cooldownKey, cooldownMs, '1')
        end
    end

    return 1
`;

function createOutcomeRecorder(route: RouteConfig) {
    return (success: boolean) => {
        const keys = getKeys(route.id);
        const maxFailures = route.cbFailureThreshold || 5;
        const windowSize = route.cbWindowSize || 10; 
        const cooldownMs = route.cbCooldownMs || 30000;
        const outcomeStr = success ? "SUCCESS" : "FAILURE";

        redis.eval(
            OUTCOME_LUA,
            4,
            keys.state,
            keys.outcomes,
            keys.cooldown,
            keys.probe,
            outcomeStr,
            windowSize,
            maxFailures,
            cooldownMs
        ).catch(err => console.error(`Redis Circuit Breaker Lua Error:`, err));
    };
}

export function createCircuitBreaker(container: RouteTableContainer): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const route = matchRoute(req.method, req.path, container.table);

            // Step 1 & 2: Match route and check if CB is configured
            if (!route || !route.cbFailureThreshold) {
                return next();
            }

            const keys = getKeys(route.id);
            let currentState = (await redis.get(keys.state)) as CircuitBreakerState | null || "CLOSED";

            // Step 3: Handle OPEN state
            if (currentState === "OPEN") {
                const cooldownRemainingMs = await redis.pttl(keys.cooldown);

                if (cooldownRemainingMs > 0) {
                    res.setHeader("Retry-After", Math.ceil(cooldownRemainingMs / 1000).toString());
                    res.status(503).json({
                        error: "SERVICE_UNAVAILABLE",
                        message: "Upstream service is currently failing. Circuit is OPEN."
                    });
                    return;
                } else {
                    // Cooldown expired, transition to HALF_OPEN
                    await redis.set(keys.state, "HALF_OPEN");
                    currentState = "HALF_OPEN";
                }
            }

            // Step 4: Handle HALF_OPEN state (The Probe Lock)
            if (currentState === "HALF_OPEN") {
                // Lock expires in 10s to match the proxy timeout we will set in the next step
                const lockAcquired = await redis.set(keys.probe, "1", "PX", 10000, "NX");

                // ioredis returns the string "OK" if it succeeds, or 'null' if it fails.
                if (lockAcquired !== "OK") {
                    res.status(503).json({
                        error: "SERVICE_UNAVAILABLE",
                        message: "Upstream recovery in progress. Please try again shortly."
                    });
                    return;
                }
            }

            // Step 5: CLOSED state (or successful probe lock acquisition)
            res.locals.recordOutcome = createOutcomeRecorder(route);
            return next();

        } catch (error) {
            console.error("❌ Circuit Breaker middleware crashed.", error);
            // Fail Open
            return next();
        }
    };
}