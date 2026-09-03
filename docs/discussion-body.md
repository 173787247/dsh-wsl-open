> 非官方项目，由社区成员独立开发和维护。

**项目地址：** https://github.com/173787247/dsh-wsl-open

**项目介绍：**
浏览器在 Windows、文件在 WSL 时，聊天里的 `/home/.../deck.pptx` 只是一段普通文字。通用路径插件多半在 Linux 侧 `xdg-open`，打不开 Windows 里的 PowerPoint / WPS。

本插件把正文里的 `/home/...`、`/mnt/c/...` 标成可点击，用 `wslpath -w` 转成 Windows 路径：文件走 `cmd.exe /c start`，目录走 `explorer.exe`。只打开家目录、当前会话工作区和 `/mnt/c/Users`（及 `/mnt/d/Users`）下真实存在的路径。

与 DSH 的集成：host 注册 `POST /api/wsl-open/open`，web client 用 CSS Highlight 标路径。装进 `web` profile 即可。

**安装：** dsh plugin --profile web add github:173787247/dsh-wsl-open

重启 dsh web 后刷新页面，点助手回复里带虚线下划线的绝对路径。仓库话题：dsh-plugin。

**截图：**

![click-path](https://raw.githubusercontent.com/173787247/dsh-wsl-open/master/assets/click-wsl-path.png)
