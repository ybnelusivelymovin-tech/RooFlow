# Grok Telegram bot

A small Telegram bot that sends your messages to xAI's Grok and replies with its answer. It remembers the last 20 messages of each chat, so you can have a back-and-forth conversation.

Commands in Telegram:

- `/start` says hello and shows your Telegram user ID
- `/reset` makes the bot forget the current conversation
- anything else you type is sent to Grok

You need about 15 minutes, a computer with Python 3.9 or newer, a Telegram account, and an xAI account with some API credit.

## 1. Get a Telegram bot token (from BotFather)

1. In Telegram, search for **@BotFather** (it has a blue check mark) and open a chat with it.
2. Send `/newbot`.
3. When it asks for a name, send any display name, for example `My Grok`.
4. When it asks for a username, send one that ends in `bot`, for example `my_grok_123_bot`. If it's taken, try another.
5. BotFather replies with a token that looks like `123456789:AAH...`. Copy it. Treat it like a password: anyone who has it can control your bot.

If you ever leak the token, send `/revoke` to BotFather to get a new one.

## 2. Get an xAI API key

1. Go to [console.x.ai](https://console.x.ai) and sign in.
2. Add credit or a payment method under **Billing**. The API does not work without it.
3. Open **API Keys**, click **Create API Key**, and copy the key (it starts with `xai-`). You only see it once, so paste it somewhere safe right away.

## 3. Set up the bot on your computer

Open a terminal (on Windows, use PowerShell) and run these commands one at a time.

Go into this folder:

```bash
cd grok-telegram-bot
```

Create a Python virtual environment, a private folder for this project's packages:

```bash
python3 -m venv .venv
```

On Windows, type `python` instead of `python3`.

Turn the virtual environment on. You need to do this every time you open a new terminal:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

Your prompt now starts with `(.venv)`. Install the packages:

```bash
pip install -r requirements.txt
```

Create your settings file by copying the example:

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```

Open `.env` in any text editor and replace the two placeholder values with your token and key:

```
TELEGRAM_BOT_TOKEN=123456789:AAH...your-token...
XAI_API_KEY=xai-...your-key...
```

No quotes and no spaces around the `=`. The `.env` file is ignored by git, so your secrets won't be committed.

## 4. Run it

```bash
python bot.py
```

You should see `Starting bot with model grok-4. Press Ctrl+C to stop.` Now open your bot in Telegram (search for the username you picked in step 1), press **Start**, and send it a message.

The bot only works while this terminal is open. Press `Ctrl+C` to stop it.

## Optional settings

Remove the `#` at the start of a line in `.env` to turn a setting on.

| Setting | What it does |
| --- | --- |
| `GROK_MODEL` | Which Grok model to use. Defaults to `grok-4`. See the model list at [console.x.ai](https://console.x.ai) for others. |
| `SYSTEM_PROMPT` | The bot's personality and instructions, for example `You are a pirate. Answer everything like one.` |
| `ALLOWED_USER_IDS` | Make the bot private. Send `/start` to the bot to see your user ID, then put it here. Separate several IDs with commas. Leave it blank to let anyone use the bot. |

Restart the bot (`Ctrl+C`, then `python bot.py`) after changing `.env`.

## Troubleshooting

- **`Missing TELEGRAM_BOT_TOKEN` or `Missing XAI_API_KEY`**: you haven't created `.env`, or still have the placeholder text in it. Redo the last part of step 3.
- **`InvalidToken` or `Unauthorized` when starting**: the Telegram token is wrong. Copy it again from BotFather.
- **`Conflict: terminated by other getUpdates request`**: the bot is already running somewhere else, maybe in another terminal. Stop the other copy.
- **The bot replies "Sorry, Grok had an error (AuthenticationError)"**: your xAI key is wrong. Create a new one.
- **"Sorry, Grok had an error (PermissionDeniedError)" or "(RateLimitError)"**: your xAI account is probably out of credit. Check Billing on console.x.ai.
- **"(NotFoundError)"**: the `GROK_MODEL` name doesn't exist. Remove that line from `.env` or check the model list.
- **`command not found: python3`**: install Python from [python.org](https://www.python.org/downloads/). On Windows, tick **Add Python to PATH** during install.
- **PowerShell says running scripts is disabled**: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, then try activating again.

## Good to know

- Memory lives in the bot's RAM, so restarting the bot clears every conversation.
- Each message you send costs a little xAI credit, and longer conversations cost more because the history is sent along each time.
