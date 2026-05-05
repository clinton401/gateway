import { Client } from "pg";
import type { RouteTableContainer } from "../types/index";
import { loadRoutesFromDatabase, buildRouteTable } from "./routes";

export async function setupDatabaseListener(container: RouteTableContainer) {
    let client: Client;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let hasConnectedOnce = false; // Tracks if we need a full reload upon recovery

    async function connectAndListen() {
        try {
            client = new Client({ connectionString: process.env.DIRECT_URL });

            client.on("notification", async (msg) => {
                if (msg.channel === "route_updates") {
                    console.log("🔄 Database change detected! Hot-reloading...");
                    await performFullReload();
                }
            });

            client.on("error", (err) => {
                console.error("❌ Postgres Listener Error:", err.message);
                scheduleReconnect();
            });

            client.on("end", () => {
                console.warn("⚠️ Postgres Listener Disconnected.");
                scheduleReconnect();
            });

            await client.connect();
            console.log("📡 Postgres LISTEN connection established.");

            await client.query("LISTEN route_updates");

            // If this is a recovery connection, we might have missed updates while offline.
            if (hasConnectedOnce) {
                console.log("🔄 Recovering missed data...");
                await performFullReload();
            }
            hasConnectedOnce = true;

        } catch (error) {
            console.error("❌ Failed to connect Listener. Retrying in 5s...");
            scheduleReconnect();
        }
    }

    function scheduleReconnect() {
        // If we are already counting down to a retry, do nothing.
        if (reconnectTimer) return;

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null; // Clear the lock so we can retry again if THIS fails
            console.log("🔄 Attempting to reconnect Postgres Listener...");
            connectAndListen();
        }, 5000);
    }

    async function performFullReload() {
        try {
            const freshRoutes = await loadRoutesFromDatabase();
            const newTable = buildRouteTable(freshRoutes);

            // THE ATOMIC SWAP
            container.table = newTable;
            container.lastReloadAt = new Date();

            console.log(`✅ Gateway Atomic Swap complete. Tracking ${container.table.size} routes.`);
        } catch (error) {
            console.error("❌ Failed to hot-reload routes:", error);
        }
    }

    // Kick off the first connection
    await connectAndListen();
}