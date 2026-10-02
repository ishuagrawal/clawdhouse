// The video's timeline: one mood per beat over the chiptune from src/music.py,
// laid out by src/timeline.json. Both src/render-video.ts (pictures) and
// src/cues.ts (sound effects) play it, so what you see and what you hear
// come from the same frames.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { REACTIONS, SCENES } from './scenes.ts'
import type { Scene } from './scenes.ts'
import { Stage, seed } from './clawd.ts'
import { BAND_COLS, BAND_ROWS, branch, card, transcript } from './session.ts'
import type { AppRow } from './session.ts'

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url))
export const TL = JSON.parse(readFileSync(path('./timeline.json'), 'utf8'))
export const FPS: number = TL.fps
export const PER_BEAT = Math.round((60 / TL.bpm) * FPS)
if (Math.abs((60 / TL.bpm) * FPS - PER_BEAT) > 1e-9) throw new Error('pick a bpm that puts a whole number of frames in a beat')

// What page.html's appWindow() draws: the Code tab at one moment.
type Cell = {
  rows: AppRow[]
  card?: ReturnType<typeof card>
  branch?: ReturnType<typeof branch>
  isWorking: boolean
  stage: { label: string; detail: string; tint: string; svg: string }
  // Text being typed into the prompt.
  typed?: string
  // The open session's dot in the sidebar.
  dot: 'work' | 'ask' | 'idle'
}

export type Frame = {
  cell: Cell
  top?: { kicker: string; title: string; count?: string }
  hero?: { line: string; code?: string; opacity: number }
  fade?: number
}

// A beat-long (or longer) shot: how to draw each of its frames.
type Shot = { beats: number; frame: (i: number, stage: Stage) => Frame; stage: Stage }

const pad = (n: number) => String(n).padStart(2, '0')
const PROMPT = 'add a dark mode toggle to settings'
const stageFor = (scene: Scene, n: number, warm?: number) => {
  seed(n)
  return new Stage(scene, FPS, warm ?? scene.warm ?? 2.5, BAND_COLS, BAND_ROWS)
}

// The Code tab as it stands at scene `i`, with Clawd drawn from `stage`.
function cellAt(i: number, stage: Stage): Cell {
  const scene = SCENES[i]
  const isAsking = scene.row?.kind === 'ask' || scene.row?.kind === 'permit'
  return {
    rows: transcript(i),
    card: card(scene),
    branch: branch(i),
    isWorking: scene.isWorking ?? false,
    stage: { label: scene.label, detail: scene.detail, tint: scene.tint ?? '', svg: stage.svg() },
    dot: isAsking ? 'ask' : scene.isWorking ? 'work' : 'idle',
  }
}

function buildShots(): Shot[] {
  const shots: Shot[] = []
  const at = (mood: Scene['mood']) => SCENES.findIndex(s => s.mood === mood)

  // ── Intro: Clawd says hi while the first prompt gets typed ──────────────

  {
    const idle = at('idle')
    const stage = stageFor(SCENES[idle], 1, 1.2)
    shots.push({
      beats: TL.beats.intro,
      stage,
      frame: i => {
        const beat = i / PER_BEAT
        if (i === 3 * PER_BEAT) stage.react('hello', 'hi friend!')
        const typed = beat < 4.5 ? '' : PROMPT.slice(0, Math.round(((beat - 4.5) / 3.2) * PROMPT.length))
        return {
          cell: { ...cellAt(idle, stage), typed: typed || undefined },
          top: { kicker: 'meet', title: 'Clawd' },
          hero: beat < 4 ? { line: 'A pixel Clawd who acts out what Claude is doing', opacity: Math.min(1, i / 6, (4 - beat) * 2) } : undefined,
        }
      },
    })
  }

  // ── Forty moods, one per beat, as one session plays out ─────────────────

  SCENES.forEach((scene, n) => {
    const stage = stageFor(scene, 1000 + n)
    shots.push({
      beats: 1,
      stage,
      frame: i => {
        const cell = cellAt(n, stage)
        // The prompt still holds what was typed, until it's sent.
        if (scene.mood === 'idle') cell.typed = PROMPT
        // Claude's reply streams in over the beat.
        const reply = scene.mood === 'talking' && scene.row?.kind === 'text' ? scene.row.text : null
        if (reply) {
          const shown = reply.slice(0, Math.max(8, Math.round((i / PER_BEAT) * 1.6 * reply.length)))
          cell.rows = cell.rows.map(r => (r.kind === 'text' && r.text === reply ? { ...r, text: shown } : r))
        }
        return { cell, top: { kicker: '/clawd', title: scene.mood, count: `${pad(n + 1)} / ${SCENES.length}` } }
      },
    })
  })

  // ── Reactions: a moment over the mood each one usually lands on ─────────

  REACTIONS.forEach((r, n) => {
    const over = at(r.over)
    const stage = stageFor(SCENES[over], 2000 + n)
    shots.push({
      beats: 1,
      stage,
      frame: i => {
        if (i === 0) stage.react(r.kind, r.text, r.extra)
        return { cell: cellAt(over, stage), top: { kicker: 'reaction', title: r.kind, count: `${pad(n + 1)} / ${REACTIONS.length}` } }
      },
    })
  })

  // ── Outro: confetti, then how to get him ────────────────────────────────

  {
    const happy = at('happy')
    const stage = stageFor(SCENES[happy], 3, 0.15)
    const beats = TL.beats.outro + TL.tail / (60 / TL.bpm)
    const total = Math.round(beats * PER_BEAT)
    shots.push({
      beats,
      stage,
      frame: i => {
        const beat = i / PER_BEAT
        // A second burst of confetti on the final chord.
        if (i === 2 * PER_BEAT) stage.again()
        return {
          cell: cellAt(happy, stage),
          top: { kicker: 'all', title: 'done!' },
          hero: beat >= 1.5 ? { line: 'Get Clawd for your Claude Code', code: '/plugin install clawd-buddy@clawdhouse', opacity: Math.min(1, (beat - 1.5) * 2) } : undefined,
          fade: Math.max(0, (i - (total - 14)) / 14),
        }
      },
    })
  }

  return shots
}

export type Played = {
  index: number
  // Which shot this frame belongs to, and how far into it.
  shot: number
  i: number
  frame: Frame & { beatT: number }
  // The sim right after this frame was drawn, before the clock steps on.
  stage: Stage
}

// Every frame of the video, in order. The sims draw from a seeded Math.random,
// so collect all the frames before starting anything else that might draw
// from it too (a browser, say), or the render and the cues drift apart.
export function* play(): Generator<Played> {
  const shots = buildShots()
  let index = 0
  for (const [s, shot] of shots.entries()) {
    const n = Math.round(shot.beats * PER_BEAT)
    for (let i = 0; i < n; i++) {
      const f = shot.frame(i, shot.stage)
      // The status line's starburst keeps turning.
      f.cell.rows = f.cell.rows.map(r => (r.kind === 'stat' ? { ...r, turn: index * 0.25 } : r))
      yield { index, shot: s, i, frame: { ...f, beatT: (index % PER_BEAT) / PER_BEAT }, stage: shot.stage }
      shot.stage.tick()
      index++
    }
  }
}
