// Compatibility adapter for legacy command modules.
const { isOwner } = require("./middleware");
module.exports = async function isOwnerOrSudo(senderId, sock) {
    if (isOwner(senderId)) return true;
    const digits = String(senderId || "").replace(/\D/g, "");
    const sudo = String(process.env.SUDO || "").replace(/\D/g, "");
    return Boolean(digits && sudo && digits === sudo);
};
