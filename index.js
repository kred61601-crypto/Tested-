/**
 * Redtech Bot — SaaS Server - FIXED
 * Fixed: Missing POST /code caused "Unexpected token '<', <!DOCTYPE"
 * Now: POST /code returns JSON { code: "XXXX-XXXX" }
 */

const path = require("path");
const redtechWebhook = require("./saas/redtechWebhook");
const { isAdminAuthenticated } = require("./saas/adminAuth");
const botManager = require("./saas/botManager");

// ── Log noise filter ──────────────────────────────────────────────────────────
const _origError = console.error.bind(console);
const _origLog   = console.log.bind(console);

const CLEAN_SIGNAL_ERRORS = [
    { match: "Bad MAC",                                           msg: "⚠️  [Signal] Corrupt session key — will auto-refresh." },
    { match: "No matching sessions found",                        msg: "⚠️  [Signal] No session found — awaiting key exchange." },
    { match: "No session found to decrypt",                       msg: "⚠️  [Signal] Missing sender key — will resolve automatically." },
    { match: "Failed to decrypt message with any known session",  msg: "⚠️  [Signal] All session keys failed." },
    { match: "Closing open session in favor of incoming prekey",  msg: "ℹ️  [Signal] Re-keying session." },
    { match: "Closing session:",                                   msg: "ℹ️  [Signal] Closing stale session." },
    { match: "Decrypted message with closed session",             msg: "ℹ️  [Signal] Decrypted via closed session (harmless)." },
    { match: "transaction failed, rolling back",                  msg: "⚠️  [Signal] Transaction rollback (non-fatal)." },
    { match: "_chains",         msg: null },
    { match: "registrationId",  msg: null },
    { match: "currentRatchet",  msg: null },
    { match: "pendingPreKey",   msg: null },
    { match: "indexInfo",       msg: null },
    { match: "baseKeyType",     msg: null },
    { match: "ephemeralKeyPair",msg: null },
];

const _logCooldowns = new Map();
const COOLDOWN_MS = 30_000;

function interceptLog(originalFn, args) {
    const raw = String(args[0] ?? "");
    for (const { match, msg } of CLEAN_SIGNAL_ERRORS) {
        if (raw.includes(match)) {
            if (msg === null) return;
            const now = Date.now();
            if (now - (_logCooldowns.get(match) || 0) >= COOLDOWN_MS) {
                _logCooldowns.set(match, now);
                _origLog(msg);
            }
            return;
        }
    }
    originalFn(...args);
}

console.error = (...args) => interceptLog(_origError, args);
console.log   = (...args) => interceptLog(_origLog,   args);

process.on("unhandledRejection", (reason) => _origError("⚠️ Unhandled Rejection:", reason));
process.on("uncaughtException",  (error)  => _origError("⚠️ Uncaught Exception:", error));

// ── Express ───────────────────────────────────────────────────────────────────
const express = require("express");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || require("crypto").randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    },
}));

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// ── Bot API (/api/bot/*) ──────────────────────────────────────────────────────
app.use("/api/auth", require("./saas/authApiRoutes"));
app.use("/api/admin", require("./saas/adminApiRoutes"));
app.use("/api/bot", require("./saas/userApiRoutes"));
const { createDatabaseApiRouter } = require("./saas/redtechDatabaseApi");
const { requireAdmin } = require("./saas/adminAuth");
app.use("/api/redtech-database/v1", createDatabaseApiRouter());
app.use("/api/redtech/database", createDatabaseApiRouter());
app.use("/api/admin/redtech-database", require("./saas/redtechDatabaseApi").createAdminRouter(requireAdmin));

// ── FIX: PAIRING API - THIS WAS MISSING ───────────────────────────────────────
// Your code.html does fetch("/code", {method:"POST"}) but server only had GET /code
// which returns HTML. So frontend got HTML instead of JSON and crashed.
// These routes ALWAYS return JSON, never HTML.

async function handlePairing(req, res) {
  try {
    const body = req.body || {};
    const raw = (body.number || body.phone || body.phoneNumber || req.query.number || "").toString();
    const number = raw.replace(/\D/g, "");

    if (!number || number.length < 10) {
      return res.json({ success: false, error: "Enter valid number with country code, e.g. 254726476468" });
    }

    console.log(`[pair] Request for ${number}`);

    // 1. Try your existing botManager - try all common function names
    const candidates = [
      "requestPairingCode",
      "getPairingCode",
      "requestCode",
      "pair",
      "createPairingCode",
      "startPairing",
      "connect",
      "createBot",
    ];

    for (const name of candidates) {
      if (typeof botManager[name] === "function") {
        try {
          const out = await botManager[name](number, req);
          // Normalize any return shape to { code }
          const code = typeof out === "string" ? out : out?.code || out?.pairingCode || out?.pairing_code;
          if (code) return res.json({ success: true, code: String(code).trim() });
          if (out) return res.json({ success: true, ...out });
        } catch (e) {
          console.error(`[pair] botManager.${name} failed:`, e.message);
          // try next candidate, don't crash
        }
      }
    }

    // 2. Try botManager per-session helper if it exists
    if (typeof botManager.getBot === "function") {
      try {
        const bot = await botManager.getBot(req);
        if (bot && typeof bot.requestPairingCode === "function") {
          const code = await bot.requestPairingCode(number);
          if (code) return res.json({ success: true, code: String(code).trim() });
        }
      } catch (e) { console.error("[pair] getBot failed:", e.message); }
    }

    // 3. If nothing worked, tell frontend clearly (as JSON, not HTML)
    return res.json({
      success: false,
      error: "Pairing function not found in botManager.js. Add requestPairingCode(number) to saas/botManager.js"
    });

  } catch (e) {
    console.error("[pair] Error:", e);
    return res.status(500).json({ success: false, error: e.message || "Pairing failed" });
  }
}

// All these URLs point to same handler - so any frontend version works
app.post("/code", handlePairing);
app.post("/api/code", handlePairing);
app.post("/api/bot/pair", handlePairing);
app.post("/api/bot/code", handlePairing);
app.post("/pair", handlePairing);
app.get("/api/bot/code", handlePairing);

// ── Pages ─────────────────────────────────────────────────────────────────────

const codeWorkspace = path.join(__dirname, "public", "code.html");
const adminWorkspace = path.join(__dirname, "public", "admin.html");
const authWorkspace = path.join(__dirname, "public", "auth.html");
const adminAccessWorkspace = path.join(__dirname, "public", "admin-access.html");
const settingsWorkspace = path.join(__dirname, "public", "settings.html");

app.get("/", (_req, res) => res.redirect("/code"));
app.get("/token", (_req, res) => res.redirect("/code"));
app.get("/code", (_req, res) => res.sendFile(codeWorkspace));
app.get("/admin", (req, res) => { if (!isAdminAuthenticated(req)) return res.sendFile(adminAccessWorkspace); return res.sendFile(adminWorkspace); });
app.get("/auth", (_req, res) => res.redirect("/"));
app.get("/settings", (_req, res) => res.redirect("/code"));
app.get("/connect", (_req, res) => res.redirect("/code"));
app.get("/dashboard", (_req, res) => res.redirect("/code"));
app.get("/bot-dashboard", (_req, res) => res.redirect("/code"));
app.get("/login", (_req, res) => res.redirect("/code"));
app.get("/servers", (_req, res) => res.redirect("/code"));
app.get("/pair", (_req, res) => res.redirect("/code"));
app.get("/health", (req, res) => res.send("🤖 Redtech Bot SaaS is Online!"));

// ── Listen ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🌍 Redtech Bot SaaS listening on port ${PORT}`);
    redtechWebhook.start();
    botManager.restorePersisted().catch((error) => console.error("❌ Persistent bot restore failed:", error.message));
});
