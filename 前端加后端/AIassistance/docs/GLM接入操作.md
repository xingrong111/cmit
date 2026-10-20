# GLM接入操作

已创建 `E:\CMIT\AIassistance\server\.env`，密钥为空。请用绝对路径打开，避免当前目录不对：

```powershell
notepad "E:\CMIT\AIassistance\server\.env"
```

登录 https://bigmodel.cn/usercenter/proj-mgmt/apikeys ，按控制台实际要求完成账号操作，在API密钥管理创建/复制密钥。只在本地.env填写，不贴到聊天或前端代码。

```dotenv
MODEL_BASE_URL=https://open.bigmodel.cn/api/paas/v4
MODEL_NAME=glm-4.7-flash
MODEL_API_KEY=替换成自己的实际API密钥
TENCENT_MAP_KEY=
PUBLIC_MODE=false
```

地图Key可暂时为空，先接通AI。GLM-4.7-Flash与GLM-4.7、GLM-4.7-FlashX是不同型号，不要省略Flash或改成FlashX。免费模型支持、限制及新用户赠送额度适用范围以账号控制台当前显示为准，不保证任何GLM模型都免费。

本版适配结构化JSON输出、关闭深度思考、低温度选择事实ID，不需要另装模型SDK。官方参考：https://docs.bigmodel.cn/cn/guide/models/free/glm-4.7-flash 。

保存后关闭旧后端，再在PowerShell启动：

```powershell
cd E:\CMIT\AIassistance\server
npm start
```

若提示EADDRINUSE，是旧服务仍占用3100端口；请停止旧服务后重启。不要另起多个同端口进程。

另开PowerShell执行真实调用检查：

```powershell
$payload = @{question="瞿秋白有哪些求学经历？"; mode="history"} | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/chat" -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($payload))
$result | Select-Object mode, modelStatus, status
```

`modelStatus=available` 才是本次实际模型调用成功；not_configured表示未读到密钥；unavailable表示服务失败并降级资料检索。配置接口显示modelConfigured=true仅代表有填写密钥，不证明有效。

2026-10-11已执行实际密钥调用：GLM返回HTTP 200，结构化结果含factIds，史料问答返回model_selected_sources / available。此前出现超时及HTTP 429、错误码1305，平台负载较高时仍会降级；不保证每次请求都成功。密钥内容没有输出或保存进报告。进入浏览器“史料问答”而不是“操作导览”测试，后者使用确定的帮助内容，不发模型请求。
