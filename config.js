require('dotenv').config();

global.APIs = {
    xteam: 'https://api.xteam.xyz',
    dzx: 'https://api.dhamzxploit.my.id',
    lol: 'https://api.lolhuman.xyz',
    violetics: 'https://violetics.pw',
    neoxr: 'https://api.neoxr.my.id',
    zenzapis: 'https://zenzapis.xyz',
    akuari: 'https://api.akuari.my.id',
    akuari2: 'https://apimu.my.id',
    nrtm: 'https://fg-nrtm.ddns.net',
    bg: 'http://bochil.ddns.net',
    fgmods: 'https://api-fgmods.ddns.net'
};

global.APIKeys = {
    'https://api.xteam.xyz': 'd90a9e986e18778b',
    'https://api.lolhuman.xyz': '85faf717d0545d14074659ad',
    'https://api.neoxr.my.id': 'yourkey',
    'https://violetics.pw': 'beta',
    'https://zenzapis.xyz': 'yourkey',
    'https://api-fgmods.ddns.net': 'fg-dylux'
};

const ownerNumbers = String(process.env.OWNER_NUMBER || process.env.OWNER || "")
    .split(/[;,\s]+/).map(value => value.replace(/\D/g, "")).filter(Boolean);
const admins = String(process.env.ADMINS || "")
    .split(/[;,\s]+/).map(value => value.replace(/\D/g, "")).filter(Boolean);
const prefixes = String(process.env.PREFIX || ".").split(",").map(value => value.trim()).filter(Boolean);

module.exports = {
    WARN_COUNT: 3,
    ownerNumbers,
    admins,
    prefixes,
    processedIdLimit: Number(process.env.PROCESSED_ID_LIMIT || 1000),
    APIs: global.APIs,
    APIKeys: global.APIKeys, 
    phoneNumber: "" // Don't Add If You Are Using Panel To Deploy
};
