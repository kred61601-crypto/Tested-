// Small persistent compatibility store for legacy moderation commands.
const fs = require("fs");
const path = require("path");
const { isAdmin: checkAdmin, isOwner: checkOwner, isSudo: checkSudo } = require("./middleware");

const dataDir = path.join(__dirname, "../data");
const file = path.join(dataDir, "legacy-command-state.json");
let state = {};
try { state = JSON.parse(fs.readFileSync(file, "utf8")); } catch (_) { state = {}; }

function save() {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(file, JSON.stringify(state, null, 2));
    } catch (error) {
        console.error("Legacy command state save failed:", error.message);
    }
}
function section(name) {
    if (!state[name] || typeof state[name] !== "object") state[name] = {};
    return state[name];
}
function getToggle(name, jid) { return section(name)[jid] || null; }
function setToggle(name, jid, value) { section(name)[jid] = value; save(); return true; }
function removeToggle(name, jid) { delete section(name)[jid]; save(); return true; }

module.exports = {
    setAntilink: async (jid, key, action = "delete") => setToggle("antilink", jid, { enabled: true, action }),
    getAntilink: async (jid) => getToggle("antilink", jid),
    removeAntilink: async (jid) => removeToggle("antilink", jid),
    setAntitag: async (jid, key, action = "delete") => setToggle("antitag", jid, { enabled: true, action }),
    getAntitag: async (jid) => getToggle("antitag", jid),
    removeAntitag: async (jid) => removeToggle("antitag", jid),
    isWelcomeOn: async (jid) => Boolean(getToggle("welcome", jid)?.enabled),
    getWelcome: async (jid) => getToggle("welcome", jid)?.message || "",
    isGoodByeOn: async (jid) => Boolean(getToggle("goodbye", jid)?.enabled),
    getGoodbye: async (jid) => getToggle("goodbye", jid)?.message || "",
    getSudoList: async () => Object.keys(section("sudo")),
    removeSudo: async (jid) => removeToggle("sudo", jid),
    incrementWarningCount: async (jid, user) => {
        const key = `${jid}:${user}`;
        const warnings = section("warnings");
        warnings[key] = Number(warnings[key] || 0) + 1;
        save();
        return warnings[key];
    },
    resetWarningCount: async (jid, user) => {
        delete section("warnings")[`${jid}:${user}`];
        save();
        return true;
    },
    isGroup: (jid) => String(jid || "").endsWith("@g.us"),
    isOwner: (jid) => checkOwner(jid),
    isOwnerOrSudo: (jid) => checkOwner(jid) || checkSudo(jid),
    isSudo: (jid) => checkSudo(jid),
    isAdmin: async (jid, chatId, sock) => checkAdmin(jid, chatId, sock),
    isBotAdmin: async (sock, chatId) => {
        const id = (sock?.user?.id || "").split(":")[0];
        return id ? checkAdmin(`${id}@s.whatsapp.net`, chatId, sock) : false;
    }
};
