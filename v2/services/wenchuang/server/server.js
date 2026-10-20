const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { grantsFromHonors, grantsFromLevels, evaluate, createStore } = require('./core');

const catalog = JSON.parse(fs.readFileSync(process.env.WC_CATALOG_PATH || path.join(__dirname, 'catalog.json'), 'utf8'));
const products = new Map(catalog.products.map(p => [p.id, p]));
const store = createStore(process.env.WC_STORE_PATH || path.join(__dirname, 'data', 'claims.json'));
const port = Number(process.env.PORT || 3115);
const accountUrl = process.env.WC_ACCOUNT_URL || 'http://127.0.0.1:3212/api/me';
const honorsUrl = process.env.WC_HONORS_URL || 'http://127.0.0.1:3214/api/honors';
const levelsUrl = process.env.WC_LEVELS_URL || 'http://127.0.0.1:3214/api/levels';
const assetRoot = path.resolve(process.env.WC_ASSET_ROOT || path.join(__dirname, 'assets'));

function respond(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}
async function upstream(url, authorization) {
  const response = await fetch(url, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('依赖服务响应异常');
  return response.json();
}
async function context(req, needHonors) {
  const authorization = req.headers.authorization || '';
  if (!/^Bearer\s+\S+$/i.test(authorization)) return { error: 401, message: '请先登录账户' };
  try {
    const account = await upstream(accountUrl, authorization);
    if (!account.user?.id) return { error: 401, message: '登录已失效，请重新登录' };
    if (!needHonors) return { userId: String(account.user.id), grants: [], levels: [] };
    const [honors, levels] = await Promise.all([upstream(honorsUrl, authorization), upstream(levelsUrl, authorization)]);
    return { userId: String(account.user.id), grants: grantsFromHonors(honors), levels: grantsFromLevels(levels) };
  } catch { return { error: 503, message: '暂时无法核验账户或称号，请稍后重试' }; }
}
function validAssets(product) {
  if (product.asset_status !== '已就绪' || !Array.isArray(product.assets) || !product.assets.length) return false;
  return product.assets.every(asset => {
    if (!/^[A-Za-z0-9_-]+\.(png|jpg|jpeg|webp|pdf)$/i.test(asset)) return false;
    const file = path.resolve(assetRoot, asset);
    return file.startsWith(assetRoot + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile();
  });
}
function safeProduct(product, grants, levels, claimedIds) {
  return { id: product.id, name: product.name, condition: product.condition,
    ...evaluate(product, grants, levels), claimed: claimedIds.has(product.id),
    asset_status: validAssets(product) ? '已就绪' : '待素材',
    assets: claimedIds.has(product.id) && validAssets(product) ? product.assets : [] };
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/api/health' && req.method === 'GET') return respond(res, 200, { ok: true, service: 'wencuang-claim', catalog_version: catalog.version });
    if (url.pathname === '/api/catalog' && req.method === 'GET') return respond(res, 200, { products: catalog.products.map(p => ({ id: p.id, name: p.name, condition: p.condition })) });
    if (req.method === 'GET' && (url.pathname === '/' || /^\/[A-Za-z0-9_-]+\.(?:html|css|js)$/.test(url.pathname) || /^\/images\/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(url.pathname))) {
      const file = path.resolve(__dirname, '..', 'public', '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      const base = path.resolve(__dirname, '..', 'public');
      if (!file.startsWith(base + path.sep)) return respond(res, 403, { error: '资源路径无效' });
      if (!fs.existsSync(file)) return respond(res, 404, { error: '资源不存在' });
      const ext = path.extname(file).toLowerCase();
      const type = ({ '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp' })[ext];
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      return fs.createReadStream(file).pipe(res);
    }
    if (url.pathname === '/api/products' && req.method === 'GET' && !/^Bearer\s+\S+$/i.test(req.headers.authorization || '')) {
      return respond(res, 200, { products: catalog.products.map(p => ({ id:p.id,name:p.name,condition:p.condition,guest:true,unlocked:false,claimed:false,progress:0,required:p.condition.count||1,asset_status:validAssets(p)?'已就绪':'待素材',assets:[] })) });
    }
    const needsHonors = (url.pathname === '/api/products' && req.method === 'GET') || (url.pathname.endsWith('/claim') && req.method === 'POST');
    const ctx = await context(req, needsHonors);
    if (ctx.error) return respond(res, ctx.error, { error: ctx.message });
    const claimed = store.list(ctx.userId);
    const claimedIds = new Set(claimed.map(row => row.product_id));
    if (url.pathname === '/api/products' && req.method === 'GET') return respond(res, 200, { products: catalog.products.map(p => safeProduct(p, ctx.grants, ctx.levels, claimedIds)), note: catalog.note });
    if (url.pathname === '/api/claims' && req.method === 'GET') return respond(res, 200, { claims: claimed.map(row => ({ ...row, name: products.get(row.product_id)?.name || row.product_id, assets: validAssets(products.get(row.product_id) || {}) ? products.get(row.product_id).assets : [] })) });
    const match = url.pathname.match(/^\/api\/products\/(WC\d{3})\/claim$/);
    if (match && req.method === 'POST') {
      const product = products.get(match[1]);
      if (!product) return respond(res, 404, { error: '作品不存在' });
      const prior = claimed.find(row => row.product_id === product.id);
      if (prior) return respond(res, 200, { claim: prior, already_claimed: true });
      if (!evaluate(product, ctx.grants, ctx.levels).unlocked) return respond(res, 403, { error: '尚未满足解锁条件' });
      if (!validAssets(product)) return respond(res, 409, { error: '作品原图待交付，暂不能领取', code: 'ASSET_PENDING' });
      const row = { product_id: product.id, claimed_at: new Date().toISOString() };
      const result = await store.claim(ctx.userId, product.id, row);
      return respond(res, result.created ? 201 : 200, { claim: result.row, already_claimed: !result.created });
    }
    const asset = url.pathname.match(/^\/api\/claims\/(WC\d{3})\/assets\/([A-Za-z0-9_-]+\.(?:png|jpg|jpeg|webp|pdf))$/i);
    if (asset && req.method === 'GET') {
      const product = products.get(asset[1]);
      if (!product || !claimedIds.has(product.id) || !validAssets(product) || !product.assets.includes(asset[2])) return respond(res, 404, { error: '素材不存在或尚未领取' });
      const file = path.resolve(assetRoot, asset[2]);
      const type = /\.pdf$/i.test(file) ? 'application/pdf' : /\.png$/i.test(file) ? 'image/png' : /\.webp$/i.test(file) ? 'image/webp' : 'image/jpeg';
      res.writeHead(200, { 'Content-Type': type, 'Content-Disposition': `attachment; filename="${asset[2]}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
      return fs.createReadStream(file).pipe(res);
    }
    if (req.method !== 'GET' && req.method !== 'POST') return respond(res, 405, { error: '请求方法不支持' });
    return respond(res, 404, { error: '接口不存在' });
  } catch { return respond(res, 500, { error: '文创服务暂时不可用' }); }
});
if (require.main === module) server.listen(port, '127.0.0.1', () => console.log(`文创领取 http://127.0.0.1:${port}`));
module.exports = { server };
