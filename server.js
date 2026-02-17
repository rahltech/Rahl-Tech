import express from "express"
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys"
import P from "pino"
import fs from "fs"
import QRCode from "qrcode"

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static("public"))

const activeSockets = {}

app.post("/pair", async (req, res) => {
  try {
    let { phone, method } = req.body
    method = method || "code"

    if (method === "code" && !phone) {
      return res.json({ error: "Phone number required for pairing code" })
    }

    if (phone) {
      phone = phone.replace(/\D/g, "")
    }

    const sessionId = phone || Date.now().toString()
    const sessionPath = `./sessions/${sessionId}`

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

    activeSockets[sessionId] = sock

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update

      // ✅ REAL QR IMAGE
      if (method === "qr" && qr) {
        const qrImage = await QRCode.toDataURL(qr)

        return res.json({
          type: "qr",
          image: qrImage
        })
      }

      if (connection === "open") {
        console.log(`✅ ${sessionId} connected`)
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        console.log(`❌ ${sessionId} closed:`, statusCode)

        if (statusCode !== DisconnectReason.loggedOut) {
          delete activeSockets[sessionId]
        }
      }
    })

    // ✅ CODE METHOD
    if (method === "code") {
      const pairingCode = await sock.requestPairingCode(phone)

      return res.json({
        type: "code",
        code: pairingCode
      })
    }

  } catch (err) {
    console.error(err)
    return res.json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
