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

let latestPairingCode = null

// 🔥 OPTIONAL: clear session on start (uncomment if needed)
// if (fs.existsSync("./session")) {
//   fs.rmSync("./session", { recursive: true, force: true })
//   console.log("🗑 Old session deleted")
// }

app.get("/", (req, res) => {
  res.send("WhatsApp Bot Running ✅")
})

// 🔥 API route to send pairing code to frontend
app.get("/pair", (req, res) => {
  if (!latestPairingCode) {
    return res.json({ status: "waiting", code: null })
  }

  res.json({ status: "ready", code: latestPairingCode })
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
      logger: P({ level: "silent" }),
      browser: ["Render Bot", "Chrome", "1.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === "connecting") {
        console.log("🔄 Connecting...")
      }

      if (connection === "open") {
        console.log("✅ Connected to WhatsApp!")
        latestPairingCode = null
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        console.log("❌ Connection closed:", statusCode)

        if (statusCode !== DisconnectReason.loggedOut) {
          console.log("🔁 Reconnecting...")
          startBot()
        } else {
          console.log("🚫 Logged out. Delete session folder and redeploy.")
        }
      }

      // ✅ REQUEST PAIRING AT CORRECT TIME
      if (connection === "connecting" && !sock.authState.creds.registered) {
        try {
          const code = await sock.requestPairingCode(process.env.NUMBER)

          latestPairingCode = code

          console.log("🔑 Pairing Code:", code)
        } catch (err) {
          console.log("❌ Pairing error:", err)
        }
      }
    })

  } catch (err) {
    console.log("❌ Fatal Error:", err)
  }
                      }
