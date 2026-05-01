const http = require("http");
// --- CONFIGURATION ---
const GATEWAY_URL = "http://localhost:3000/api/users";
const UPSTREAM_PORT = 4001;
const COOLDOWN_MS = 3000; // Must match your DB config!

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// --- 1. THE DUMMY UPSTREAM SERVER ---
// We control this server's health programmatically.
let upstreamHealthy = true;
const upstreamServer = http.createServer((req, res) => {
    if (upstreamHealthy) {
        res.writeHead(200);
        res.end(JSON.stringify({ message: "Upstream OK" }));
    } else {
        res.writeHead(500); // Simulate a catastrophic crash
        res.end(JSON.stringify({ error: "Upstream CRASHED" }));
    }
});

// --- 2. THE AUTOMATED TEST RUNNER ---
async function runTests() {
    console.log("🚀 Starting Circuit Breaker Integration Tests...\n");
    const results = [];

    async function makeRequest(phase, requestNumber) {
        const res = await fetch(GATEWAY_URL);
        results.push({
            Phase: phase,
            Req: requestNumber,
            Status: res.status,
            State: res.status === 200 ? "CLOSED" : res.status === 502 ? "CLOSED (Proxy Failed)" : "OPEN/BLOCKED"
        });
        return res.status;
    }

    try {
        // Test 1: Normal Traffic (CLOSED)
        console.log("🟢 Phase 1: Sending normal traffic...");
        await makeRequest("1. Normal", 1);
        await makeRequest("1. Normal", 2);

        // Test 2: The Crash (CLOSED -> OPEN)
        console.log("🔴 Phase 2: Upstream crashed. Sending failures...");
        upstreamHealthy = false;
        await makeRequest("2. Crash", 3); // 502 - Strike 1
        await makeRequest("2. Crash", 4); // 502 - Strike 2
        await makeRequest("2. Crash", 5); // 502 - Strike 3 (Breaker Trips!)

        console.log("🛡️ Gateway should now block traffic...");
        await makeRequest("3. Blocked", 6); // 503 - Blocked at Gateway
        await makeRequest("3. Blocked", 7); // 503 - Blocked at Gateway

        // Test 3: The Probe Race Condition (OPEN -> HALF_OPEN)
        console.log(`⏳ Phase 3: Waiting ${COOLDOWN_MS / 1000} seconds for cooldown...`);
        await delay(COOLDOWN_MS + 500) // Wait just past the cooldown

        console.log("🏎️ Firing 2 concurrent requests to test Probe Lock...");
        // Fire two requests at the exact same millisecond
        const raceResults = await Promise.all([
            fetch(GATEWAY_URL),
            fetch(GATEWAY_URL)
        ]);

        results.push({
            Phase: "4. Race Cond",
            Req: "8a (Probe)",
            Status: raceResults[0].status,
            State: "HALF_OPEN (Probe)"
        });
        results.push({
            Phase: "4. Race Cond",
            Req: "8b (Locked)",
            Status: raceResults[1].status,
            State: raceResults[1].status === 503 ? "LOCKED (Success)" : "FAIL"
        });

        // Test 4: The Recovery (HALF_OPEN -> CLOSED)
        console.log(`⏳ Phase 4: Healing upstream. Waiting for cooldown again...`);
        upstreamHealthy = true; // Fix the server
        await delay(COOLDOWN_MS + 500)

        console.log("🟢 Phase 5: Sending Recovery Probe...");
        await makeRequest("5. Recovery", 9); // Probe succeeds!
        await makeRequest("5. Normal", 10); // Traffic flows normally

        console.table(results);

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        upstreamServer.close();
        process.exit(0);
    }
}

// Start the dummy server, then run the tests
upstreamServer.listen(UPSTREAM_PORT, () => {
    runTests();
});