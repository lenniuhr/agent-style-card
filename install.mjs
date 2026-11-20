// Registers this repo's hooks in the user's Claude Code settings (~/.claude/settings.json).
// Run once per PC after cloning, and again after moving the clone: node install.mjs
// It replaces every existing hook whose command runs a style-card.mjs or next-line.mjs, wherever that file
// lives, so an older copy in ~/.claude/hooks stops running. All other settings and hooks stay as they are.
// The previous settings are kept beside the file as settings.json.bak-agent-stylesheet.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)).replaceAll('\\', '/');
const settingsDir = join(homedir(), '.claude');
const settingsPath = join(settingsDir, 'settings.json');

const ours = /(style-card|next-line)\.mjs/;
const node = (script) => `node "${root}/hooks/${script}"`;

const wanted = {
  SessionStart: { type: 'command', command: node('style-card.mjs'), timeout: 15, statusMessage: 'style card' },
  UserPromptSubmit: {
    type: 'command',
    command: node('style-card.mjs'),
    timeout: 10,
    onFailure: 'block',
    statusMessage: 'style card',
  },
  Stop: { type: 'command', command: node('next-line.mjs'), timeout: 10 },
};

let settings = {};
if (existsSync(settingsPath)) {
  settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  copyFileSync(settingsPath, `${settingsPath}.bak-agent-stylesheet`);
} else {
  mkdirSync(settingsDir, { recursive: true });
}

const hooks = (settings.hooks ??= {});
let removed = 0;
for (const [event, groups] of Object.entries(hooks)) {
  if (!Array.isArray(groups)) continue;
  const kept = [];
  for (const group of groups) {
    const before = group.hooks?.length ?? 0;
    const rest = (group.hooks ?? []).filter((h) => !ours.test(h.command ?? ''));
    removed += before - rest.length;
    if (rest.length) kept.push({ ...group, hooks: rest });
    else if (!before) kept.push(group);
  }
  hooks[event] = kept;
}

for (const [event, hook] of Object.entries(wanted)) {
  hooks[event] = [{ hooks: [hook] }, ...(hooks[event] ?? [])];
}

writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
console.log(`Registered the style card hooks from ${root}, replacing ${removed} older entries.`);
console.log('Start a new Claude Code session to load them.');
