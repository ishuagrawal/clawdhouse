# clawd-buddy

A pixel Clawd who keeps you company while Claude works. He sits on a small stage above the prompt (or in a side pane) and acts out what Claude is doing: thinking, reading files, editing, running tests, building, committing, browsing, waiting for your OK. He cheers when a turn finishes, sulks when it fails, and nods off after a minute and a half of quiet.

![All 40 moods](../media/clawd-states.png)

▶ [Every mood, one per beat](../media/clawd-beat.mp4)

Everything is drawn in code (see `hooks/engine.ts`). There are no image files to download.

## Install

```
/plugin marketplace add ishuagrawal/clawdhouse
/plugin install clawd-buddy@clawdhouse
```

See the [repo README](../README.md) for loading it from a clone instead.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `name` | `friend` | What Clawd calls you in greetings and cheers. |

Set it with `/plugin configure clawd-buddy@clawdhouse`, or pass `--config name=YourName` when installing from the shell.

## Commands

| Command | What it does |
| --- | --- |
| `/clawd` | Show Clawd (or list what he can do) |
| `/clawd stage` | Put him above the prompt |
| `/clawd pane` | Move him into a side pane |
| `/clawd hide` | Give him a break |
| `/clawd <mood>` | Preview a mood, such as `/clawd testing` or `/clawd delegating 3` |
| `/clawd <reaction>` | Preview a reaction: `pass`, `fail`, `edit`, `found`, `none`, `hello`, `denied`, `phew`, `combo`, `noted`, `streak` |

Run `/clawd` with no arguments for the full list of moods.

## How it works

`hooks/register.tsx` hooks session, prompt, turn and tool events and maps each one to a mood: a `Bash` call running `npm test` becomes *testing*, an `Edit` becomes *writing*, a `git commit` becomes *committing*. It stores the mood in `$.state` and draws the stage with `ui.render` hooks for the `AbovePrompt` band and the `Pane`. `hooks/engine.ts` holds the sprite art, the tiny physics sim and the rasterizer that turns a frame into terminal cells or an SVG. In the terminal, `hooks/clawd.tsx` runs the animation as a client module. Surfaces that can't run one, like the desktop app, get frames stepped and drawn by the hooks module itself.
