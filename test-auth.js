const jwt = require("jsonwebtoken");
const http = require("http");

// --- CONFIGURATION ---
const GATEWAY_URL = "http://localhost:3000";
const JWT_SECRET = "your-test-secret-minimum-32-characters-long";
const VALID_API_KEY = "gw_live_3c8031237277fce78c069cb6193df9d7ef0ea7b466a5b606ff4c1ed3a5b78ba3"; // <--- PASTE YOUR SEED KEY HERE

// --- GENERATE TEST JWTS ---
const validAdminJwt = jwt.sign(
    { sub: "user_123", role: "admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
);

const validViewerJwt = jwt.sign(
    { sub: "user_456", role: "viewer" },
    JWT_SECRET,
    { expiresIn: "1h" }
);

const expiredJwt = jwt.sign(
    { sub: "user_789", role: "admin" },
    JWT_SECRET,
    { expiresIn: "-1s" } // Expired 1 second ago
);

// --- DUMMY UPSTREAM SERVER ---
// We just need a server to respond with 200 OK to prove the gateway let us through
const dummyServer1 = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Upstream 1 Reached!");
});

const dummyServer2 = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Upstream 2 Reached!");
});

async function runTests() {
    console.log("🚀 Starting Authentication Integration Tests...\n");
    const results = [];

    async function makeReq(testName, path, headers) {
        const res = await fetch(`${GATEWAY_URL}${path}`, { headers });
        const body = await res.text();
        let errorReason = "";
        try { errorReason = JSON.parse(body).error || ""; } catch { }

        results.push({
            Test: testName,
            Status: res.status,
            Result: res.status === 200 ? "✅ PASSED (Allowed)" : `🚫 BLOCKED (${errorReason})`
        });
    }

    try {
        console.log("--- Testing API Key Enforcement (/api/users) ---");
        await makeReq("1. Missing Key", "/api/users", {});
        await makeReq("2. Wrong Key", "/api/users", { "x-api-key": "gw_live_wrongkey123" });
        await makeReq("3. Valid Key", "/api/users", { "x-api-key": VALID_API_KEY });

        console.log("--- Testing JWT Enforcement (/api/admin) ---");
        await makeReq("4. Missing JWT", "/api/admin", {});
        await makeReq("5. Garbage JWT", "/api/admin", { "Authorization": "Bearer not.a.real.token" });
        await makeReq("6. Expired JWT", "/api/admin", { "Authorization": `Bearer ${expiredJwt}` });
        await makeReq("7. Viewer Role (No Access)", "/api/admin", { "Authorization": `Bearer ${validViewerJwt}` });
        await makeReq("8. Admin Role (Full Access)", "/api/admin", { "Authorization": `Bearer ${validAdminJwt}` });

        console.table(results);

    } catch (error) {
        console.error("Test execution failed:", error);
    } finally {
        dummyServer1.close();
        dummyServer2.close();
        process.exit(0);
    }
}

// Start dummy server on both ports to simulate your microservices
dummyServer1.listen(4001, () => {
    dummyServer2.listen(4002, () => {
        runTests();
    });
});