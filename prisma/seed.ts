import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { generateApiKey } from "../src/lib/key-generator"; // 👈 Make sure this path is correct


async function main() {
    console.log("🌱 Seeding the database...");

    // Clear existing data so we can re-seed cleanly without duplicate ID errors
    await prisma.apiKey.deleteMany();
    await prisma.route.deleteMany();

    // 1. Create the API-Key protected route (Combining your existing config)
    // 1. Create the API-Key protected route
    await prisma.route.create({
        data: {
            id: "route_users_api",
            path: "/api/users",
            method: "ALL",
            upstream: "http://localhost:4001",
            stripPath: "/api",
            enabled: true,

            rateLimitWindowMs: 60000,
            rateLimitMax: 10,
            rateLimitKeyBy: "ip",
            cbFailureThreshold: 3,
            cbWindowSize: 5,
            cbCooldownMs: 3000,
            cbSuccessThreshold: 1,

            authMode: "apiKey",

            // 🟢 NEW: Add these Phase 7 Transform Configurations!
            requestHeaderTransform: [
                { op: "set", header: "X-Service-Token", value: "internal_token_abc" },
                { op: "set", header: "X-Gateway-Request-Id", value: "{{requestId}}" },
                { op: "remove", header: "X-Forwarded-For" },
            ],
            requestBodyTransform: [
                { op: "rename", from: "userId", to: "user_id" },
                { op: "set", field: "handled_by", value: "gateway" },
            ],
            responseBodyTransform: [
                { op: "remove", field: "internal_db_id" },
            ],
        }
    });

    // 2. Create the JWT protected route
    await prisma.route.create({
        data: {
            id: "route_admin_jwt",
            path: "/api/admin",
            method: "ALL",
            upstream: "http://localhost:4002",
            stripPath: "/api",
            enabled: true,

            // --- NEW: Auth Config ---
            authMode: "jwt",
            authJwtSecret: "your-test-secret-minimum-32-characters-long",
            authJwtRequiredClaims: { role: "admin" }, // Only tokens with role="admin" allowed
        }
    });

    // 3. Generate and save the test API Key
    const { plaintextKey, hashedKey, prefix } = generateApiKey();

    console.log("\n==================================================");
    console.log("🔑 TEST API KEY GENERATED (Save this now!):");
    console.log(plaintextKey);
    console.log("==================================================\n");

    await prisma.apiKey.create({
        data: {
            name: "Test Client Key",
            keyHash: hashedKey,
            keyPrefix: prefix,
            routeScope: [],  // Empty array means this key works for ALL routes
            enabled: true,
        }
    });

    console.log("✅ Seeding complete.");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:");
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });