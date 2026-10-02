// Plays the video's frames (src/shots.ts) without drawing them and notes
// every moment that should make a sound: each cut to a new mood, every key
// typed into the prompt, and what Clawd's engine does on screen (a reaction
// pops, confetti bursts, the hammer lands, the camera flashes, a paper plane
// takes off). Writes .build/cues.json for src/sfx.py.

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { ART } from '../../clawd-buddy/hooks/engine.ts'
import { FPS, TL, play } from './shots.ts'
import type { Played } from './shots.ts'

const OUT = fileURLToPath(new URL('../.build/cues.json', import.meta.url))

export type Cue = { frame: number; t: number; kind: string; name?: string; n?: number }

// Everything about a frame worth comparing with the one before it.
function snap({ shot, frame, stage }: Played) {
  const sim = stage.sim
  const PLANE_LIFE = 2.4
  return {
    shot,
    kicker: frame.top?.kicker ?? '',
    title: frame.top?.title ?? '',
    typed: frame.cell.typed?.length ?? 0,
    hero: (frame.hero?.opacity ?? 0) > 0,
    mood: sim.mood,
    moodT: sim.moodT,
    emit: sim.emit,
    // react() sets t to 0, and only the next step moves it on.
    react: sim.react && sim.react.t === 0 ? sim.react.kind : null,
    isGrounded: sim.isGrounded,
    squash: sim.squash,
    beat: sim.beat,
    isArrived: sim.isArrived,
    isPlanted: sim.isPlanted,
    planes: sim.particles.filter(p => (p.art === ART.planeR || p.art === ART.planeL) && p.life > PLANE_LIFE - 1.5 / FPS).length,
  }
}

const cues: Cue[] = []
let prev: ReturnType<typeof snap> | null = null
let frames = 0

for (const played of play()) {
  const now = snap(played)
  const at = (kind: string, more: Partial<Cue> = {}) => cues.push({ frame: played.index, t: played.index / FPS, kind, ...more })
  frames++

  if (!prev || now.shot !== prev.shot) {
    // A cut: the mood (or reaction) that just came on gets its sound.
    at('cut', { name: `${now.kicker}:${now.title}` })
    prev = now
    continue
  }

  if (now.typed > prev.typed) at('key', { n: now.typed - prev.typed })
  if (now.hero && !prev.hero) at('hero')
  if (now.react) at('react', { name: now.react })
  if (now.moodT < prev.moodT) at('enter', { name: now.mood })

  if (prev.isGrounded && !now.isGrounded) at('jump')
  if (!now.isGrounded && now.squash > prev.squash) at('bounce')
  if (!prev.isGrounded && now.isGrounded) at('land')

  // The engine's own beats: the hammer, the camera, the countdown, the flag.
  const isNewBeat = now.beat !== prev.beat && now.mood === prev.mood
  if (isNewBeat && now.mood === 'building' && now.isArrived && now.beat % 2 === 1) at('hammer')
  if (isNewBeat && now.mood === 'snapping') at('shutter')
  if (isNewBeat && now.mood === 'shipping' && now.isArrived) at(now.beat === 3 ? 'liftoff' : 'count', { n: now.beat })
  if (now.isPlanted && !prev.isPlanted) at('flag')
  if (now.planes > prev.planes) at('plane')

  // Steady work: keys while he types, bubbles in the test tube, snores.
  if (now.emit > prev.emit) {
    if ((now.mood === 'writing' || now.mood === 'terminal') && now.isArrived) at('tap', { name: now.mood })
    if (now.mood === 'testing') at('bubble')
    if (now.mood === 'sleepy') at('snore')
  }
  prev = now
}

mkdirSync(fileURLToPath(new URL('../.build/', import.meta.url)), { recursive: true })
writeFileSync(OUT, JSON.stringify({ fps: FPS, bpm: TL.bpm, frames, cues }, null, 1))
const counts = cues.reduce<Record<string, number>>((c, q) => ((c[q.kind] = (c[q.kind] ?? 0) + 1), c), {})
console.log(`wrote ${OUT} (${cues.length} cues: ${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(', ')})`)
