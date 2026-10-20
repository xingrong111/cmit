# V1学习挑战服务

从V1目录使用Node.js 24运行 `node 启动服务.mjs`。统一网页入口：http://127.0.0.1:3110/#/pages/learning/index ，内部端口3114。题库保存在本目录题库.json，不再依赖包外文件。

身份由账户服务验证，默认ACCOUNT_URL为 http://127.0.0.1:3112/api/me 。挑战必须登录，管理与导入必须为管理员。进度保存在data/progress.json，按账户保存。LEARNING_PROGRESS_PATH可覆盖进度文件位置，用于隔离测试。

入门抽5题、进阶抽8题，答完即完成，不设分数线。所有题目仍待核验，编辑与导入仅保存草稿。

网页管理从统一管理员工作台进入。微信导入V1/微信开发者工具导入包，不要导入本目录原独立miniprogram工程。

测试：`node --test tests/learn.test.js tests/import-check.test.js tests/manage.test.js`。完整说明见V1/docs/学习合并说明.md。
