"""A simple Telegram bot powered by xAI's Grok."""
import logging
import os
import sys
from collections import defaultdict, deque

from dotenv import load_dotenv
from openai import AsyncOpenAI
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (Application, CommandHandler, ContextTypes,
                          MessageHandler, filters)

load_dotenv()


def require(name: str) -> str:
    """Read a required setting, or exit with a plain-English hint."""
    value = os.getenv(name, "").strip()
    if not value or value.startswith("paste-"):
        sys.exit(
            f"Missing {name}. Copy .env.example to .env and fill it in "
            f"(see README.md, step 3)."
        )
    return value


def parse_allowed(raw: str) -> set:
    try:
        return {int(x) for x in raw.split(",") if x.strip()}
    except ValueError:
        sys.exit("ALLOWED_USER_IDS must be numbers separated by commas, e.g. 123,456")


TELEGRAM_TOKEN = require("TELEGRAM_BOT_TOKEN")
XAI_API_KEY = require("XAI_API_KEY")
MODEL = os.getenv("GROK_MODEL", "grok-4")
SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT", "You are a helpful, friendly assistant. Keep answers concise."
)
# Optional: comma-separated Telegram user IDs allowed to use the bot (blank = anyone)
ALLOWED = parse_allowed(os.getenv("ALLOWED_USER_IDS", ""))
MAX_TELEGRAM_CHARS = 4096

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s", level=logging.INFO
)
logging.getLogger("httpx").setLevel(logging.WARNING)  # hide per-request noise
log = logging.getLogger("grok-bot")

client = AsyncOpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")
history = defaultdict(lambda: deque(maxlen=20))  # last 20 messages per chat


def allowed(update: Update) -> bool:
    return not ALLOWED or update.effective_user.id in ALLOWED


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if not allowed(update):
        # Still show the ID so the owner can add it to ALLOWED_USER_IDS.
        await update.message.reply_text(
            f"Sorry, this bot is private. Your Telegram user ID is {user_id}."
        )
        return
    await update.message.reply_text(
        "Hi! I'm your Grok bot. Just send me a message.\n"
        "/reset clears my memory of this chat.\n"
        f"Your Telegram user ID: {user_id}"
    )


async def reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not allowed(update):
        return
    history[update.effective_chat.id].clear()
    await update.message.reply_text("Memory cleared.")


async def chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text or not allowed(update):
        return
    chat_id = update.effective_chat.id
    history[chat_id].append({"role": "user", "content": update.message.text})
    await context.bot.send_chat_action(chat_id, ChatAction.TYPING)
    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, *history[chat_id]],
        )
        reply = resp.choices[0].message.content or "(no reply)"
    except Exception as e:
        log.exception("xAI request failed")
        history[chat_id].pop()
        await update.message.reply_text(
            f"Sorry, Grok had an error ({type(e).__name__}). "
            "Check the terminal running the bot for details."
        )
        return
    history[chat_id].append({"role": "assistant", "content": reply})
    for i in range(0, len(reply), MAX_TELEGRAM_CHARS):
        await update.message.reply_text(reply[i:i + MAX_TELEGRAM_CHARS])


def build_app() -> Application:
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("reset", reset))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, chat))
    return app


def main():
    log.info("Starting bot with model %s. Press Ctrl+C to stop.", MODEL)
    build_app().run_polling()


if __name__ == "__main__":
    main()
