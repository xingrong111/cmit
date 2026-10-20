import express from 'express';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createContent, STAGES } from './content.js';

export function createApp({ content = createContent(), allowedOrigins, production = process.env.NODE_ENV === 'production' } = {}) {
  const origins = allowedOrigins ?? (process.env.ALLOWED_ORIGINS?.split(',').map(v => v.trim()).filter(Boolean) ?? (production ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8791', 'http://127.0.0.1:8791']));
  if (production && !origins.length) throw new Error('生产环境必须设置 ALLOWED_ORIGINS');
  const app = express();
  app.disable('x-powered-by');
  app.set('query parser', 'simple');
  app.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (req.headers.origin) {
      if (!origins.includes(req.headers.origin)) return res.status(403).json({ error: '访问来源未获允许' });
      res.set({ 'Access-Control-Allow-Origin': req.headers.origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS' });
    }
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).set('Allow', 'GET,HEAD,OPTIONS').json({ error: '当前接口仅提供阅读' });
    next();
  });
  const validate = schema => (req, res, next) => {
    for (const [key, value] of Object.entries(req.query)) {
      const rule = schema[key];
      if (!rule || typeof value !== 'string' || !rule(value)) return res.status(400).json({ error: `参数 ${key} 无效` });
    }
    next();
  };
  const text = max => v => v.length <= max;
  const id = v => /^[A-Za-z0-9-]{1,80}$/.test(v);
  const positive = max => v => /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v)) && Number(v) <= max;
  const stage = v => !v || STAGES.includes(v);
  const result = (res, data) => data ? res.json(data) : res.status(404).json({ error: '内容不存在或尚未公开' });
  app.get('/api/meta', validate({}), (req, res) => res.json(content.meta()));
  app.get('/api/home', validate({}), (req, res) => res.json({ meta: content.meta(), featured_people: content.people().slice(0, 6), events: content.timeline().items.slice(-4).reverse(), provinces: [...new Set(content.people().map(p => p.province))], stages: STAGES }));
  app.get('/api/people', validate({ q: text(100), province: text(30), page: positive(100000), limit: positive(100) }), (req, res) => {
    const q = (req.query.q ?? '').trim().toLowerCase();
    const all = content.people().filter(p => (!q || (p.name + ' ' + p.aliases.join(' ')).toLowerCase().includes(q)) && (!req.query.province || p.province === req.query.province));
    // Omitting pagination keeps the original full-list API response compatible.
    const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 100);
    res.json({ items: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit, has_more: page * limit < all.length });
  });
  app.get('/api/timeline', validate({ person_id: id, stage, limit: positive(100) }), (req, res) => {
    if (req.query.person_id && !content.person(req.query.person_id)) return result(res, null);
    res.json(content.timeline(req.query.person_id, req.query.stage, Number(req.query.limit ?? 100)));
  });
  app.param('id', (req, res, next, value) => id(value) ? next() : res.status(400).json({ error: '内容编号格式无效' }));
  app.get('/api/people/:id', validate({}), (req, res) => result(res, content.person(req.params.id)));
  app.get('/api/people/:id/timeline', validate({ stage }), (req, res) => result(res, content.person(req.params.id) ? content.timeline(req.params.id, req.query.stage) : null));
  app.get('/api/people/:id/sources', validate({}), (req, res) => {
    const p = content.person(req.params.id);
    result(res, p ? { items: [...new Set(p.facts.map(f => f.source_id))].sort().map(content.source) } : null);
  });
  app.get('/api/people/:id/graph', validate({}), (req, res) => result(res, content.graph(req.params.id)));
  app.get('/api/events/:id', validate({}), (req, res) => {
    const e = content.events().find(e => e.id === req.params.id);
    result(res, e ? { ...e, facts: content.publicFacts().filter(f => e.fact_ids.includes(f.id)), sources: e.source_ids.map(content.source) } : null);
  });
  app.get('/api/facts/:id', validate({}), (req, res) => {
    const f = content.publicFacts().find(f => f.id === req.params.id);
    result(res, f ? { ...f, source: content.source(f.source_id) } : null);
  });
  app.get('/api/sources/:id', validate({}), (req, res) => result(res, content.source(req.params.id)));
  app.use((req, res) => res.status(404).json({ error: '内容不存在或尚未公开' }));
  app.use((error, req, res, next) => res.status(error instanceof URIError ? 400 : 500).json({ error: error instanceof URIError ? '请求地址格式无效' : '服务暂时不可用' }));
  return { app, content };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8790);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须为 1 至 65535');
  const { app, content } = createApp({ content: createContent({ ...(process.env.DB_PATH ? { dbPath: resolve(process.env.DB_PATH) } : {}) }) });
  const server = app.listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`英迹资料服务 http://${process.env.HOST ?? '127.0.0.1'}:${port}`));
  server.on('error', error => { console.error(error.message); content.close(); process.exitCode = 1; });
  const shutdown = () => server.close(() => { content.close(); process.exit(0); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
