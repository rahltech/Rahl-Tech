const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
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
});  

sock.ev.on("creds.update", saveCreds);  

sock.ev.on("connection.update", async (update) => {  
    const { connection } = update;  

    if (connection === "open") {  
        console.log("Rahlxmd Connected");  

        const creds = fs.readFileSync(path.join(sessionPath, "creds.json"));  
        const base44Session = encodeBase44(creds);  

        console.log("Base44 Session:", base44Session);  
    }  
});  

return sock;

}

module.exports = { createSocket };
