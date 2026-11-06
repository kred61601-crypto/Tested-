# Command system repair notes

## Repairs applied
- `lib/commandHandler.js` now supports both modern `{ name, execute }` commands and legacy function exports.
- Legacy handlers receive mapped arguments (socket, chat JID, raw message, sender, mentions, text, quoted message, group metadata, etc.).
- Object exports register named `*Command` handlers without mistakenly registering event/helper functions.
- Added `lib/isAdmin.js`, `lib/isOwner.js`, `lib/jidHelper.js`, and `lib/index.js` compatibility helpers used by legacy commands.
- `config.js` now exports `ownerNumbers`, `admins`, `prefixes`, and `processedIdLimit`.
- `lib/middleware.js` safely defaults missing owner/admin lists.
- `saas/botInstance.js` now awaits message processing and logs command-processing failures instead of leaving rejected promises unhandled.
- Added explicit `pino` and CommonJS-compatible `node-fetch` dependencies.
- JavaScript syntax check: passed for every `.js` file in the archive.

## Deployment
1. Replace the existing project with the contents of this ZIP (keep your existing `.env` values).
2. On Render, run `npm install` and then `npm start`.
3. Set `OWNER_NUMBER` to the bot owner's WhatsApp number with country code and digits only. Optional `ADMINS` and `PREFIX` can be comma-separated.
4. Check Render logs for `Loaded ... command handler(s)` and `Loaded ... command names`.

## Important limitations found in the source archive
This project is a mixed revision. Several old commands import other helper files that are absent from this ZIP (for example `lib/welcome.js`, `lib/messageConfig.js`, `lib/antilink.js`, `lib/uploadImage.js`, `lib/uploader.js`, `lib/api.js`, `lib/waVideo.js`, `lib/converter.js`, and `lib/exif.js`). Those individual commands will still be skipped at load time until their original helper implementations are restored. Some source files are heavily obfuscated and cannot be safely reconstructed from this archive alone. This repair fixes the shared loader/access/event blockers; it does not fabricate missing API services or private helper implementations.
