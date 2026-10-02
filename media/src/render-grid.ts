// Renders media/clawd-states.png: every mood in the Claude desktop app's
// Code tab, as it looks with clawd-buddy loaded (page.html, `.app`).

import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

import { SCENES } from './scenes.ts'
import { Stage, seed } from './clawd.ts'
import { BAND_COLS, BAND_ROWS, branch, card, transcript } from './session.ts'
import { CHROME } from './chrome.ts'

const OUT = fileURLToPath(new URL('../clawd-states.png', import.meta.url))
const PAGE = new URL('./page.html', import.meta.url).href

const cells = SCENES.map((scene, i) => {
  seed(1000 + i)
  const stage = new Stage(scene, 30, scene.warm ?? 2.5, BAND_COLS, BAND_ROWS)
  return {
    mood: scene.mood,
    rows: transcript(i),
    card: card(scene),
    branch: branch(i),
    isWorking: scene.isWorking ?? false,
    stage: { label: scene.label, detail: scene.detail, tint: scene.tint ?? '', svg: stage.svg() },
  }
})

// The page loads the app's own fonts from the installed app, over file://.
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
const page = await browser.newPage()
await page.setViewport({ width: 4424, height: 1000, deviceScaleFactor: 1 })
await page.goto(PAGE)
await page.evaluate((c, n) => (window as any).appGrid(c, n), cells, SCENES.length)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: OUT as `${string}.png`, fullPage: true })
await browser.close()
console.log(`wrote ${OUT}`)
