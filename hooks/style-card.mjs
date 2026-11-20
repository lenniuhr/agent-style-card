// Style card hook, registered for two events:
//   SessionStart (startup, resume, clear, compact): pulls this repo, then adds the full style-card.md.
//   UserPromptSubmit: adds the short style-reminder.md, so the card is not repeated on every prompt.
// Both files are read from this repo's root, so the hook works wherever the repo is cloned.
// Any read failure exits 2. On UserPromptSubmit that blocks the prompt and shows the reason, so a session
// never runs without the card; the reminder hook also checks that the full card is readable.
// The pull never fails the hook: offline, no login or local edits simply leave the card as it is.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cardPath = join(root, 'style-card.md');
const reminderPath = join(root, 'style-reminder.md');

function fail(reason) {
  process.stderr.write(`style card hook: ${reason}. The prompt was blocked so this session does not run without the card.\n`);
  process.exit(2);
}

function readText(path) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    fail(`cannot read ${path} (${err.code ?? err.message})`);
  }
  if (!text.trim()) fail(`${path} is empty`);
  return text;
}

function pull() {
  try {
    execFileSync('git', ['-C', root, 'pull', '--ff-only', '--quiet'], {
      stdio: 'ignore',
      timeout: 6000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
    });
  } catch {
    // Keep the card already on disk.
  }
}

let event = 'UserPromptSubmit';
try {
  const input = readFileSync(0, 'utf8');
  if (input.trim()) event = JSON.parse(input).hook_event_name ?? event;
} catch {
  // No or unreadable input: treat as a prompt, the safe default.
}

if (event === 'SessionStart') pull();

const card = readText(cardPath);
// The reminder names the card's path as {{CARD_PATH}}, filled in here so it is right on any computer.
const context = event === 'SessionStart' ? card : readText(reminderPath).replaceAll('{{CARD_PATH}}', cardPath);

process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
