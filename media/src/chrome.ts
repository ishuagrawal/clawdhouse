// Where to find a Chrome or Chromium to render with. Set CHROME to override.
import { existsSync } from 'node:fs'

const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
]

export const CHROME = process.env.CHROME ?? CANDIDATES.find(p => existsSync(p)) ?? ''
if (!CHROME) throw new Error('No Chrome found: set CHROME to a Chrome or Chromium binary')
