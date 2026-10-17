# 英迹 · 博物馆专题展

## 1. 主题
用户已确认的纸感专题展：宽松留白、朱红展签、墨绿山水。参考故宫/数字敦煌/国博，并补充大都会艺术博物馆的精选藏品与搜索层次、Google Arts & Culture的专题入口、大英博物馆目录检索。参考组织方式，不复制图片。
## 2. 色彩
所有颜色在frontend/src/styles/theme.css变量中声明。宣纸#FBF5E9、卡片#FFFAF1、墨#35281D、朱红#982B28、墨绿#354D43、金#BD9A67、辅助#75604B。
## 3. 字体
标题系统中文衬线Noto Serif SC/宋体回退，正文Noto Sans SC/系统无衬线，数字Georgia。正文16px、行高1.8，重要标题32–64px，辅助最小12px。字体不依赖外部请求。
## 4. 组件
统一展签、纸卡、筛选条、来源脚注、错误重试与状态文字；操作区域至少44px。细线图标使用自有SVG，原生tabBar输出PNG。卡片展开与来源详情具有完整返回路径。
## 5. 布局
手机16–20px边距，双列目录、单列阅读。桌面最大1200px，首页大幅封面+精选人物阵列，目录可多列，档案正文与证据侧栏分开。四项底栏首页/人物/长卷/我的。
## 6. 深度
极轻纸卡阴影和单色细线，封面采用原创SVG山水。山水不是实际地图；不使用无许可人像。
## 7. 动效
L1按钮反馈、约180ms透明度入场。只动画transform/opacity；支持减少动态效果。图谱可拖动缩放、复位，并有关系文字列表。
## 8. 约束
不编造缺失照片、日期、地点、关系或统计；不虚构登录/账户同步。争议事实有归因，不能入确定时间线。来源元数据不隐去支持范围。没有资料不等同人数为零。不开重型3D与自动播放。所有hex在主题变量或构建配置/原创素材中统一声明。
## 9. 响应
375px与桌面验证，长标题可换行，固定底栏留安全区。微信胶囊由原生导航处理，不画假系统栏。Canvas小程序和H5分别编译，H5验证不等同微信真机验证。

参考：https://www.metmuseum.org/art/collection 、https://artsandculture.google.com/discover 、https://www.britishmuseum.org/collection/collection-online/guide 、https://digicol.dpm.org.cn/ 、https://www.e-dunhuang.com/ 、https://www.chnmuseum.cn/zl/wszl/
