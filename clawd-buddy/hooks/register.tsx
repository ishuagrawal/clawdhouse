import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderInput } from 'claude-code'

import type { Buddy, Mood, Place, ReactKind } from '../types'
import { BODY, layout, newSim, rasterize, step, toSvg } from './engine'
import type { Props as SimProps, Sim } from './engine'

// What Clawd calls you: the `name` option (/config), set again on each load.
let OWNER = 'friend'
const PANE = 'clawd-buddy'
// Rows the stage above the prompt takes: room for a hat or a thought above him.
const STAGE_ROWS = 16
const SLEEP_AFTER_MS = 90_000
const SETTLE_MS = 6_000

const buddy = atom({ plugin: 'clawd-buddy', key: 'buddy' } as const, {
  mood: 'idle',
  detail: '',
  since: 0,
  seq: 0,
  helpers: 0,
  tint: '',
  hour: 12,
  isBig: false,
  month: 0,
  day: 1,
  react: { kind: 'hello', text: '', seq: 0 },
} as Buddy)

const LABEL: Record<Mood, string> = {
  idle: 'hanging out',
  sleepy: 'napping',
  listening: 'got your message',
  thinking: 'thinking',
  pondering: 'deep in thought',
  talking: 'writing a reply',
  reading: 'reading',
  searching: 'searching',
  writing: 'editing',
  terminal: 'running a command',
  testing: 'running tests',
  building: 'building',
  installing: 'installing',
  shipping: 'shipping it',
  committing: 'committing',
  cleaning: 'cleaning up',
  planning: 'planning',
  asking: 'has a question',
  waiting: 'needs your OK',
  timing: 'waiting on a timer',
  delegating: 'sent helpers',
  surfing: 'surfing the web',
  plugging: 'using a tool',
  snapping: 'taking a screenshot',
  casting: 'using a skill',
  compacting: 'compacting memory',
  debugging: 'hunting a bug',
  polishing: 'tidying up the code',
  branching: 'tending the branches',
  querying: 'asking the database',
  serving: 'serving it up',
  benchmarking: 'timing it',
  designing: 'making it pretty',
  exploring: 'exploring',
  mailing: 'sending a message',
  remembering: 'noting that down',
  phoning: 'on the simulator',
  happy: 'done!',
  oops: 'oops',
  sad: 'stopped',
}

const MOODS = Object.keys(LABEL) as Mood[]

// ── Reading what Claude is doing ───────────────────────────────────────────

type Doing = { mood: Mood; detail: string; tint?: string }

// Each language gets its own colour: book covers, laptop stickers, code sparks.
const EXT_TINT: Record<string, string> = {
  swift: '#F05138',
  ts: '#3178C6',
  tsx: '#3178C6',
  js: '#E8C547',
  jsx: '#61DAFB',
  mjs: '#E8C547',
  py: '#4B8BBE',
  rs: '#DEA584',
  go: '#00ADD8',
  md: '#D9D4C7',
  json: '#9CCC65',
  css: '#E44D9A',
  scss: '#CF649A',
  html: '#E34F26',
  sh: '#6CC070',
  yml: '#CB171E',
  yaml: '#CB171E',
  rb: '#CC342D',
  java: '#E76F00',
  kt: '#A97BFF',
  c: '#5C6BC0',
  cpp: '#00599C',
  h: '#5C6BC0',
  sql: '#E38C00',
  toml: '#B5651D',
  glsl: '#8E6FD0',
}

const TOOLCHAIN_TINT: [RegExp, string][] = [
  [/\b(swift|xcodebuild|pod)\b/, '#F05138'],
  [/\b(npm|npx|node)\b/, '#CB3837'],
  [/\b(pnpm)\b/, '#F9AD00'],
  [/\b(yarn)\b/, '#2C8EBB'],
  [/\b(bun)\b/, '#F6DECE'],
  [/\b(pip3?|python3?|pytest|uv|poetry)\b/, '#4B8BBE'],
  [/\b(cargo|rustc)\b/, '#DEA584'],
  [/\bgo\b/, '#00ADD8'],
  [/\bbrew\b/, '#F9A03F'],
  [/\bgit\b/, '#F05032'],
  [/\bdocker\b/, '#2496ED'],
  [/\b(vercel|next)\b/, '#E8E6E0'],
]

// Folders that hold projects rather than being one.
const SHELVES = new Set(['Users', 'Desktop', 'Documents', 'Developer', 'Projects', 'projects', 'code', 'Code', 'repos', 'src', 'dev', 'private', 'tmp', 'var', 'home'])

const PAL_PINK = '#EF7DA0'
const basename = (path: string) => path.split('/').filter(Boolean).pop() ?? path
const clip = (text: string, n = 40) => (text.length > n ? text.slice(0, n - 1) + '…' : text)
const tintOfPath = (path: string) => EXT_TINT[path.split('.').pop()?.toLowerCase() ?? ''] ?? ''
const tintOfCommand = (line: string) => TOOLCHAIN_TINT.find(([re]) => re.test(line))?.[1] ?? ''

// `good-egg › main.ts` from /Users/ishu/Desktop/good-egg/src/main.ts.
function where(path: string) {
  const parts = path.split('/').filter(Boolean)
  const file = parts.pop() ?? path
  const home = parts[0] === 'Users' ? 2 : 0
  const project = parts.slice(home).find(p => !SHELVES.has(p) && !p.startsWith('.'))
  return project ? `${project} › ${file}` : file
}

function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const TEST = /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\b(pytest|jest|vitest|mocha|rspec|phpunit|ctest)\b|\b(go|cargo|swift|deno|dotnet|mix)\s+test\b|xcodebuild\b.*\btest\b|playwright\s+test/
const BUILD = /\b(npm|pnpm|yarn|bun)\s+run\s+build\b|\b(make|tsc|webpack|esbuild|rollup|gradle|gradlew|mvn|cmake|ninja|xcodebuild)\b|\b(cargo|go|swift|vite|next|docker)\s+build\b/
const INSTALL = /\b(npm|pnpm|yarn|bun)\s+(install|i|add|ci)\b|\bpip3?\s+install\b|\b(brew|gem|apt|apt-get|pod|bundle)\s+install\b|\b(cargo|uv|poetry)\s+add\b|\bgo\s+get\b|\bgit\s+(pull|fetch|clone)\b|\bnpx\s/
const SHIP = /\bgit\s+push\b|\bgh\s+(pr|release)\s+create\b|\b(deploy|vercel|netlify|fly|wrangler)\b|\bfirebase\s+deploy\b|\bnpm\s+publish\b/
const CLEAN = /(^|[;&|]\s*)rm\s|\brimraf\b|\bgit\s+clean\b|\bprune\b|\bclean\b/
const FETCH = /\b(curl|wget|http|https)\s/
const LOOK = /^\s*(git\s+(status|diff|log|show|blame|grep|branch)|ls|find|rg|grep|fd|tree|which|pwd|du|stat|file)\b/
const PEEK = /^\s*(cat|head|tail|less|bat|wc)\b/
const WAIT = /^\s*sleep\b|\bwait\b/
const DEBUG = /\b(lldb|gdb|pdb|dlv|debug|debugger)\b|node\s+--inspect/
const LINT = /\b(eslint|prettier|ruff|black|swiftlint|swift-format|swiftformat|rustfmt|gofmt|clippy|biome|stylelint|lint|fmt|format)\b/
const BRANCH = /\bgit\s+(checkout|switch|branch|merge|rebase|stash|cherry-pick|worktree)\b/
const DB = /\b(psql|mysql|sqlite3|mongosh|redis-cli|prisma|drizzle-kit|supabase|convex)\b/
const SERVE = /\b(npm|pnpm|yarn|bun)\s+(run\s+)?(dev|start|serve|preview)\b|\bnext\s+dev\b|\bhttp\.server\b|^\s*vite\s*$|^\s*(npx\s+)?serve\b/
const BENCH = /\b(hyperfine|bench|benchmark|perf|lighthouse|wrk)\b|^\s*time\s/
const EXPLORE = /^\s*(tree|find)\b/
const PHONE = /\b(simctl|xcrun\s+simctl|ios-deploy|devicectl)\b/

function doingForBash(command: string): Doing {
  const line = command.split('\n')[0].trim()
  const detail = clip(line)
  const tint = tintOfCommand(line)

  if (/\bgit\s+commit\b/.test(line)) {
    const message = /-m\s+["']([^"'\n]+)/.exec(command)?.[1]
    return { mood: 'committing', detail: clip(message ?? 'a commit'), tint }
  }
  if (TEST.test(line)) return { mood: 'testing', detail, tint }
  if (SHIP.test(line)) return { mood: 'shipping', detail, tint }
  if (PHONE.test(line)) return { mood: 'phoning', detail, tint: '#F05138' }
  if (DEBUG.test(line)) return { mood: 'debugging', detail, tint }
  if (BENCH.test(line)) return { mood: 'benchmarking', detail, tint }
  if (SERVE.test(line)) return { mood: 'serving', detail, tint }
  if (BUILD.test(line)) return { mood: 'building', detail, tint }
  if (INSTALL.test(line)) return { mood: 'installing', detail, tint }
  if (DB.test(line)) return { mood: 'querying', detail, tint }
  if (BRANCH.test(line)) return { mood: 'branching', detail, tint: '#F05032' }
  if (LINT.test(line)) return { mood: 'polishing', detail, tint }
  if (FETCH.test(line)) return { mood: 'surfing', detail: hostOf(/https?:\/\/\S+/.exec(line)?.[0] ?? '') || detail }
  if (CLEAN.test(line)) return { mood: 'cleaning', detail, tint }
  if (EXPLORE.test(line)) return { mood: 'exploring', detail, tint }
  if (PEEK.test(line)) {
    const file = line.split(/\s+/).find((w, i) => i > 0 && !w.startsWith('-')) ?? ''
    return { mood: 'reading', detail: file ? where(file) : detail, tint: tintOfPath(file) }
  }
  if (LOOK.test(line)) return { mood: 'searching', detail, tint }
  if (WAIT.test(line)) return { mood: 'timing', detail }

  return { mood: 'terminal', detail, tint }
}

function doingForTool(tool: string, input: Record<string, unknown>): Doing {
  const str = (key: string) => (typeof input[key] === 'string' ? (input[key] as string) : '')
  const short = tool.replace(/^mcp__[^_]+__/, '')
  const path = str('file_path') || str('notebook_path')

  switch (tool) {
    case 'Read':
      return { mood: 'reading', detail: where(path), tint: tintOfPath(path) }
    case 'Grep':
    case 'Glob':
    case 'LS':
    case 'LSP':
    case 'ToolSearch':
      return { mood: 'searching', detail: clip(str('pattern') || str('query') || str('path') || tool) }
    case 'Edit':
    case 'Write':
    case 'MultiEdit':
    case 'NotebookEdit':
      if (/\/memory\/|CLAUDE\.md$|MEMORY\.md$/.test(path)) return { mood: 'remembering', detail: where(path), tint: PAL_PINK }
      if (/\.(css|scss|sass|less|svg)$/i.test(path)) return { mood: 'designing', detail: where(path), tint: tintOfPath(path) }
      return { mood: 'writing', detail: where(path), tint: tintOfPath(path) }
    case 'Bash':
      return doingForBash(str('command'))
    case 'WebFetch':
      return { mood: 'surfing', detail: hostOf(str('url')) || 'the web' }
    case 'WebSearch':
      return { mood: 'surfing', detail: `“${clip(str('query'), 34)}”` }
    case 'Agent':
    case 'Task':
      if (str('subagent_type') === 'Explore') return { mood: 'exploring', detail: clip(str('description') || 'the codebase') }
      return { mood: 'delegating', detail: clip(str('description') || 'a helper') }
    case 'SendMessage':
      return { mood: 'mailing', detail: `to ${clip(str('to') || 'a teammate', 30)}` }
    case 'TodoWrite':
    case 'TaskCreate':
    case 'TaskUpdate':
    case 'TaskList':
    case 'EnterPlanMode':
    case 'ExitPlanMode':
      return { mood: 'planning', detail: tool === 'ExitPlanMode' ? 'plan ready' : 'the to-do list' }
    case 'AskUserQuestion':
      return { mood: 'asking', detail: `over to you, ${OWNER}` }
    case 'Skill':
      return { mood: 'casting', detail: str('skill') }
    case 'Monitor':
    case 'ScheduleWakeup':
    case 'CronCreate':
      return { mood: 'timing', detail: short }
    case 'Artifact':
      return { mood: 'shipping', detail: 'publishing a page' }
    case 'SendUserFile':
      return { mood: 'mailing', detail: `sending you a file, ${OWNER}` }
  }

  const action = str('action')
  if (/screenshot|zoom/i.test(tool) || /screenshot|zoom/.test(action)) {
    return { mood: 'snapping', detail: 'say cheese' }
  }
  if (/iOS_Simulator/i.test(tool)) return { mood: 'phoning', detail: clip(action || short), tint: '#F05138' }
  if (/convex|supabase|postgres|sqlite|database|_query|runOneoffQuery|tables/i.test(tool)) return { mood: 'querying', detail: clip(short) }
  if (/slack|gmail|mail|message|send_message|post_message/i.test(tool)) return { mood: 'mailing', detail: clip(short) }
  if (/figma|design|canva/i.test(tool)) return { mood: 'designing', detail: clip(short) }
  if (/deploy/i.test(short)) return { mood: 'shipping', detail: clip(short) }
  if (/browser|chrome|navigate|get_page_text|read_page/i.test(tool)) {
    return { mood: 'surfing', detail: hostOf(str('url')) || clip(short) }
  }
  if (tool.startsWith('mcp__')) {
    return { mood: 'plugging', detail: clip(short) }
  }

  return { mood: 'thinking', detail: clip(short) }
}

// ── Reading what came back ─────────────────────────────────────────────────

type Verdict = { kind: ReactKind; text: string; extra?: string }

const lineCount = (text: string) => (text === '' ? 0 : text.split('\n').length)

function verdictFor(tool: string, input: Record<string, unknown>, doing: Doing, text: string, isError: boolean): Verdict | undefined {
  const str = (key: string) => (typeof input[key] === 'string' ? (input[key] as string) : '')

  if (doing.mood === 'testing') {
    const swift = /Executed (\d+) tests?, with (\d+) failures?/.exec(text)
    const passed = Number(swift ? Number(swift[1]) - Number(swift[2]) : /(\d+)\s+(passed|passing)/i.exec(text)?.[1] ?? NaN)
    const failed = Number(swift?.[2] ?? /(\d+)\s+(failed|failing)/i.exec(text)?.[1] ?? 0)
    if (isError || failed > 0) return { kind: 'fail', text: failed > 0 ? `✗ ${failed} failed` : '✗ tests failed' }
    return { kind: 'pass', text: Number.isNaN(passed) ? '✓ tests pass' : `✓ ${passed} passed` }
  }
  if (isError) {
    const code = /exit code (\d+)/i.exec(text)?.[1]
    return { kind: 'fail', text: code ? `exit ${code}` : doing.mood === 'building' ? 'build failed' : 'failed' }
  }

  switch (doing.mood) {
    case 'remembering':
      return { kind: 'noted', text: 'noted ♥' }
    case 'polishing':
      return { kind: 'pass', text: '✦ tidy' }
    case 'branching':
      return { kind: 'found', text: /merge|rebase/.test(str('command')) ? 'merged' : 'switched' }
    case 'writing': {
      if (tool === 'Write') return { kind: 'edit', text: `+${lineCount(str('content'))}` }
      const edits = Array.isArray(input.edits) ? (input.edits as { old_string?: string; new_string?: string }[]) : [{ old_string: str('old_string'), new_string: str('new_string') }]
      const added = edits.reduce((n, x) => n + lineCount(x.new_string ?? ''), 0)
      const removed = edits.reduce((n, x) => n + lineCount(x.old_string ?? ''), 0)
      return { kind: 'edit', text: `+${added}`, extra: `−${removed}` }
    }
    case 'searching': {
      if (tool !== 'Grep' && tool !== 'Glob') return undefined
      const hits = text.split('\n').filter(l => l.trim() && !/^(No |Found \d)/.test(l)).length
      if (hits === 0 || /^No (matches|files) found/m.test(text)) return { kind: 'none', text: 'no hits' }
      return { kind: 'found', text: tool === 'Glob' ? `${hits} files` : `${hits} hits` }
    }
    case 'committing': {
      const hash = /\[[^\]\s]+\s+([0-9a-f]{7})\]/.exec(text)?.[1]
      return { kind: 'pass', text: hash ? `✓ ${hash}` : '✓ committed' }
    }
    case 'building':
      return { kind: 'pass', text: '✓ built' }
    case 'installing':
      return { kind: 'pass', text: '✓ installed' }
    case 'shipping':
      return { kind: 'pass', text: tool === 'Bash' ? '✓ shipped' : '✓ sent' }
    case 'delegating':
      return { kind: 'found', text: 'helper’s back' }
  }
  return undefined
}

// ── State ──────────────────────────────────────────────────────────────────

let isInTurn = false
let lastChange = 0
let current: Mood = 'idle'
let helpers = 0
let turnTools = 0
let streak = 0
let latest: Buddy | null = null

// Surfaces whose Client can't run (the desktop app's sandbox refuses it) get
// Clawd from here: this module steps the same engine and redraws the pane.
const HOST_FPS = 8
const frame = atom({ plugin: 'clawd-buddy', key: 'frame' } as const, 0)
const place = atom({ plugin: 'clawd-buddy', key: 'place' } as const, 'stage' as Place)
let hostSim: Sim | null = null
let hostSize = { cols: 0, rows: 0 }
let hostSeenAt = 0

function simProps(b: Buddy): SimProps {
  return {
    mood: b.mood,
    label: LABEL[b.mood],
    detail: b.detail,
    seq: b.seq,
    helpers: b.helpers ?? 0,
    tint: b.tint ?? '',
    hour: b.hour ?? 12,
    isBig: b.isBig ?? false,
    month: b.month ?? today().month,
    day: b.day ?? today().day,
    react: b.react ?? { kind: 'hello', text: '', seq: 0 },
  }
}

function today() {
  try {
    const d = new Date()
    return { month: d.getMonth(), day: d.getDate() }
  } catch {
    return { month: 0, day: 1 }
  }
}

function hourNow() {
  try {
    return new Date().getHours()
  } catch {
    return 12
  }
}

async function setMood($: EngineInterface, mood: Mood, detail = '', extra: { tint?: string; isBig?: boolean } = {}) {
  const now = await $.clock.now()
  current = mood
  lastChange = now
  await update($, buddy, b => (latest = {
    ...b,
    mood,
    detail,
    since: now,
    seq: b.seq + 1,
    helpers,
    tint: extra.tint ?? '',
    isBig: extra.isBig ?? false,
    hour: hourNow(),
    ...today(),
  }))
}

async function setReact($: EngineInterface, verdict: Verdict) {
  await update($, buddy, b => (latest = { ...b, react: { ...verdict, seq: (b.react?.seq ?? 0) + 1 } }))
}

async function setHelpers($: EngineInterface, n: number) {
  helpers = Math.max(0, n)
  await update($, buddy, b => (latest = { ...b, helpers }))
}

// Back to idle a little after a turn ends, unless something else happened.
function settleLater($: EngineInterface) {
  const settledFrom = lastChange
  $.clock.after(SETTLE_MS, () => {
    if (!isInTurn && lastChange === settledFrom) void setMood($, 'idle')
  })
}

const cheers = () => ['done!', 'ta-da!', 'all set', `nice one, ${OWNER}!`, 'that’s a wrap']

// ── Hooks ──────────────────────────────────────────────────────────────────

export const register: Register = (on, options) => {
  OWNER = typeof options.name === 'string' && options.name.trim() ? options.name.trim() : 'friend'

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'clawd',
      description: 'Open the Clawd buddy pane (or /clawd <mood> to preview one)',
    })
    lastChange = await $.clock.now()

    $.clock.every(5_000, () => {
      void $.clock.now().then(now => {
        if (current === 'idle' && now - lastChange > SLEEP_AFTER_MS) void setMood($, 'sleepy')
      })
    })

    $.clock.every(Math.round(1000 / HOST_FPS), () => {
      // Only while a host-drawn pane has been drawn lately.
      if (!hostSim || !latest) return
      void $.clock.now().then(now => {
        if (!hostSim || !latest || now - hostSeenAt > 3_000) return
        hostSim.props = simProps(latest)
        const L = layout(hostSize.cols, hostSize.rows)
        if (L.cols >= 18 && L.cellRows >= 4) step(hostSim, L, 1 / HOST_FPS)
        void update($, frame, n => (n + 1) % 100_000)
      })
    })

    if ((await $.state.get({ plugin: 'clawd-buddy', key: 'place' } as const)).value === 'pane') {
      void $.ui.open({ id: PANE, title: 'Clawd' })
    }
    const hour = hourNow()
    const hello = hour < 5 ? `up late, ${OWNER}?` : hour < 12 ? `morning, ${OWNER}!` : hour < 18 ? `hi ${OWNER}!` : `evening, ${OWNER}!`
    void setReact($, { kind: 'hello', text: hello })

    return next(e)
  })

  on('command.run', { command: 'clawd' }, async ($, e) => {
    const [ask, extra] = e.args.trim().split(/\s+/) as [string, string?]
    const where = (await $.state.get({ plugin: 'clawd-buddy', key: 'place' } as const)).value ?? 'stage'

    if (ask === 'pane') {
      await update($, place, () => 'pane' as Place)
      await $.ui.open({ id: PANE, title: 'Clawd' })
      return { text: 'Clawd moved into a side pane. /clawd stage brings him back above the prompt.' }
    }
    if (ask === 'stage' || ask === 'show' || (ask === '' && where === 'hidden')) {
      await update($, place, () => 'stage' as Place)
      await $.ui.close({ id: PANE })
      return { text: 'Clawd is on stage above the prompt.' }
    }
    if (ask === 'hide') {
      await update($, place, () => 'hidden' as Place)
      await $.ui.close({ id: PANE })
      return { text: 'Clawd is taking a break. /clawd brings him back.' }
    }
    if (where === 'hidden') await update($, place, () => 'stage' as Place)
    if (where === 'pane') await $.ui.open({ id: PANE, title: 'Clawd' })

    if (MOODS.includes(ask as Mood)) {
      const mood = ask as Mood
      if (!isInTurn) await setHelpers($, mood === 'delegating' ? Number(extra) || 2 : 0)
      await setMood($, mood, 'on request', { tint: extra?.startsWith('#') ? extra : EXT_TINT[extra ?? ''], isBig: extra === 'big' })
      if (!isInTurn) settleLater($)
      return { text: `Clawd: ${LABEL[mood]}` }
    }
    const reactions: ReactKind[] = ['pass', 'fail', 'edit', 'found', 'none', 'hello', 'denied', 'phew', 'combo', 'noted', 'streak']
    if (reactions.includes(ask as ReactKind)) {
      const samples: Record<ReactKind, Verdict> = {
        pass: { kind: 'pass', text: '✓ 42 passed' },
        fail: { kind: 'fail', text: '✗ 2 failed' },
        edit: { kind: 'edit', text: '+12', extra: '−3' },
        found: { kind: 'found', text: '7 hits' },
        none: { kind: 'none', text: 'no hits' },
        hello: { kind: 'hello', text: `hi ${OWNER}!` },
        denied: { kind: 'denied', text: 'ok, skipping' },
        phew: { kind: 'phew', text: 'phew · 42s' },
        combo: { kind: 'combo', text: 'combo ×10!' },
        noted: { kind: 'noted', text: 'noted ♥' },
        streak: { kind: 'streak', text: 'streak ×3' },
      }
      await setReact($, samples[ask as ReactKind])
      return { text: `Clawd reacts: ${ask}` }
    }

    return { text: `Clawd is here. /clawd stage | pane | hide moves him. Moods: ${MOODS.join(', ')}. Reactions: ${reactions.join(', ')}.` }
  })

  on('prompt.submit', async ($, e, next) => {
    await setMood($, 'listening', clip(e.text.replace(/\s+/g, ' '), 36))

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    isInTurn = true
    turnTools = 0
    await setMood($, 'thinking')

    return next(e)
  })

  // Thinking and reply text stream in as chunks: switch on each change of kind.
  on('turn.step', async function* ($, e, next) {
    const isMain = !(e as { agentId?: string }).agentId
    const stream = next(e)
    let kind = ''

    while (true) {
      const r = await stream.next()
      if (r.done) return r.value
      const now = r.value.kind
      if (isMain && now !== kind && (now === 'thinking' || now === 'text')) {
        kind = now
        void setMood($, now === 'thinking' ? 'pondering' : 'talking')
      }
      yield r.value
    }
  })

  // A call the mode puts to the person: Clawd holds up a sign until it runs.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (e.tool_use_id && verdict.decision === 'ask') {
      await setMood($, 'waiting', `${e.tool.replace(/^mcp__[^_]+__/, '')} needs your OK`)
    }

    return verdict
  })

  on('tool.call', async ($, e, next) => {
    const input = e as unknown as Record<string, unknown>
    const doing = doingForTool(e.tool, input)
    const isHelper = doing.mood === 'delegating'
    if (isHelper) await setHelpers($, helpers + 1)
    await setMood($, doing.mood, doing.detail, { tint: doing.tint })

    const startedAt = await $.clock.now()
    try {
      const ran = await next(e)
      const isError = ran.deny === undefined && ran.isError === true
      const took = Math.round(((await $.clock.now()) - startedAt) / 1000)
      let verdict: Verdict | undefined =
        ran.deny === undefined ? verdictFor(e.tool, input, doing, ran.text ?? '', isError) : { kind: 'denied', text: 'ok, skipping' }

      // Streaks of green, long hauls and busy turns get their own moment.
      const isCheck = doing.mood === 'testing' || doing.mood === 'building'
      if (isCheck) streak = verdict?.kind === 'pass' ? streak + 1 : 0
      turnTools += 1
      if (isCheck && streak >= 3 && verdict?.kind === 'pass') verdict = { kind: 'streak', text: `streak ×${streak}` }
      else if (!isError && took >= 30 && verdict?.kind !== 'fail') verdict = { kind: 'phew', text: `phew · ${took}s` }
      else if (!verdict && turnTools % 10 === 0) verdict = { kind: 'combo', text: `combo ×${turnTools}!` }
      if (verdict) await setReact($, verdict)

      if (isError) {
        await setMood($, 'oops', verdict?.text ?? `${e.tool} failed`)
      } else if (isInTurn && (current === doing.mood || current === 'waiting')) {
        await setMood($, isHelper && helpers > 1 ? 'delegating' : 'thinking')
      }

      return ran
    } finally {
      if (isHelper) await setHelpers($, helpers - 1)
    }
  })

  on('session.compact', async ($, e, next) => {
    if (e.agentId) return next(e)
    await setMood($, 'compacting', e.trigger === 'auto' ? 'making room' : 'on request')
    const done = await next(e)
    await setMood($, isInTurn ? 'thinking' : 'idle')

    return done
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) {
      return next(e)
    }
    isInTurn = false
    const seconds = Math.round(e.durationMs / 1000)
    const took = seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`

    if (e.reason === 'answer') {
      await setMood($, 'happy', `took ${took}`, { isBig: seconds >= 60 })
      const lines = cheers()
      await setReact($, { kind: 'pass', text: lines[Math.floor(Math.random() * lines.length)] })
    } else if (e.reason === 'aborted') await setMood($, 'sad', 'interrupted')
    else await setMood($, 'sad', e.reason === 'refusal' ? 'declined' : 'hit an error')

    settleLater($)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    return drawStage($, e, e.props.bodyColumns, Math.max(8, e.props.scroll.bodyRows))
  })

  // The stage: a strip right above the prompt, as wide as the conversation.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, place)) !== 'stage') return next(e)
    return drawStage($, e, e.props.bodyColumns, Math.min(STAGE_ROWS, Math.max(8, e.props.maxRows - 1)))
  })
}

async function drawStage($: EngineInterface, e: RenderInput<'Pane' | 'AbovePrompt'>, cols: number, rows: number) {
  const b = await read($, buddy)

  if (e.surface === 'terminal') {
    const { Client } = $.ui.resolve(e)
    return <Client key="clawd" module="./clawd.tsx" props={simProps(b)} width={cols} height={rows} />
  }

  // Every other surface: this module runs the engine and draws the frame.
  await read($, frame)
  latest = latest ?? b
  hostSize = { cols, rows }
  hostSeenAt = await $.clock.now()
  hostSim = hostSim ?? newSim(simProps(b))
  const L = layout(cols, rows)
  const { Box, Text } = $.ui.resolve(e)
  const shown = hostSim.shown
  if (L.cols < 24 || L.cellRows < 4) return <Text color={BODY}>▐▛███▜▌ {shown.label}</Text>

  const caption = (
    <Box flexDirection="row">
      <Text color={shown.tint || BODY}>{'● '}</Text>
      <Text bold color={BODY}>
        {shown.label}
      </Text>
      {shown.detail !== '' && (
        <Text dimColor wrap="truncate-end">
          {'  ' + shown.detail}
        </Text>
      )}
    </Box>
  )

  // Surfaces that draw SVG get square pixels; text cells elsewhere.
  if (e.surface === 'desktop' || e.surface === 'vscode' || e.surface === 'mobile') {
    const { Svg } = $.ui.resolve(e)
    const art = toSvg(hostSim, L)
    return (
      <Box flexDirection="column">
        {caption}
        <Svg source={art.source} alt={`Clawd, ${shown.label}`} />
      </Box>
    )
  }

  const lines = rasterize(hostSim, L)
  return (
    <Box flexDirection="column">
      {caption}
      <Text> </Text>
      {lines.map(segs => (
        <Box flexDirection="row">
          {segs.map(seg => (
            <Text color={seg.fg} backgroundColor={seg.bg}>
              {seg.text}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  )
}
