import express from "express"
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from "@whiskeysockets/baileys"
import P from "pino"
import fs from "fs"
import path from "path"

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static("public"))

const activeSockets = {}

app.post("/generate", async (req, res) => {
  try {
    let { number } = req.body

    if (!number) {
      return res.json({ status: "error", message: "Phone number required" })
    }

    // Clean number
    number = number.replace(/\D/g, "")

    const sessionPath = `./sessions/${number}`

    if (!fs.existsSync("./sessions")) {
      fs.mkdirSync("./sessions")
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      auth: state,
      logger: P({ level: "silent" }),
      browser: ["MultiUser Bot", "Chrome", "1.0.0"]
    })

    activeSockets[number] = sock

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === "open") {
        console.log(`✅ ${number} connected`)
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        console.log(`❌ ${number} closed:`, statusCode)

        if (statusCode !== DisconnectReason.loggedOut) {
          delete activeSockets[number]
        }
      }
    })

    const code = await sock.requestPairingCode(number)

    res.json({
      status: "success",
      code
    })

  } catch (err) {
    res.json({
      status: "error",
      message: err.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`)
})
