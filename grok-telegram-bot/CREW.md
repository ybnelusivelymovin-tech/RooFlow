# The crew: prompting several Grok bots, and letting them prompt themselves

`bot.py` is one bot you talk to. `crew.py` is five prompted bots that also run
their own routines on a schedule. Run one or the other — two processes on the
same Telegram token fight over `getUpdates`.

## The thing that is easy to miss

Grok has **no knowledge of anything recent** unless you attach xAI's
server-side search tools to the request. A prompt like "find this week's best
posts" sent to a plain chat-completions call does not fail — it invents
plausible posts, handles and view counts. `crew.py` attaches `x_search` and
`web_search`, and `prompts/00-house.md` forbids unsourced numbers, so the bots
return `NOTHING FOUND` instead of fiction.

## Setup

1. `pip install -r requirements.txt`
2. Fill in the `<<FILL IN>>` lines at the top of `prompts/00-house.md`. Do this
   before anything else — every bot inherits that file, and a vague niche is
   the single biggest cause of mush.
3. Put the handles you actually watch into `watchlist:` in `routines.yaml`
   (max 20, no `@`).
4. Start the bot, send it `/here`, and put the number it replies with into
   `ROUTINE_CHAT_ID` in `.env`. Without it nothing runs on a schedule.
5. `python crew.py`

## Talking to them

| Command | What happens |
| --- | --- |
| `/scout <task>` | outlier finder, with X + web search on |
| `/hooks <task>` | turns posts into reusable hook templates |
| `/trends <task>` | rising language in the niche |
| `/writer <task>` | one script, no variants |
| `/editor <task>` | scores a draft, biased toward no |
| `/pitch <topic>` | writer drafts, editor attacks, writer revises, up to 2 rounds |
| `/routines` | what is scheduled |
| `/run <name>` | fire a routine now instead of waiting for its cron |

## How they prompt themselves

Three layers, in `routines.yaml`:

**1. On a clock.** A routine with a `cron:` fires itself and posts into
`ROUTINE_CHAT_ID`. This is the boring layer and it does most of the work.

**2. Chained.** A routine with `then: <name>` passes its own output to the next
bot as input. `monday-outliers → monday-hooks` means Monday 8am produces a
table of outlier posts and immediately turns them into hook templates, with no
human in between. A routine marked `chained_only: true` never fires on its own.

**3. Argued.** `/pitch` runs two personas against each other for a couple of
rounds. The critic only works because `editor.md` gives it a scorecard and
tells it to expect to reject half — a critic without a rubric just agrees.

Chains stop at depth 4, stop if a bot returns `NOTHING FOUND`, and the whole
crew stops at `MAX_CALLS_PER_DAY`. Keep those caps. A self-prompting loop with
no stop condition is a bill.

Every routine's output is also written to `output/<date>_<routine>.md`, which
is what you paste into your Creators / Hooks / Trend Radar tables.

## Writing a good bot prompt

What separates these from "you are a social media expert":

- **One beat each.** A bot that scouts and writes does both badly.
- **A fixed output schema.** Name the exact columns, in order. That is what
  makes the output paste straight into a table instead of needing a human to
  reformat it.
- **A refusal rule.** `NOTHING FOUND` must be an allowed answer, or the bot
  will always find something.
- **A judgement rule, not a vibe.** "Outlier" is defined as 3x the author's own
  median, not "a post that did well". Define the threshold or you get the
  algorithm's greatest hits every week.
- **A bias.** The editor is told to reject half. Without a stated bias, a model
  defaults to agreeable.
- **Bans.** List the exact phrases you never want to see. Models reach for
  "game-changer" unless told not to.
