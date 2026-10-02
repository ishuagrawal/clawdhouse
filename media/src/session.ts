// What the Code tab shows at each scene of the session in src/scenes.ts: the
// transcript the way the desktop app folds it, the branch bar, any question
// card. The grid (src/render-grid.ts) and the video (src/shots.ts) both use it.

import { SCENES } from './scenes.ts'
import type { Row, Scene } from './scenes.ts'

// The band the desktop app gives clawd-buddy above the prompt: 94 columns
// of 8 px across the 768 px conversation column, 11 rows (2 for the caption).
export const BAND_COLS = 94
export const BAND_ROWS = 11

// What the Code tab shows for a tool while it runs: the call's description.
const DOING: Record<string, string> = {
  exploring: 'Mapping the settings code',
  reading: 'Reading settings.tsx',
  searching: 'Searching for useTheme',
  planning: 'Updating the to-do list',
  branching: 'Creating the dark-mode branch',
  installing: 'Installing zustand',
  writing: 'Editing settings.tsx',
  designing: 'Editing theme.css',
  terminal: 'Making the dev script executable',
  serving: 'Starting the dev server',
  snapping: 'Screenshotting the settings page',
  surfing: 'Reading the prefers-color-scheme docs',
  casting: 'Using the frontend-design skill',
  plugging: 'Creating a Linear issue',
  querying: 'Checking saved theme preferences',
  delegating: 'Auditing color contrast',
  mailing: 'Messaging design-review',
  building: 'Building the app',
  testing: 'Running the test suite',
  debugging: 'Debugging the theme test',
  polishing: 'Fixing lint errors',
  benchmarking: 'Benchmarking the theme switch',
  phoning: 'Booting the iPhone simulator',
  timing: 'Waiting for the dev server',
  remembering: 'Noting the theme convention in CLAUDE.md',
  committing: 'Committing the dark mode change',
  cleaning: 'Removing build artifacts',
  shipping: 'Pushing the dark-mode branch',
}

export type AppRow = { kind: 'user' | 'text' | 'sum' | 'note' | 'stat'; text: string; turn?: number }

// Finished tools fold into one line per run: "Ran 2 commands, read a file".
const KIND: Record<string, [string, string, string]> = {
  Bash: ['Ran', 'command', 'commands'],
  Read: ['Read', 'file', 'files'],
  Edit: ['Edited', 'file', 'files'],
}
function fold(tools: Row[]): AppRow {
  const n = new Map<string, number>()
  for (const t of tools) {
    const k = t.kind === 'tool' && KIND[t.verb] ? t.verb : 'other'
    n.set(k, (n.get(k) ?? 0) + 1)
  }
  const order = ['Bash', 'Read', 'Edit', 'other']
  const parts = [...n].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).map(([k, c]) => {
    const [verb, one, many] = KIND[k] ?? ['Used', 'tool', 'tools']
    return `${verb.toLowerCase()} ${c === 1 ? `a ${one}` : `${c} ${many}`}`
  })
  const text = parts.join(', ')
  return { kind: 'sum', text: text[0].toUpperCase() + text.slice(1) }
}

// The session so far, as the transcript shows it at scene `i`.
export function transcript(i: number): AppRow[] {
  const scene = SCENES[i]
  const out: AppRow[] = []
  let run: Row[] = []
  const flush = () => {
    if (run.length) out.push(fold(run))
    run = []
  }
  // Settled scenes (idle, done, napping) show the conversation without the
  // first scene's greeting; every scene before this one is history.
  for (const s of SCENES.slice(1, i)) {
    const r = s.row
    if (!r) continue
    if (r.kind === 'tool') run.push(r)
    else if (r.kind === 'user' || r.kind === 'text') {
      flush()
      out.push(r)
    } else if (r.kind === 'divider' && s.mood === 'sad') {
      flush()
      out.push({ kind: 'note', text: 'Interrupted by user' })
    }
  }
  flush()

  const r = scene.row
  if (r?.kind === 'tool') out.push({ kind: 'sum', text: DOING[scene.mood] ?? `${r.verb} ${r.arg}` })
  else if (r?.kind === 'user' || r?.kind === 'text') {
    if (out.at(-1)?.text !== r.text) out.push(r)
  } else if (r?.kind === 'divider' && scene.mood === 'sad') out.push({ kind: 'note', text: 'Interrupted by user' })

  if (scene.isWorking) {
    const secs = 4 + i * 6
    const time = secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`
    const tokens = (0.2 + i * 0.31).toFixed(1) + 'k'
    const doing =
      r?.kind === 'thinking' ? 'Thinking…' :
      r?.kind === 'tool' ? 'Running tools…' :
      r?.kind === 'divider' ? r.text :
      r?.kind === 'ask' ? 'Waiting for your answer' :
      r?.kind === 'permit' ? 'Waiting for your OK' : ''
    out.push({ kind: 'stat', text: [time, `${tokens} tokens`, doing].filter(Boolean).join(' · '), turn: i * 0.7 })
  }
  return out
}

// The bar above the band once the branch has changes: the first edit onward.
const FIRST_EDIT = SCENES.findIndex(s => s.mood === 'writing')
export function branch(i: number) {
  if (i < FIRST_EDIT) return undefined
  const k = i - FIRST_EDIT
  return { name: 'dark-mode', add: 24 + k * 9, del: 3 + Math.floor(k / 2) }
}

export function card(scene: Scene) {
  const r = scene.row
  if (r?.kind === 'ask') return { kind: 'ask', question: r.question, options: r.options.map(label => ({ label })) }
  if (r?.kind === 'permit') return { kind: 'permit', command: r.command }
  return undefined
}
