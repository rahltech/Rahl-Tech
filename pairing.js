const { v4: uuidv4 } = require("uuid");

const { generateToken } = require("./src/tokenManager");
const { createSocket } = require("./src/socket");
const { storeSession } = require("./src/sessionManager");

const config = require("./config");

async function initiatePairing(phone) {
    try {
        if (!phone) {
            throw new Error("Phone number is required");
        }

        // Remove + if user sends it
        phone = phone.replace(/\+/g, "").trim();

        const token = generateToken();
        const brandedCode = `${config.BRAND_PREFIX}-${token}`;
        const sessionId = uuidv4();

        console.log("🔐 Creating socket for session:", sessionId);

        const sock = await createSocket(sessionId);

        // Small delay to allow socket to initialize properly
        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log("📲 Requesting pairing code for:", phone);

        const realCode = await sock.requestPairingCode(phone);

        console.log("✅ Pairing code generated");

        storeSession(token, {
            realCode,
            sessionId,
            sock
        });

        return brandedCode;

    } catch (error) {
        console.error("❌ Pairing error:", error);
        throw new Error("Pairing failed");
    }
}

module.exports = { initiatePairing };
