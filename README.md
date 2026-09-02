# dsh-wsl-open
> **Install set:** part of [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit). Prefer `KIT_SET=daily` | `llm` | `github` | `full` (see kit README). Fault tree: [TROUBLESHOOTING.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.md).


DeepSeek Harness plugin: click a **WSL Linux path** in chat to open it on **Windows** (default app, or Explorer for folders).

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

---

## Why

Chat does not turn `/home/.../deck.pptx` into a useful link. Generic “open path” plugins often call Linux `xdg-open`, which cannot launch Windows Office / WPS.

## What it does

1. Highlights absolute Linux paths in assistant text (CSS Highlight; does not rewrite React DOM)
2. Maps with `wslpath -w` (or a fallback) to `\\wsl$\<distro>\...` or `C:\...`
3. Files → `cmd.exe /c start` (Windows default app); folders → `explorer.exe`

Only opens real paths under home, the session workspace, and `/mnt/c/Users` (and `/mnt/d/Users`). Non-WSL hosts skip open.

Prefer this for **files/folders**. Use [dsh-wsl-launch](https://github.com/173787247/dsh-wsl-launch) for apps, and [dsh-wsl-browser](https://github.com/173787247/dsh-wsl-browser) for `http(s)` URLs.

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-open
```

Restart `dsh web`, refresh the page. Click a dotted-underline path in a **new or re-rendered** assistant message.

## Verify

1. Ask the agent to write a file under `/home/<you>/...` (e.g. `.pptx`).
2. The absolute path should be dotted-underlined.
3. Click it — Windows opens with the default app.

Debug: browser console `[dsh-wsl-open]`; host log `dsh-wsl-open: loaded distro=...`.

## Config

```yaml
- id: dsh-wsl-open
  name: dsh-wsl-open
  config:
    enabled: true
```

| Key | Default | Meaning |
|-----|---------|---------|
| `enabled` | `true` | Set `false` to disable |

## Test

```sh
npm test
```

## License

MIT
