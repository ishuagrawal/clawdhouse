# media

The clawdhouse promo image and video, and the code that makes them.

| File | What it is |
| --- | --- |
| [clawd-states.png](./clawd-states.png) | All 40 moods, each in its own Code tab of the Claude desktop app |
| [clawd-beat.mp4](./clawd-beat.mp4) | 36 s, 1080p: one session in the desktop app, with a new mood on every beat of an original chiptune, each with its own sound effect, then the reactions |

Clawd isn't drawn by hand here. Every frame comes from the plugin's own engine (`plugin/hooks/engine.ts`), stepped on a fixed clock with a seeded random source, so the image and video show exactly what the plugin draws, and the same frames come out every time. The desktop app around him is rebuilt in HTML (`src/page.html`) from screenshots of the real app with clawdhouse loaded, in the app's own font, and screenshotted in headless Chrome. The band he stands in is the size the app gives the plugin: 94 columns by 11 rows, 8 px a pixel. The sessions in the sidebar are made up.

The sound effects are cued from those same frames. `src/cues.ts` plays the video without drawing it and notes each cut, each key typed into the prompt and each thing the engine does on screen: a reaction pops, confetti bursts, the rocket counts down. `src/sfx.py` then synthesizes an 8-bit sound for every cue, pitched to the chord playing at that moment, and mixes them over the music.

## Regenerate

Needs Node 23.6 or newer (it runs the TypeScript directly), Python 3 with NumPy, ffmpeg, and Google Chrome or Chromium (set `CHROME` to its path if it isn't found). The pages load Anthropic Sans from the installed Claude desktop app (`/Applications/Claude.app`); without it they fall back to the system font.

```bash
npm install
```

```bash
npm run all
```

`npm run all` runs four steps:

- `npm run music` synthesizes the music to `.build/music.wav` (`src/music.py`).
- `npm run sfx` finds the cues (`src/cues.ts`), then synthesizes the effects and mixes them over the music into `.build/soundtrack.wav` (`src/sfx.py`).
- `npm run grid` renders `clawd-states.png` (`src/render-grid.ts`).
- `npm run video` renders `clawd-beat.mp4` (`src/render-video.ts`). Pass `-- --stills 0,400,900` to write just those frames to `.build/` while you tweak a layout.

To change only the sound, run `npm run sfx` and then `npm run remux`. That puts the new soundtrack under the video you've already rendered, in a couple of seconds.

## Changing things

- **A mood's scene:** `src/scenes.ts` holds each mood's caption, transcript row and `warm`, the seconds the engine runs before the frame you see. Desk moods need about 2 s for Clawd to walk over, and entrances like confetti are best caught early.
- **A sound effect:** in `src/sfx.py`, `MOODS`, `REACTIONS` and `ENGINE` say what each cue sounds like, and `LEVEL` says how loud each kind plays. Every cue is brought to its level on its own, so a new sound doesn't need its gain hand-matched to the rest.
- **Timing:** `src/timeline.json` sets the tempo and how many beats each section gets. The score in `src/music.py` (and the chords `src/sfx.py` tunes to) are written for that layout, so change them together. Keep the tempo at one that puts a whole number of frames in a beat (112.5 BPM at 30 fps is 16) so cuts land exactly on the beat.
- **The shots:** `src/shots.ts` lays out what each frame shows. Both the video and the cues play it, so a change there moves the pictures and the sounds together.
- **The transcript:** `src/session.ts` turns the scenes into what the Code tab shows at each one: finished tools folded into lines like "Ran 2 commands, read a file", the running tool's description, the branch bar, the question cards. The grid and the video both use it.
