// Renders media/clawd-beat.mp4. Each frame is the desktop app's Code tab in
// src/page.html with Clawd drawn by the mod's own engine (the timeline is
// src/shots.ts), piped to ffmpeg over the soundtrack from `npm run sfx`.

import { spawn } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

import { FPS, play } from './shots.ts'
import { CHROME } from './chrome.ts'

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const AUDIO = path('../.build/soundtrack.wav')
const OUT = path('../clawd-beat.mp4')
if (!existsSync(AUDIO)) throw new Error('run `npm run music` and `npm run sfx` first')

function ffmpeg(args: string[], stdin: 'pipe' | 'ignore' = 'ignore') {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: [stdin, 'inherit', 'inherit'] })
  const done = new Promise<void>((resolve, reject) => p.on('close', code => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))))
  return { p, done }
}

const AUDIO_OUT = ['-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest']

// `--remux` swaps a new soundtrack under the video that's already rendered.
if (process.argv.includes('--remux')) {
  const tmp = path('../.build/remux.mp4')
  await ffmpeg(['-i', OUT, '-i', AUDIO, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', ...AUDIO_OUT, tmp]).done
  renameSync(tmp, OUT)
  console.log(`wrote ${OUT} (new soundtrack)`)
  process.exit(0)
}

const frames = [...play()].map(f => f.frame)

// `--stills 0,200,640` writes those frames to .build/ as PNGs instead of a video.
const stillsAt = process.argv.includes('--stills') ? new Set(process.argv[process.argv.indexOf('--stills') + 1].split(',').map(Number)) : null
const video = stillsAt
  ? null
  : ffmpeg(
      [
        '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
        '-i', AUDIO,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-tune', 'animation', '-pix_fmt', 'yuv420p',
        ...AUDIO_OUT, OUT,
      ],
      'pipe',
    )

// A browser left screenshotting for long can be reaped (some sandboxes stop
// Chrome after ~30 s), so every 300 frames get a freshly launched one.
// The page loads the app's own fonts from the installed app, over file://.
const launch = () => puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
let browser = await launch()
async function freshPage() {
  await browser.close().catch(() => {})
  browser = await launch()
  const p = await browser.newPage()
  // Laid out at 1280 × 720 and drawn at 1.5×: 1080p, with Clawd's pixels a whole 12 px.
  await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.5 })
  await p.goto(new URL('./page.html', import.meta.url).href)
  await p.evaluate(() => document.fonts.ready)
  return p
}
let page = await freshPage()

for (const [index, state] of frames.entries()) {
  if (index > 0 && index % 300 === 0) page = await freshPage()
  await page.evaluate(s => (window as any).frame(s), state as any)
  if (stillsAt) {
    if (stillsAt.has(index)) await page.screenshot({ path: path(`../.build/still-${index}.png`) as `${string}.png` })
  } else {
    const png = await page.screenshot({ type: 'png', optimizeForSpeed: true })
    if (!video!.p.stdin!.write(png)) await new Promise(r => video!.p.stdin!.once('drain', r))
  }
  if ((index + 1) % 100 === 0) process.stdout.write(`\r${index + 1}/${frames.length} frames`)
}
video?.p.stdin!.end()
await video?.done
await browser.close()
console.log(stillsAt ? '\rwrote stills to .build/' : `\rwrote ${OUT} (${frames.length} frames, ${(frames.length / FPS).toFixed(2)}s)`)
