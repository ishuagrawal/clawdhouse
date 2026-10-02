import { mock, test } from 'claude-code/testing'

const PANE = (cols: number, rows: number) => ({
  plugin: 'clawdhouse',
  surface: 'terminal' as const,
  component: 'Pane' as const,
  requestId: 'clawdhouse',
  props: {
    title: 'Clawd',
    isFocused: false,
    bodyColumns: cols,
    placement: 'dock' as const,
    scroll: { offset: 0, bodyRows: rows },
    view: {},
  } as any,
})

// One frame as rows of [text, fg, bg] runs.
function rows(el: any): any[] {
  const out: any[] = []
  const seg = (t: any): any[] => {
    if (t.type === 'Text') return [[(t.children ?? []).join(''), t.props?.color ?? null, t.props?.backgroundColor ?? null]]
    return (t.children ?? []).flatMap(seg)
  }
  for (const child of el.children ?? []) out.push(seg(child))
  return out
}

async function dump(ui: any, label: string) {
  const tree = await ui.drawn({ in: 'clawd' })
  console.log('FRAME ' + JSON.stringify({ label, rows: rows(tree) }))
}

test('frames', async ($, on: any) => {
  const T: any = $
  on('prompt.submit', ($: any, e: any) => e)
  on('tool.call', () => ({ result: { filePath: '/x/demo.ts' } }))
  on('turn.complete', ($: any, e: any) => e)
  on('session.start', ($: any, e: any) => e)
  on('command.register', () => ({ value: {} }))
  on('ui.open', () => ({ value: {} }))
  mock.clock(on)
  on('command.run', ($: any, e: any) => ({ text: 'base' }))
  try { await T.session.start({ source: 'startup', cwd: '/tmp', model: 'x', sessionId: 's' }) } catch (err) { console.log('ERR start ' + err) }
  const ui: any = await $.ui.mount(PANE(70, 20))
  await ui.resize({ columns: 70, rows: 20, in: 'clawd' })
  await ui.advance(400)
  const go = async (label: string, fn: () => Promise<unknown>, ms: number, shots = 1) => {
    try { await fn() } catch (err) { console.log('ERR ' + label + ' ' + err) }
    await ui.redraw()
    for (let i = 0; i < shots; i++) { await ui.advance(ms / shots); await dump(ui, shots > 1 ? `${label} ${i}` : label) }
  }
  const MOODS = ['idle','sleepy','listening','thinking','pondering','talking','reading','searching','writing','terminal','testing','building','installing','shipping','committing','cleaning','planning','asking','waiting','timing','delegating','surfing','plugging','snapping','casting','compacting','happy','oops','sad']
  for (const mood of MOODS) {
    const arg = mood === 'reading' ? 'reading swift' : mood === 'writing' ? 'writing ts' : mood === 'happy' ? 'happy big' : mood
    await go(mood, () => T.command.run({ command: 'clawd', args: arg, origin: { kind: 'user' }, presentation: {} }), 2600)
  }
  await go('writing', () => T.command.run({ command: 'clawd', args: 'writing swift', origin: { kind: 'user' }, presentation: {} }), 2600)
  for (const r of ['pass', 'fail', 'edit', 'found', 'none', 'hello']) {
    await go('react:' + r, () => T.command.run({ command: 'clawd', args: r, origin: { kind: 'user' }, presentation: {} }), 400)
  }
})
