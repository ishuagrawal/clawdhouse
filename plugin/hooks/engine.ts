// Clawd's world: the sprite, the props, the simulation and the rasteriser.
// Shared by the terminal's Client (clawd.tsx) and the host-drawn pane
// (register.tsx), which every surface can show.
import type { Mood, ReactKind, Reaction } from '../types'

// ── Clawd ──────────────────────────────────────────────────────────────────
// Anthropic's pixel crab on his official grid of 12 × 8 square pixels: a
// body eight wide and six tall, two-by-two arms at mid-height, four legs two
// tall at the body's edges, and two single-pixel eyes set wide; body colour
// #DA7758. Each of his pixels is 2 × 2 fine pixels here (a fine pixel is a
// column by half a text row, or one SVG unit), so his face has room to emote.
//
//   ..########..
//   ..#■####■#..
//   ############
//   ############
//   ..########..
//   ..########..
//   ..#.#..#.#..
//   ..#.#..#.#..

export const W0 = 24
export const H0 = 16

export const BODY = '#DA7758'
export const BODY_LIGHT = '#E8917A'
export const BODY_DARK = '#B9603F'
export const MINI_BODY = '#E8957B'
export const FLASH = '#E5484D'
export const EYE = '#1A1918'
export const BROW = '#8E3F28'
export const BLUSH = '#F4A39A'
export const FLOOR = '#4A4540'
export const MUTED = '#B9A898'

export const PAL: Record<string, string> = {
  w: '#F4F1EA',
  W: '#FFFFFF',
  s: '#C9C5BE',
  g: '#8A8580',
  d: '#5A5550',
  k: '#1A1918',
  K: '#1B2433',
  b: '#2F6FB0',
  B: '#8EC5F0',
  i: '#1D3F6E',
  c: '#5FD4D4',
  C: '#BDEFF0',
  y: '#F2C46D',
  Y: '#FFE38A',
  u: '#C98A2E',
  O: '#F59E5B',
  n: '#9A6A45',
  N: '#6E4A30',
  m: '#C9965F',
  r: '#E5484D',
  R: '#A8323A',
  p: '#EF7DA0',
  q: BLUSH,
  G: '#6CC070',
  H: '#3F8F4A',
  l: '#B5E07A',
  P: '#8E6FD0',
  V: '#5B4499',
  v: '#C2B0EE',
  o: BODY,
}
export const CONFETTI = ['#E5484D', '#F2C46D', '#6CC070', '#8EC5F0', '#8E6FD0', '#EF7DA0', '#5FD4D4']
export const FLAG_COLORS = ['#6CC070', '#8EC5F0', '#EF7DA0', '#F2C46D', '#8E6FD0', '#5FD4D4', '#F59E5B']
export const LIQUIDS = ['#6CC070', '#5FD4D4', '#B07CE8', '#F59E5B']

export const TICK = 40
// Seconds per step: the terminal's Client steps at 25 fps, the host at 8.
let DT = TICK / 1000
export const GRAVITY = 260
export const CAPTION_ROWS = 2

// ── Art: drawn facing right, mirrored when Clawd faces left ────────────────
// 't' is the tint (from the file's language), 'T' its shadow, 'L' its light;
// 'j' and 'J' are the flask's liquid.

export type Art = readonly string[]

export const ART = {
  surfboard: [
    '....wwwwwwwwwwtTtwwwwwwwwww...',
    '..wWwwwwwwwwwwtTtwwwwwwwwwwww.',
    '...ssssssssssssssssssssssss...',
  ],
  sun: [
    '....Y....',
    '.Y.....Y.',
    '...yyy...',
    '..yYYYy..',
    'Y.yYWYy.Y',
    '..yYYYy..',
    '...yyy...',
    '.Y.....Y.',
    '....Y....',
  ],
  cloudPuff: ['..wwww...', '.wwwwwww.', 'wwwwwwwww', '.sssssss.'],
  gullA: ['w...w', '.w.w.'],
  gullB: ['..w..', 'ww.ww'],
  book: [
    '..wwwwwww..wwwwwww..',
    '.wwgggggwwsgggggwww.',
    '.wwwwwwwwswwgggggww.',
    '.wwggggwwswwwwwwwww.',
    'tttttttttTTttttttttt',
    '.TTTTTTTTrTTTTTTTTT.',
  ],
  pageFlip: ['....ww', '...wws', '..ww..', '.ww...'],
  lamp: [
    '.yyyyy.',
    'yYYYYYy',
    'uuuuuuu',
    '...n...',
    '...n...',
    '...n...',
    '...n...',
    '...n...',
    '...n...',
    '...n...',
    '...n...',
    '.NNNNN.',
  ],
  magnifier: [
    '...sssss..',
    '..sBWWBBs.',
    '.sBWBBBBBs',
    '.sBBBBBBBs',
    '.sBBBBBBBs',
    '..sBBBBBs.',
    '...sssss..',
    '..NN......',
    '.NN.......',
    'NN........',
  ],
  paper: ['wwws', 'wggw', 'wwww', 'wgww', 'wwww'],
  paperTint: ['ttts', 'tLLt', 'tttt', 'tLtt', 'tttt'],
  laptop: [
    'sWWWWWWWWWWWWWWs',
    'sssssstttsssssss',
    'ssssstLtttssssss',
    'ssssstttttssssss',
    'sssssstttssssoss',
    'gggggggggggggggg',
    'dddddddddddddddd',
  ],
  mug: ['wwww..', 'wttwss', 'wttw.s', 'wwwwss', '.ww...'],
  crt: [
    '.ssssssssssssss.',
    'sggggggggggggggd',
    'sgKKKKKKKKKKKKgd',
    'sgKKKKKKKKKKKKgd',
    'sgKKKKKKKKKKKKgd',
    'sgKKKKKKKKKKKKgd',
    'sgKKKKKKKKKKKKgd',
    'sgKKKKKKKKKKKKgd',
    'sggggggggggGgggd',
    '.dddddddddddddd.',
    '.....gggggg.....',
    '...dddddddddd...',
  ],
  keyboard: ['dsdsdsdsdsd', 'ddddddddddd'],
  flask: ['...ss...', '...ss...', '..s..s..', '.s....s.', '.sJjjjs.', 'sjjJjjjs', 'sjjjjjjs', '.ssssss.'],
  rack: [
    '.s..s..s..s.',
    '.r..y..B..G.',
    '.r..y..B..G.',
    '.R..u..b..H.',
    'nnnnnnnnnnnn',
    'n..........n',
    'n..........n',
  ],
  hardhat: ['.....YYYY.....', '...yYYyyyyy...', '..yyyyyyyyyyu.', 'uyyyyyyyyyyyyu'],
  anvil: [
    'ssssssssssss..',
    'gggggggggggggg',
    '..gddddddddd..',
    '....dddddd....',
    '....dddddd....',
    '...dddddddd...',
    '..dddddddddd..',
  ],
  hammerUp: ['sssss', 'ggggg', '..N..', '..n..', '..n..', '..n..', '..n..'],
  hammerDown: ['........sss', 'nnnnnnnnsgs', '........sss'],
  box: [
    'mmmmmttmmmmm',
    'nnnnnttnnnnn',
    'NNNNNTTNNNNN',
    'nnwwwwnnnnnn',
    'nnwggwnnnnnn',
    'nnwwwwnnnnnn',
    'nnnnnnnnnnnN',
    'NNNNNNNNNNNN',
  ],
  rocket: [
    '...rr...',
    '..rrrr..',
    '..wwww..',
    '.wwBBww.',
    '.wwBWww.',
    '.wwwwww.',
    '.wwttww.',
    '.wwwwww.',
    'rwwwwwwr',
    'rr.ss.rr',
  ],
  pad: ['ssssssssssss', 'd..d....d..d'],
  flagA: ['Ytttttt', 'NtLtttt', 'Nttttt.', 'Ntt....', 'N......', 'N......', 'N......', 'N......', 'N......', 'N......'],
  flagB: ['Yttttt.', 'NtLtttt', 'Ntttttt', 'N..ttt.', 'N......', 'N......', 'N......', 'N......', 'N......', 'N......'],
  broom: ['..N...', '..n...', '..n...', '..n...', '..n...', '..n...', '.uuuu.', 'yyyyyy', 'yYyYyy', 'y.y.y.'],
  bandana: ['...rrrrrrrr...', '..rrWrrrWrrrr.', '.rWrrrWrrrWrrR', '............RR'],
  dust: ['.s.', 'sgs'],
  clipboard: [
    '....sss....',
    'nnnnsgsnnnn',
    'nwwwwwwwwwn',
    'nwkwgggggwn',
    'nwwwwwwwwwn',
    'nwkwggggwwn',
    'nwwwwwwwwwn',
    'nwkwgggggwn',
    'nwwwwwwwwwn',
    'nwkwgggwwwn',
    'nwwwwwwwwwn',
    'NNNNNNNNNNN',
  ],
  pencil: ['p', 'y', 'y', 'y', 'm', 'k'],
  sign: [
    'wwwwwwwwwww',
    'wwwwwwwwwww',
    'wwwwwwwwwww',
    'wwwwwwwwwww',
    'wwwwwwwwwww',
    'wwwwwwwwwww',
    'sssssssssss',
    '.....n.....',
    '.....n.....',
    '.....n.....',
    '.....n.....',
    '.....n.....',
    '.....n.....',
  ],
  hourglass: ['NNNNNNNNN', '.nC...Cn.', '.n.C.C.n.', '.n..C..n.', '.n.C.C.n.', '.nC...Cn.', 'NNNNNNNNN'],
  megaphone: ['......Yu', '....YYyu', 'nsYYyyyu', 'nsyyyyyu', '....yyyu', '......yu'],
  plug: ['.s..s.', '.s..s.', 'gggggg', 'ggGggg', '.dddd.'],
  socket: ['wwww', 'wkkw', 'wwww', 'wkkw', 'wwww', 'ssss'],
  camera: ['..gg....WW', 'dddddddddd', 'dgggsssggd', 'dgsKbBKsgd', 'dgsKbbKsgd', 'dggsKKsggd', 'dddddddddd'],
  photo: ['wwwww', 'wBoBw', 'woooW', 'wBBBw', 'wwwww', 'wwwww'],
  wizardHat: [
    '........PP....',
    '.......PPV....',
    '......PPPV....',
    '.....PYPPV....',
    '.....PPPPPV...',
    '....PPPPYPV...',
    '...PPPPPPPVV..',
    '..uuuuuuuuuu..',
    'PPPPPPPPPPPPPP',
  ],
  wand: ['....Y.', '...YWY', '...nY.', '..n...', '.n....', 'n.....'],
  partyHat: ['...W...', '...Y...', '...p...', '..pYp..', '..Ypp..', '.pYppY.', '.ppYpp.', 'pYppYpp'],
  nightcap: [
    '....iiiiiii.....',
    '..iiBiiiiBiii...',
    '.iiiiiiBiiiiiib.',
    'wwwwwwwwwwwwwiib',
    '..............WW',
    '..............WW',
  ],
  moon: ['.YYY..', 'YY....', 'Y.....', 'Y.....', 'YY....', '.YYY..'],
  thought: [
    '....wwww...ww...',
    '..wwwwwwwwwwwww.',
    '.wwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwww',
    '.wwwwwwwwwwwwww.',
    '..sswwwwwwwwss..',
    '....ssssssss....',
  ],
  bulb: ['..YYYY..', '.YWWYYY.', 'YYWYYYYY', 'YYYYYYYY', 'YYYuuYYY', '.YYYYYY.', '..YYYY..', '..ssss..', '..gggg..', '...ss...'],
  bubble: [
    '.wwwwwwwwwwwwwwwwww.',
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwww',
    '.wwwwwwwwwwwwwwwwww.',
    '..www...............',
    '.ww.................',
  ],
  envelope: ['wwwwwwwwwwww', 'wswwwwwwwwsw', 'wwswwwwwwsww', 'wwwswwwwswww', 'wwwwsrrswwww', 'wwwwwrrwwwww', 'wwwwwwwwwwww', 'ssssssssssss'],
  letter: ['wwwwwwwwwwww', 'wggggggggwww', 'wwwwwwwwwwww', 'wgggggggwwww', 'wwwwwwwwwwww', 'wggggwwwwwww', 'wwwwwwwwwppw', 'wwwwwwwwwwww'],
  rainCloud: ['....ssss......', '..ssggggss.ss.', '.sggggggggggss', 'gggggggggggggg', '.dddddddddddd.'],
  smoke: ['.gg.', 'gssg', '.gg.'],
  sparkle: ['.Y.', 'YWY', '.Y.'],
  heart: ['p.p', 'ppp', '.p.'],
  butterflyA: ['pp.pp', 'ppkpp', '.p.p.'],
  butterflyB: ['..k..', '.pkp.', '.....'],
  miniHats: [
    ['..yy..', '.yyyyu'],
    ['..tt..', 'ttttt.'],
    ['.Y.Y.Y', 'YYYYYY'],
    ['..BB..', '.iiii.'],
  ],
  // Debugging: a bug that won't hold still, and a net.
  bugA: ['.HGH.', 'GGlGG', 'k.k.k'],
  bugB: ['.HGH.', 'GGlGG', '.k.k.'],
  net: ['..sss..', '.s.w.s.', 's.w.w.s', '.s.w.s.', '..sss..', '...n...', '...n...', '...n...', '...n...', '...n...', '...n...', '...n...'],
  // Linting: a spray bottle.
  spray: ['dd....', 'ddd...', '..s...', '.www..', '.wBw..', '.wBw..', '.wBw..', '.wBw..', '.www..'],
  // Branching: a watering can.
  can: ['..bbb....', '.bBBBb..b', '.bbbbbbbb', '.bbbbbb..', '.bbbbbb..'],
  // Querying: a database, LEDs blinking.
  database: [
    '.BBBBBBBB.',
    'BBWBBBBBBB',
    'bBBBBBBBBb',
    'bbbbbbbbbb',
    'bbGbbbbbbb',
    'iBBBBBBBBi',
    'bbbbbbbbbb',
    'bbYbbbbbbb',
    'iiiiiiiiii',
  ],
  // Serving: a rack of servers, and a bow tie for the host.
  rack: [
    'dddddddddd',
    'dggggggggd',
    'dg.g.gkkgd',
    'dggggggggd',
    'dg.g.gkkgd',
    'dggggggggd',
    'dg.g.gkkgd',
    'dggggggggd',
    'dg.g.gkkgd',
    'dggggggggd',
    'dg.g.gkkgd',
    'dggggggggd',
    'dddddddddd',
    '.d......d.',
    'dd......dd',
  ],
  bowtie: ['r..r', 'rRRr', 'r..r'],
  // Benchmarking: a stopwatch over a treadmill.
  stopwatch: ['..ss...', '...s...', '.wwwww.', 'wwwwwww', 'wwwwwww', 'wwwwwww', '.wwwww.'],
  // Designing: beret, easel, palette and brush.
  beret: ['....rr....', '.rrrrrrrr.', 'rrrrrrrrrr', '..RRRRRR..'],
  easel: [
    'ssssssssssssss',
    'sWWWWWWWWWWWWs',
    'sWWWWWWWWWWWWs',
    'sWWWWWWWWWWWWs',
    'sWWWWWWWWWWWWs',
    'sWWWWWWWWWWWWs',
    'sWWWWWWWWWWWWs',
    'sWWWWWWWWWWWWs',
    'sWWWWWWWWWWWWs',
    'ssssssssssssss',
    '...N......N...',
    '..N........N..',
    '..N........N..',
    '.N..........N.',
    '.N..........N.',
    'N............N',
  ],
  palette: ['..mmmm..', '.mrmYmm.', 'mmBmmGmm', '.mmpmmm.', '...mm...'],
  brush: ['...t', '..n.', '.n..', 'n...'],
  // Exploring: pith helmet and treasure map.
  helmet: ['....mmmmmm....', '...mmmmmmmm...', '..NNNNNNNNNN..', 'mmmmmmmmmmmmmm'],
  map: [
    'uYYYYYYYYYYYYYYu',
    'YYYrYYYYYYYYYGGY',
    'YYYYrYYYYYYYGGGY',
    'YBBYYrrYYYYYYGYY',
    'YBBYYYYrrYYYYYYY',
    'YYYYYYYYYrYYrYrY',
    'uYYYYYYYYYYYYrYu',
  ],
  // Mailing: paper planes.
  planeR: ['w....', 'ww...', 'wwwwW', 'ss...'],
  planeL: ['....w', '...ww', 'Wwwww', '...ss'],
  // Phoning: an iPhone.
  phone: ['kkkkkk', 'kKKKKk', 'kKKKKk', 'kKKKKk', 'kKKKKk', 'kKKKKk', 'kKKKKk', 'kKKKKk', 'kkskkk', 'kkkkkk'],
  // Seasons and play.
  pumpkin: ['...H...', '..oNo..', '.OoOoO.', 'OoOoOoO', 'OoOoOoO', '.OoOoO.'],
  lantern: ['...H...', '..oNo..', '.OYOYO.', 'OoOoOoO', 'OYYYYYO', '.OoOoO.'],
  ball: ['.rr.', 'rWrr', 'rrrr', '.rr.'],
} satisfies Record<string, Art | Art[]>

// A subagent's helper: Clawd at half size, one fine pixel per pixel.
export const MINI = ['..oooooooo..', '..okooooko..', 'oooooooooooo', 'oooooooooooo', '..oooooooo..', '..oooooooo..']
export const MINI_LEGS = [
  ['..o.o..o.o..', '..o.o..o.o..'],
  ['..o.o..o.o..', '....o....o..'],
]

// ── The face ───────────────────────────────────────────────────────────────

export type EyeKind =
  | 'open'
  | 'wide'
  | 'puppy'
  | 'happy'
  | 'closed'
  | 'sad'
  | 'dizzy'
  | 'squeeze'
  | 'star'
  | 'heart'
  | 'half'
export type Mouth = 'none' | 'smile' | 'grin' | 'o' | 'small' | 'flat' | 'frown' | 'wavy' | 'tongue' | 'yawn' | 'grit' | 'side'
export type Brows = 'none' | 'focus' | 'worried' | 'raised' | 'curious'
export type Wear = 'none' | 'glasses' | 'goggles' | 'shades'

export type Face = { eyes: EyeKind; mouth: Mouth; brows: Brows; blush: boolean; look: { dx: number; dy: number }; wear: Wear }

export const face = (eyes: EyeKind, mouth: Mouth = 'none', more: Partial<Face> = {}): Face => ({
  eyes,
  mouth,
  brows: 'none',
  blush: false,
  look: { dx: 0, dy: 0 },
  wear: 'none',
  ...more,
})

// ── Activities ─────────────────────────────────────────────────────────────

export type Move = 'wander' | 'pace' | 'still' | 'station' | 'scan' | 'carry' | 'surf' | 'sweep' | 'party' | 'stomp' | 'loaf' | 'tap' | 'chase' | 'treadmill'
export type ArmPose = 'out' | 'raise' | 'up' | 'down'
export type Arms = { front: ArmPose; back: ArmPose }

export type ActDef = {
  move: Move
  speed?: number
  isWorking?: boolean
  face: (sim: Sim) => Face
  arms?: (sim: Sim) => Arms
}

export const ARMS_OUT: Arms = { front: 'out', back: 'out' }
export const ARMS_UP: Arms = { front: 'raise', back: 'raise' }
export const typing = (sim: Sim): Arms =>
  Math.floor(sim.t * 8) % 2 ? { front: 'down', back: 'out' } : { front: 'out', back: 'down' }
export const glance = (sim: Sim, every = 1.3) => (Math.floor(sim.t / every) % 2 ? 1 : -1)
export const walkLook = (sim: Sim) => ({ dx: isWalking(sim) || !sim.isGrounded ? sim.dir : 0, dy: 0 })

export const ACTS: Record<Mood, ActDef> = {
  idle: { move: 'wander', speed: 7, face: idleFace, arms: idleArms },
  sleepy: {
    move: 'loaf',
    face: () => face('closed', 'small', { blush: true }),
  },
  listening: {
    move: 'still',
    face: s => (s.moodT < 0.45 ? face('wide', 'o', { look: { dx: 0, dy: -1 }, brows: 'raised' }) : face('happy', 'grin', { blush: true })),
    arms: s => (s.moodT > 0.45 ? ARMS_UP : ARMS_OUT),
  },
  thinking: {
    move: 'pace',
    speed: 10,
    face: s => face('open', 'side', { look: { dx: isWalking(s) ? s.dir : glance(s), dy: -1 } }),
  },
  pondering: {
    move: 'still',
    face: s => face('open', 'small', { look: { dx: glance(s, 2), dy: -1 }, brows: 'curious' }),
  },
  talking: {
    move: 'still',
    face: s => face('happy', Math.floor(s.t * 6) % 3 ? 'o' : 'small', { blush: true }),
    arms: s => (Math.floor(s.t * 1.5) % 2 ? { front: 'raise', back: 'out' } : ARMS_OUT),
  },
  reading: {
    move: 'still',
    isWorking: true,
    face: () => face('open', 'none', { look: { dx: 0, dy: 1 }, wear: 'glasses' }),
  },
  searching: {
    move: 'scan',
    speed: 6,
    isWorking: true,
    face: s => face('open', 'o', { look: { dx: s.dir, dy: 0 }, brows: 'curious' }),
  },
  writing: {
    move: 'station',
    speed: 16,
    isWorking: true,
    face: () => face('open', 'none', { brows: 'focus' }),
    arms: typing,
  },
  terminal: {
    move: 'station',
    speed: 16,
    isWorking: true,
    face: s => face('open', 'tongue', { look: { dx: s.dir, dy: 0 }, brows: 'focus' }),
    arms: typing,
  },
  testing: {
    move: 'still',
    isWorking: true,
    face: s => face('wide', 'wavy', { look: { dx: s.dir, dy: -1 }, wear: 'goggles' }),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  building: {
    move: 'station',
    speed: 16,
    isWorking: true,
    face: s => face('open', 'grit', { look: { dx: s.dir, dy: 1 }, brows: 'focus' }),
  },
  installing: {
    move: 'carry',
    speed: 16,
    isWorking: true,
    face: s => face('squeeze', 'grit', { look: walkLook(s) }),
    arms: () => ARMS_UP,
  },
  shipping: {
    move: 'station',
    speed: 16,
    isWorking: true,
    face: s => (rocketLift(s) > 0 ? face('star', 'grin', { blush: true }) : face('wide', 'o', { look: { dx: s.dir, dy: -1 } })),
    arms: s => (s.isArrived && rocketLift(s) > 0 ? ARMS_UP : ARMS_OUT),
  },
  committing: {
    move: 'still',
    face: s => (s.isPlanted ? face('happy', 'smile', { blush: true }) : face('open', 'small', { brows: 'focus' })),
    arms: s => (s.isPlanted ? ARMS_UP : { front: 'raise', back: 'out' }),
  },
  cleaning: {
    move: 'sweep',
    speed: 12,
    isWorking: true,
    face: () => face('closed', 'smile'),
    arms: () => ({ front: 'down', back: 'out' }),
  },
  planning: {
    move: 'still',
    face: s => face('open', 'tongue', { look: { dx: s.dir, dy: 1 } }),
    arms: () => ({ front: 'raise', back: 'raise' }),
  },
  asking: {
    move: 'still',
    face: () => face('open', 'o', { brows: 'curious' }),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  waiting: {
    move: 'tap',
    face: () => face('puppy', 'small', { brows: 'worried', blush: true }),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  timing: {
    move: 'still',
    face: s => face('half', 'flat', { look: { dx: s.dir, dy: 0 } }),
  },
  delegating: {
    move: 'still',
    face: s => face('open', Math.floor(s.t * 4) % 2 ? 'grin' : 'o', { brows: 'focus' }),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  surfing: {
    move: 'surf',
    speed: 14,
    isWorking: true,
    face: () => face('open', 'grin', { wear: 'shades' }),
    arms: s => (Math.floor(s.t * 1.2) % 2 ? { front: 'raise', back: 'out' } : ARMS_OUT),
  },
  plugging: {
    move: 'still',
    isWorking: true,
    face: s => face('wide', 'o', { look: { dx: s.dir, dy: 0 } }),
  },
  snapping: {
    move: 'still',
    face: s => (s.moodT % 1.6 < 0.4 ? face('closed', 'grin') : face('happy', 'grin', { blush: true })),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  casting: {
    move: 'still',
    face: () => face('star', 'smile', { blush: true }),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  compacting: {
    move: 'stomp',
    face: () => face('squeeze', 'grit'),
    arms: s => (s.isGrounded ? ARMS_OUT : ARMS_UP),
  },
  happy: {
    move: 'party',
    face: s => (Math.floor(s.t * 2) % 2 ? face('star', 'grin', { blush: true }) : face('happy', 'grin', { blush: true })),
    arms: () => ARMS_UP,
  },
  oops: {
    move: 'still',
    face: () => face('squeeze', 'wavy', { brows: 'worried' }),
  },
  debugging: {
    move: 'chase',
    speed: 15,
    isWorking: true,
    face: s => face('wide', 'o', { look: { dx: s.critter && s.critter.x > s.x + 12 ? 1 : -1, dy: 1 } }),
    arms: s => (Math.floor(s.t * 3) % 2 ? { front: 'up', back: 'out' } : { front: 'raise', back: 'out' }),
  },
  polishing: {
    move: 'scan',
    speed: 6,
    isWorking: true,
    face: () => face('happy', 'smile', { blush: true }),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  branching: {
    move: 'station',
    speed: 16,
    isWorking: true,
    face: s => face('open', 'smile', { look: { dx: s.dir, dy: 0 } }),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  querying: {
    move: 'station',
    speed: 16,
    isWorking: true,
    face: s => face('open', 'o', { look: { dx: s.dir, dy: 0 } }),
    arms: typing,
  },
  serving: {
    move: 'station',
    speed: 16,
    isWorking: true,
    face: () => face('happy', 'smile', { blush: true }),
    arms: s => (Math.floor(s.t * 1.2) % 3 === 0 ? { front: 'up', back: 'out' } : ARMS_OUT),
  },
  benchmarking: {
    move: 'treadmill',
    isWorking: true,
    face: s => face(s.moodT > 3 ? 'squeeze' : 'open', 'o', { look: { dx: s.dir, dy: 0 } }),
    arms: s => (Math.floor(s.t * 8) % 2 ? { front: 'raise', back: 'down' } : { front: 'down', back: 'raise' }),
  },
  designing: {
    move: 'station',
    speed: 16,
    isWorking: true,
    face: s => face('open', 'smile', { look: { dx: s.dir, dy: 0 } }),
    arms: s => (Math.floor(s.t * 4) % 2 ? { front: 'raise', back: 'out' } : { front: 'out', back: 'out' }),
  },
  exploring: {
    move: 'wander',
    speed: 9,
    isWorking: true,
    face: s => face('open', 'o', { look: { dx: isWalking(s) ? s.dir : glance(s), dy: 1 } }),
    arms: () => ({ front: 'raise', back: 'raise' }),
  },
  mailing: {
    move: 'still',
    face: () => face('happy', 'smile'),
    arms: s => (s.moodT % 1.1 < 0.25 ? { front: 'out', back: 'out' } : { front: 'up', back: 'out' }),
  },
  remembering: {
    move: 'still',
    face: () => face('happy', 'smile', { blush: true }),
  },
  phoning: {
    move: 'still',
    isWorking: true,
    face: s => face('open', 'none', { look: { dx: s.dir, dy: 1 } }),
    arms: () => ({ front: 'raise', back: 'out' }),
  },
  sad: {
    move: 'wander',
    speed: 3,
    face: () => face('sad', 'frown', { brows: 'worried', look: { dx: 0, dy: 1 } }),
    arms: () => ({ front: 'down', back: 'down' }),
  },
}

export const STATIONS: readonly Mood[] = ['writing', 'terminal', 'building', 'shipping', 'branching', 'querying', 'serving', 'designing']
export const FACES_SIDE: readonly Mood[] = ['compacting', 'testing', 'plugging', 'snapping', 'reading', 'planning', 'delegating', 'timing', 'mailing', 'phoning', 'remembering', 'benchmarking']

// ── Simulation ─────────────────────────────────────────────────────────────

export type Props = {
  mood: Mood
  label: string
  detail: string
  seq: number
  helpers: number
  tint: string
  hour: number
  isBig: boolean
  month: number
  day: number
  react: Reaction
}

export type Shown = { mood: Mood; label: string; detail: string; tint: string; isBig: boolean }

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  g: number
  life: number
  glyph?: string
  art?: Art
  isFloat?: boolean
  color: string
}

export type Mini = { x: number; dir: -1 | 1; targetX: number; stride: number; isLeaving: boolean; hat: number; tint: string }
export type Fidget = 'look' | 'wave' | 'stretch' | 'whistle' | 'sit' | 'dance' | 'juggle' | 'ball'
export type Critter = { x: number; vx: number; t: number }
export type Ball = { x: number; vx: number; y: number; vy: number }
export type Butterfly = { x: number; y: number; vx: number; t: number }

export type Sim = {
  props: Props
  seq: number
  reactSeq: number
  shown: Shown
  pending: Shown | null
  mood: Mood
  moodT: number
  t: number
  x: number
  y: number
  vx: number
  vy: number
  isGrounded: boolean
  dir: -1 | 1
  targetX: number
  pause: number
  stride: number
  squash: number
  flash: number
  blink: number
  nextBlink: number
  emit: number
  beat: number
  anchorX: number
  isArrived: boolean
  isPlanted: boolean
  variant: number
  fidget: Fidget | null
  fidgetT: number
  butterfly: Butterfly | null
  critter: Critter | null
  ball: Ball | null
  react: { kind: ReactKind | 'pet'; t: number } | null
  flags: { x: number; color: string }[]
  minis: Mini[]
  particles: Particle[]
  isHeld: boolean
  grabX: number
  grabY: number
  hasDragged: boolean
  prevX: number
  prevY: number
  isPlaced: boolean
}

export type State = { sim: Sim; frame: number }

export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix)
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

export const ROCKET_CYCLE = 3.6
export function rocketLift(sim: Sim) {
  const t = (sim.moodT % ROCKET_CYCLE) - 1.2
  return t <= 0 ? 0 : 30 * t * t
}

export const isNight = (sim: Sim) => sim.props.hour >= 21 || sim.props.hour < 6

// ── Layout ─────────────────────────────────────────────────────────────────

export type Layout = ReturnType<typeof layout>

export function layout(cols: number, rows: number) {
  const cellRows = Math.max(0, rows - CAPTION_ROWS)
  const pxH = cellRows * 2
  const scale = cols >= 100 && cellRows >= 26 ? 2 : 1
  const w = W0 * scale
  const h = H0 * scale
  const floorY = pxH - 1
  return { cols, cellRows, pxH, scale, w, h, floorY, groundY: floorY - h, maxX: Math.max(0, cols - w) }
}

// A point in fine pixels from Clawd's top-left as if he faced right, in the
// scene's columns and half-pixels; `w` is the prop's width, so a mirrored
// prop lands on his other side.
export function place(sim: Sim, L: Layout, rx: number, ry: number, w = 0) {
  const S = L.scale
  const x = sim.dir > 0 ? sim.x + rx * S : sim.x + (W0 - rx - w) * S
  return { x, y: sim.y + ry * S }
}

// Props are laid out on an 18 × 10 frame (hands at x 16, floor at y 10).
// Their centres stretch across his width; above his head they keep their
// height, on his body they stretch, and on the floor they stay on it.
const FRAME_W = 18
const FRAME_H = 10
export function anchor(sim: Sim, L: Layout, rx: number, ry: number, w = 0, h = 0) {
  const x = Math.round(((rx + w / 2) * W0) / FRAME_W - w / 2)
  const y = ry + h >= FRAME_H ? ry + (H0 - FRAME_H) : ry >= 0 ? Math.round((ry * H0) / FRAME_H) : ry
  return place(sim, L, x, y, w)
}

export const waveTop = (L: Layout, x: number, t: number) =>
  L.floorY - Math.round((4 + 1.6 * Math.sin(x * 0.2 - t * 3) + 0.9 * Math.sin(x * 0.07 + t)) * L.scale)

// ── Behaviour ──────────────────────────────────────────────────────────────

export type At = { x: number; y: number }

export function spray(sim: Sim, n: number, at: At, glyphs: readonly string[], colors: readonly string[], spread = 6, g = 0) {
  for (let i = 0; i < n; i++) {
    sim.particles.push({
      x: at.x + rand(-spread, spread),
      y: at.y + rand(-2, 2),
      vx: rand(-8, 8),
      vy: rand(-14, -4),
      g,
      life: rand(0.6, 1.3),
      glyph: pick(glyphs),
      color: pick(colors),
    })
  }
}

export function bits(sim: Sim, n: number, at: At, arts: readonly Art[], colors: readonly string[], speed = 14, g = 0, life = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2)
    const v = rand(speed * 0.4, speed)
    sim.particles.push({ x: at.x, y: at.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, g, life: rand(life * 0.6, life), art: pick(arts), color: pick(colors) })
  }
}

export function float(sim: Sim, at: At, text: string, color: string) {
  sim.particles.push({ x: at.x - text.length / 2, y: at.y, vx: 0, vy: -7, g: 0, life: 1.9, glyph: text, isFloat: true, color })
}

export function jump(sim: Sim, height: number, vx = 0) {
  sim.vy = -Math.sqrt(2 * GRAVITY * height)
  sim.vx = vx
  sim.isGrounded = false
}

export function enterMood(sim: Sim, next: Shown, L: Layout) {
  const mood = next.mood
  const head = { x: sim.x + L.w / 2, y: sim.y - 2 }
  sim.shown = next
  sim.mood = mood
  sim.moodT = 0
  sim.pause = 0
  sim.emit = 0
  sim.beat = -1
  sim.isArrived = false
  sim.isPlanted = false
  sim.anchorX = sim.x
  sim.variant = Math.floor(Math.random() * 1000)
  sim.fidget = null

  if (mood === 'oops') {
    sim.flash = 0.7
    bits(sim, 4, head, [ART.smoke], ['#8A8580'], 10, -8, 1.2)
  }
  if (mood === 'happy') {
    for (let i = 0; i < 36; i++) {
      sim.particles.push({
        x: rand(0, L.cols),
        y: rand(-6, 2),
        vx: rand(-5, 5),
        vy: rand(0, 6),
        g: 16,
        life: rand(2, 3.2),
        art: pick([['x'], ['xx'], ['x', 'x']]),
        color: pick(CONFETTI),
      })
    }
  }
  if (mood === 'installing') sim.targetX = sim.x < L.maxX / 2 ? L.maxX : 0
  if (STATIONS.includes(mood)) {
    const room = 18 * L.scale
    sim.targetX = rand(0, L.maxX)
    if (L.cols - (sim.targetX + L.w) < room && sim.targetX < room) sim.targetX = L.maxX / 2
  }
  if (FACES_SIDE.includes(mood)) sim.dir = sim.x + L.w / 2 < L.cols / 2 ? 1 : -1
  if (mood === 'debugging' && !sim.critter) {
    const fromLeft = sim.x > L.cols / 2
    sim.critter = { x: fromLeft ? 2 : L.cols - 8, vx: (fromLeft ? 1 : -1) * 10, t: 0 }
  }
}

export function react(sim: Sim, r: Reaction, L: Layout) {
  sim.react = { kind: r.kind, t: 0 }
  const S = L.scale
  const head = { x: sim.x + L.w / 2, y: sim.y - 4 * S }
  switch (r.kind) {
    case 'pass':
      float(sim, head, r.text, PAL.G)
      bits(sim, 8, head, [ART.sparkle, ['Y'], ['W']], ['#FFE38A'], 16, 6, 1.1)
      break
    case 'fail':
      float(sim, head, r.text, PAL.r)
      bits(sim, 5, head, [ART.smoke], ['#8A8580'], 8, -6, 1.3)
      sim.flash = Math.max(sim.flash, 0.4)
      break
    case 'edit':
      float(sim, { x: head.x - (r.extra ? 2 : 0), y: head.y }, r.text, PAL.G)
      if (r.extra) float(sim, { x: head.x + 3, y: head.y }, r.extra, PAL.r)
      bits(sim, 4, head, [['Y'], ['t']], [sim.shown.tint || PAL.y], 10, 4, 0.8)
      break
    case 'found':
      float(sim, head, r.text, PAL.Y)
      spray(sim, 1, { x: head.x, y: head.y - 4 }, ['!'], [PAL.Y], 0)
      break
    case 'none':
      float(sim, head, r.text, MUTED)
      break
    case 'hello':
      float(sim, head, r.text, PAL.p)
      bits(sim, 3, head, [ART.heart], [PAL.p], 8, -4, 1.4)
      break
    case 'denied':
      float(sim, head, r.text, MUTED)
      break
    case 'phew':
      float(sim, head, r.text, PAL.B)
      for (let i = 0; i < 3; i++) sim.particles.push({ ...place(sim, L, i % 2 ? 2 : 21, 1), vx: rand(-4, 4), vy: rand(-6, 0), g: 30, life: 0.9, art: ['B', 'B'], color: PAL.B })
      break
    case 'combo':
      float(sim, head, r.text, PAL.Y)
      bits(sim, 14, { x: head.x, y: sim.y + 6 * S }, [ART.sparkle, ['Y'], ['W']], ['#FFE38A'], 26, 0, 0.8)
      break
    case 'noted':
      float(sim, head, r.text, PAL.p)
      bits(sim, 4, head, [ART.heart], [PAL.p], 8, -6, 1.6)
      break
    case 'streak':
      float(sim, head, r.text, PAL.O)
      for (let i = 0; i < 18; i++) {
        sim.particles.push({ x: sim.x + rand(2, L.w - 2), y: sim.y + rand(6, 12) * S, vx: rand(-3, 3), vy: rand(-26, -10), g: 0, life: rand(0.5, 1.1), art: pick([['x'], ['x', 'x']]), color: pick([PAL.Y, PAL.O, PAL.r]) })
      }
      break
  }
}

export function chooseTarget(sim: Sim, L: Layout) {
  const { maxX } = L
  switch (ACTS[sim.mood].move) {
    case 'pace':
      sim.targetX = rand(maxX * 0.2, maxX * 0.8)
      sim.pause = rand(0.5, 1.2)
      break
    case 'scan':
      sim.targetX = clamp(sim.x + rand(-12, 12) * L.scale, 0, maxX)
      sim.pause = rand(0.8, 1.8)
      break
    case 'carry':
      sim.targetX = sim.targetX > maxX / 2 ? 0 : maxX
      sim.pause = 0.3
      break
    case 'sweep':
      sim.targetX = clamp(sim.anchorX + (sim.targetX > sim.anchorX ? -4 : 4) * L.scale, 0, maxX)
      sim.pause = 0.05
      break
    case 'surf':
      sim.targetX = rand(0, maxX)
      sim.pause = 0.1
      break
    default:
      sim.targetX = rand(0, maxX)
      sim.pause = sim.mood === 'sad' ? rand(2.5, 4) : rand(1, 3)
  }
}

export function isWalking(sim: Sim) {
  const move = ACTS[sim.mood].move
  const walks =
    (move === 'wander' && !sim.fidget) ||
    move === 'pace' ||
    move === 'scan' ||
    move === 'carry' ||
    move === 'sweep' ||
    move === 'chase' ||
    (move === 'station' && !sim.isArrived)
  return walks && sim.isGrounded && Math.abs(sim.targetX - sim.x) >= 0.6
}

// Idle isn't just standing around.
export const FIDGETS: readonly Fidget[] = ['look', 'wave', 'stretch', 'whistle', 'sit', 'dance', 'juggle', 'ball']

export function idleFace(sim: Sim): Face {
  const night = isNight(sim)
  if (sim.butterfly) {
    const dx = sim.butterfly.x > sim.x + 9 ? 1 : -1
    return face('wide', 'o', { look: { dx, dy: -1 }, blush: true })
  }
  switch (sim.fidget) {
    case 'juggle':
      return face('open', 'o', { look: { dx: 0, dy: -1 } })
    case 'ball':
      return face('happy', 'grin', { look: { dx: sim.ball && sim.ball.x > sim.x + 12 ? 1 : -1, dy: 1 } })
    case 'look':
      return face('open', 'smile', { blush: true })
    case 'wave':
      return face('happy', 'grin', { blush: true })
    case 'stretch':
      return face('closed', night || sim.fidgetT > 0.5 ? 'yawn' : 'o')
    case 'whistle':
      return face('closed', 'small')
    case 'sit':
      return face('open', 'smile', { look: { dx: glance(sim, 1.6), dy: 0 } })
    case 'dance':
      return face('happy', 'grin')
  }
  return face(night ? 'half' : 'open', 'none', { look: walkLook(sim) })
}

export function idleArms(sim: Sim): Arms {
  switch (sim.fidget) {
    case 'juggle':
      return Math.floor(sim.t * 6) % 2 ? { front: 'raise', back: 'out' } : { front: 'out', back: 'raise' }
    case 'wave':
      return { front: Math.floor(sim.t * 5) % 2 ? 'up' : 'out', back: 'out' }
    case 'stretch':
      return ARMS_UP
    case 'dance':
      return Math.floor(sim.t * 3) % 2 ? { front: 'up', back: 'down' } : { front: 'down', back: 'up' }
    case 'sit':
      return { front: 'down', back: 'down' }
  }
  return ARMS_OUT
}

export function stepIdle(sim: Sim, L: Layout) {
  const S = L.scale
  if (sim.fidget) {
    sim.fidgetT += DT
    if (sim.fidget === 'dance' && sim.isGrounded && Math.floor(sim.fidgetT * 3) !== Math.floor((sim.fidgetT - DT) * 3)) {
      jump(sim, 2 * S)
      sim.dir = (sim.dir * -1) as -1 | 1
    }
    if (sim.fidget === 'whistle' && Math.random() < 0.06) {
      sim.particles.push({ ...anchor(sim, L, 14, 2), vx: sim.dir * 6, vy: -8, g: 0, life: 1.4, glyph: pick(['♪', '♫']), color: PAL.v })
    }
    if (sim.fidget === 'ball' && !sim.ball && sim.fidgetT < DT * 1.5) {
      const fromLeft = sim.x > L.cols / 2
      sim.ball = { x: fromLeft ? -4 : L.cols, vx: (fromLeft ? 1 : -1) * 26, y: 0, vy: 0 }
    }
    if (sim.fidgetT > (sim.fidget === 'sit' ? 5 : sim.fidget === 'juggle' || sim.fidget === 'ball' ? 3.5 : 2.2)) {
      sim.fidget = null
      chooseTarget(sim, L)
    }
    return
  }
  const dx = sim.targetX - sim.x
  if (Math.abs(dx) < 0.6) {
    sim.pause -= DT
    if (sim.pause > 0) return
    const roll = Math.random()
    if (roll < 0.45) chooseTarget(sim, L)
    else if (roll < 0.55 && !sim.butterfly) {
      const fromLeft = Math.random() < 0.5
      sim.butterfly = { x: fromLeft ? -4 : L.cols + 2, y: L.groundY - 6 * S, vx: (fromLeft ? 1 : -1) * 7 * S, t: 0 }
    } else {
      sim.fidget = pick(FIDGETS)
      sim.fidgetT = 0
    }
    return
  }
  sim.dir = dx < 0 ? -1 : 1
  const move = Math.min(Math.abs(dx), (sim.butterfly ? 12 : 7) * S * DT)
  sim.x += sim.dir * move
  sim.stride += move
}

// The bug runs from Clawd; the ball rolls, gets kicked, and rolls away.
export function stepPlay(sim: Sim, L: Layout) {
  const S = L.scale
  const mid = sim.x + L.w / 2
  const c = sim.critter
  if (c) {
    c.t += DT
    if (Math.abs(c.x + 2 - mid) < 16 * S) c.vx = Math.sign(c.x + 2 - mid || 1) * 24
    else if (Math.random() < 0.03) c.vx = rand(-12, 12)
    c.x += c.vx * DT
    if (c.x < 0 || c.x > L.cols - 5) {
      c.x = clamp(c.x, 0, L.cols - 5)
      c.vx *= -1
    }
    if (sim.mood !== 'debugging') sim.critter = null
  }
  const b = sim.ball
  if (b) {
    b.x += b.vx * DT
    b.vy += 120 * DT
    b.y = Math.min(0, b.y + b.vy * DT)
    if (b.y === 0) b.vy = 0
    b.vx *= 0.995
    const isNear = Math.abs(b.x + 2 - mid) < 12 * S && b.y === 0
    if (isNear && Math.sign(b.vx) === Math.sign(mid - b.x - 2)) {
      b.vx = -b.vx * 1.3
      b.vy = -40
      sim.dir = b.vx > 0 ? -1 : 1
      bits(sim, 3, { x: b.x + 2, y: L.floorY - 2 }, [['s']], [MUTED], 8, 20, 0.4)
    }
    if (b.x < -10 || b.x > L.cols + 6) sim.ball = null
  }
}

export function stepButterfly(sim: Sim, L: Layout) {
  const b = sim.butterfly
  if (!b) return
  b.t += DT
  b.x += b.vx * DT
  b.y = L.groundY - 8 * L.scale + Math.sin(b.t * 3) * 4 * L.scale - b.t * 0.6
  if (sim.mood === 'idle' && !sim.fidget) sim.targetX = clamp(b.x - L.w / 2, 0, L.maxX)
  if (b.x < -8 || b.x > L.cols + 4) sim.butterfly = null
}

export function stepMinis(sim: Sim, L: Layout) {
  const want = sim.props.helpers ?? 0
  const staying = sim.minis.filter(m => !m.isLeaving)
  if (staying.length < want) {
    const fromLeft = Math.random() < 0.5
    sim.minis.push({
      x: fromLeft ? -10 : L.cols,
      dir: fromLeft ? 1 : -1,
      targetX: rand(0, L.cols - 10),
      stride: 0,
      isLeaving: false,
      hat: Math.floor(Math.random() * ART.miniHats.length),
      tint: pick(CONFETTI),
    })
  } else if (staying.length > want) {
    const m = staying[0]
    m.isLeaving = true
    m.targetX = m.x < L.cols / 2 ? -12 : L.cols + 2
  }
  for (const m of sim.minis) {
    const dx = m.targetX - m.x
    if (Math.abs(dx) < 0.6) {
      if (!m.isLeaving && Math.random() < 0.04) m.targetX = rand(0, L.cols - 10)
      continue
    }
    m.dir = dx < 0 ? -1 : 1
    const move = Math.min(Math.abs(dx), 24 * L.scale * DT)
    m.x += m.dir * move
    m.stride += move
  }
  sim.minis = sim.minis.filter(m => !(m.isLeaving && (m.x < -11 || m.x > L.cols + 1)))
}

export function emit(sim: Sim, L: Layout) {
  const S = L.scale
  const tint = sim.shown.tint || PAL.y
  sim.emit = 0.5

  switch (sim.mood) {
    case 'sleepy':
      sim.particles.push({ ...anchor(sim, L, 15, 0), vx: 5, vy: -5, g: 0, life: 2.2, glyph: pick(['z', 'Z']), color: PAL.v })
      sim.emit = 1.1
      break
    case 'writing':
      if (sim.isArrived) spray(sim, 1, anchor(sim, L, 9, 3), ['{', '}', ';', '<', '>', '/', '=', '(', ')'], [tint, shade(tint, 0.4), MUTED], 7)
      sim.emit = 0.2
      break
    case 'terminal':
      if (sim.isArrived && Math.random() < 0.3) spray(sim, 1, anchor(sim, L, 27, -2), ['$', '>', '_'], [PAL.G], 2)
      sim.emit = 0.3
      break
    case 'reading':
      if (Math.random() < 0.3) spray(sim, 1, anchor(sim, L, 24, -3), ['·'], [PAL.Y], 2)
      sim.emit = 0.6
      break
    case 'testing':
      bits(sim, 1, anchor(sim, L, 20, -3), [['J'], ['J', 'J']], [shade(LIQUIDS[sim.variant % LIQUIDS.length], 0.3)], 3, -10, 1)
      sim.emit = 0.2
      break
    case 'shipping': {
      if (!sim.isArrived) break
      const lift = rocketLift(sim)
      const at = anchor(sim, L, 24, 10 - lift / S)
      if (lift > 0) {
        sim.particles.push({ x: at.x + rand(-1, 1), y: at.y, vx: rand(-3, 3), vy: rand(4, 12), g: 0, life: 0.5, art: pick([['x'], ['xx']]), color: pick([PAL.Y, PAL.O, PAL.r]) })
      } else {
        bits(sim, 1, at, [ART.smoke], ['#B9A898'], 6, -4, 0.8)
      }
      sim.emit = 0.06
      break
    }
    case 'cleaning':
      bits(sim, 1, anchor(sim, L, 18, 9), [['s'], ['g']], [MUTED], 8, 6, 0.6)
      if (Math.random() < 0.15) spray(sim, 1, anchor(sim, L, 8, -2), ['♪'], [PAL.v], 2)
      sim.emit = 0.12
      break
    case 'installing':
      if (sim.isGrounded) bits(sim, 1, { x: sim.dir > 0 ? sim.x : sim.x + L.w, y: L.floorY - 1 }, [['s']], [MUTED], 5, 0, 0.4)
      sim.emit = 0.12
      break
    case 'surfing':
      bits(sim, 2, anchor(sim, L, -4, 11), [['W'], ['C'], ['B']], [PAL.W], 12, 22, 0.6)
      sim.emit = 0.1
      break
    case 'casting':
      bits(sim, 1, anchor(sim, L, 22, -1), [ART.sparkle, ['Y'], ['v']], ['#C2B0EE'], 10, 0, 1.1)
      sim.emit = 0.15
      break
    case 'plugging':
      if (Math.random() < 0.6) bits(sim, 2, anchor(sim, L, 20, 2), [['Y'], ['c'], ['W']], ['#FFE38A'], 10, 0, 0.3)
      sim.emit = 0.35
      break
    case 'delegating':
      sim.particles.push({ ...anchor(sim, L, 25, 2), vx: sim.dir * 14, vy: 0, g: 0, life: 0.7, glyph: sim.dir > 0 ? ')' : '(', color: PAL.y })
      sim.emit = 0.3
      break
    case 'oops':
      bits(sim, 1, anchor(sim, L, 9, -1), [ART.smoke], ['#8A8580'], 5, -6, 1)
      sim.emit = 0.3
      break
    case 'debugging':
      if (Math.random() < 0.25) spray(sim, 1, place(sim, L, 12, -3), ['?', '!'], [PAL.l, PAL.Y], 4)
      sim.emit = 0.5
      break
    case 'polishing':
      bits(sim, 2, place(sim, L, 27, -2), [['C'], ['W']], ['#BDEFF0'], 14, 6, 0.5)
      if (Math.random() < 0.5) bits(sim, 1, { x: sim.x + rand(0, L.w), y: sim.y + rand(0, 12) * S }, [ART.sparkle], ['#FFFFFF'], 2, 0, 0.5)
      sim.emit = 0.12
      break
    case 'branching':
      if (sim.isArrived) sim.particles.push({ ...place(sim, L, 31, 2), vx: sim.dir * 6, vy: 4, g: 60, life: 0.5, art: ['B'], color: PAL.B })
      sim.emit = 0.08
      break
    case 'querying':
      if (sim.isArrived) sim.particles.push({ ...place(sim, L, 27, rand(2, 8)), vx: -sim.dir * 26, vy: 0, g: 0, life: 0.35, art: ['ww'], color: PAL.w })
      sim.emit = 0.18
      break
    case 'serving':
      if (sim.isArrived && Math.random() < 0.4) spray(sim, 1, place(sim, L, 32, -1), [')'], [PAL.G, PAL.c], 1)
      sim.emit = 0.4
      break
    case 'benchmarking':
      sim.particles.push({ ...place(sim, L, -2, rand(2, 12)), vx: -sim.dir * 40, vy: 0, g: 0, life: 0.25, art: ['www'], color: PAL.w })
      sim.emit = 0.1
      break
    case 'designing':
      if (sim.isArrived && Math.random() < 0.3) bits(sim, 1, place(sim, L, 27, 6), [['x'], ['x', 'x']], [pick(CONFETTI)], 8, 30, 0.6)
      sim.emit = 0.3
      break
    case 'exploring':
      if (isWalking(sim)) sim.particles.push({ x: sim.x + L.w / 2, y: L.floorY - 1, vx: 0, vy: 0, g: 0, life: 2.5, art: ['dd'], color: PAL.d })
      sim.emit = 0.35
      break
    case 'mailing':
      if (sim.moodT % 1.1 < 0.15) {
        const at = place(sim, L, 22, 0)
        sim.particles.push({ x: at.x, y: at.y, vx: sim.dir * 30, vy: -10, g: 8, life: 2.4, art: sim.dir > 0 ? ART.planeR : ART.planeL, color: PAL.w })
      }
      sim.emit = 0.15
      break
    case 'remembering':
      bits(sim, 1, place(sim, L, 12, -2), [ART.heart, ['p']], [PAL.p], 6, -6, 1.2)
      sim.emit = 0.6
      break
    case 'phoning':
      if (Math.random() < 0.3) spray(sim, 1, place(sim, L, 20, -3), ['·'], [PAL.c], 2)
      sim.emit = 0.4
      break
    case 'sad': {
      const at = anchor(sim, L, 2, -6, 14)
      sim.particles.push({ x: at.x + rand(0, 14 * S), y: at.y, vx: 0, vy: 30, g: 0, life: 0.45, art: ['B', 'B'], color: PAL.B })
      if (Math.random() < 0.1) sim.particles.push({ ...anchor(sim, L, 5, 3), vx: 0, vy: 2, g: 30, life: 0.6, art: ['B'], color: PAL.B })
      sim.emit = 0.12
      break
    }
    case 'happy':
      if (sim.shown.isBig && Math.random() < 0.5) {
        const at = { x: rand(4, L.cols - 4), y: rand(4, L.pxH * 0.4) }
        bits(sim, 14, at, [['x'], ['x']], [pick(CONFETTI)], 22, 10, 0.9)
      }
      sim.emit = 0.45
      break
  }

  // Autumn leaves in October, snow in December.
  if (sim.mood === 'idle' || sim.mood === 'sleepy') {
    if (sim.props.month === 9 && Math.random() < 0.3) {
      sim.particles.push({ x: rand(0, L.cols), y: -2, vx: rand(-4, 4), vy: rand(4, 8), g: 0, life: 4, art: pick([['x'], ['xx']]), color: pick([PAL.O, PAL.r, PAL.y, PAL.N]) })
    }
    if (sim.props.month === 11) {
      sim.particles.push({ x: rand(0, L.cols), y: -2, vx: rand(-2, 2), vy: rand(5, 9), g: 0, life: 6, art: ['W'], color: PAL.W })
    }
  }
  if (sim.mood === 'idle' && sim.fidget === null && Math.random() < 0.08) {
    spray(sim, 1, anchor(sim, L, 9, -3), ['·'], [PAL.Y], 8)
  }

  // Long jobs make anyone sweat.
  if (ACTS[sim.mood].isWorking && sim.moodT > 15 && Math.random() < 0.2) {
    sim.particles.push({ ...anchor(sim, L, 2, 1), vx: -3, vy: 2, g: 24, life: 0.8, art: ['B', 'B'], color: PAL.B })
  }
}

export function step(sim: Sim, L: Layout, dt = TICK / 1000) {
  DT = dt
  sim.t += DT
  sim.moodT += DT
  sim.squash = Math.max(0, sim.squash - DT)
  sim.flash = Math.max(0, sim.flash - DT)
  sim.emit -= DT
  if (sim.react) {
    sim.react.t += DT
    if (sim.react.t > 1.9) sim.react = null
  }

  if (!sim.isPlaced) {
    sim.x = L.maxX / 2
    sim.y = L.groundY
    sim.targetX = sim.x
    sim.isPlaced = true
  }

  const p = sim.props
  if (p.seq !== sim.seq) {
    sim.seq = p.seq
    sim.pending = { mood: p.mood, label: p.label, detail: p.detail, tint: p.tint, isBig: p.isBig }
  }
  // Hold each job long enough to see; urgent states cut in.
  if (sim.pending) {
    const dwell = ACTS[sim.mood].isWorking ? 1.4 : 0.5
    const isUrgent = ['oops', 'waiting', 'asking', 'listening'].includes(sim.pending.mood)
    if (sim.moodT >= dwell || isUrgent) {
      enterMood(sim, sim.pending, L)
      sim.pending = null
    }
  }
  if (p.react && p.react.seq !== sim.reactSeq) {
    sim.reactSeq = p.react.seq
    if (p.react.text) react(sim, p.react, L)
  }

  sim.blink = Math.max(0, sim.blink - DT)
  if (sim.t > sim.nextBlink) {
    sim.blink = 0.14
    sim.nextBlink = sim.t + rand(2, 5)
  }

  const S = L.scale
  const act = ACTS[sim.mood]

  if (sim.isHeld) {
    sim.vx = (sim.x - sim.prevX) / DT
    sim.vy = (sim.y - sim.prevY) / DT
    sim.prevX = sim.x
    sim.prevY = sim.y
  } else if (!sim.isGrounded) {
    sim.vy += GRAVITY * DT
    sim.x += sim.vx * DT
    sim.y += sim.vy * DT
    if (sim.x < 0 || sim.x > L.maxX) {
      sim.x = clamp(sim.x, 0, L.maxX)
      sim.vx *= -0.5
    }
    if (sim.y < -L.h) sim.y = -L.h
    if (sim.y >= L.groundY) {
      sim.y = L.groundY
      const impact = sim.vy
      if (impact > 90) {
        sim.vy = -impact * 0.35
        sim.vx *= 0.6
        bits(sim, 4, { x: sim.x + L.w / 2, y: L.floorY - 1 }, [['s'], ['g']], [MUTED], 12, 20, 0.5)
      } else {
        sim.vy = 0
        sim.vx = 0
        sim.isGrounded = true
        if (act.move === 'stomp') bits(sim, 4, anchor(sim, L, 26, 4), [['w'], ['s']], [PAL.w], 12, 16, 0.7)
      }
      sim.squash = 0.12
    }
  } else {
    switch (act.move) {
      case 'party':
        if (sim.moodT > 0.2) {
          jump(sim, rand(5, 8) * S, rand(-10, 10))
          bits(sim, 3, { x: sim.x + L.w / 2, y: sim.y }, [ART.sparkle, ['Y']], ['#FFE38A'], 12, 0, 0.8)
        }
        break
      case 'stomp':
        sim.pause -= DT
        if (sim.pause <= 0) {
          jump(sim, 2.5 * S)
          sim.pause = 0.7
        }
        break
      case 'surf': {
        const dx = sim.targetX - sim.x
        if (Math.abs(dx) < 0.6) chooseTarget(sim, L)
        else {
          sim.dir = dx < 0 ? -1 : 1
          sim.x += sim.dir * Math.min(Math.abs(dx), (act.speed ?? 10) * S * DT)
        }
        sim.y = waveTop(L, sim.x + L.w / 2, sim.t) - 3 * S - L.h
        break
      }
      case 'still':
      case 'tap':
      case 'loaf':
        sim.y = L.groundY
        break
      case 'treadmill':
        sim.y = L.groundY - 3 * S
        sim.stride += 22 * S * DT
        break
      case 'chase': {
        sim.y = L.groundY
        const c = sim.critter
        if (c) sim.targetX = clamp(c.x + 2 - L.w / 2, 0, L.maxX)
        defaultWalk(sim, L)
        break
      }
      case 'wander':
        sim.y = L.groundY
        if (sim.mood === 'idle') stepIdle(sim, L)
        else defaultWalk(sim, L)
        break
      default:
        sim.y = L.groundY
        defaultWalk(sim, L)
    }
  }

  // Beats: the hammer strikes, the camera flashes, the countdown, the flag.
  if (sim.mood === 'building' && sim.isArrived) {
    const beat = Math.floor(sim.moodT / 0.35)
    if (beat !== sim.beat && beat % 2 === 1) bits(sim, 6, anchor(sim, L, 27, 2), [['Y'], ['O'], ['W']], ['#FFE38A'], 22, 30, 0.5)
    sim.beat = beat
  }
  if (sim.mood === 'snapping') {
    const beat = Math.floor(sim.moodT / 1.6)
    if (beat !== sim.beat) {
      bits(sim, 6, anchor(sim, L, 25, 0), [ART.sparkle, ['W']], ['#FFFFFF'], 14, 0, 0.5)
      sim.particles.push({ ...anchor(sim, L, 18, 5), vx: sim.dir * rand(4, 10), vy: -18, g: 50, life: 1.6, art: ART.photo, color: PAL.w })
    }
    sim.beat = beat
  }
  if (sim.mood === 'shipping' && sim.isArrived) {
    const c = sim.moodT % ROCKET_CYCLE
    const beat = c < 1.2 ? Math.floor(c / 0.4) : 3
    if (beat !== sim.beat) float(sim, anchor(sim, L, 24, -4), ['3', '2', '1', 'liftoff!'][beat], beat === 3 ? PAL.Y : PAL.w)
    sim.beat = beat
  }
  if (sim.mood === 'committing' && !sim.isPlanted && sim.moodT > 0.9) {
    sim.isPlanted = true
    const at = anchor(sim, L, 20, 0, 7)
    sim.flags = [...sim.flags.filter(f => Math.abs(f.x - at.x) > 5), { x: Math.round(at.x), color: FLAG_COLORS[sim.flags.length % FLAG_COLORS.length] }].slice(-10)
    bits(sim, 8, { x: at.x + 3, y: L.floorY - 10 * S }, [ART.sparkle, ['Y']], ['#FFE38A'], 14, 0, 0.9)
  }

  if (sim.emit <= 0) emit(sim, L)
  stepMinis(sim, L)
  stepButterfly(sim, L)
  stepPlay(sim, L)

  sim.particles = sim.particles
    .map(q => ({ ...q, x: q.x + q.vx * DT, y: q.y + q.vy * DT, vy: q.vy + q.g * DT, life: q.life - DT }))
    .filter(q => q.life > 0 && q.y > -12 && q.y < L.pxH + 2)
    .slice(-140)
}

export function defaultWalk(sim: Sim, L: Layout) {
  const act = ACTS[sim.mood]
  if (act.move === 'station' && sim.isArrived) return
  const dx = sim.targetX - sim.x
  if (Math.abs(dx) < 0.6) {
    if (act.move === 'station') {
      sim.isArrived = true
      sim.dir = sim.x + L.w / 2 < L.cols / 2 ? 1 : -1
      return
    }
    sim.pause -= DT
    if (sim.pause <= 0) chooseTarget(sim, L)
    return
  }
  sim.dir = dx < 0 ? -1 : 1
  const move = Math.min(Math.abs(dx), (act.speed ?? 8) * L.scale * DT)
  sim.x += sim.dir * move
  sim.stride += move
}

// ── Drawing ────────────────────────────────────────────────────────────────

export type Put = (x: number, y: number, c: string) => void
export type Stamp = (cx: number, cy: number, ch: string, fg: string, bg?: string) => void

export type Pen = {
  sim: Sim
  L: Layout
  put: Put
  stamp: Stamp
  dot: (x: number, y: number, c: string) => void
  blit: (art: Art, x: number, y: number, mirror?: boolean, colors?: Record<string, string>) => void
  held: (art: Art, rx: number, ry: number, colors?: Record<string, string>) => At
  wear: (art: Art, rx: number, ry: number, colors?: Record<string, string>) => At
}

export function makePen(sim: Sim, L: Layout, put: Put, stamp: Stamp): Pen {
  const S = L.scale
  const tint = sim.shown.tint || BODY
  const liquid = LIQUIDS[sim.variant % LIQUIDS.length]
  const base: Record<string, string> = { ...PAL, t: tint, T: shade(tint, -0.35), L: shade(tint, 0.4), j: liquid, J: shade(liquid, 0.4) }
  // One fine pixel: S columns by S half-pixels.
  const dot = (x: number, y: number, c: string) => {
    for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) put(Math.round(x) + a, Math.round(y) + b, c)
  }
  const blit = (art: Art, x: number, y: number, mirror = false, colors?: Record<string, string>) => {
    const w = Math.max(...art.map(r => r.length))
    art.forEach((row, j) => {
      const padded = row.padEnd(w, '.')
      for (let i = 0; i < w; i++) {
        const ch = mirror ? padded[w - 1 - i] : padded[i]
        if (ch === '.') continue
        dot(x + i * S, y + j * S, colors?.[ch] ?? base[ch] ?? ch)
      }
    })
  }
  const held = (art: Art, rx: number, ry: number, colors?: Record<string, string>) => {
    const w = Math.max(...art.map(r => r.length))
    const at = anchor(sim, L, rx, ry, w, art.length)
    blit(art, at.x, at.y, sim.dir < 0, colors)
    return at
  }
  const wear = (art: Art, rx: number, ry: number, colors?: Record<string, string>) => {
    const w = Math.max(...art.map(r => r.length))
    const at = place(sim, L, rx, ry, w)
    blit(art, at.x, at.y, sim.dir < 0, colors)
    return at
  }
  return { sim, L, put, stamp, dot, blit, held, wear }
}

export function drawSky(pen: Pen) {
  const { sim, L, put } = pen
  const S = L.scale
  const night = (isNight(sim) && sim.mood === 'idle') || sim.mood === 'sleepy'

  if (night) {
    for (let k = 0; k < 26; k++) {
      const x = Math.floor(hash(k) * L.cols)
      const y = Math.floor(hash(k + 50) * L.pxH * 0.55)
      const on = Math.sin(sim.t * (1 + hash(k + 9) * 2) + k) > -0.2
      if (on) put(x, y, hash(k + 3) > 0.7 ? PAL.Y : PAL.w)
    }
    pen.blit(ART.moon, L.cols - 10 * S, 2 * S)
  }
  if (sim.mood === 'surfing') {
    const pulse = Math.floor(sim.t * 2) % 2
    pen.blit(pulse ? ART.sun : ART.sun.map(r => r.replace(/^(\.*)Y/, '$1.').replace(/Y(\.*)$/, '.$1')), L.cols - 12 * S, 1 * S)
    for (let k = 0; k < 2; k++) {
      const x = ((sim.t * (3 + k * 2) + k * 37) % (L.cols + 12)) - 10
      pen.blit(ART.cloudPuff, x, (3 + k * 5) * S)
    }
    const gx = L.cols - ((sim.t * 9) % (L.cols + 10))
    pen.blit(Math.floor(sim.t * 4) % 2 ? ART.gullA : ART.gullB, gx, 10 * S)
  }
}

export function drawGround(pen: Pen) {
  const { sim, L, put } = pen
  const S = L.scale

  if (sim.mood === 'surfing') {
    for (let x = 0; x < L.cols; x++) {
      const top = waveTop(L, x, sim.t)
      const isCrest = Math.sin(x * 0.2 - sim.t * 3) > 0.9
      for (let y = top; y <= L.floorY; y++) {
        const depth = y - top
        const c = depth === 0 ? (isCrest ? PAL.W : PAL.C) : depth === 1 ? PAL.B : depth < 4 ? PAL.b : PAL.i
        put(x, y, c)
      }
      if (hash(x + Math.floor(sim.t * 3)) > 0.97) put(x, top + 2, PAL.W)
    }
    return
  }

  const night = (isNight(sim) && sim.mood === 'idle') || sim.mood === 'sleepy'
  for (let x = 0; x < L.cols; x++) {
    put(x, L.floorY, night ? '#2E3550' : FLOOR)
    const h = hash(x)
    if (h > 0.93) put(x, L.floorY - 1, night ? '#2F5A3A' : PAL.H)
    if (h > 0.975) put(x, L.floorY - 2, night ? '#3F7A4A' : PAL.l)
    if (h < 0.025) put(x, L.floorY - 1, PAL.g)
  }

  if (sim.mood === 'sad') {
    const w = Math.min(24 * S, Math.floor(sim.moodT * 4 * S))
    const cx = Math.round(sim.x + L.w / 2)
    for (let x = cx - Math.floor(w / 2); x < cx + Math.ceil(w / 2); x++) put(x, L.floorY, (x + Math.floor(sim.t * 4)) % 5 ? PAL.b : PAL.B)
  }
  if (sim.mood === 'casting') {
    const cx = sim.x + L.w / 2
    const rx = 15 * S
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2 + sim.t * 1.5
      const x = Math.round(cx + Math.cos(a) * rx)
      const y = Math.round(L.floorY - 1 + Math.sin(a) * 1.5 * S)
      put(x, y, k % 3 === 0 ? PAL.Y : k % 2 ? PAL.P : PAL.v)
    }
  }
  if (sim.mood === 'searching') {
    for (let k = 0; k < 3; k++) {
      const x = Math.floor(hash(sim.variant + k) * (L.cols - 6))
      pen.blit(k === 1 ? ART.paperTint : ART.paper, x, L.floorY - 5 * S)
    }
  }
  if (sim.mood === 'cleaning') {
    for (let k = 0; k < 4; k++) {
      const x = Math.floor(hash(sim.variant + k * 7) * (L.cols - 4))
      const swept = Math.abs(x - (sim.x + L.w / 2)) < 10 * S && sim.moodT > 1
      if (!swept) pen.blit(ART.dust, x, L.floorY - 2 * S)
    }
  }

  if (sim.props.month === 9 && sim.mood !== 'surfing') {
    const x = 1
    pen.blit(sim.props.day === 31 ? ART.lantern : ART.pumpkin, x, L.floorY - 6 * S)
  }
  for (const f of sim.flags) {
    pen.blit(Math.floor(sim.t * 2 + f.x) % 2 ? ART.flagA : ART.flagB, f.x, L.floorY - 10 * S, false, { t: f.color, L: shade(f.color, 0.4) })
  }

  if (sim.mood === 'plugging' && !sim.isHeld) {
    const plug = anchor(sim, L, 17, 2, 6)
    const wallX = sim.dir > 0 ? L.cols - 4 * S : 0
    pen.blit(ART.socket, wallX, L.floorY - 7 * S)
    const cx = Math.round(plug.x + 2 * S)
    for (let y = Math.round(plug.y + 5 * S); y < L.floorY; y++) put(cx, y, PAL.d)
    const socketX = sim.dir > 0 ? wallX : wallX + 4 * S
    for (let x = Math.min(cx, socketX); x <= Math.max(cx, socketX); x++) put(x, L.floorY - 1, PAL.d)
    // Current runs along the cable.
    const run = Math.floor(sim.t * 20) % Math.max(1, Math.abs(socketX - cx))
    put(Math.min(cx, socketX) + run, L.floorY - 1, PAL.Y)
  }
}

// Gear standing beside Clawd, behind him.
export function drawBehind(pen: Pen) {
  const { sim, L } = pen
  const S = L.scale
  if (sim.isHeld) return
  const mirror = sim.dir < 0
  const dot = (at: At, x: number, y: number, w: number, c: string) => pen.dot(mirror ? at.x + (w - 1 - x) * S : at.x + x * S, at.y + y * S, c)

  if (sim.mood === 'branching' && sim.isArrived) {
    // A tree grows, branch by branch.
    const g = clamp(sim.moodT / 3, 0, 1)
    const base = place(sim, L, 34, 16, 2)
    const h = Math.round(4 + 10 * g)
    for (let y = 1; y <= h; y++) for (let i = 0; i < 2; i++) pen.dot(base.x + i * S, base.y - y * S, PAL.N)
    const branches: [number, number][] = [
      [5, -1],
      [8, 1],
      [11, -1],
    ]
    for (const [at, side] of branches) {
      if (h < at) continue
      const len = Math.min(5, h - at + 1)
      for (let i = 1; i <= len; i++) pen.dot(base.x + (side > 0 ? 1 + i : -i) * S, base.y - (at + Math.floor(i / 2)) * S, PAL.N)
      const tipX = base.x + (side > 0 ? 1 + len : -len) * S
      const tipY = base.y - (at + Math.floor(len / 2)) * S
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 0], [-1, -1], [1, -1], [0, -2]]) pen.dot(tipX + dx * S, tipY + dy * S, (dx + dy) % 2 ? PAL.G : PAL.l)
    }
    if (h >= 12) for (const [dx, dy] of [[0, 0], [1, 0], [-1, -1], [0, -1], [1, -1], [2, -1], [0, -2], [1, -2]]) pen.dot(base.x + dx * S, base.y - (h + 1 - dy) * S, (dx + dy) % 2 ? PAL.G : PAL.l)
  }
  if (sim.mood === 'querying' && sim.isArrived) {
    const at = pen.wear(ART.database, 27, 7)
    const blink = Math.floor(sim.t * 6)
    dot(at, 2, 4, 10, blink % 2 ? PAL.G : PAL.H)
    dot(at, 2, 7, 10, blink % 3 ? PAL.Y : PAL.u)
  }
  if (sim.mood === 'serving' && sim.isArrived) {
    const at = pen.wear(ART.rack, 27, 1)
    for (let u = 0; u < 5; u++) {
      dot(at, 2, 2 + 2 * u, 10, hash(u + Math.floor(sim.t * 5)) > 0.4 ? PAL.G : PAL.H)
      dot(at, 4, 2 + 2 * u, 10, hash(u * 7 + Math.floor(sim.t * 3)) > 0.7 ? PAL.Y : PAL.d)
    }
  }
  if (sim.mood === 'designing' && sim.isArrived) {
    const at = pen.wear(ART.easel, 27, 0)
    // He paints himself: a little Clawd appears on the canvas.
    const shown = Math.floor(clamp(sim.moodT / 4, 0, 1) * 12)
    const pic = ['..oooooooo..', '..okooooko..', 'oooooooooooo', 'oooooooooooo', '..oooooooo..', '..o.o..o.o..']
    pic.forEach((row, j) => {
      for (let i = 0; i < Math.min(shown, 12); i++) if (row[i] !== '.') dot(at, 1 + i, 2 + j, 14, row[i] === 'k' ? EYE : BODY)
    })
    for (let k = 0; k < Math.min(10, Math.floor(sim.moodT * 2)); k++) {
      pen.dot(at.x + Math.floor(hash(k + sim.variant) * 16 - 2) * S, L.floorY - S, CONFETTI[k % CONFETTI.length])
    }
  }
  if (sim.mood === 'benchmarking') {
    const at = pen.wear(['dddddddddddddddddddddddddddddd', 'gggggggggggggggggggggggggggggg', 'd............................d'], -3, 13)
    const shift = Math.floor(sim.t * 20) % 4
    for (let i = 0; i < 30; i += 4) pen.dot(at.x + ((i + shift) % 30) * S, at.y + S, PAL.s)
    const rail = place(sim, L, 27, 4, 1)
    for (let y = 0; y < 10; y++) pen.dot(rail.x, rail.y + y * S, PAL.g)
    for (let x = -4; x < 1; x++) pen.dot(rail.x + (mirror ? -x : x) * S, rail.y, PAL.g)
  }

  switch (sim.mood) {
    case 'reading':
      pen.held(ART.lamp, -9, -2)
      break
    case 'writing':
      if (sim.isArrived) pen.held(ART.mug, 19, 5)
      break
    case 'terminal':
      if (sim.isArrived) {
        const at = pen.held(ART.crt, 20, -2)
        const tint = sim.shown.tint || PAL.G
        const palette = [tint, PAL.G, PAL.Y, PAL.c, shade(tint, 0.4)]
        const scroll = Math.floor(sim.moodT * 4)
        for (let r = 0; r < 5; r++) {
          const seed = r + scroll
          const indent = Math.floor(hash(seed * 3) * 3)
          const len = 2 + Math.floor(hash(seed) * 8)
          for (let i = 0; i < len; i++) {
            const col = 3 + indent + i
            if (col > 12) break
            const c = palette[Math.floor(hash(seed * 7 + Math.floor(i / 3)) * palette.length)]
            pen.dot(mirror ? at.x + (15 - col) * S : at.x + col * S, at.y + (2 + r) * S, c)
          }
        }
        if (Math.floor(sim.t * 3) % 2) pen.dot(mirror ? at.x + 3 * S : at.x + 12 * S, at.y + 7 * S, PAL.W)
      }
      break
    case 'testing':
      pen.held(ART.rack, -14, 3)
      break
    case 'building':
      if (sim.isArrived) {
        const at = pen.held(ART.anvil, 21, 3)
        const glow = [PAL.Y, PAL.O, PAL.r][Math.floor(sim.t * 6) % 3]
        for (let i = 4; i < 9; i++) pen.dot(mirror ? at.x + (13 - i) * S : at.x + i * S, at.y - S, glow)
      }
      break
    case 'shipping':
      if (sim.isArrived) {
        pen.held(ART.pad, 19, 8)
        const lift = rocketLift(sim)
        const at = pen.held(ART.rocket, 21, -2 - lift / S)
        if (lift > 0) {
          const flick = Math.floor(sim.t * 12) % 2
          const flame = flick ? ['.YYYY.', '..OO..', '..r...'] : ['..YY..', '.OYYO.', '..rr..']
          pen.blit(flame, at.x + S, at.y + 10 * S, mirror)
        }
      }
      break
    case 'compacting': {
      const h = 12 - Math.floor((sim.moodT * 2) % 9)
      const pile = Array.from({ length: h }, (_, i) => (i % 3 === 2 ? 'ssssssssss' : i % 3 === 1 ? 'wggggwgggw' : 'wwwwwwwwww'))
      pen.held(pile, 21, 10 - h)
      break
    }
  }
}

// Arm blocks in his own pixels, left arm; the right mirrors them.
const ARM_BLOCKS: Record<ArmPose, [number, number][]> = {
  out: [
    [0, 2],
    [1, 2],
    [0, 3],
    [1, 3],
  ],
  raise: [
    [0, 1],
    [1, 1],
    [0, 2],
    [1, 2],
  ],
  up: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  down: [
    [0, 4],
    [1, 4],
    [0, 5],
    [1, 5],
  ],
}
const LEGS = [2, 4, 7, 9]

export function currentFace(sim: Sim): Face {
  if (sim.isHeld) return face('wide', 'o', { blush: true, brows: 'raised' })
  const base = ACTS[sim.mood].face(sim)
  const r = sim.react
  if (!r) return base
  const keep = { wear: base.wear }
  switch (r.kind) {
    case 'pass':
      return face('star', 'grin', { blush: true, ...keep })
    case 'fail':
      return face('dizzy', 'wavy', { brows: 'worried', ...keep })
    case 'edit':
      return face('happy', 'smile', { blush: true, ...keep })
    case 'found':
      return face('wide', 'o', { brows: 'raised', ...keep })
    case 'none':
      return face('half', 'flat', keep)
    case 'hello':
    case 'pet':
      return face('heart', 'grin', { blush: true, ...keep })
    case 'denied':
      return face('half', 'small', keep)
    case 'phew':
      return face('closed', 'o', keep)
    case 'combo':
    case 'streak':
      return face('star', 'grin', { blush: true, ...keep })
    case 'noted':
      return face('happy', 'smile', { blush: true, ...keep })
  }
}

export function bodyTop(sim: Sim) {
  const isLoaf = sim.mood === 'sleepy' && sim.isGrounded && !sim.isHeld
  const isSitting = sim.mood === 'idle' && sim.fidget === 'sit' && sim.isGrounded
  // Loafing and sitting fold the legs away; a landing squashes the top row.
  return isLoaf || isSitting ? 4 : sim.squash > 0 ? 4 : 0
}

export function drawClawd(pen: Pen) {
  const { sim, L, put } = pen
  const S = L.scale
  const shake = sim.flash > 0 ? (Math.floor(sim.t / 0.05) % 2 ? 1 : -1) : 0
  const ox = Math.round(sim.x) + shake
  const act = ACTS[sim.mood]
  const isLoaf = sim.mood === 'sleepy' && sim.isGrounded && !sim.isHeld
  const isSitting = sim.mood === 'idle' && sim.fidget === 'sit' && sim.isGrounded
  const isLanding = sim.squash > 0 && !isLoaf && !isSitting
  const drop = isLoaf || isSitting ? 4 : isLanding ? 2 : 0
  const oy = Math.round(sim.y) + drop * S
  const color = sim.flash > 0 && Math.floor(sim.t / 0.1) % 2 === 1 ? FLASH : BODY

  // One of his pixels: 2S columns by 2S half-pixels; a fine one is S by S.
  const block = (x: number, y: number) => {
    for (let i = 0; i < 2 * S; i++) for (let j = 0; j < 2 * S; j++) put(ox + x * 2 * S + i, oy + y * 2 * S + j, color)
  }
  const fine = (x: number, y: number, c: string) => {
    for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) put(ox + x * S + i, oy + y * S + j, c)
  }

  const top = isLanding ? 1 : 0
  for (let y = top; y < 6; y++) for (let x = 2; x < 10; x++) block(x, y)

  const isShrug = sim.react?.kind === 'denied' && sim.react.t < 1.2
  const arms = sim.isHeld ? ARMS_UP : isShrug ? { front: 'raise' as ArmPose, back: 'raise' as ArmPose } : (act.arms?.(sim) ?? ARMS_OUT)
  const frontIsRight = sim.dir > 0
  const left = frontIsRight ? arms.back : arms.front
  const right = frontIsRight ? arms.front : arms.back
  for (const [x, y] of ARM_BLOCKS[left]) if (y >= top) block(x, y)
  for (const [x, y] of ARM_BLOCKS[right]) if (y >= top) block(11 - x, y)

  if (!isLoaf && !isSitting) {
    // A walk lifts the legs in pairs; a tap lifts the front one.
    const phase = isWalking(sim) || act.move === 'treadmill' ? Math.floor(sim.stride / (2 * S)) % 4 : 0
    const isTapping = act.move === 'tap' && Math.floor(sim.t / 0.25) % 2 === 1
    const front = frontIsRight ? 9 : 2
    for (const x of LEGS) {
      const isLifted =
        sim.isGrounded && !sim.isHeld && ((phase === 1 && (x === 2 || x === 7)) || (phase === 3 && (x === 4 || x === 9)) || (isTapping && x === front))
      block(x, 6)
      if (!isLifted) block(x, 7)
    }
  }

  drawFace(currentFace(sim), sim, (x, y, c) => fine(x, y + top * 2, c))
}

type Px = [number, number, string?]

// Clawd's official face is two square eyes and nothing else, so he emotes
// with his eyes; a mouth shows only for big feelings, and never brows.
const MOUTHS: readonly Mouth[] = ['smile', 'grin', 'o', 'frown', 'yawn']

export function drawFace(given: Face, sim: Sim, fine: (x: number, y: number, c: string) => void) {
  const f = { ...given, brows: 'none' as Brows, mouth: MOUTHS.includes(given.mouth) ? given.mouth : ('none' as Mouth) }
  const { dx, dy } = f.look
  const isBlink = sim.blink > 0 && (f.eyes === 'open' || f.eyes === 'wide' || f.eyes === 'puppy')
  const eyes = isBlink ? 'closed' : f.eyes

  // Drawn for his left side and mirrored across his middle (x ↔ 23 - x).
  const both = (pts: Px[], sx = 0, sy = 0, c = EYE) => {
    for (const [x, y, k] of pts) {
      fine(x + sx, y + sy, k ?? c)
      fine(W0 - 1 - x + sx, y + sy, k ?? c)
    }
  }
  const one = (pts: Px[], c = EYE) => {
    for (const [x, y, k] of pts) fine(x, y, k ?? c)
  }

  if (f.blush) both([[4, 5], [5, 5]], 0, 0, BLUSH)

  switch (eyes) {
    case 'open':
      both([[6, 2], [7, 2], [6, 3], [7, 3]], dx, dy)
      break
    case 'wide':
      both([[6, 1, PAL.W], [7, 1], [6, 2], [7, 2], [6, 3], [7, 3]], dx, dy)
      break
    case 'puppy':
      both([[5, 1], [6, 1, PAL.W], [7, 1], [5, 2], [6, 2], [7, 2], [5, 3], [6, 3], [7, 3, PAL.W]])
      break
    case 'happy':
      both([[5, 3], [6, 2], [7, 2], [8, 3]])
      break
    case 'closed':
      both([[5, 3], [6, 3], [7, 3]])
      break
    case 'half':
      both([[6, 2, BODY_DARK], [7, 2, BODY_DARK], [6, 3], [7, 3]], dx)
      break
    case 'sad':
      both([[6, 3], [7, 3], [6, 4], [7, 4], [5, 2, BODY_DARK]])
      break
    case 'dizzy':
      both([[5, 1], [7, 1], [6, 2], [5, 3], [7, 3]])
      break
    case 'squeeze':
      both([[5, 1], [6, 1], [7, 2], [6, 3], [5, 3]])
      break
    case 'star':
      both([[6, 1, PAL.Y], [5, 2, PAL.Y], [6, 2, PAL.W], [7, 2, PAL.Y], [6, 3, PAL.Y]])
      break
    case 'heart':
      both([[5, 1], [7, 1], [5, 2], [6, 2], [7, 2], [6, 3]], 0, 0, PAL.p)
      break
  }

  switch (f.brows) {
    case 'focus':
      both([[5, 0], [6, 0], [7, 1]], 0, 0, BROW)
      break
    case 'worried':
      both([[5, 1], [6, 0], [7, 0]], 0, 0, BROW)
      break
    case 'raised':
      both([[5, 0], [6, 0], [7, 0]], 0, 0, BROW)
      break
    case 'curious':
      one([[5, 1], [6, 1], [7, 1], [16, 0], [17, 0], [18, 0]], BROW)
      break
  }

  switch (f.mouth) {
    case 'smile':
      one([[11, 6], [12, 6]])
      break
    case 'grin':
      one([[10, 5], [13, 5], [11, 6], [12, 6]])
      break
    case 'o':
      one([[11, 6], [12, 6]])
      break
    case 'small':
      one([[11, 6], [12, 6]])
      break
    case 'flat':
      one([[10, 6], [11, 6], [12, 6], [13, 6]])
      break
    case 'side':
      one([[11, 6], [12, 6], [13, 5]])
      break
    case 'frown':
      one([[10, 6], [11, 5], [12, 5], [13, 6]])
      break
    case 'wavy':
      one([[10, 6], [11, 5], [12, 6], [13, 5]])
      break
    case 'tongue':
      one([[11, 5], [12, 5], [12, 6, PAL.p]])
      break
    case 'yawn':
      one([[11, 5], [12, 5], [11, 6], [12, 6]])
      break
    case 'grit':
      one([[10, 5], [11, 5], [12, 5], [13, 5], [10, 6, PAL.W], [11, 6, PAL.W], [12, 6, PAL.W], [13, 6, PAL.W]])
      break
  }

  const ring: Px[] = [[5, 1], [6, 1], [7, 1], [8, 1], [5, 2], [8, 2], [5, 3], [8, 3], [5, 4], [6, 4], [7, 4], [8, 4]]
  const bridge: Px[] = [[9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2]]
  switch (f.wear) {
    case 'glasses':
      both(ring, 0, 0, PAL.N)
      one(bridge, PAL.N)
      break
    case 'goggles':
      for (let x = 2; x < 22; x++) fine(x, 2, PAL.d)
      both(ring, 0, 0, PAL.c)
      both([[6, 2, PAL.C], [7, 2, PAL.C], [6, 3], [7, 3]])
      break
    case 'shades':
      both([[5, 2], [6, 2], [7, 2], [8, 2], [5, 3], [6, 3], [7, 3], [8, 3], [6, 4], [7, 4]])
      one(bridge)
      one([[5, 2, PAL.W], [15, 2, PAL.W]])
      break
  }
}

// Gear Clawd holds or wears, drawn over him.
export function drawFront(pen: Pen) {
  const { sim, L } = pen
  const S = L.scale
  const m = sim.mood
  const mirror = sim.dir < 0

  // Hats sit on his head and stay on even while he is carried.
  const hatY = bodyTop(sim)
  if (m === 'casting') pen.wear(ART.wizardHat, 5, -8 + hatY)
  if (m === 'happy') pen.wear(ART.partyHat, 8, -7 + hatY)
  if (m === 'sleepy') pen.wear(ART.nightcap, 4, -3 + hatY)
  if (m === 'building') pen.wear(ART.hardhat, 5, -3 + hatY)
  if (m === 'cleaning') pen.wear(ART.bandana, 5, -2 + hatY)
  if (sim.isHeld) return

  switch (m) {
    case 'sleepy': {
      // A snore bubble swells and pops.
      const phase = sim.moodT % 3
      const r = Math.min(3, phase * 1.4)
      if (phase < 2.6 && r >= 1) {
        const at = place(sim, L, 21, 6 + hatY)
        for (let a = 0; a < 16; a++) {
          const t = (a / 16) * Math.PI * 2
          pen.dot(at.x + Math.cos(t) * r * S, at.y + Math.sin(t) * r * S, PAL.C)
        }
      }
      break
    }
    case 'surfing':
      pen.held(ART.surfboard, -6, 10)
      break
    case 'reading': {
      const at = pen.wear(ART.book, 2, 8)
      if (sim.moodT % 1.8 > 1.4) pen.blit(ART.pageFlip, at.x + 10 * S, at.y - 3 * S, mirror)
      break
    }
    case 'searching':
      pen.held(ART.magnifier, 15, -4 + (Math.floor(sim.t * 2) % 2))
      break
    case 'writing':
      if (sim.isArrived) pen.held(ART.laptop, 1, 4)
      break
    case 'terminal':
      if (sim.isArrived) pen.held(ART.keyboard, 4, 9)
      break
    case 'testing':
      pen.held(ART.flask, 16 + (Math.floor(sim.t * 8) % 2), -3)
      break
    case 'building':
      if (sim.isArrived) {
        if (Math.floor(sim.moodT / 0.35) % 2) pen.held(ART.hammerDown, 16, 0)
        else pen.held(ART.hammerUp, 15, -6)
      }
      break
    case 'installing':
      pen.held(ART.box, 3, -7)
      break
    case 'committing':
      if (!sim.isPlanted) {
        const c = FLAG_COLORS[sim.flags.length % FLAG_COLORS.length]
        pen.held(ART.flagA, 16, -6, { t: c, L: shade(c, 0.4) })
      }
      break
    case 'cleaning':
      pen.held(ART.broom, 16 + (Math.floor(sim.t * 6) % 2), 0)
      break
    case 'planning': {
      const at = pen.held(ART.clipboard, 15, -4)
      const ticked = Math.min(4, Math.floor(sim.moodT / 0.7) % 6)
      for (let k = 0; k < ticked; k++) {
        const row = 3 + 2 * k
        const x = mirror ? at.x + 8 * S : at.x + 2 * S
        pen.dot(x, at.y + row * S, PAL.G)
      }
      pen.held(ART.pencil, -1, 0)
      break
    }
    case 'asking':
    case 'waiting': {
      const isWaiting = m === 'waiting'
      const colors = isWaiting ? { w: PAL.y, s: PAL.u } : undefined
      const at = pen.held(ART.sign, 14 + (Math.floor(sim.t * 3) % 2), -8, colors)
      pen.stamp(Math.round(at.x + 5 * S), Math.ceil(at.y / 2) + 1, isWaiting ? '!' : '?', EYE, isWaiting ? PAL.y : PAL.w)
      break
    }
    case 'timing': {
      const at = pen.held(ART.hourglass, 16, -1)
      const p = (sim.moodT % 4) / 4
      const sand = (x: number, y: number) => pen.dot(at.x + (mirror ? 8 - x : x) * S, at.y + y * S, PAL.Y)
      if (p < 0.4) [3, 4, 5].forEach(x => sand(x, 1))
      if (p < 0.75) sand(4, 2)
      if (Math.floor(sim.t * 8) % 2) sand(4, 3)
      if (p > 0.3) sand(4, 4)
      if (p > 0.6) [3, 4, 5].forEach(x => sand(x, 5))
      break
    }
    case 'delegating':
      pen.held(ART.megaphone, 16, 0)
      break
    case 'plugging':
      pen.held(ART.plug, 17, 2)
      break
    case 'snapping': {
      const at = pen.held(ART.camera, 15, -1)
      if (sim.moodT % 1.6 < 0.15) {
        for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) pen.dot(at.x + ((mirror ? 0 : 6) + a) * S, at.y + (b - 1) * S, PAL.W)
      }
      break
    }
    case 'casting':
      pen.held(ART.wand, 16, -2)
      break
    case 'thinking': {
      const at = pen.held(ART.thought, 12, -13)
      pen.held(['ww', 'ww'], 13, -5)
      pen.held(['w'], 12, -3)
      const icons = ['?', '…', '{', '✦', '#']
      const icon = icons[Math.floor(sim.moodT / 1.1) % icons.length]
      const cx = Math.round(at.x + 7 * S)
      pen.stamp(cx, Math.ceil(at.y / 2) + 1, icon, icon === '✦' ? PAL.u : EYE, PAL.w)
      break
    }
    case 'pondering': {
      const at = pen.held(ART.bulb, 5, -11)
      if (Math.floor(sim.t * 3) % 2) {
        const rays: [number, number][] = [
          [-2, 3],
          [9, 3],
          [-1, 0],
          [8, 0],
          [3, -2],
          [4, -2],
        ]
        for (const [x, y] of rays) pen.dot(at.x + x * S, at.y + y * S, PAL.Y)
      }
      break
    }
    case 'talking': {
      const at = pen.held(ART.bubble, 15, -10)
      const typed = Math.floor(sim.moodT * 8) % 50
      const tint = sim.shown.tint || PAL.g
      for (let r = 0; r < 3; r++) {
        const len = clamp(typed - r * 15, 0, r === 2 ? 9 : 15)
        for (let i = 0; i < len; i++) {
          const c = hash(r * 31 + Math.floor(i / 4)) > 0.75 ? tint : PAL.g
          pen.dot(mirror ? at.x + (17 - i) * S : at.x + (2 + i) * S, at.y + (1 + 2 * r) * S, c)
        }
      }
      break
    }
    case 'listening': {
      const fall = clamp(sim.moodT / 0.45, 0, 1)
      if (sim.moodT < 0.9) pen.held(ART.envelope, 3, -30 + 22 * fall * fall)
      else pen.held(ART.letter, 3, -9)
      break
    }
    case 'sad':
      pen.held(ART.rainCloud, 2, -9)
      break
    case 'debugging':
      pen.wear(ART.net, 21, Math.floor(sim.t * 3) % 2 ? -8 : -6)
      break
    case 'polishing':
      pen.wear(ART.spray, 21, -3)
      break
    case 'branching':
      if (sim.isArrived) pen.wear(ART.can, 21, 1)
      break
    case 'serving':
      pen.wear(ART.bowtie, 10, 8)
      break
    case 'benchmarking': {
      const at = pen.wear(ART.stopwatch, 9, -10)
      const a = sim.t * 6
      const cx = at.x + 3 * S
      const cy = at.y + 4 * S
      for (let r = 0; r <= 2; r++) pen.dot(cx + Math.round(Math.sin(a) * r) * S, cy - Math.round(Math.cos(a) * r) * S, EYE)
      break
    }
    case 'designing':
      pen.wear(ART.beret, 7, -3)
      pen.wear(ART.palette, -4, 5)
      if (sim.isArrived) pen.wear(ART.brush, 22, 1)
      break
    case 'exploring':
      pen.wear(ART.helmet, 5, -3)
      pen.wear(ART.map, 4, 6)
      break
    case 'remembering': {
      const diary = { w: '#FFF0F5', g: PAL.p, s: PAL.q, t: PAL.p, T: shade(PAL.p, -0.35), r: PAL.r }
      pen.wear(ART.book, 2, 8, diary)
      break
    }
    case 'phoning': {
      const at = pen.wear(ART.phone, 19, -2)
      // App icons, and the one he just tapped lights up.
      const tap = Math.floor(sim.t * 3) % 8
      for (let k = 0; k < 8; k++) {
        const x = 1 + (k % 2) * 2
        const y = 1 + Math.floor(k / 2) * 2
        const color = k === tap ? PAL.W : sim.shown.tint && k === 0 ? sim.shown.tint : CONFETTI[k % CONFETTI.length]
        pen.dot(mirror ? at.x + (5 - x) * S : at.x + x * S, at.y + y * S, color)
      }
      break
    }
  }
}

export function drawCompany(pen: Pen) {
  const { sim, L } = pen
  const S = L.scale
  for (const mini of sim.minis) {
    const legs = MINI_LEGS[Math.floor(mini.stride / (2 * S)) % 2]
    const top = L.floorY - 8 * S
    ;[...MINI, ...legs].forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] === '.') continue
        pen.dot(mini.x + i * S, top + j * S, row[i] === 'k' ? EYE : MINI_BODY)
      }
    })
    pen.blit(ART.miniHats[mini.hat], mini.x + 3 * S, top - 2 * S, mini.dir < 0, { t: mini.tint })
  }
  const b = sim.butterfly
  if (b) pen.blit(Math.floor(b.t * 8) % 2 ? ART.butterflyA : ART.butterflyB, b.x, b.y)
  const c = sim.critter
  if (c) pen.blit(Math.floor(c.t * 10) % 2 ? ART.bugA : ART.bugB, c.x, L.floorY - 3 * S, c.vx < 0)
  const ball = sim.ball
  if (ball) pen.blit(ART.ball, ball.x, L.floorY - 4 * S + ball.y)
  if (sim.mood === 'idle' && sim.fidget === 'juggle') {
    const colors = [PAL.r, PAL.Y, PAL.B]
    for (let k = 0; k < 3; k++) {
      const ph = sim.fidgetT * 4 + (k * Math.PI * 2) / 3
      const x = sim.x + L.w / 2 + Math.cos(ph) * 9 * S
      const y = sim.y - (3 + Math.abs(Math.sin(ph)) * 9) * S
      pen.blit(['xx', 'xx'], x, y, false, { x: colors[k] })
    }
  }
}

export type Seg = { fg?: string; bg?: string; text: string }

type Cell = { ch: string; fg: string; bg?: string }
export type Picture = { px: (string | undefined)[]; solid: Map<number, Cell>; glyphs: Map<number, { ch: string; color: string }> }

// The whole frame: a grid of square pixels (a column by half a text row)
// plus the text that sits on it, keyed by cell.
export function paint(sim: Sim, L: Layout): Picture {
  const { cols, cellRows, pxH } = L
  const px: (string | undefined)[] = new Array(cols * pxH)
  const put: Put = (x, y, c) => {
    x = Math.round(x)
    y = Math.round(y)
    if (x >= 0 && x < cols && y >= 0 && y < pxH) px[y * cols + x] = c
  }
  const solid = new Map<number, Cell>()
  const stamp: Stamp = (cx, cy, ch, fg, bg) => {
    if (cx >= 0 && cx < cols && cy >= 0 && cy < cellRows) solid.set(cy * cols + cx, { ch, fg, bg })
  }

  const pen = makePen(sim, L, put, stamp)
  drawSky(pen)
  drawGround(pen)
  drawBehind(pen)
  drawCompany(pen)
  drawClawd(pen)
  drawFront(pen)

  // Pixel particles join the picture; glyph particles sit in empty cells.
  const glyphs = new Map<number, { ch: string; color: string }>()
  for (const q of sim.particles) {
    if (q.art) {
      pen.blit(q.art, q.x, q.y, false, { x: q.color, t: q.color, J: q.color })
      continue
    }
    const text = q.glyph ?? ''
    const cy = Math.floor(q.y / 2)
    const cx0 = Math.round(q.x)
    if (q.isFloat) {
      // Readouts sit on top of everything, over whatever colour is beneath.
      for (let i = 0; i < text.length; i++) {
        const cx = cx0 + i
        const top = px[2 * cy * cols + cx]
        stamp(cx, cy, text[i], q.color, top && top === px[(2 * cy + 1) * cols + cx] ? top : undefined)
      }
      continue
    }
    for (let i = 0; i < text.length; i++) {
      const cx = cx0 + i
      if (cx >= 0 && cx < cols && cy >= 0 && cy < cellRows) glyphs.set(cy * cols + cx, { ch: text[i], color: q.color })
    }
  }

  return { px, solid, glyphs }
}

// Terminal: two pixels per cell as half blocks.
export function rasterize(sim: Sim, L: Layout): Seg[][] {
  const { cols, cellRows } = L
  const { px, solid, glyphs } = paint(sim, L)
  const rows: Seg[][] = []
  for (let r = 0; r < cellRows; r++) {
    const segs: Seg[] = []
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const top = px[2 * r * cols + c]
      const bot = px[(2 * r + 1) * cols + c]
      const s = solid.get(i)
      const g = glyphs.get(i)
      let cell: Seg
      if (s) cell = { fg: s.fg, bg: s.bg, text: s.ch }
      else if (g && (g.ch !== ' ' || (!top && !bot))) cell = { fg: g.color, bg: top && top === bot ? top : undefined, text: g.ch }
      else if (!top && !bot) cell = { text: ' ' }
      else if (top && !bot) cell = { fg: top, text: '▀' }
      else if (!top && bot) cell = { fg: bot, text: '▄' }
      else if (top === bot) cell = { fg: top, text: '█' }
      else cell = { fg: top, bg: bot, text: '▀' }

      const last = segs[segs.length - 1]
      if (last && last.fg === cell.fg && last.bg === cell.bg) last.text += cell.text
      else segs.push(cell)
    }
    rows.push(segs)
  }
  return rows
}

export function newSim(props: Props): Sim {
  const shown = { mood: props.mood, label: props.label, detail: props.detail, tint: props.tint, isBig: props.isBig }
  return {
    props,
    seq: props.seq,
    reactSeq: props.react?.seq ?? 0,
    shown,
    pending: null,
    mood: props.mood,
    moodT: 0,
    t: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    isGrounded: true,
    dir: 1,
    targetX: 0,
    pause: 1,
    stride: 0,
    squash: 0,
    flash: 0,
    blink: 0,
    nextBlink: 2,
    emit: 0,
    beat: -1,
    anchorX: 0,
    isArrived: false,
    isPlanted: false,
    variant: 0,
    fidget: null,
    fidgetT: 0,
    butterfly: null,
    critter: null,
    ball: null,
    react: null,
    flags: [],
    minis: [],
    particles: [],
    isHeld: false,
    grabX: 0,
    grabY: 0,
    hasDragged: false,
    prevX: 0,
    prevY: 0,
    isPlaced: false,
  }
}


const xml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Everywhere else: one SVG, every pixel a crisp square, runs merged.
export function toSvg(sim: Sim, L: Layout, cellPx = 8): { source: string; width: number; height: number } {
  const { cols, cellRows, pxH } = L
  const { px, solid, glyphs } = paint(sim, L)
  const out: string[] = []
  for (let y = 0; y < pxH; y++) {
    let x = 0
    while (x < cols) {
      const c = px[y * cols + x]
      if (!c) {
        x++
        continue
      }
      let w = 1
      while (x + w < cols && px[y * cols + x + w] === c) w++
      out.push(`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c}"/>`)
      x += w
    }
  }
  const text = (cx: number, cy: number, ch: string, fg: string, bg?: string) => {
    if (bg) out.push(`<rect x="${cx}" y="${cy * 2}" width="1" height="2" fill="${bg}"/>`)
    out.push(`<text x="${cx + 0.5}" y="${cy * 2 + 1.6}" fill="${fg}">${xml(ch)}</text>`)
  }
  for (const [i, g] of glyphs) if (!solid.has(i)) text(i % cols, Math.floor(i / cols), g.ch, g.color)
  for (const [i, s] of solid) text(i % cols, Math.floor(i / cols), s.ch, s.fg, s.bg)

  const width = cols * cellPx
  const height = cellRows * 2 * cellPx
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${pxH}" width="${width}" height="${height}" shape-rendering="crispEdges">` +
    `<g font-family="ui-monospace,Menlo,monospace" font-size="1.7" font-weight="700" text-anchor="middle">${out.join('')}</g></svg>`
  return { source, width, height }
}
