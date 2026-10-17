/**
 * 英迹·山河英雄谱｜成员5 学习挑战
 * 零依赖本地服务。题目保持待核验，进度只存在本目录 data/progress.json。
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createLearning } = require('./learn.js');
const { createManage } = require('./manage.js');
const { previewImport, checkImport, saveDraft } = require('./import-check.js');

const PORT = Number(process.env.PORT || 3105);
const HOST = '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const learning = createLearning();
const manage = createManage();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
function readBody(req, limit = 20 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) reject(Object.assign(new Error('请求过大'), { status: 413 }));
      else chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(Object.assign(new Error('请求格式无效'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}
function learnerQuery(url) {
  const id = url.searchParams.get('learner_id');
  if (id && !/^[A-Za-z0-9-]{8,64}$/.test(id)) return { error: '学习者编号无效' };
  return { id };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}`);
    if (url.pathname === '/api/levels' && req.method === 'GET') {
      const query = learnerQuery(url);
      if (query.error) return send(res, 400, { error: query.error });
      return send(res, 200, learning.levels(query.id));
    }
    if (url.pathname === '/api/honors' && req.method === 'GET') {
      const query = learnerQuery(url);
      if (query.error) return send(res, 400, { error: query.error });
      return send(res, 200, learning.titles(query.id));
    }
    if (url.pathname === '/api/attempts' && req.method === 'POST') {
      const body = await readBody(req);
      const result = await learning.start(body.level_id, body.learner_id);
      return send(res, result.status, result.body || { error: result.error });
    }
    const attempt = url.pathname.match(/^\/api\/attempts\/(att_[a-f0-9]{32})(?:\/answers)?$/);
    if (attempt && req.method === 'GET' && !url.pathname.endsWith('/answers')) {
      const result = learning.attempt(attempt[1]);
      return send(res, result.status, result.body || { error: result.error });
    }
    if (attempt && req.method === 'POST' && url.pathname.endsWith('/answers')) {
      const body = await readBody(req);
      const result = await learning.answer(attempt[1], body.choice, body.question_id);
      return send(res, result.status, result.body || { error: result.error });
    }
    if (url.pathname === '/api/manage/levels' && req.method === 'GET') return send(res, 200, manage.listLevels());
    if (url.pathname === '/api/manage/questions' && req.method === 'GET') {
      const result = manage.listQuestions(url.searchParams.get('level_id'));
      return send(res, result.status, result.body);
    }
    if (url.pathname === '/api/manage/questions/preview' && req.method === 'POST') {
      const result = manage.preview(await readBody(req));
      return send(res, result.status, result.body);
    }
    if (url.pathname === '/api/manage/questions/delete' && req.method === 'POST') {
      const body = await readBody(req);
      const result = manage.remove(body.draft_id);
      return send(res, result.status, result.body);
    }
    if (url.pathname === '/api/manage/questions' && req.method === 'POST') {
      const result = manage.save(await readBody(req));
      return send(res, result.status, result.body);
    }
    if (url.pathname === '/api/import/preview' && req.method === 'POST') {
      const body = await readBody(req, 1024 * 1024);
      return send(res, 200, previewImport(body.submission || body));
    }
    if (url.pathname === '/api/import/confirm' && req.method === 'POST') {
      const body = await readBody(req, 1024 * 1024);
      const submission = body.submission || body;
      const checked = checkImport(submission);
      if (!checked.ok) return send(res, 400, { ok: false, published: false, errors: checked.errors });
      const saved = saveDraft('导入预览.json', submission, {});
      return send(res, 201, { ok: true, status: '草稿', question_status: '待核验', published: false, file: path.basename(saved) });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: '请求方法不支持' });
    const requested = path.resolve(PUBLIC_DIR, `.${decodeURIComponent(url.pathname)}`);
    const filePath = requested === PUBLIC_DIR ? path.join(PUBLIC_DIR, 'index.html') : requested;
    if (filePath !== path.join(PUBLIC_DIR, 'index.html') && !filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) return send(res, 403, { error: '路径无效' });
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return send(res, 404, { error: '页面不存在' });
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    send(res, error.status || 500, { error: error.status ? error.message : '服务暂时不可用' });
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => console.log(`学习挑战 http://${HOST}:${PORT}`));
}

module.exports = { server };
