"""A simple Telegram bot powered by xAI's Grok."""
import logging
import os
from collections import defaultdict, deque

from dotenv import load_dotenv
from openai import AsyncOpenAI
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (Application, CommandHandler, ContextTypes,
                          MessageHandler, filters)

load_dotenv()
TELEGRAM_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
XAI_API_KEY = os.environ["XAI_API_KEY"]
MODEL = os.getenv("GROK_MODEL", "grok-4")
SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT", "You are a helpful, friendly assistant. Keep answers concise."
)
# Optional: comma-separated Telegram user IDs allowed to use the bot (blank = anyone)
ALLOWED = {int(x) for x in os.getenv("ALLOWED_USER_IDS", "").split(",") if x.strip()}

logging.basicConfig(level=logging.INFO)
client = AsyncOpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")
history = defaultdict(lambda: deque(maxlen=20))  # last 20 messages per chat


def allowed(update: Update) -> bool:
    return not ALLOWED or update.effective_user.id in ALLOWED


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not allowed(update):
        return
    await update.message.reply_text(
        f"Hi! I'm your Grok bot. Just send me a message.\n"
        f"/reset clears my memory.\nYour Telegram user ID: {update.effective_user.id}"
    )


async def reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not allowed(update):
        return
    history[update.effective_chat.id].clear()
    await update.message.reply_text("Memory cleared.")


async def chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not allowed(update) or not update.message or not update.message.text:
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
        logging.exception("xAI error")
        history[chat_id].pop()
        await update.message.reply_text(f"Sorry, Grok had an error: {type(e).__name__}")
        return
    history[chat_id].append({"role": "assistant", "content": reply})
    for i in range(0, len(reply), 4000):  # Telegram's message length limit
        await update.message.reply_text(reply[i:i + 4000])


def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("reset", reset))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, chat))
    app.run_polling()


if __name__ == "__main__":
    main()
