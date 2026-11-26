"""Grok media crew: several prompted bots in one Telegram bot, able to run
their own routines on a schedule and hand work to each other.

Run this INSTEAD of bot.py (two processes on one token = Telegram Conflict).
"""
import asyncio
import datetime as dt
import logging
import os
import sys
from pathlib import Path

import yaml
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from openai import AsyncOpenAI
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (Application, CommandHandler, ContextTypes,
                          MessageHandler, filters)

HERE = Path(__file__).parent
load_dotenv(HERE / ".env")

logging.basicConfig(format="%(asctime)s %(levelname)s %(name)s: %(message)s",
                    level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("apscheduler").setLevel(logging.WARNING)
log = logging.getLogger("crew")


def require(name: str) -> str:
    v = os.getenv(name, "").strip()
    if not v or v.startswith("paste-"):
        sys.exit(f"Missing {name}. See README.md step 3.")
    return v


TELEGRAM_TOKEN = require("TELEGRAM_BOT_TOKEN")
XAI_API_KEY = require("XAI_API_KEY")
# Where scheduled routines post. Send /here to the bot to learn the number.
ROUTINE_CHAT_ID = os.getenv("ROUTINE_CHAT_ID", "").strip()
ALLOWED = {int(x) for x in os.getenv("ALLOWED_USER_IDS", "").replace(" ", "").split(",") if x}
# Hard stop so a runaway chain cannot drain the account.
MAX_CALLS_PER_DAY = int(os.getenv("MAX_CALLS_PER_DAY", "40"))
MAX_TELEGRAM_CHARS = 4000

CONFIG = yaml.safe_load((HERE / "routines.yaml").read_text())
DEFAULTS = CONFIG.get("defaults", {})
X_WATCHLIST = CONFIG.get("x_watchlist", []) or []   # usable as an x_search filter
CREATORS = CONFIG.get("creators", []) or []         # reference only, other platforms
ROUTINES = {r["name"]: r for r in CONFIG.get("routines", [])}
MODEL = os.getenv("GROK_MODEL", DEFAULTS.get("model", "grok-4.7"))

client = AsyncOpenAI(api_key=XAI_API_KEY, base_url="https://api.x.ai/v1")
HOUSE = (HERE / "prompts" / "00-house.md").read_text()
PERSONAS = {p.stem: p.read_text() for p in (HERE / "prompts").glob("*.md")
            if not p.stem.startswith("00-")}

_calls = {"day": dt.date.today(), "n": 0}


def budget_ok() -> bool:
    if _calls["day"] != dt.date.today():
        _calls.update(day=dt.date.today(), n=0)
    if _calls["n"] >= MAX_CALLS_PER_DAY:
        return False
    _calls["n"] += 1
    return True


def build_tools(search) -> list:
    """Grok has NO live data unless these server-side tools are attached."""
    tools, days = [], int(DEFAULTS.get("days_back", 7))
    since = (dt.date.today() - dt.timedelta(days=days)).isoformat()
    for kind in (search or []):
        if kind == "x":
            # Restricted to the watchlist. NOTE: allowed_x_handles narrows the
            # search to exactly these accounts, so nothing new is discoverable.
            t = {"type": "x_search", "from_date": since,
                 "to_date": dt.date.today().isoformat()}
            if X_WATCHLIST:
                t["allowed_x_handles"] = X_WATCHLIST[:20]
            tools.append(t)
        elif kind == "x_open":          # same window, whole platform — discovery
            tools.append({"type": "x_search", "from_date": since})
        elif kind == "web":
            tools.append({"type": "web_search"})
    return tools


async def ask(persona: str, task: str, search=None, context_text: str = "") -> str:
    if persona not in PERSONAS:
        return f"No such bot: {persona}. Have: {', '.join(sorted(PERSONAS))}"
    if not budget_ok():
        return (f"Daily cap of {MAX_CALLS_PER_DAY} Grok calls reached. "
                "Raise MAX_CALLS_PER_DAY in .env if that is deliberate.")
    instructions = f"{HOUSE}\n\n---\n\n{PERSONAS[persona]}"
    task = task.replace("{days_back}", str(DEFAULTS.get("days_back", 7)))
    if persona in ("scout", "trends") and CREATORS:
        task += (
            "\n\n--- CREATORS WE ALREADY TRACK (handle | platforms | name) ---\n"
            "Most are not on X, so x_search will not see them: look them up by "
            "name and handle on the open web. Report a post only if you actually "
            "retrieved it. Never report a post for an account you could not "
            "reach — leave the account out instead.\n"
            + "\n".join(CREATORS))
    if context_text:
        task = f"{task}\n\n--- INPUT FROM THE PREVIOUS BOT ---\n{context_text}"
    kwargs = dict(model=MODEL, instructions=instructions,
                  input=[{"role": "user", "content": task}])
    tools = build_tools(search)
    if tools:
        kwargs["tools"] = tools
        kwargs["extra_body"] = {"max_turns": int(os.getenv("MAX_TURNS", "6"))}
    resp = await client.responses.create(**kwargs)
    return (getattr(resp, "output_text", None) or "(empty reply)").strip()


async def send(bot, chat_id, text: str):
    for i in range(0, len(text), MAX_TELEGRAM_CHARS):
        await bot.send_message(chat_id, text[i:i + MAX_TELEGRAM_CHARS])


async def run_routine(bot, chat_id, name: str, carried: str = "", depth: int = 0):
    """Run one routine, then whatever it chains into. Depth-capped on purpose."""
    r = ROUTINES.get(name)
    if not r or depth > 4:
        return
    await bot.send_message(chat_id, f"▶ {name} ({r['persona']})")
    try:
        out = await ask(r["persona"], r.get("task", ""), r.get("search"), carried)
    except Exception as e:
        log.exception("routine %s failed", name)
        await bot.send_message(chat_id, f"✖ {name} failed: {type(e).__name__}")
        return
    await send(bot, chat_id, out)
    (HERE / "output").mkdir(exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y-%m-%d_%H%M")
    (HERE / "output" / f"{stamp}_{name}.md").write_text(out)
    if r.get("then") and "NOTHING FOUND" not in out:
        await run_routine(bot, chat_id, r["then"], out, depth + 1)


# ---------------- Telegram commands ----------------

def allowed(u: Update) -> bool:
    return not ALLOWED or u.effective_user.id in ALLOWED


async def cmd_start(u: Update, c: ContextTypes.DEFAULT_TYPE):
    bots = ", ".join(f"/{p}" for p in sorted(PERSONAS))
    await u.message.reply_text(
        f"Crew online. Bots: {bots}\n"
        f"/routines list schedules · /run <name> fire one now\n"
        f"/pitch <topic> two bots argue it out\n"
        f"/here show this chat's id (for ROUTINE_CHAT_ID)\n"
        f"Your user id: {u.effective_user.id}")


async def cmd_here(u: Update, c: ContextTypes.DEFAULT_TYPE):
    await u.message.reply_text(f"ROUTINE_CHAT_ID={u.effective_chat.id}")


async def cmd_routines(u: Update, c: ContextTypes.DEFAULT_TYPE):
    lines = [f"{n}: {r['persona']} — {r.get('cron', 'chained only')}"
             + (f" → {r['then']}" if r.get("then") else "")
             for n, r in ROUTINES.items()]
    await u.message.reply_text("\n".join(lines) or "none")


async def cmd_run(u: Update, c: ContextTypes.DEFAULT_TYPE):
    if not allowed(u):
        return
    name = " ".join(c.args).strip()
    if name not in ROUTINES:
        await u.message.reply_text(f"Unknown. Try: {', '.join(ROUTINES)}")
        return
    await c.bot.send_chat_action(u.effective_chat.id, ChatAction.TYPING)
    await run_routine(c.bot, u.effective_chat.id, name)


async def cmd_pitch(u: Update, c: ContextTypes.DEFAULT_TYPE):
    """Two bots in one thread: one proposes, the editor tries to kill it."""
    if not allowed(u):
        return
    topic = " ".join(c.args).strip()
    if not topic:
        await u.message.reply_text("Usage: /pitch <topic or hook>")
        return
    chat = u.effective_chat.id
    draft = await ask("writer", f"Write one piece on: {topic}")
    await send(c.bot, chat, f"✍️ WRITER\n\n{draft}")
    for rnd in range(2):
        note = await ask("editor", "Score this draft.", context_text=draft)
        await send(c.bot, chat, f"🔪 EDITOR (round {rnd + 1})\n\n{note}")
        if note.startswith("VERDICT: SHIP") or note.startswith("VERDICT: KILL"):
            break
        draft = await ask("writer", "Apply only the FIX notes. Change nothing "
                                    "else. Output the full piece again.",
                          context_text=f"{draft}\n\n{note}")
        await send(c.bot, chat, f"✍️ WRITER (revision {rnd + 1})\n\n{draft}")


def make_persona_cmd(name: str):
    async def handler(u: Update, c: ContextTypes.DEFAULT_TYPE):
        if not allowed(u):
            return
        task = " ".join(c.args).strip() or "Run your standard job for this week."
        await c.bot.send_chat_action(u.effective_chat.id, ChatAction.TYPING)
        search = ["x", "web"] if name in ("scout", "trends") else []
        await send(c.bot, u.effective_chat.id, await ask(name, task, search))
    return handler


async def on_text(u: Update, c: ContextTypes.DEFAULT_TYPE):
    if not u.message or not u.message.text or not allowed(u):
        return
    await c.bot.send_chat_action(u.effective_chat.id, ChatAction.TYPING)
    await send(c.bot, u.effective_chat.id,
               await ask("writer", u.message.text))


def schedule(app: Application):
    if not ROUTINE_CHAT_ID:
        log.warning("ROUTINE_CHAT_ID not set — nothing will run on a schedule. "
                    "Send /here to the bot and put the number in .env.")
        return
    tz = DEFAULTS.get("timezone", "UTC")
    for name, r in ROUTINES.items():
        if r.get("chained_only") or not r.get("cron"):
            continue
        async def job(ctx, _n=name):
            await run_routine(ctx.bot, int(ROUTINE_CHAT_ID), _n)
        app.job_queue.run_custom(
            job, name=name,
            job_kwargs={"trigger": CronTrigger.from_crontab(r["cron"], timezone=tz)})
        log.info("scheduled %s at %r (%s)", name, r["cron"], tz)


def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("here", cmd_here))
    app.add_handler(CommandHandler("routines", cmd_routines))
    app.add_handler(CommandHandler("run", cmd_run))
    app.add_handler(CommandHandler("pitch", cmd_pitch))
    for p in PERSONAS:
        app.add_handler(CommandHandler(p, make_persona_cmd(p)))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))
    schedule(app)
    log.info("Crew up on %s. Bots: %s", MODEL, ", ".join(sorted(PERSONAS)))
    app.run_polling()


if __name__ == "__main__":
    main()
