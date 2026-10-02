// Everything Clawd can be up to. The hooks pick one from what Claude is
// doing; the Client draws its scene and moves the way it says.
export type Mood =
  | 'idle'
  | 'sleepy'
  | 'listening'
  | 'thinking'
  | 'pondering'
  | 'talking'
  | 'reading'
  | 'searching'
  | 'writing'
  | 'terminal'
  | 'testing'
  | 'building'
  | 'installing'
  | 'shipping'
  | 'committing'
  | 'cleaning'
  | 'planning'
  | 'asking'
  | 'waiting'
  | 'timing'
  | 'delegating'
  | 'surfing'
  | 'plugging'
  | 'snapping'
  | 'casting'
  | 'compacting'
  | 'debugging'
  | 'polishing'
  | 'branching'
  | 'querying'
  | 'serving'
  | 'benchmarking'
  | 'designing'
  | 'exploring'
  | 'mailing'
  | 'remembering'
  | 'phoning'
  | 'happy'
  | 'oops'
  | 'sad'

// A moment's reaction to a result, drawn over whatever Clawd is doing.
export type ReactKind = 'pass' | 'fail' | 'edit' | 'found' | 'none' | 'hello' | 'denied' | 'phew' | 'combo' | 'noted' | 'streak'

export type Reaction = { kind: ReactKind; text: string; extra?: string; seq: number }

// Where Clawd lives: the stage above the prompt, a side pane, or nowhere.
export type Place = 'stage' | 'pane' | 'hidden'

export type Buddy = {
  mood: Mood
  detail: string
  since: number
  seq: number
  helpers: number
  tint: string
  hour: number
  isBig: boolean
  month: number
  day: number
  react: Reaction
}

declare module 'claude-code' {
  interface PluginState {
    'clawdhouse': { buddy: Buddy; frame: number; place: Place }
  }
}
