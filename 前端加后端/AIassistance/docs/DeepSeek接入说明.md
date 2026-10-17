# 小迹切换至DeepSeek

更新：2026-10-11。网页端和小程序端共用Node服务，均已使用新的模型配置。

```dotenv
MODEL_BASE_URL=https://api.deepseek.com
MODEL_NAME=deepseek-flash
MODEL_API_KEY=在服务端填写你的DeepSeek密钥
```

接口为 `/chat/completions`，使用Bearer认证、JSON对象输出及 `thinking.type=disabled`。依据官方文档实际核对，适用于当前普通对话、史料ID选择及场馆ID推荐三个调用流程。

- [DeepSeek Chat Completions官方参数](https://api-docs.deepseek.com/api/create-chat-completion/)
- [DeepSeek JSON输出官方说明](https://api-docs.deepseek.com/guides/json_mode/)
- 文档实际访问日期：2026-10-11。

本轮已通过真实请求验证：HTTP200、mode=model_chat、modelStatus=available，小迹回答自己的名称及能力。没有用测试响应或基础身份回答代替验证。验证结果见 `DeepSeek接入验证.json`。真实联通验证仅做一次身份对话，不代表已经完成模型压力测试或所有史实问答验收。

普通聊天可以自然回应；历史回答仍以资料正文为依据，模型只选择允许的事实ID，不自行编造生平、关系、网址。文化导览只推荐现有地点和操作步骤，不生成未经核验的距离、营业信息或真实步行承诺。

认证失败（401）、余额/额度问题（402）、调用限制（429）在普通对话中分别提示，不能把这些问题解释为“资料库没有信息”。

两个已重启的入口：

- 网页端：<http://127.0.0.1:3104/web/#assistant>
- 原小程序风格预览：<http://127.0.0.1:3100/>

刷新页面即可读取新服务。原生小程序代码保留，继续使用其已配置的后端地址；真机需要HTTPS及合法请求域名，不可直接访问手机自己的127.0.0.1。

智谱旧配置备份在 `server/.env.glm-before-deepseek`，仅本地保留，已加入忽略规则，不应打包或提交。当前DeepSeek密钥只在 `server/.env`，不写入网页、截图或此说明。
