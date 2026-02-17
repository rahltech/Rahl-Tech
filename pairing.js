const { v4: uuidv4 } = require("uuid");

const { generateToken } = require("./src/tokenManager");
const { createSocket } = require("./src/socket");
const { storeSession } = require("./src/sessionManager");

const config = require("./config");

async function initiatePairing(phone) {
    const token = generateToken();
    const brandedCode = `${config.BRAND_PREFIX}-${token}`;
    const sessionId = uuidv4();

    const sock = await createSocket(sessionId);

    let realCode;

    await new Promise((resolve, reject) => {

        const timeout = setTimeout(() => {
            reject(new Error("Pairing timeout"));
        }, 20000); // 20 sec safety

        sock.ev.on("connection.update", async (update) => {
            const { connection } = update;

            console.log("Connection state:", connection);

            if (connection === "connecting") {
                try {
                    realCode = await sock.requestPairingCode(phone);
                    clearTimeout(timeout);
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            }

            if (connection === "close") {
                clearTimeout(timeout);
                reject(new Error("Connection closed"));
            }
        });
    });

    storeSession(token, {
        realCode,
        sessionId,
        sock
    });

    return brandedCode;
}

module.exports = { initiatePairing };
