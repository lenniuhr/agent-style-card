# agent-style-card

The style card for Claude Code and the hooks that enforce it, shared between PCs.

- `style-card.md` is the full card, added to every session at start.
- `style-reminder.md` is the short checklist, added to every prompt.
- `hooks/style-card.mjs` adds both. At session start it first runs `git pull --ff-only` here, so an
  edit pushed from another PC arrives by itself. Offline, or with local edits, it keeps the card it
  has and says nothing.
- `hooks/next-line.mjs` sends a final message back once when it ends with neither a Next line nor a
  closing Question.
- `install.mjs` registers those hooks in Claude Code's user settings.

The repo is public on purpose. The company PCs sign git in with a company account whose token reaches
only company repos, so a private repo here would never pull there. Keep anything secret or
company-specific out of it.

## Set up a PC

Needs git and Node.js. From the folder where the clone should live, such as `~/wkspaces`:

```
git clone https://github.com/lenniuhr/agent-style-card
node agent-style-card/install.mjs
```

The install registers three hooks in `~/.claude/settings.json`: the card at session start, the
reminder on every prompt, and the Next line check when a turn ends. It replaces any older hook that
runs a `style-card.mjs` or `next-line.mjs`, wherever that file lives, keeps every other setting, and
saves the previous file as `settings.json.bak-agent-style-card`. Running it twice changes nothing.
Run it again after moving the clone, because the hooks point at the clone's absolute path.

Start a new Claude Code session afterwards. It works when the session's first prompt carries the
reminder naming this clone's `style-card.md`.

## Change the card

Edit `style-card.md` in the clone, commit and push. Other PCs get it at their next session start.
Never edit a copy elsewhere: only this clone is read, and older copies in `~/.claude` are left
unused.

Pushing needs the personal account `lenniuhr`. On a company PC, where the GitHub CLI's active
account is the company one, switch for the push and back:

```
gh auth switch -u lenniuhr; git push; gh auth switch -u <company account>
```

While the switch lasts, other running sessions that call GitHub act as `lenniuhr`.
