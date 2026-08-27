# dsh-wsl-open

DeepSeek Harness plugin: click a **WSL Linux path** in chat to open it in **Windows** (default app, or Explorer for a folder).

给「浏览器在 Windows、文件在 WSL」用。官方聊天不会把 `/home/.../deck.pptx` 变成链接；通用路径插件多半在 Linux 侧 `xdg-open`，打不开 Windows 里的 Office。

本插件会：

1. 用 CSS Highlight 把正文里的 `/home/...`、`/mnt/c/...` 标成可点击（不改 React DOM）
2. 用 `wslpath -w`（没有则自己拼）转成 `\\wsl$\Ubuntu-24.04\home\...` 或 `C:\...`
3. 文件走 `cmd.exe /c start`（默认程序，例如 PowerPoint/WPS）；目录走 `explorer.exe`

只打开家目录、当前会话工作区、`/mnt/c/Users`（及 `/mnt/d/Users`）下真实存在的路径。非 WSL 主机不执行打开。

## Install

Already running `dsh web`:

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-open
# or a local checkout:
dsh plugin --profile web add /absolute/path/to/dsh-wsl-open
```

Restart `dsh web`. Refresh the page. Click a dotted-underline path in a **new or re-rendered** assistant message.

## Verify

1. Ask the agent to write a file under `/home/<you>/...` (a `.pptx` is a good test).
2. In the reply, the absolute path should be dotted-underlined.
3. Click it. Windows should open the file with the default app.

If nothing happens, check the browser console for `[dsh-wsl-open]` and the dsh host log for `dsh-wsl-open: loaded distro=...`.

## Config

Override the whole row in the profile `cordis.patch.yml`:

```yaml
- id: dsh-wsl-open
  name: dsh-wsl-open
  config:
    enabled: true
```

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Set `false` to disable. |

## Changelog

- **0.1.0** — click `/home` and `/mnt/c` paths in chat; open files with the Windows default app and folders in Explorer.

## Test

```sh
npm test
```

## Topics

On GitHub, add `dsh-plugin`.
