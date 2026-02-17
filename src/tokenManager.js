function generateToken() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

module.exports = { generateToken };
