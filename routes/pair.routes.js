const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { generateToken } = require("../src/tokenManager");
const { createSocket } = require("../src/socket");
const config = require("../config");

const activeTokens = {};

router.post("/", async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "Phone number required" });
    }

    const token = generateToken();
    const brandedCode = `${config.BRAND_PREFIX}-${token}`;
    const sessionId = uuidv4();

    const sock = await createSocket(sessionId);
    const realCode = await sock.requestPairingCode(phone);

    activeTokens[token] = {
        realCode,
        sessionId
    };

    res.json({
        pairing_code: brandedCode
    });
});

module.exports = router;
