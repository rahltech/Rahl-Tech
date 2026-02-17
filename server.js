const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const pairRoute = require("./routes/pair.routes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check route (important for Render)
app.get("/", (req, res) => {
    res.send("🔥 Rahlxmd is running");
});

// Pairing route
app.use("/pair", pairRoute);

// Ensure sessions folder exists
const sessionsPath = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsPath)) {
    fs.mkdirSync(sessionsPath);
    console.log("📁 sessions folder created");
}

// Use Render's assigned port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🔥 Rahlxmd running on port ${PORT}`);
});
