# 英迹资料服务

Node.js 24 + Express 5.2.1 + 内置 SQLite。仅提供阅读；不包含登录、收藏同步、审核或写入接口。

## 启动

```powershell
npm ci --ignore-scripts
npm start
```

默认地址 `http://127.0.0.1:8790/api`。需要调整配置时，将 `.env.example` 复制为 `.env`。生产环境设置 `NODE_ENV=production` 和明确的 `ALLOWED_ORIGINS`，通过 HTTPS 反向代理发布；微信小程序还需在后台配置 request 合法域名。生产启动时未配置来源会直接报错。Node 的 SQLite 模块可能输出实验性提示，不影响当前阅读接口。

初次启动将 `data/content.json` 导入 `data/app.sqlite3`。已有非空数据库不会被启动过程覆盖。`DB_PATH` 可指定其他数据库路径。程序退出会关闭数据库；种子数据保留原人物、事实、事件、来源编号。

## 接口

所有成功响应为 JSON。未收录或未公开返回 404，无效、重复、未知查询参数返回 400，写入请求返回 405。

| 路径 | 查询参数 / 返回 |
| --- | --- |
| `/api/meta` | 版本、自然人数、团体数、事件数、发布范围 |
| `/api/home` | `{meta,featured_people,events,provinces,stages}` |
| `/api/people` | `q` 姓名/别名、`province`、`page` 正整数、`limit` 1–100；默认 page=1、limit=100；返回 `{items,total,page,limit,has_more}` |
| `/api/people/:id` | 人物、已公开事实、事件、来源数、团体成员 |
| `/api/people/:id/timeline` | 可选 `stage`；返回 `{person_id,items,total,stages,undated_count,note}` |
| `/api/people/:id/sources` | `{items}`，来源保留归属、边界、原链接与最终链接 |
| `/api/people/:id/graph` | `{nodes,edges,excluded_note}` |
| `/api/timeline` | 可选 `person_id`、`stage`、`limit` 1–100；返回 `{items,total,stages,undated_count,note}`，事件补充 `person_name`；total 为筛选后数量 |
| `/api/events/:id` | 事件正文、事实和来源 |
| `/api/facts/:id` | 事实和对应来源 |
| `/api/sources/:id` | 来源及其已公开事实 |

stage 合法值：`早年求索`、`时代风云`、`革命实践`、`信念与传承`。省份/阶段等中文参数应由客户端 URL 编码。

只公开 `demo_published` 内容；人物未发布时其事实和事件也不会公开。争议/归属说明可以保留在事实层，但确定时间线与关系图谱只使用 `verified` 事实。没有公开事实引用的来源或显式标为草稿的来源不可读取。出生日期冲突仍为空，不推测完整生平，不扩展来源所支持的事实边界。

开发环境仅允许配置中列出的本机前端来源。可以通过 `ALLOWED_ORIGINS` 设置逗号分隔的精确来源列表；未授权浏览器来源返回 403。无 Origin 的微信原生请求可以读取公开内容，CORS 不作为用户鉴权。

## 验证

```powershell
npm test
```

测试启动临时数据库与真实 HTTP 服务，覆盖原 Python 14 项数据检查及分页、参数校验、首页/全体长卷、草稿来源、CORS 和只读规则。临时数据库位于 tests 下独立目录，关闭服务和 SQLite 后，检查目录归属再清理；不修改运行数据库。

图谱接口支持可选查询参数focus（节点编号）：读取与初始人物连通的指定节点的一跳联系。人物、学校、组织、刊物、地点与史料摘读分别标记kind；category区分直接联系与时代背景，theme供主题筛选。返回节点包含related_count、source_count、description；连线附事实原文excerpt与original_type。补充关系的原文若改变或不再公开已核，则不会继续沿用。接口不写入关系记录。
