# clawdhouse

Mods for [Claude Code](https://claude.com/claude-code): panes, bands and buddies built on Claude Code's function hooks.

| Mod | What it does |
| --- | --- |
| [clawd-buddy](./clawd-buddy) | A pixel Clawd who lives above your prompt (or in a side pane) and reacts to what Claude is doing: reading, editing, running tests, waiting on you. |

![Clawd's 40 moods, each in the Claude Code desktop app](./media/clawd-states.png)

▶ [Watch Clawd run through every mood, one per beat](./media/clawd-beat.mp4) (36 s, with sound)

> Function hooks are an early-access Claude Code feature and the API may change between releases. These mods were built and tested on Claude Code 2.1.286.

## Install

This repo is a Claude Code plugin marketplace. Inside Claude Code:

```
/plugin marketplace add ishuagrawal/clawdhouse
/plugin install clawd-buddy@clawdhouse
```

Or from a shell:

```bash
claude plugin marketplace add ishuagrawal/clawdhouse
```

```bash
claude plugin install clawd-buddy@clawdhouse --config name=YourName
```

Start a new session (or run `/reload-plugins`) and Clawd shows up. Pull updates later with `claude plugin marketplace update clawdhouse`.

## Hack on a mod

Clone the repo and load a mod straight from disk. Saving a file hot-reloads it in the running session.

```bash
git clone https://github.com/ishuagrawal/clawdhouse.git
```

```bash
claude --plugin-dir ./clawdhouse/clawd-buddy
```

In the desktop app, where you can't pass flags, add the folder to the `env` block of `~/.claude/settings.json` instead:

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "/absolute/path/to/clawdhouse/clawd-buddy"
  }
}
```

If you also installed the mod from the marketplace, disable that copy (`claude plugin disable clawd-buddy@clawdhouse`) so it doesn't load twice.

### Types, checks and tests

The first time Claude Code loads a mod from your disk it writes the API's type declarations to `<mod>/.claude-plugin/types/`. That folder is generated and git-ignored, and the mod's `tsconfig.json` extends it, so load the mod once before opening it in an editor.

```bash
claude plugin validate ./clawd-buddy
```

```bash
claude plugin test ./clawd-buddy
```

`validate` reads the manifest and hooks module the way the engine will and reports anything it would refuse. `test` runs the mod's `tests/*.test.ts` against the engine.

## Layout

```
.claude-plugin/marketplace.json   the marketplace: lists every mod in this repo
<mod>/
  .claude-plugin/plugin.json      name, version, options (userConfig)
  hooks/hooks.json                points at the hooks module
  hooks/register.tsx              exports register(on, options)
  types/index.d.ts                the mod's $.state contract
  tests/*.test.ts                 claude plugin test
media/                            the promo image and video, rendered from the mod's engine
```

To add a mod, give it its own folder and add an entry to `.claude-plugin/marketplace.json`.

## License

[MIT](./LICENSE)
