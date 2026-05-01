
import Redis from 'ioredis';

// 1. Establish the global namespace to prevent connection leaks during hot-reloads
const globalForRedis = globalThis as unknown as { redis: Redis };

function createRedisClient() {
    // 2. The Fail-Fast Check: Never boot blindly
    if (!process.env.REDIS_URL) {
        throw new Error('CRITICAL: REDIS_URL environment variable is missing.');
    }

    // 3. Initialize the client
    const client = new Redis(process.env.REDIS_URL, {
        // Senior config: Don't let it hang forever if Redis goes down
        maxRetriesPerRequest: 3,
    });

    // 4. Attach Event Listeners
    client.on('connect', () => {
        console.log('🟢 Redis connected successfully.');
    });

    client.on('error', (err) => {
        // We log the error loudly, but we don't process.exit() here because 
        // ioredis has built-in auto-reconnect logic. It will keep trying to fix itself.
        console.error('❌ CRITICAL: Redis connection error:', err);
    });

    return client;
}

// 5. Export the singleton instance
export const redis = globalForRedis.redis ?? createRedisClient();

// 6. Preserve the instance in development
if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}