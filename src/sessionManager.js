const activeSessions = new Map();

function storeSession(token, data) {
    activeSessions.set(token, data);
}

function getSession(token) {
    return activeSessions.get(token);
}

function removeSession(token) {
    activeSessions.delete(token);
}

module.exports = {
    storeSession,
    getSession,
    removeSession
};
