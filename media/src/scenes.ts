// Every mood Clawd has, in the order a session might walk through them, with
// what the Code tab would be showing at that moment. Labels, details and tints
// are what plugin/hooks/register.tsx derives for the same tool call.

import type { Mood, ReactKind } from '../../plugin/types/index.d.ts'

export type Row =
  | { kind: 'user'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'thinking'; text: string }
  | { kind: 'tool'; verb: string; arg: string; result?: string; isError?: boolean }
  | { kind: 'ask'; question: string; options: string[] }
  | { kind: 'permit'; tool: string; command: string }
  | { kind: 'divider'; text: string }

export type Scene = {
  mood: Mood
  label: string
  detail: string
  tint?: string
  helpers?: number
  isBig?: boolean
  // Seconds the sim runs before the frame we show, so the mood has settled in.
  warm?: number
  row?: Row
  isWorking?: boolean
}

const NPM = '#CB3837'
const GIT = '#F05032'
const TS = '#3178C6'

export const SCENES: Scene[] = [
  { mood: 'idle', label: 'hanging out', detail: '', row: { kind: 'text', text: 'Ready when you are.' } },
  { mood: 'listening', label: 'got your message', detail: 'add a dark mode toggle to settings', warm: 1.2, row: { kind: 'user', text: 'add a dark mode toggle to settings' }, isWorking: true },
  { mood: 'thinking', label: 'thinking', detail: '', row: { kind: 'thinking', text: 'Thinking…' }, isWorking: true },
  { mood: 'pondering', label: 'deep in thought', detail: '', row: { kind: 'thinking', text: 'Thinking about where the theme should live…' }, isWorking: true },
  { mood: 'exploring', label: 'exploring', detail: 'Map the settings code', row: { kind: 'tool', verb: 'Explore', arg: 'Map the settings code', result: 'Found 6 relevant files' }, isWorking: true },
  { mood: 'reading', label: 'reading', detail: 'pixel-cafe › settings.tsx', tint: TS, row: { kind: 'tool', verb: 'Read', arg: 'src/settings.tsx', result: 'Read 182 lines' }, isWorking: true },
  { mood: 'searching', label: 'searching', detail: 'useTheme', row: { kind: 'tool', verb: 'Search', arg: '"useTheme"', result: '7 matches in 4 files' }, isWorking: true },
  { mood: 'planning', label: 'planning', detail: 'the to-do list', row: { kind: 'tool', verb: 'Update Todos', arg: '4 tasks', result: 'Theme store · Toggle · Tokens · Tests' }, isWorking: true },
  { mood: 'branching', label: 'tending the branches', detail: 'git switch -c dark-mode', tint: GIT, row: { kind: 'tool', verb: 'Bash', arg: 'git switch -c dark-mode', result: "Switched to a new branch 'dark-mode'" }, isWorking: true },
  { mood: 'installing', label: 'installing', detail: 'npm install zustand', tint: NPM, row: { kind: 'tool', verb: 'Bash', arg: 'npm install zustand', result: 'added 1 package in 2s' }, isWorking: true },
  { mood: 'writing', label: 'editing', detail: 'pixel-cafe › settings.tsx', tint: TS, row: { kind: 'tool', verb: 'Edit', arg: 'src/settings.tsx', result: '+24 −3' }, isWorking: true },
  { mood: 'designing', label: 'making it pretty', detail: 'pixel-cafe › theme.css', tint: '#E44D9A', row: { kind: 'tool', verb: 'Edit', arg: 'styles/theme.css', result: '+41 −6' }, isWorking: true },
  { mood: 'terminal', label: 'running a command', detail: 'chmod +x scripts/dev.sh', row: { kind: 'tool', verb: 'Bash', arg: 'chmod +x scripts/dev.sh' }, isWorking: true },
  { mood: 'serving', label: 'serving it up', detail: 'npm run dev', tint: NPM, row: { kind: 'tool', verb: 'Bash', arg: 'npm run dev', result: 'Local: http://localhost:5173' }, isWorking: true },
  { mood: 'snapping', label: 'taking a screenshot', detail: 'say cheese', row: { kind: 'tool', verb: 'Screenshot', arg: 'localhost:5173/settings', result: '1440 × 900' }, isWorking: true },
  { mood: 'surfing', label: 'surfing the web', detail: 'developer.mozilla.org', row: { kind: 'tool', verb: 'Fetch', arg: 'developer.mozilla.org/…/prefers-color-scheme', result: '200 OK' }, isWorking: true },
  { mood: 'casting', label: 'using a skill', detail: 'frontend-design', row: { kind: 'tool', verb: 'Skill', arg: 'frontend-design' }, isWorking: true },
  { mood: 'plugging', label: 'using a tool', detail: 'create_issue', row: { kind: 'tool', verb: 'linear', arg: 'create_issue', result: 'PIX-142 created' }, isWorking: true },
  { mood: 'querying', label: 'asking the database', detail: 'psql -c "select theme from prefs"', row: { kind: 'tool', verb: 'Bash', arg: 'psql -c "select theme from prefs"', result: '3 rows' }, isWorking: true },
  { mood: 'delegating', label: 'sent helpers', detail: 'Audit color contrast', helpers: 2, warm: 3.5, row: { kind: 'tool', verb: 'Agent', arg: 'Audit color contrast', result: 'All pairs pass AA' }, isWorking: true },
  { mood: 'mailing', label: 'sending a message', detail: 'to design-review', row: { kind: 'tool', verb: 'SendMessage', arg: 'to design-review', result: 'Delivered' }, isWorking: true },
  { mood: 'building', label: 'building', detail: 'npm run build', tint: NPM, row: { kind: 'tool', verb: 'Bash', arg: 'npm run build', result: 'built in 3.1s' }, isWorking: true },
  { mood: 'testing', label: 'running tests', detail: 'npm test', tint: NPM, row: { kind: 'tool', verb: 'Bash', arg: 'npm test', result: '2 failed, 40 passed', isError: true }, isWorking: true },
  { mood: 'oops', warm: 0.4, label: 'oops', detail: '✗ 2 failed', row: { kind: 'text', text: 'Two snapshot tests still expect the light palette.' }, isWorking: true },
  { mood: 'sad', label: 'stopped', detail: 'interrupted', warm: 1.2, row: { kind: 'divider', text: 'Interrupted · What should Claude do instead?' } },
  { mood: 'debugging', warm: 0.9, label: 'hunting a bug', detail: 'node --inspect test/theme.test.js', tint: NPM, row: { kind: 'tool', verb: 'Bash', arg: 'node --inspect test/theme.test.js' }, isWorking: true },
  { mood: 'polishing', label: 'tidying up the code', detail: 'eslint --fix src', row: { kind: 'tool', verb: 'Bash', arg: 'eslint --fix src', result: '✦ tidy' }, isWorking: true },
  { mood: 'benchmarking', label: 'timing it', detail: "hyperfine 'node scripts/bench.js'", tint: NPM, row: { kind: 'tool', verb: 'Bash', arg: "hyperfine 'node scripts/bench.js'", result: '12.4 ms ± 0.3 ms' }, isWorking: true },
  { mood: 'phoning', label: 'on the simulator', detail: 'xcrun simctl boot "iPhone 17"', tint: '#F05138', row: { kind: 'tool', verb: 'Bash', arg: 'xcrun simctl boot "iPhone 17"' }, isWorking: true },
  { mood: 'asking', label: 'has a question', detail: 'over to you, friend', row: { kind: 'ask', question: 'Which accent should dark mode use?', options: ['Clay (Recommended)', 'Ocean', 'Moss'] }, isWorking: true },
  { mood: 'waiting', label: 'needs your OK', detail: 'Bash needs your OK', row: { kind: 'permit', tool: 'Bash', command: 'npm publish --tag next' }, isWorking: true },
  { mood: 'timing', label: 'waiting on a timer', detail: 'sleep 30', row: { kind: 'tool', verb: 'Bash', arg: 'sleep 30' }, isWorking: true },
  { mood: 'remembering', label: 'noting that down', detail: 'pixel-cafe › CLAUDE.md', tint: '#EF7DA0', row: { kind: 'tool', verb: 'Edit', arg: 'CLAUDE.md', result: '+2' }, isWorking: true },
  { mood: 'compacting', label: 'compacting memory', detail: 'making room', row: { kind: 'divider', text: 'Compacting conversation…' }, isWorking: true },
  { mood: 'talking', label: 'writing a reply', detail: '', row: { kind: 'text', text: 'Dark mode now follows the system setting, with a toggle in Settings › Appearance.' }, isWorking: true },
  { mood: 'committing', warm: 1.5, label: 'committing', detail: 'Add dark mode to settings', tint: GIT, row: { kind: 'tool', verb: 'Bash', arg: 'git commit -m "Add dark mode to settings"', result: '[dark-mode 4f2c9a1]' }, isWorking: true },
  { mood: 'cleaning', label: 'cleaning up', detail: 'rm -rf dist .cache', row: { kind: 'tool', verb: 'Bash', arg: 'rm -rf dist .cache' }, isWorking: true },
  { mood: 'shipping', warm: 4.0, label: 'shipping it', detail: 'git push -u origin dark-mode', tint: GIT, row: { kind: 'tool', verb: 'Bash', arg: 'git push -u origin dark-mode', result: '✓ shipped' }, isWorking: true },
  { mood: 'happy', warm: 0.5, label: 'done!', detail: 'took 1m 12s', isBig: true, row: { kind: 'text', text: 'Done. Dark mode is live on the dark-mode branch.' } },
  { mood: 'sleepy', label: 'napping', detail: '', warm: 4, row: { kind: 'text', text: 'Done. Dark mode is live on the dark-mode branch.' } },
]

// Reactions are moments drawn over a mood: each pairs with the mood it
// usually lands on and the text the hooks would float.
export type ReactionScene = { kind: ReactKind; text: string; extra?: string; over: Mood }

export const REACTIONS: ReactionScene[] = [
  { kind: 'hello', text: 'hi friend!', over: 'idle' },
  { kind: 'found', text: '7 hits', over: 'searching' },
  { kind: 'none', text: 'no hits', over: 'searching' },
  { kind: 'edit', text: '+24', extra: '−3', over: 'writing' },
  { kind: 'pass', text: '✓ 42 passed', over: 'testing' },
  { kind: 'fail', text: '✗ 2 failed', over: 'testing' },
  { kind: 'phew', text: 'phew · 42s', over: 'building' },
  { kind: 'found', text: 'helper’s back', over: 'delegating' },
  { kind: 'denied', text: 'ok, skipping', over: 'waiting' },
  { kind: 'noted', text: 'noted ♥', over: 'remembering' },
  { kind: 'combo', text: 'combo ×10!', over: 'writing' },
  { kind: 'streak', text: 'streak ×3', over: 'testing' },
]

export const sceneOf = (mood: Mood) => SCENES.find(s => s.mood === mood)!
