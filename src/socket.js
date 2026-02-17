const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");

const sessions = {};

async function createSession(sessionId) {
    if (sessions[sessionId]) {
        return sessions[sessionId];
    }

    const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['RAHLXMD', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 10000
    });

    sessions[sessionId] = {
        sock,
        qr: null,
        connected: false
    };

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, qr } = update;

        if (qr) {
            sessions[sessionId].qr = await QRCode.toDataURL(qr);
        }

        if (connection === "open") {
            sessions[sessionId].connected = true;
            sessions[sessionId].qr = null;
            console.log(`✅ ${sessionId} connected`);
        }

        if (connection === "close") {
            sessions[sessionId].connected = false;
            console.log(`❌ ${sessionId} closed`);
        }
    });

    return sessions[sessionId];
}

function getSession(sessionId) {
    return sessions[sessionId];
}

module.exports = { createSession, getSession };
