# 英迹 · uni-app + Node.js

已确认的博物馆专题展改版，包含uni-app Vue3前端、Node.js/Express只读服务与SQLite资料种子。前端支持微信小程序构建与H5预览。

## 本地运行

需要Node.js 24或更高兼容版本、npm。分别在两个终端运行：

```sh
cd backend
npm ci
npm start
```

```sh
cd frontend
npm ci
npm run dev:h5
```

资料服务：http://127.0.0.1:8790/api/meta；H5：http://127.0.0.1:8791/ 。首次后端启动自动从data/content.json建立SQLite，后续启动不覆盖已有内容。后端测试：在backend目录运行npm test。

## 构建微信小程序

在frontend目录运行`npm run build:mp-weixin`，用微信开发者工具导入dist/build/mp-weixin。manifest.json的mp-weixin.appid填写自己的真实AppID；当前未填，防止误用他人账号。

微信真机不能访问电脑的127.0.0.1。正式构建前复制.env.example为.env.local，设置VITE_API_BASE为微信后台允许的HTTPS资料服务地址，然后重新构建。无需将AppSecret写入前端。账号注册、主体与类目、备案、管理员扫码、审核和正式发布由账号持有人在官方平台完成。

## 功能

专题首页、人物目录（姓名与别名搜索/省份筛选）、人物档案、分段长卷（人物与阶段筛选/列表模式）、事件阅读、可拖动缩放关系图谱、来源详情、我的阅读。

四项底栏：首页、人物、长卷、我的。原六模块入口保留在首页，足迹/互动/文创仍待对应模块接入。书签、最近阅读、字号偏好仅保存在本机；不是账户同步收藏。

## 数据边界

复用人物合集第九轮查证版转换数据：15位人物、47个明确日期片段、10条已核关系记录。所有事实与来源ID保留。争议事实只归因展示，不生成确定时间线与图谱；草稿事实不公开。不补造生卒月日、人物关系、历史地图或照片。

山水、姓名印记与线图标为本项目原创。参考故宫、数字敦煌、国博、大都会、大英博物馆和Google Arts & Culture的内容组织方式，未复制其馆藏图像或商标。

## 交付与发布区别

frontend/dist/build/mp-weixin是微信编译产物，不代表已经微信审核上线。H5浏览器检查与微信真机验收分别记录。

原Sites公开网站为不依赖电脑开机的阅读展示版，不能直接运行Node.js持久服务。Node.js后端可在支持Node24和HTTPS的主机部署，配置HOST、PORT、ALLOWED_ORIGINS及可持久保存的DB_PATH。详细配置见backend/README.md。

开发源码含前后端锁文件；不打包node_modules、依赖缓存、运行数据库、真实AppID或凭证。交付包由根目录tools/package_delivery.py生成，验收记录在output/验收记录.md。

公开静态网页构建时设置`VITE_DATA_MODE=static`后执行`npm run build:h5`，保持后端运行，在工程根目录运行`node tools/export_static.mjs`导出公开接口结果。微信和正式Node服务模式构建时不设置此变量。静态模式使用同源/data读取资料，可独立托管，不调用127.0.0.1。

