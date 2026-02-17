import express from "express"
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys"
import P from "pino"
import fs from "fs"

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static("public"))

const activeSockets = {}

app.post("/pair", async (req, res) => {
  try {
    let { phone } = req.body

    if (!phone) {
      return res.json({ error: "Phone number required" })
    }

    // Clean number (remove spaces, +, etc)
    phone = phone.replace(/\D/g, "")

    const sessionPath = `./sessions/${phone}`

    if (!fs.existsSync("./sessions")) {
      fs.mkdirSync("./sessions")
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      auth: state,
      logger: P({ level: "silent" }),
      browser: ["Rahlxmd", "Chrome", "1.0.0"]
    })

    activeSockets[phone] = sock

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update

      if (connection === "open") {
        console.log(`✅ ${phone} connected`)
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        console.log(`❌ ${phone} closed:`, statusCode)

        if (statusCode !== DisconnectReason.loggedOut) {
          delete activeSockets[phone]
        }
      }
    })

    const pairingCode = await sock.requestPairingCode(phone)

    return res.json({ pairingCode })

  } catch (err) {
    console.error(err)
    return res.json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
