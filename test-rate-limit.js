// test-rate-limit.js
async function testRateLimit() {
    const results = [];

    for (let i = 0; i < 15; i++) {
        const res = await fetch("http://localhost:3000/api/users");
        results.push({
            request: i + 1,
            status: res.status,
            remaining: res.headers.get("x-ratelimit-remaining"),
            retryAfter: res.headers.get("retry-after"),
        });
    }

    console.table(results);
}

testRateLimit();