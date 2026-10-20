# 英迹·山河英雄谱｜账户、评论与管理员审核（初版）

这是根据 `a_项目/页面展示.html` 与 `功能说明.html` 中“成员3”范围实现的可运行初版。

> 本目录同时保留了此前用于接口调试的移动网页版本，以及可直接导入微信开发者工具的[微信小程序版](微信小程序版/README.md)。微信小程序版才是本模块交付给小程序工程的前端实现。

## 已实现

- 普通用户注册、登录、退出与服务端会话；注册不允许选择管理员角色。
- 阅读免登录；登录后才能提交评论、查看本人评论状态、编辑待审核／被退回评论。
- 评论默认为“待审核”；公共接口只返回“已公开”评论。
- 管理员服务端鉴权、待办统计、评论通过／退回、人物事实发布／退回、版本冲突保护和审计日志。
- 移动端单页前端，统一使用宣纸米白、朱红、暖金、20px 卡片圆角和固定四项底部导航。

## 本地运行

要求 Node.js 20+（本机已验证 Node 24）。在本目录运行：

```powershell
node server.js
```

如果 Windows 命令提示符显示“`node` 不是内部或外部命令”，可直接使用 Codex 已附带的 Node 运行时（无需安装）：

```bat
"C:\Users\laisiqi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.js
```

在 VS Code 的 **PowerShell** 终端中，带引号的可执行文件前须加调用运算符 `&`：

```powershell
& "C:\Users\laisiqi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\server.js
```

若看到 `EADDRINUSE ... 3103`，说明已有服务正在使用该端口；可直接打开 `http://127.0.0.1:3103`。如需重启，先在 PowerShell 查找并停止监听进程：

```powershell
Get-NetTCPConnection -LocalPort 3103 -State Listen | Select-Object OwningProcess
Stop-Process -Id <上一步显示的进程号>
```

当前服务明确绑定 `127.0.0.1`，请优先访问 `http://127.0.0.1:3103`，而不是浏览器缓存中的旧 `localhost` 页面。

也可以自行安装 Node.js 20+ LTS，并重新打开终端后再执行 `node server.js`。

访问 <http://localhost:3103>。

演示学习账户：`learner@yingji.local` / `LearnMe!2026`  
演示管理员账户：`admin@yingji.local` / `ChangeMe!2026`

首次运行会生成 `data.json`。它是本地演示数据，**不得**携带演示口令或 JSON 文件部署到生产环境。

## 接口边界

- 普通用户：`/api/auth/*`、`/api/comments`、`/api/my/comments`
- 管理员：`/api/admin/dashboard`、`/api/admin/comments`、`/api/admin/facts`
- 管理接口不信任前端角色字段，以服务端会话中的 `user.role === 'admin'` 判断。

## 后续接入

生产化前须改用数据库、HTTPS、受控登录（如微信登录）、持久化会话、频率限制、验证码／内容安全服务、CSRF 策略、密码重置和管理员授权流程。人物事实字段与来源映射应接入成员2、成员5的正式数据模型；本初版的事实条目是可操作流程样例，不冒充已完成的史料发布系统。
