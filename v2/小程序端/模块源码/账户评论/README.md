# 微信小程序原生导入包

这是“账户、评论与管理员审核”的微信小程序原生页面，不是网页。可在微信开发者工具中直接导入本文件夹；`project.config.json` 使用 `touristappid`，正式发布前替换为项目 AppID。

## 开发调试

1. 先启动上级目录的 `server.js`：`& "C:\Users\laisiqi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\server.js`。
2. 导入本目录，在微信开发者工具详情页勾选“**不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**”。
3. 本地接口是 `http://127.0.0.1:3103/api`，在真机及发布环境中必须改为已备案的 HTTPS 服务域名；在 `app.js` 配置。

## 与完整交付包的合并

可把 `pages` 和 `utils/api.js` 复制到 `英迹-完整交付包/微信开发者工具导入包`，再将页面写入其 `app.json`。更推荐合并 `英迹-uni-node/frontend/src` 的维护源后，执行 `npm ci` 与 `npm run build:mp-weixin` 生成最终编译产物。

本初版的账户服务仍是演示服务，不应带着示例账号或 HTTP 地址直接发布。
