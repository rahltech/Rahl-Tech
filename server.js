import express from "express"
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys"
import P from "pino"

const app = express()
const PORT = process.env.PORT || 3000

let latestPairingCode = null
let sock = null

// Home route
app.get("/", (req, res) => {
  res.send("WhatsApp Bot Running ✅")
})

// Pair route (frontend will call this)
app.get("/pair", (req, res) => {
  if (!latestPairingCode) {
    return res.json({ status: "waiting", code: null })
  }

  res.json({
    status: "ready",
    code: latestPairingCode
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  startBot()
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["Render Bot", "Chrome", "1.0.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting") {
      console.log("🔄 Connecting to WhatsApp...")
    }

    if (connection === "open") {
      console.log("✅ Connected successfully!")
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

    // Request pairing correctly
    if (connection === "connecting" && !sock.authState.creds.registered) {
      try {
        const phone = process.env.NUMBER

        if (!phone) {
          console.log("❌ NUMBER environment variable missing")
          return
        }

        const code = await sock.requestPairingCode(phone)
        latestPairingCode = code

        console.log("🔑 Pairing Code:", code)

      } catch (err) {
        console.log("❌ Pairing error:", err)
      }
    }
  })
}
