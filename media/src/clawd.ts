// Drives the mod's own engine outside Claude Code: the same simulation and
// the same SVG the desktop app draws, stepped on a fixed clock with a seeded
// random source so every render comes out identical.

import { layout, newSim, step, toSvg } from '../../clawd-buddy/hooks/engine.ts'
import type { Layout, Props, Sim } from '../../clawd-buddy/hooks/engine.ts'
import type { ReactKind } from '../../clawd-buddy/types/index.d.ts'
import type { Scene } from './scenes.ts'

// The stage the desktop app gives the band: 96 columns, 16 rows (2 caption).
export const COLS = 96
export const ROWS = 16
export const PX_H = (ROWS - 2) * 2

export function seed(n: number) {
  let a = n >>> 0
  Math.random = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NO_REACT = { kind: 'hello' as ReactKind, text: '', seq: 0 }

function propsFor(scene: Scene, seq: number): Props {
  return {
    mood: scene.mood,
    label: scene.label,
    detail: scene.detail,
    seq,
    helpers: scene.helpers ?? 0,
    tint: scene.tint ?? '',
    hour: 14,
    isBig: scene.isBig ?? false,
    // June: no seasonal props (October brings pumpkins, December snow).
    month: 5,
    day: 15,
    react: NO_REACT,
  }
}

export class Stage {
  sim: Sim
  L: Layout
  dt: number

  // Starts idle, then switches to the scene's mood the way the hooks do, so
  // the engine plays its entrance (confetti, a walk to the desk, a critter).
  constructor(scene: Scene, fps: number, warm = scene.warm ?? 2.5, cols = COLS, rows = ROWS) {
    this.dt = 1 / fps
    this.L = layout(cols, rows)
    this.sim = newSim(propsFor({ mood: 'idle', label: 'hanging out', detail: '' }, 0))
    this.run(0.6)
    this.sim.props = propsFor(scene, 1)
    this.run(warm)
  }

  run(seconds: number) {
    const n = Math.round(seconds / this.dt)
    for (let i = 0; i < n; i++) step(this.sim, this.L, this.dt)
  }

  tick() {
    step(this.sim, this.L, this.dt)
  }

  // Enter the same mood again: the engine replays its entrance (confetti).
  again() {
    this.sim.props = { ...this.sim.props, seq: this.sim.props.seq + 1 }
  }

  react(kind: ReactKind, text: string, extra?: string) {
    const seq = this.sim.props.react.seq + 1
    this.sim.props = { ...this.sim.props, react: { kind, text, extra, seq } }
  }

  svg() {
    return toSvg(this.sim, this.L).source
  }
}
