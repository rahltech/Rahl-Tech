const express = require("express");
const bodyParser = require("body-parser");
const config = require("./config");
const pairRoute = require("./routes/pair.routes");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/pair", pairRoute);

app.listen(config.PORT, () => {
    console.log(`🔥 Rahlxmd Web Server running on port ${config.PORT}`);
});
