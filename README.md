# agent-stylesheet

The style card for Claude Code and the hooks that enforce it, shared between PCs.

- `style-card.md` is the full card, added to every session at start.
- `style-reminder.md` is the short checklist, added to every prompt.
- `hooks/style-card.mjs` adds both. At session start it first runs `git pull --ff-only` here, so an
  edit pushed from another PC arrives by itself. Offline or without a login it keeps the card it has.
- `hooks/next-line.mjs` sends a final message back once when it ends with neither a Next line nor a
  closing Question.

## Set up a PC

```
git clone https://github.com/lenniuhr/agent-stylesheet
node agent-stylesheet/install.mjs
```

The install registers the three hooks in `~/.claude/settings.json` and replaces any older style card
hooks there. Run it again after moving the clone. A new session picks the hooks up.

## Change the card

Edit `style-card.md` in the clone, commit and push. Other PCs get it at their next session start.
Never edit a copy elsewhere: only this clone is read.
