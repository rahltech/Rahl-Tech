const express = require("express");
const router = express.Router();
const { initiatePairing } = require("../pairing"); // pairing.js is in root

router.post("/", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                error: "Phone number required"
            });
        }

        const pairingCode = await initiatePairing(phone);

        return res.json({
            pairing_code: pairingCode
        });

    } catch (error) {
        console.error("Pairing error:", error);
        return res.status(500).json({
            error: "Pairing failed"
        });
    }
});

module.exports = router;
