const express = require("express");
const router = express.Router();
const { initiatePairing } = require("../src/pairing");

router.post("/", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: "Phone number required" });
        }

        const pairingCode = await initiatePairing(phone);

        res.json({
            pairing_code: pairingCode
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Pairing failed" });
    }
});

module.exports = router;
