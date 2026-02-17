require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const pairRoute = require("./routes/pair.routes");

const app = express();   

app.use(bodyParser.json());
app.use(express.static("public"));


app.use("/pair", pairRoute);

app.get("/", (req, res) => {
    res.send("🔥 Rahlxmd is running");
});


if (!fs.existsSync("./sessions")) {
    fs.mkdirSync("./sessions");
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🔥 Rahlxmd running on port ${PORT}`);
});
