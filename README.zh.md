# dsh-wsl-open
> **套件安装：** 见 [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)。推荐 `KIT_SET=daily` | `llm` | `github` | `full`。故障树：[TROUBLESHOOTING.zh.md](https://github.com/173787247/dsh-wsl-kit/blob/master/docs/TROUBLESHOOTING.zh.md)。


DeepSeek Harness 插件：在聊天里点击 **WSL Linux 路径**，在 **Windows** 上打开（默认程序；目录用资源管理器）。

属于 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**。

[English → README.md](./README.md)

---

## 为什么需要

官方聊天不会把 `/home/.../deck.pptx` 变成可点链接；通用「打开路径」插件往往调用 Linux `xdg-open`，打不开 Windows 上的 Office / WPS。

## 行为

1. 在助手文本里高亮绝对 Linux 路径（CSS Highlight，不改写 React DOM）
2. 用 `wslpath -w`（或回退方案）映射到 `\\wsl$\<发行版>\...` 或 `C:\...`
3. 文件 → `cmd.exe /c start`（Windows 默认程序）；目录 → `explorer.exe`

仅打开真实存在的路径：家目录、会话工作区、`/mnt/c/Users`（以及 `/mnt/d/Users`）。非 WSL 主机跳过打开。

打开**文件/目录**用本插件；开应用用 [dsh-wsl-launch](https://github.com/173787247/dsh-wsl-launch)；开网页用 [dsh-wsl-browser](https://github.com/173787247/dsh-wsl-browser)。

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-open
```

重启 `dsh web` 并刷新页面。在**新消息或重新渲染**的助手回复里，点击带点状下划线的路径。

## 验证

1. 让 Agent 在 `/home/<你>/...` 下写一个文件（例如 `.pptx`）。
2. 绝对路径应带点状下划线。
3. 点击后，Windows 用默认程序打开。

调试：浏览器控制台 `[dsh-wsl-open]`；主机日志 `dsh-wsl-open: loaded distro=...`。

## 配置

```yaml
- id: dsh-wsl-open
  name: dsh-wsl-open
  config:
    enabled: true
```

| 键 | 默认 | 含义 |
|----|------|------|
| `enabled` | `true` | 设为 `false` 可关闭 |

## 测试

```sh
npm test
```

## 许可

MIT
