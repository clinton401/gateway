import crypto from "crypto";

type GeneratedKey = {
    plaintextKey: string;
    hashedKey: string;
    prefix: string;
};

export function generateApiKey(): GeneratedKey {
    // 1. Generate secure random string (256-bit)
    const random = crypto.randomBytes(32).toString("hex");

    // 2. Add prefix (environment-aware is better)
    const key = `gw_live_${random}`;

    // 3. Hash the FULL key (this is what you store)
    const hashedKey = crypto
        .createHash("sha256")
        .update(key)
        .digest("hex");

    // 4. Extract prefix (for lookup/display)
    const prefix = key.slice(0, 20);

    return {
        plaintextKey: key,   // show ONCE to user
        hashedKey,           // store in DB
        prefix,              // store in DB
    };
}