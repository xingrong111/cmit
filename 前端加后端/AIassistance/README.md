# 英迹 · AI阅读助手与历史足迹雷达

技术栈已落实为**微信原生小程序 + Node.js**。这是成员4的独立功能模块，目录内包含小程序源代码、后端、可操作浏览器预览、测试和接入说明。未包含其他成员负责的登录注册、审核管理、全国统计地图、题库、IP或漫画。

## 先运行看看

本机已经用Node.js 22.17.0验证。后端不依赖第三方npm包，不需要安装依赖。

```powershell
cd E:\CMIT\AIassistance\server
npm start
```

保持该终端运行，浏览器打开 **http://127.0.0.1:3100/**。可以真正提交问题、切换城市、查看官方出处、添加/调整/移除路线地点。不是只有静态截图。

首次运行不用填写任何密钥。历史问答会显示资料检索结果，操作导览可直接使用。调用真实大模型和步行服务的配置在下文。

## 微信开发者工具导入

1. 导入目录 `E:\CMIT\AIassistance\miniprogram`，项目类型选小程序。当前配置是游客AppID，独立查看界面后应改为团队自己的真实AppID。
2. 启动上述Node服务。`miniprogram/config.js` 默认接口地址是 `http://127.0.0.1:3100`。
3. 仅在本地开发者工具调试时，按工具设置允许不校验合法域名；项目提交前必须恢复校验并配置HTTPS合法域名。项目配置默认 `urlCheck: true`，不会偷偷替你关闭校验。
4. 真机访问不了电脑的127.0.0.1。团队联调可使用可达测试服务；正式小程序使用可达的HTTPS域名。切勿以开发者工具通过代替真机通过。
5. 真正定位还需要微信公众平台该AppID获准使用位置接口，并完善隐私保护指引。代码已声明 `scope.userLocation`、`requiredPrivateInfos: ["getLocation"]`，但这不代替平台审批。当前类别能否申请以平台实际后台为准。

微信定位、权限和隐私流程依照[微信位置接口文档](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.getLocation.html)和[隐私授权指引](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/PrivacyAuthorize.html)编写。需要时打开小程序设置恢复被拒绝的位置授权。

## 实现了哪些内容

| 页面 | 已实现内容 |
|---|---|
| AI阅读助手 | 史料问答/操作导览切换，人物与事件上下文，相关资料选择，原始出处卡，停止、重新提问，服务异常与资料不足提示 |
| 历史足迹雷达 | 用户主动定位、拒绝后手动选城、关键词/类型/半径筛选、真实坐标地图标记与点选、地点列表、空结果和网络异常 |
| 历史地点详情 | 地址、介绍、建议阅读看点、关联人物、开放信息时效、来源、入口导航、加入文化路线 |
| 文化路线 | 最多4站、按用户顺序排列、向前移动/移除、实际步行路线与分段指引、地图折线、入口不足/闭馆/服务失败提示 |
| 来源与位置隐私 | 原始和最终URL、机构、日期、证据位置、短摘录；单独隐私授权页，不同意仍可手动浏览 |

纸色、朱红、金线、墨色与楷体标题延续已有主题。原生地图属于地图平台底图，外围控件统一主题；不改地图道路和行政边界来追求装饰效果。足迹雷达与首页人数地图是不同功能。**没有现场任务模块。**

## 接入大模型与地图

复制 `server/.env.example` 为 `server/.env`，在本地填写：

```dotenv
MODEL_BASE_URL=https://api.deepseek.com
MODEL_NAME=deepseek-flash
MODEL_API_KEY=你的服务端密钥
TENCENT_MAP_KEY=你的腾讯位置WebService密钥
PUBLIC_MODE=false
```

重启服务生效。模型请求按[DeepSeek JSON输出文档](https://api-docs.deepseek.com/guides/json_mode/)使用JSON输出。其他兼容接口能否支持 `response_format: json_object` 需要实际验证；不支持时本模块降级资料检索。

**本版模型负责从候选资料中选择事实ID，回答正文由服务端使用资料原文生成。**不是自由生成长篇传记，不扮演英雄。无密钥时标识资料检索；有密钥且服务可用时标识模型选取；失败回退到已有资料。操作导览使用确定的操作帮助，避免编造按钮和路径。所有密钥只在Node端读取。

路线按[腾讯步行规划文档](https://lbs.qq.com/service/webService/webServiceGuide/route/routeWalking)调用。每段使用真实响应里的距离、时间和压缩路径；按平台格式解码，不用直线假装道路。当前没有真实密钥，所以只完成接口及模拟响应检查，尚未做实际计费服务联调。

## 当前资料与明确待办

资料样例保留官方来源，处于 `source_checked`、`published:false` 的本地试读状态；尚无其他审核人签字，不标“已完成独立史实复核”。入口坐标和当日开放信息没有可靠依据时保持空值。GPS能力已编写，但这三个场馆暂时不能产生有效附近距离或步行路线。

启用真实场景需要补齐：团队真实AppID与位置权限、可达HTTPS接口、模型/地图密钥、场馆真实入口GCJ-02坐标及依据、独立审核后的可发布资料。坐标不能靠地址猜测；古旧网页不能证明今天开放。

详情见 `docs/资料接入与来源.md`、`docs/接口与团队合并.md`、`docs/隐私与部署.md`。不必等待全部人物资料完成，可以按审核状态逐条接入。

## 检查与目录

```powershell1
cd E:\CMIT\AIassistance\server
npm test
npm run validate
```

`npm test` 检查后端和微信控制器逻辑；`validate` 检查数据结构及发布边界，**不等于史实审核或图片授权**。浏览器自动检查：`python E:\CMIT\AIassistance\preview\check_preview.py`，需要Edge和Python的websocket-client，属于可选开发工具。

```text
AIassistance/
  miniprogram/        微信项目；app.wxss为主题
  server/            原生Node HTTP服务、资料JSON、测试
  preview/           使用实际接口的浏览器预览、截图与检查记录
  docs/              页面说明、接口、资料、部署、自检报告
```

浏览器预览是方便审阅的辅助入口，微信小程序源代码才是主要交付。预览截图不是微信真机截图。
