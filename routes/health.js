const express = require("express");
const router = express.Router();
const TelegramBot = require("node-telegram-bot-api");

// Basic health endpoint
router.get("/", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Telegram send test to all configured chat IDs
router.get("/telegram", async (req, res) => {
  try {
    const token = process.env.TELEGRAM_TOKEN;
    if (!token) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing TELEGRAM_TOKEN" });
    }

    const bot = new TelegramBot(token, { polling: false });

    const DEFAULT_MOM_CHAT_ID = "1286269182";
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || process.env.MY_CHAT_ID;
    const ENV_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS
      ? process.env.TELEGRAM_CHAT_IDS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [process.env.MOM_CHAT_ID || DEFAULT_MOM_CHAT_ID, ADMIN_CHAT_ID].filter(
          Boolean
        );

    if (!ENV_CHAT_IDS.length) {
      return res
        .status(400)
        .json({ ok: false, error: "No chat IDs configured" });
    }

    const results = [];
    for (const chatId of ENV_CHAT_IDS) {
      try {
        await bot.sendMessage(
          chatId,
          `Health check: service is up at ${new Date().toLocaleString()}`
        );
        results.push({ chatId, status: "sent" });
      } catch (err) {
        results.push({ chatId, status: "failed", error: err.message });
      }
    }

    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
