// Next-line hook, registered for Stop: the style card's rule that every final message ends with a **Next:** line,
// or with a **Question** block when the reader must answer first (style-card.md in this repo, "End with a Next line").
// It reads the turn's last assistant text from the transcript. When that text ends with neither, it sends the turn
// back once with the reason, so the message gets its line. A reply of one paragraph passes without either: the card
// lets a plain answer with nothing left go without the line, and the hook cannot tell that case from a forgotten one.
// It never blocks twice in a row (stop_hook_active), and any failure lets the turn end, so a broken hook never traps
// a session.
import { readFileSync } from 'node:fs';

const allow = () => process.exit(0);

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  allow();
}
if (!input || input.stop_hook_active) allow();

// The last assistant message's text, from the hook input when the host gives it, else from the transcript.
function lastText() {
  if (typeof input.last_assistant_message === 'string') return input.last_assistant_message;
  if (typeof input.transcript_path !== 'string') return null;
  const lines = readFileSync(input.transcript_path, 'utf8').split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try {
      entry = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (entry?.type === 'user' && !entry.isMeta && Array.isArray(entry.message?.content) === false) return null;
    if (entry?.type !== 'assistant') continue;
    const parts = Array.isArray(entry.message?.content) ? entry.message.content : [];
    const text = parts.filter((p) => p?.type === 'text').map((p) => p.text).join('\n').trim();
    if (text) return text;
  }
  return null;
}

let text;
try {
  text = lastText();
} catch {
  allow();
}
if (!text) allow();

// The last block of the message: its last paragraph, or the paragraph holding the last **Question** label.
const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
if (blocks.length < 2) allow();
const last = blocks[blocks.length - 1] ?? '';
const endsWithNext = /^\*\*Next:\*\*/.test(last);
const endsWithQuestion = blocks.slice(-4).some((b) => /^\*\*Question( \d+)?:\*\*/.test(b)) && !/^\*\*Next:\*\*/.test(last);
if (endsWithNext || endsWithQuestion) allow();

process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: 'Style card: the final message ends with neither a **Next:** line nor a closing **Question**. Add the Next line '
    + 'naming who does what, or "**Next:** none, the topic is closed." when nothing is left on either side. Write only '
    + 'that line; do not repeat the message.',
}));
