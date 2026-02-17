const makeWASocket = require("@whiskeysockets/baileys").default;
const {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const path = require("path");

async function createSocket(sessionId) {
    const sessionPath = path.join(__dirname, "../sessions", sessionId);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS("Rahlxmd"),
        generateHighQualityLinkPreview: true,
        syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        console.log("Connection state:", connection);

        if (connection === "open") {
            console.log("✅ WhatsApp Connected");
        }

        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;

            console.log("❌ Connection closed. Code:", code);

            if (code === DisconnectReason.loggedOut) {
                console.log("Logged out from WhatsApp");
            }
        }
    });

    return sock;
}

module.exports = { createSocket };
