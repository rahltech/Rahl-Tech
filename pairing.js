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

        // Remove + and spaces
        phone = phone.replace(/\+/g, "").trim();

        const token = generateToken();
        const sessionId = uuidv4();

        console.log("🔐 Creating socket for session:", sessionId);

        const sock = await createSocket(sessionId);

        // Wait a few seconds for socket to initialize properly
        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log("📲 Requesting pairing code for:", phone);

        const realCode = await sock.requestPairingCode(phone);

        if (!realCode) {
            throw new Error("No pairing code received from WhatsApp");
        }

        console.log("✅ Pairing code generated:", realCode);

        // Store session details
        storeSession(token, {
            realCode,
            sessionId,
            sock
        });

        // ✅ IMPORTANT: Return the REAL WhatsApp pairing code
        return realCode;

    } catch (error) {
        console.error("❌ Pairing error:", error);
        throw new Error("Pairing failed");
    }
}

module.exports = { initiatePairing };
