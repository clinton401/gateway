const http = require("http");

// --- CONFIGURATION ---
const GATEWAY_URL = "http://localhost:3000";
const VALID_API_KEY = "gw_live_0f946c85158e2dd39365dcffd51b699b4b81ec73e339152fe5127b6b07a398d2"; // <--- PASTE YOUR KEY HERE

// --- THE DUMMY MICROSERVICE ---
// This simulates the backend API running on port 4001
const dummyMicroservice = http.createServer((req, res) => {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {

        console.log("\n[Microservice] 📥 I just received a request!");
        console.log("[Microservice] Headers Received:", {
            "x-service-token": req.headers["x-service-token"],
            "x-gateway-request-id": req.headers["x-gateway-request-id"],
            "x-forwarded-for": req.headers["x-forwarded-for"] || "MISSING (Stripped!)"
        });

        console.log("[Microservice] Body Received:", body);

        // Send a response back to the Gateway with a sensitive field
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            message: "Success",
            user_id: 123,
            internal_db_id: "secret_database_row_999" // The Gateway should strip this!
        }));
    });
});

async function runTest() {
    console.log("🚀 Firing payload at the Gateway...\n");

    const originalPayload = {
        userId: 123, // Note the camelCase. Gateway should change to snake_case.
        name: "Clinton"
    };

    console.log("[Client] 📤 Sending Payload:", originalPayload);

    try {
        const response = await fetch(`${GATEWAY_URL}/api/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": VALID_API_KEY,
                "X-Forwarded-For": "192.168.1.1" // Gateway should strip this
            },
            body: JSON.stringify(originalPayload)
        });

        const responseBody = await response.json();

        console.log("\n[Client] 📥 Received Response from Gateway:");
        console.log("[Client] Headers:", {
            "x-gateway-request-id": response.headers.get("x-gateway-request-id")
        });
        console.log("[Client] Body:", responseBody);

        console.log("\n✅ Transformation Test Complete!");

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        dummyMicroservice.close();
        process.exit(0);
    }
}

// Start the microservice, then run the test
dummyMicroservice.listen(4001, () => {
    runTest();
});