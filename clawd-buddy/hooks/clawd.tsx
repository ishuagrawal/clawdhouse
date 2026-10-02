import type { ClientModule, ClientPointerEvent, ClientSurface } from 'claude-code'

import {
  ART,
  BODY,
  CAPTION_ROWS,
  GRAVITY,
  PAL,
  TICK,
  W0,
  bits,
  clamp,
  layout as layoutOf,
  newSim,
  rasterize,
  step,
} from './engine'
import type { Props, State } from './engine'

const layout = (surface: ClientSurface<State>) => layoutOf(surface.columns, surface.rows)

// ── The module ─────────────────────────────────────────────────────────────

function onPointer(surface: ClientSurface<State>, e: ClientPointerEvent) {
  const st = surface.state
  if (!st) return
  const sim = st.sim
  const L = layout(surface)
  const x = e.fine?.x ?? e.x + 0.5
  const y = ((e.fine?.y ?? e.y + 0.5) - CAPTION_ROWS) * 2

  if (e.type === 'down' && e.button === 'left') {
    const isHit = x >= sim.x && x <= sim.x + L.w && y >= sim.y - 1 && y <= sim.y + L.h + 1
    if (!isHit) return
    sim.isHeld = true
    sim.hasDragged = false
    sim.isGrounded = false
    sim.grabX = x - sim.x
    sim.grabY = y - sim.y
    sim.prevX = sim.x
    sim.prevY = sim.y
  } else if (e.type === 'move' && sim.isHeld) {
    sim.hasDragged = true
    sim.x = clamp(x - sim.grabX, 0, L.maxX)
    sim.y = clamp(y - sim.grabY, -L.h / 2, L.groundY)
  } else if ((e.type === 'up' || e.type === 'leave') && sim.isHeld) {
    sim.isHeld = false
    sim.isArrived = false
    if (!sim.hasDragged) {
      // A pat: a happy hop, heart eyes and hearts.
      sim.vx = 0
      sim.vy = -Math.sqrt(2 * GRAVITY * 5 * L.scale)
      sim.react = { kind: 'pet', t: 0 }
      bits(sim, 4, { x: sim.x + L.w / 2, y: sim.y - 2 }, [ART.heart], [PAL.p], 10, -6, 1.4)
    } else {
      sim.vx = clamp(sim.vx, -160, 160)
      sim.vy = clamp(sim.vy, -220, 220)
    }
    sim.targetX = sim.x
  } else {
    return
  }
  surface.setState({ sim, frame: st.frame + 1 })
}

const Clawd: ClientModule<Props, State> = (props, surface) => {
  const { Box, Text } = surface.elements

  if (!surface.state) {
    const sim = newSim(props)
    surface.every(TICK, () => {
      const st = surface.state
      if (!st) return
      const L = layout(surface)
      if (L.cols >= W0 && L.cellRows >= 4) step(st.sim, L)
      surface.setState({ sim: st.sim, frame: st.frame + 1 })
    })
    surface.onPointer(e => onPointer(surface, e))
    surface.setState({ sim, frame: 0 })
    return <Text dimColor>…</Text>
  }

  const sim = surface.state.sim
  sim.props = props
  const L = layout(surface)

  if (L.cols < W0 || L.cellRows < 4) {
    return <Text color={BODY}>▐▛███▜▌ {sim.shown.label}</Text>
  }

  const rows = rasterize(sim, L)
  const accent = sim.shown.tint || BODY

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Text color={accent}>{'● '}</Text>
        <Text bold color={BODY}>
          {sim.shown.label}
        </Text>
        {sim.shown.detail !== '' && (
          <Text dimColor wrap="truncate-end">
            {'  ' + sim.shown.detail}
          </Text>
        )}
      </Box>
      <Text dimColor>{sim.isHeld ? 'wheee!' : ' '}</Text>
      {rows.map(segs => (
        <Box flexDirection="row">
          {segs.map(s => (
            <Text color={s.fg} backgroundColor={s.bg}>
              {s.text}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  )
}

export default Clawd
