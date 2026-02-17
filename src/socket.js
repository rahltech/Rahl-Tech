sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
        console.log("Connection closed. Reconnecting...");
        await createSocket(sessionId);
    }

    if (connection === "open") {
        console.log("Rahlxmd Connected");

        const creds = fs.readFileSync(path.join(sessionPath, "creds.json"));
        const base44Session = encodeBase44(creds);

        console.log("Base44 Session:", base44Session);
    }
});
