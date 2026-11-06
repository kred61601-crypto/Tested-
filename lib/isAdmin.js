// Compatibility adapter for legacy command modules.
const { isAdmin: checkAdmin } = require("./middleware");

module.exports = async function isAdmin(sock, chatId, senderId) {
    const isSenderAdmin = await checkAdmin(senderId, chatId, sock);
    const botId = (sock?.user?.id || "").split(":")[0];
    const botJid = botId ? `${botId}@s.whatsapp.net` : "";
    const isBotAdmin = Boolean(botJid) && await checkAdmin(botJid, chatId, sock);
    return { isSenderAdmin, isBotAdmin };
};
