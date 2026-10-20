# 学习挑战与导入

成员 5 的独立目录。

当前完成学习挑战：大厅、答题、结果、称号。抽题按 `levels.json`，称号按 `honors.json`。题目保持待核验。山河、足迹、我的只保留入口说明，不做那些模块的内容。

资料导入从 `import-template.json` 填写，说明见 `导入模板说明.md`。检查命令：

```powershell
node import-check.js import-template.json
```

通过的文件另存为 `data/import-drafts/` 里的草稿，不发布，也不把题目标成已核验。网页上也可以预览：服务运行后打开 [http://127.0.0.1:3105/import.html](http://127.0.0.1:3105/import.html) 。

题库和关卡草稿在 [http://127.0.0.1:3105/manage.html](http://127.0.0.1:3105/manage.html) 。可以改题干、选项、解析、来源和证据，并做发布前预览。保存后仍是待核验草稿，不进入正在进行的闯关。这两页都不在学习底栏里，待以后从成员3的管理员工作台进入。这里没有发布，也没有另一套管理员登录。

两种入口共用同一套资料服务。先在本目录运行：

```powershell
node server.js
```

网页端打开 [http://127.0.0.1:3105/](http://127.0.0.1:3105/) 。

微信小程序用微信开发者工具导入 `miniprogram` 文件夹。当前 AppID 是游客号 `touristappid`，只供工具里预览；正式发布前换成自己的 AppID。详情里勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」。开发者工具可以访问 `http://127.0.0.1:3105`。真机不能访问电脑的 127.0.0.1，正式体验前要把资料服务放到微信后台允许的 HTTPS 域名，并修改 `miniprogram/app.js` 里的 `api`。

进度写在 `data/progress.json`，只保存在本机。网页和小程序如果各自生成了学习者编号，进度不会自动合并。

检查规则：

```powershell
node --test tests/learn.test.js tests/import-check.test.js tests/manage.test.js
```

