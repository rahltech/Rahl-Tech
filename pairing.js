const { v4: uuidv4 } = require("uuid");
const { generateToken } = require("./src/tokenManager");
const { createSocket } = require("./src/socket");
const { storeSession } = require("./src/sessionManager");

async function initiatePairing(phone, method = "code") {
    try {
        if (!phone && method === "code") {
            throw new Error("Phone number is required for pairing code");
        }

        if (phone) {
            phone = phone.replace(/\+/g, "").trim();
        }

        const token = generateToken();
        const sessionId = uuidv4();

        console.log("🔐 Creating socket for session:", sessionId);

        const sock = await createSocket(sessionId);

        return await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Socket timeout"));
            }, 30000);

            sock.ev.on("connection.update", async (update) => {
                const { connection, qr } = update;

                console.log("Connection state:", connection);

                // ✅ QR METHOD
                if (method === "qr" && qr) {
                    clearTimeout(timeout);

                    storeSession(token, {
                        sessionId,
                        sock
                    });

                    console.log("📸 QR Generated");

                    resolve({
                        type: "qr",
                        data: qr
                    });
                }

                // ✅ CODE METHOD
                if (method === "code" && connection === "open") {
                    try {
                        clearTimeout(timeout);

                        console.log("📲 Requesting pairing code for:", phone);

                        const realCode = await sock.requestPairingCode(phone);

                        if (!realCode) {
                            return reject(new Error("Pairing code undefined"));
                        }

                        storeSession(token, {
                            realCode,
                            sessionId,
                            sock
                        });

                        console.log("✅ Pairing code generated:", realCode);

                        resolve({
                            type: "code",
                            data: realCode
                        });

                    } catch (err) {
                        reject(err);
                    }
                }

                if (connection === "close") {
                    clearTimeout(timeout);
                    reject(new Error("Connection closed"));
                }
            });
        });

    } catch (error) {
        console.error("❌ Pairing error:", error);
        throw error;
    }
}

module.exports = { initiatePairing };
