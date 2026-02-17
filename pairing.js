const { v4: uuidv4 } = require("uuid");

const { generateToken } = require("./src/tokenManager");
const { createSocket } = require("./src/socket");
const { storeSession } = require("./src/sessionManager");

async function initiatePairing(phone) {
    try {
        if (!phone) {
            throw new Error("Phone number is required");
        }

        // Clean phone number
        phone = phone.replace(/\+/g, "").trim();

        const token = generateToken();
        const sessionId = uuidv4();

        console.log("🔐 Creating socket for session:", sessionId);

        const sock = await createSocket(sessionId);

        // 🔥 WAIT for socket to reach "connecting" state
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Socket initialization timeout"));
            }, 15000); // 15 seconds safety

            sock.ev.on("connection.update", (update) => {
                const { connection } = update;

                console.log("Connection state:", connection);

                if (connection === "connecting") {
                    clearTimeout(timeout);
                    resolve();
                }

                if (connection === "close") {
                    clearTimeout(timeout);
                    reject(new Error("Connection closed before pairing"));
                }
            });
        });

        console.log("📲 Requesting pairing code for:", phone);

        const realCode = await sock.requestPairingCode(phone);

        if (!realCode) {
            throw new Error("Pairing code returned undefined");
        }

        console.log("✅ Pairing code generated:", realCode);

        storeSession(token, {
            realCode,
            sessionId,
            sock
        });

        return realCode;

    } catch (error) {
        console.error("❌ Pairing error:", error);
        throw new Error("Pairing failed");
    }
}

module.exports = { initiatePairing };
