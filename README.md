
# ⚡ GatewayOS: Data Plane (Node.js Proxy)

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-Fast-lightgrey?style=for-the-badge&logo=express)
![Redis](https://img.shields.io/badge/Redis-TCP-red?style=for-the-badge&logo=redis)
![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?style=for-the-badge&logo=prisma)

This repository contains the **Data Plane** for GatewayOS. It is a highly optimized, low-latency API Gateway built with Node.js and Express. It sits in front of your microservices, intercepts incoming traffic, and executes a rigorous middleware pipeline before securely proxying the request upstream.

> **Note:** This proxy relies on configurations set by the [GatewayOS Admin Dashboard](https://gatewayos.vercel.app). 

---

## 🧠 The Middleware Pipeline

Every request passing through GatewayOS is subjected to a synchronous, strictly-ordered pipeline. If a request fails any stage, it is immediately rejected without wasting upstream resources.

1.  **Route Matching:** Scans the Postgres database (via Prisma) to find the configured upstream destination for the incoming `Path` and `Method`.
2.  **Rate Limiter:** Connects to Redis to execute a Sliding Window algorithm. Enforces strict `X requests per Y seconds` limits based on IP or Headers.
3.  **Auth Enforcer:** Cryptographically verifies JWT signatures or hashes incoming API Keys against the database. Injects user identity headers (`X-Gateway-User-Id`) into the request.
4.  **Circuit Breaker:** Checks Redis for the health state of the upstream service (`CLOSED`, `OPEN`, `HALF_OPEN`). Instantly trips and returns `503 Service Unavailable` if the upstream is experiencing a high failure rate, protecting it from catastrophic overload.
5.  **Payload Transformer:** Mutates the request on the fly. Strips sensitive PII from JSON bodies, injects security headers, or rewrites URL paths before forwarding.
6.  **Upstream Proxy:** Forwards the sanitized request to the final destination, measures the exact latency, and logs the response payload size.

## 📈 Performance & Stress Testing
This proxy is designed for raw throughput. By utilizing a persistent `ioredis` TCP connection and intelligent database indexing, the Gateway maintains sub-millisecond processing overhead per request. It is capable of handling heavy concurrent traffic and correctly tripping circuit breakers under simulated DDoS or upstream outage scenarios.

## 💻 Tech Stack
*   **Runtime:** Node.js
*   **Server:** Express.js
*   **Database Client:** Prisma (Neon Postgres)
*   **Caching / State:** `ioredis` (TCP connection for maximum throughput)

## 🚀 Local Development Setup

**1. Clone the repository**
```bash
git clone [https://github.com/yourusername/gatewayos-backend.git](https://github.com/yourusername/gatewayos-backend.git)
cd gatewayos-backend
npm install
```

**2. Configure Environment Variables**
Create a `.env` file in the root directory. *Note: Ensure this connects to the exact same database and Redis instance as your Frontend Control Plane.*

```env
# Database & Cache
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..." # Use the standard Redis URL, not the REST URL used in the frontend
```

**3. Sync Prisma Client**
```bash
npx prisma generate
```

**4. Run the Proxy**
```bash
npm run dev
```
The Gateway will start listening on `http://localhost:3001`. Send traffic to this port, and configure your routing rules in the Next.js Admin Dashboard!

## 👨‍💻 Author
**Clinton Phillips**
*   **Portfolio:** [clintondevlab.netlify.app](https://clintondevlab.netlify.app/)
*   **LinkedIn:** [in/clinton-phillips-316a42250](https://www.linkedin.com/in/clinton-phillips-316a42250/)
*   **X / Twitter:** [@phillips464](https://x.com/phillips464)