// WhatsApp JID helpers used by legacy group commands.
function normalize(jid) {
    return String(jid || "").split(":")[0];
}
function buildComparableIds(jid) {
    const raw = normalize(jid);
    const user = raw.split("@")[0];
    return [...new Set([raw, user, user ? `${user}@s.whatsapp.net` : ""])].filter(Boolean);
}
function lidToMention(jid) {
    const user = normalize(jid).split("@")[0];
    return user ? `@${user}` : "";
}
function findParticipant(participants, jid) {
    const ids = new Set(buildComparableIds(jid));
    return (participants || []).find(p =>
        buildComparableIds(p?.id || p?.jid || p).some(id => ids.has(id))
    ) || null;
}
module.exports = { normalize, buildComparableIds, lidToMention, findParticipant };
