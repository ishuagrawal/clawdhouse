import { mock, test } from 'claude-code/testing'

function rows(el: any): any[] {
  const seg = (t: any): any[] => (t.type === 'Text' ? [[(t.children ?? []).join(''), t.props?.color ?? null, t.props?.backgroundColor ?? null]] : (t.children ?? []).flatMap(seg))
  return (el.children ?? []).map(seg)
}

test('desktop draws Clawd from the host', async ($, on: any) => {
  const clock = mock.clock(on)
  const T: any = $
  on('session.start', ($: any, e: any) => e)
  on('command.register', () => ({ value: {} }))
  on('ui.open', () => ({ value: {} }))
  on('command.run', () => ({ text: 'base' }))
  await T.session.start({ source: 'startup', cwd: '/tmp', model: 'x', sessionId: 's' })
  const ui: any = await $.ui.mount({
    plugin: 'clawdhouse',
    surface: 'desktop',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: true, maxRows: 24, bodyColumns: 96, scroll: { offset: 0, bodyRows: 24 }, view: {} } as any,
  } as any)
  for (const mood of ['debugging', 'polishing', 'branching', 'querying', 'serving', 'benchmarking', 'designing', 'exploring', 'mailing', 'remembering', 'phoning', 'idle']) {
    await T.command.run({ command: 'clawd', args: mood, origin: { kind: 'user' }, presentation: {} })
    for (let i = 0; i < 24; i++) await clock.advance(125)
    const svg = (await ui.find({ type: 'Svg' })) as any
    console.log('SVG ' + JSON.stringify({ label: mood, source: svg?.props?.source ?? JSON.stringify(await ui.drawn()).slice(0, 300) }))
  }
  await T.command.run({ command: 'clawd', args: 'writing', origin: { kind: 'user' }, presentation: {} })
  for (let i = 0; i < 24; i++) await clock.advance(125)
  for (const r of ['denied', 'phew', 'combo', 'noted', 'streak']) {
    await T.command.run({ command: 'clawd', args: r, origin: { kind: 'user' }, presentation: {} })
    for (let i = 0; i < 4; i++) await clock.advance(125)
    const svg = (await ui.find({ type: 'Svg' })) as any
    console.log('SVG ' + JSON.stringify({ label: 'react:' + r, source: svg?.props?.source ?? '' }))
    for (let i = 0; i < 16; i++) await clock.advance(125)
  }
})
