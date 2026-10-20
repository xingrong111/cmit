/**
 * 英迹·山河英雄谱｜账户、评论与管理员审核（初版）
 * 零依赖开发服务：Node 24+，数据保存到 data.json。
 * 生产环境须替换为数据库、HTTPS、受控身份提供商、持久会话与内容安全服务。
 */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3103);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_FILE = path.join(ROOT, 'data.json');
const sessions = new Map();
const MAX_COMMENT = 500;

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};
const fail = (res, status, code, message) => json(res, status, { error: { code, message } });
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${crypto.randomUUID()}`;
const sanitizeText = (value) => String(value || '').trim().replace(/[<>]/g, '');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const digest = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${digest}`;
}
function verifyPassword(password, saved) {
  const [salt, digest] = String(saved || '').split(':');
  if (!salt || !digest) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(digest, 'hex'));
}
async function readDb() { return JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); }
async function writeDb(db) { await fs.writeFile(DATA_FILE, `${JSON.stringify(db, null, 2)}\n`, 'utf8'); }
async function audit(db, actorId, action, targetType, targetId, detail = {}) {
  db.audit.push({ id: id('audit'), actorId, action, targetType, targetId, detail, createdAt: now() });
}
function publicUser(user) { return { id: user.id, nickname: user.nickname, role: user.role, createdAt: user.createdAt }; }
function tokenFrom(req) { return (req.headers.authorization || '').replace(/^Bearer\s+/i, ''); }
function currentUser(req, db) {
  const session = sessions.get(tokenFrom(req));
  if (!session || session.expiresAt < Date.now()) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}
function requireUser(req, res, db) {
  const user = currentUser(req, db);
  if (!user) { fail(res, 401, 'UNAUTHENTICATED', '请先登录后再继续。'); return null; }
  return user;
}
function requireAdmin(req, res, db) {
  const user = requireUser(req, res, db);
  if (!user) return null;
  if (user.role !== 'admin') { fail(res, 403, 'FORBIDDEN', '该操作仅对已授权管理员开放。'); return null; }
  return user;
}
async function body(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw new Error('BODY_TOO_LARGE'); }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error('INVALID_JSON'); }
}
function commentView(comment, user) {
  const base = {
    id: comment.id, topicType: comment.topicType, topicId: comment.topicId, topicTitle: comment.topicTitle,
    content: comment.content, status: comment.status, submittedAt: comment.submittedAt,
    updatedAt: comment.updatedAt, version: comment.version
  };
  if (comment.status === 'approved') return { ...base, author: { nickname: comment.authorNickname } };
  if (user && (user.id === comment.authorId || user.role === 'admin')) return { ...base, reviewReason: comment.reviewReason || '', author: { id: comment.authorId, nickname: comment.authorNickname }, ...(user.role === 'admin' ? { history: comment.history } : {}) };
  return null;
}
async function initialize() {
  try { await fs.access(DATA_FILE); return; } catch { /* create seed */ }
  const admin = { id: 'usr_admin_demo', email: 'admin@yingji.local', nickname: '资料审核员', role: 'admin', passwordHash: hashPassword('ChangeMe!2026'), createdAt: now(), agreementVersion: 'v1.0', agreementAcceptedAt: now() };
  const learner = { id: 'usr_demo_learner', email: 'learner@yingji.local', nickname: '山河学习者', role: 'user', passwordHash: hashPassword('LearnMe!2026'), createdAt: now(), agreementVersion: 'v1.0', agreementAcceptedAt: now() };
  await writeDb({
    users: [admin, learner],
    comments: [{ id: 'cmt_seed_approved', authorId: learner.id, authorNickname: learner.nickname, topicType: 'person', topicId: 'qu-qiubai', topicTitle: '瞿秋白 · 人物档案', content: '阅读资料来源后，更能理解时间线中“日期精度”的意义。', status: 'approved', reviewReason: '', submittedAt: '2026-10-09T09:00:00.000Z', updatedAt: '2026-10-09T09:30:00.000Z', version: 1, history: [{ action: 'submitted', at: '2026-10-09T09:00:00.000Z' }, { action: 'approved', at: '2026-10-09T09:30:00.000Z', actorId: admin.id }] }],
    facts: [
      { id: 'fact_001', person: '瞿秋白', field: '出生地', value: '江苏常州', evidence: '地方志与纪念馆资料待复核', status: 'pending', version: 1, updatedAt: now(), reviewReason: '' },
      { id: 'fact_002', person: '周恩来', field: '出生地', value: '江苏淮安府山阳县', evidence: '周恩来故居与江苏档案资料', status: 'published', version: 2, updatedAt: now(), reviewReason: '' }
    ],
    audit: []
  });
}

async function serveStatic(req, res, pathname) {
  const file = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const resolved = path.resolve(PUBLIC_DIR, file);
  if (!resolved.startsWith(PUBLIC_DIR)) return fail(res, 403, 'FORBIDDEN', '无权访问该资源。');
  try {
    const content = await fs.readFile(resolved);
    const type = resolved.endsWith('.css') ? 'text/css; charset=utf-8' : resolved.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' }); res.end(content);
  } catch { fail(res, 404, 'NOT_FOUND', '页面不存在。'); }
}

async function api(req, res, pathname) {
  const db = await readDb();
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const input = await body(req); const email = sanitizeText(input.email).toLowerCase(); const nickname = sanitizeText(input.nickname); const password = String(input.password || '');
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, 'INVALID_EMAIL', '请输入有效邮箱。');
    if (nickname.length < 2 || nickname.length > 20) return fail(res, 400, 'INVALID_NICKNAME', '昵称应为2—20个字符。');
    if (password.length < 8) return fail(res, 400, 'WEAK_PASSWORD', '密码至少8位。');
    if (!input.agreementAccepted) return fail(res, 400, 'AGREEMENT_REQUIRED', '请先阅读并同意用户协议。');
    if (db.users.some((user) => user.email === email)) return fail(res, 409, 'EMAIL_EXISTS', '该邮箱已注册，请直接登录。');
    const user = { id: id('usr'), email, nickname, role: 'user', passwordHash: hashPassword(password), createdAt: now(), agreementVersion: 'v1.0', agreementAcceptedAt: now() };
    db.users.push(user); await audit(db, user.id, 'register', 'user', user.id); await writeDb(db);
    return json(res, 201, { user: publicUser(user), message: '注册成功，请登录。' });
  }
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const input = await body(req); const email = sanitizeText(input.email).toLowerCase(); const user = db.users.find((item) => item.email === email);
    if (!user || !verifyPassword(String(input.password || ''), user.passwordHash)) return fail(res, 401, 'INVALID_CREDENTIALS', '邮箱或密码不正确。');
    const token = crypto.randomBytes(32).toString('base64url'); sessions.set(token, { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    await audit(db, user.id, 'login', 'user', user.id); await writeDb(db); return json(res, 200, { token, user: publicUser(user) });
  }
  if (req.method === 'POST' && pathname === '/api/auth/logout') { sessions.delete(tokenFrom(req)); return json(res, 200, { message: '已退出登录。' }); }
  if (req.method === 'GET' && pathname === '/api/me') { const user = currentUser(req, db); return json(res, 200, { user: user ? publicUser(user) : null }); }

  if (req.method === 'GET' && pathname === '/api/comments') {
    const url = new URL(req.url, `http://${req.headers.host}`); const comments = db.comments.filter((item) => item.status === 'approved' && (!url.searchParams.get('topicId') || item.topicId === url.searchParams.get('topicId'))).map((item) => commentView(item, null));
    return json(res, 200, { items: comments });
  }
  if (req.method === 'POST' && pathname === '/api/comments') {
    const user = requireUser(req, res, db); if (!user) return;
    const input = await body(req); const content = sanitizeText(input.content); const topicId = sanitizeText(input.topicId); const topicTitle = sanitizeText(input.topicTitle); const topicType = sanitizeText(input.topicType || 'person');
    if (!topicId || !topicTitle) return fail(res, 400, 'TOPIC_REQUIRED', '请选择讨论主题后再提交。');
    if (content.length < 2 || content.length > MAX_COMMENT) return fail(res, 400, 'INVALID_COMMENT', `评论应为2—${MAX_COMMENT}个字符。`);
    const comment = { id: id('cmt'), authorId: user.id, authorNickname: user.nickname, topicType, topicId, topicTitle, content, status: 'pending', reviewReason: '', submittedAt: now(), updatedAt: now(), version: 1, history: [{ action: 'submitted', at: now(), actorId: user.id }] };
    db.comments.push(comment); await audit(db, user.id, 'submit_comment', 'comment', comment.id, { version: 1 }); await writeDb(db);
    return json(res, 201, { item: commentView(comment, user), message: '已提交，审核通过后将在讨论区公开。' });
  }
  if (req.method === 'GET' && pathname === '/api/my/comments') {
    const user = requireUser(req, res, db); if (!user) return;
    const items = db.comments.filter((item) => item.authorId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((item) => commentView(item, user));
    return json(res, 200, { items });
  }
  const editMatch = pathname.match(/^\/api\/comments\/([^/]+)$/);
  if (req.method === 'PUT' && editMatch) {
    const user = requireUser(req, res, db); if (!user) return; const input = await body(req); const comment = db.comments.find((item) => item.id === editMatch[1]);
    if (!comment) return fail(res, 404, 'NOT_FOUND', '评论不存在。'); if (comment.authorId !== user.id) return fail(res, 403, 'FORBIDDEN', '只能编辑自己的评论。');
    if (!['pending', 'rejected'].includes(comment.status)) return fail(res, 409, 'NOT_EDITABLE', '已公开评论不能直接修改，请重新发表。');
    if (Number(input.version) !== comment.version) return fail(res, 409, 'VERSION_CONFLICT', '评论已更新，请刷新后再试。');
    const content = sanitizeText(input.content); if (content.length < 2 || content.length > MAX_COMMENT) return fail(res, 400, 'INVALID_COMMENT', `评论应为2—${MAX_COMMENT}个字符。`);
    comment.content = content; comment.status = 'pending'; comment.reviewReason = ''; comment.updatedAt = now(); comment.version += 1; comment.history.push({ action: 'resubmitted', at: now(), actorId: user.id, version: comment.version });
    await audit(db, user.id, 'resubmit_comment', 'comment', comment.id, { version: comment.version }); await writeDb(db); return json(res, 200, { item: commentView(comment, user), message: '已重新提交审核。' });
  }

  if (req.method === 'GET' && pathname === '/api/admin/dashboard') {
    const admin = requireAdmin(req, res, db); if (!admin) return;
    return json(res, 200, { pendingComments: db.comments.filter((item) => item.status === 'pending').length, pendingFacts: db.facts.filter((item) => item.status === 'pending').length, recentAudit: db.audit.slice(-8).reverse() });
  }
  if (req.method === 'GET' && pathname === '/api/admin/comments') {
    const admin = requireAdmin(req, res, db); if (!admin) return; const url = new URL(req.url, `http://${req.headers.host}`); const status = url.searchParams.get('status') || 'pending';
    const items = db.comments.filter((item) => status === 'all' || item.status === status).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)).map((item) => commentView(item, admin)); return json(res, 200, { items });
  }
  const reviewMatch = pathname.match(/^\/api\/admin\/comments\/([^/]+)\/review$/);
  if (req.method === 'POST' && reviewMatch) {
    const admin = requireAdmin(req, res, db); if (!admin) return; const input = await body(req); const comment = db.comments.find((item) => item.id === reviewMatch[1]);
    if (!comment) return fail(res, 404, 'NOT_FOUND', '评论不存在。'); if (comment.status !== 'pending' || Number(input.version) !== comment.version) return fail(res, 409, 'VERSION_CONFLICT', '该评论已被处理或版本已变化。');
    if (!['approved', 'rejected'].includes(input.decision)) return fail(res, 400, 'INVALID_DECISION', '请选择通过或退回。');
    const reason = sanitizeText(input.reason); if (input.decision === 'rejected' && reason.length < 2) return fail(res, 400, 'REASON_REQUIRED', '退回时请填写清楚的修改原因。');
    comment.status = input.decision; comment.reviewReason = input.decision === 'rejected' ? reason : ''; comment.updatedAt = now(); comment.version += 1; comment.history.push({ action: input.decision, at: now(), actorId: admin.id, reason, version: comment.version });
    await audit(db, admin.id, `review_comment_${input.decision}`, 'comment', comment.id, { reason, version: comment.version }); await writeDb(db); return json(res, 200, { item: commentView(comment, admin), message: input.decision === 'approved' ? '评论已公开。' : '评论已退回给作者修改。' });
  }
  if (req.method === 'GET' && pathname === '/api/admin/facts') { const admin = requireAdmin(req, res, db); if (!admin) return; return json(res, 200, { items: db.facts }); }
  const factMatch = pathname.match(/^\/api\/admin\/facts\/([^/]+)\/review$/);
  if (req.method === 'POST' && factMatch) {
    const admin = requireAdmin(req, res, db); if (!admin) return; const input = await body(req); const fact = db.facts.find((item) => item.id === factMatch[1]);
    if (!fact) return fail(res, 404, 'NOT_FOUND', '事实条目不存在。'); if (fact.status !== 'pending' || Number(input.version) !== fact.version) return fail(res, 409, 'VERSION_CONFLICT', '条目已被处理或版本已变化。');
    if (!['published', 'rejected'].includes(input.decision)) return fail(res, 400, 'INVALID_DECISION', '请选择发布或退回。');
    const reason = sanitizeText(input.reason); if (input.decision === 'rejected' && reason.length < 2) return fail(res, 400, 'REASON_REQUIRED', '退回时请填写核验原因。');
    fact.status = input.decision; fact.reviewReason = input.decision === 'rejected' ? reason : ''; fact.updatedAt = now(); fact.version += 1; await audit(db, admin.id, `review_fact_${input.decision}`, 'fact', fact.id, { reason, version: fact.version }); await writeDb(db); return json(res, 200, { item: fact, message: input.decision === 'published' ? '事实已发布。' : '事实已退回，未对普通用户公开。' });
  }
  return fail(res, 404, 'NOT_FOUND', '接口不存在。');
}

async function request(req, res) {
  try { const pathname = new URL(req.url, `http://${req.headers.host}`).pathname; if (pathname.startsWith('/api/')) return await api(req, res, pathname); return await serveStatic(req, res, pathname); }
  catch (error) { console.error(error); const message = error.message === 'INVALID_JSON' ? '请求数据格式不正确。' : error.message === 'BODY_TOO_LARGE' ? '请求内容过大。' : '服务暂时不可用，请稍后重试。'; return fail(res, 500, 'SERVER_ERROR', message); }
}

initialize().then(() => http.createServer(request).listen(PORT, '127.0.0.1', () => console.log(`英迹账户审核初版：http://127.0.0.1:${PORT}`)));
