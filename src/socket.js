const makeWASocket = require("@whiskeysockets/baileys").default;
const { 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");
const { encodeBase44 } = require("../base44");

async function createSocket(sessionId) {
    const sessionPath = path.join(__dirname, "../sessions", sessionId);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // IMPORTANT
        browser: Browsers.macOS("Rahlxmd") // VERY IMPORTANT for pairing
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection } = update;

        if (connection === "open") {
            console.log("✅ Rahlxmd Connected");

            const credsPath = path.join(sessionPath, "creds.json");

            if (fs.existsSync(credsPath)) {
                const creds = fs.readFileSync(credsPath);
                const base44Session = encodeBase44(creds);
                console.log("Base44 Session:", base44Session);
            }
        }

        if (connection === "close") {
            console.log("❌ Connection closed");
        }
    });

    return sock;
}

module.exports = { createSocket };
