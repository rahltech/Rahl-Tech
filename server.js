import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import P from "pino"
import fs from "fs"
import express from "express"

const app = express()
const PORT = process.env.PORT || 3000

// ✅ Auto delete session folder every restart
if (fs.existsSync("./session")) {
  fs.rmSync("./session", { recursive: true, force: true })
  console.log("🗑 Old session deleted")
}

// Simple route so Render knows server is alive
app.get("/", (req, res) => {
  res.send("WhatsApp Bot Running ✅")
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  startBot()
})

async function startBot() {
  try {
    console.log("📲 Connecting to WhatsApp...")

    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: P({ level: "silent" })
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === "open") {
        console.log("✅ Connected to WhatsApp!")
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode

        console.log("❌ Connection closed:", statusCode)

        if (statusCode !== DisconnectReason.loggedOut) {
          console.log("🔄 Reconnecting...")
          startBot()
        } else {
          console.log("🚫 Logged out. Delete session and redeploy.")
        }
      }
    })

    // 🔥 REQUEST PAIRING CODE
    const phoneNumber = process.env.NUMBER

    if (!phoneNumber) {
      console.log("❌ NUMBER not set in environment variables")
      return
    }

    const code = await sock.requestPairingCode(phoneNumber)
    console.log("🔑 Pairing Code:", code)

  } catch (err) {
    console.log("❌ Pairing error:", err)
  }
        }
