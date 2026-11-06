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

module.exports = {
    WARN_COUNT: 3,
    APIs: global.APIs,
    APIKeys: global.APIKeys, 
    phoneNumber: "", // Don't Add If You Are Using Panel To Deploy
    prefixes: (process.env.PREFIX || ".").split(",").map((v) => v.trim()).filter(Boolean),
    processedIdLimit: Number(process.env.PROCESSED_ID_LIMIT || 2000),
    ownerNumbers: (process.env.OWNER_NUMBER || process.env.OWNER_NUMBERS || "").split(/[ ,]+/).filter(Boolean),
    admins: (process.env.ADMINS || "").split(/[ ,]+/).filter(Boolean)
};
