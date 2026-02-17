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
    const realCode = await sock.requestPairingCode(phone);

    storeSession(token, {
        realCode,
        sessionId,
        sock
    });

    return brandedCode;
}

module.exports = { initiatePairing };
