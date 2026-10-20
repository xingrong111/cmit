import {convertGPS} from './定位.js';
import { present } from './presentation.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer } from './assistant.js';
import { walking } from './routes.js';
import {poiCandidates} from './poi.js';
import {MapCache} from './map-cache.js';
import { AppError, fail, visible, coordinate, distance, usablePoint, routePoint, publicPlace, validateData } from './domain.js';
const here = path.dirname(fileURLToPath(import.meta.url));
export function envConfig() {
  return { publicMode: process.env.PUBLIC_MODE === 'true', modelKey: process.env.MODEL_API_KEY || '',
    modelBase: process.env.MODEL_BASE_URL || 'https://api.deepseek.com', modelName: process.env.MODEL_NAME || 'deepseek-flash',
    browserMapKey:process.env.TENCENT_MAP_BROWSER_KEY || '',mapStyleId:process.env.TENCENT_MAP_STYLE_ID||'',mapKey: process.env.TENCENT_MAP_KEY || '' };
}
async function body(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length; if (size > 24000) fail(413, 'BODY_TOO_LARGE', '请求内容过长。');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'INVALID_JSON', '请求格式无效。'); }
}
export function createApp({ data, config = envConfig(), fetcher = fetch, maxRequests = 30 } = {}) {
  data ||= JSON.parse(fs.readFileSync(path.join(here, '../data/content.json'), 'utf8'));
  const errors = validateData(data); if (errors.length) throw new Error(errors.join('\n'));
  const sources = Object.fromEntries(data.sources.map(s => [s.id, s])); const limits = new Map();
  const active={chat:0,route:0,poi:0};
  const mapCache=new MapCache();const poiCache=new MapCache({ttl:600000,max:50});
  const expiry=setInterval(()=>{mapCache.sweep();poiCache.sweep();},180000);expiry.unref();
  async function guarded(kind,fn){if(active[kind]>=2)fail(503,'SERVICE_BUSY','当前请求较多，请稍后重试。');active[kind]++;try{return await fn();}finally{active[kind]--;}}
  const server = http.createServer(async (req, res) => {
    const send = (status, payload) => {
      if (res.destroyed) return;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(payload));
    };
    const controller = new AbortController();
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });
    try {
      const u = new URL(req.url, 'http://localhost'), method = req.method;
      // No user locations, chat text or credentials are written to logs or disk.
      if (u.pathname.startsWith('/api/')) {
        const now = Date.now();
        for (const [k, v] of limits) if (now - v.start > 60000) limits.delete(k);
        const ip = req.socket.remoteAddress; const item = limits.get(ip) || { start: now, count: 0 };
        if (++item.count > maxRequests) fail(429, 'RATE_LIMITED', '请求较频繁，请一分钟后再试。');
        limits.set(ip, item);
      }
      if (method === 'GET' && u.pathname === '/health') return send(200, { ok: true });
      if (method === 'GET' && u.pathname === '/api/config') return send(200, { publicMode: config.publicMode,
        modelConfigured: Boolean(config.modelKey), walkingConfigured: Boolean(config.mapKey),
        browserMapKey:config.browserMapKey||'',mapStyleId:config.mapStyleId||'',cities: [...new Set(data.places.filter(p => visible(p, config.publicMode)).map(p => p.city))],
        contentLabel: config.publicMode ? '已核验已发布资料' : '资料试读 · 待独立复核' });
      if (method === 'POST' && u.pathname === '/api/chat') return send(200, await guarded('chat',async()=>present(await answer(await body(req), data, config, controller.signal, fetcher))));
      if(method==='POST'&&u.pathname==='/api/position')return send(200,await guarded('poi',()=>convertGPSPending()));
      async function convertGPSPending(){return convertGPS(await body(req),config,controller.signal,fetcher);}
      if (method === 'POST' && u.pathname === '/api/routes') return send(200, await walking(await body(req), data, config, controller.signal, fetcher,mapCache,fn=>guarded('route',fn)));
      if(method==='POST'&&u.pathname==='/api/poi-candidates'){
        if(config.publicMode||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))fail(403,'LOCAL_TOOL_ONLY','候选点查询仅供本机资料核查。');
        return send(200,await poiCandidates(await body(req),data,config,controller.signal,fetcher,poiCache,fn=>guarded('poi',fn)));
      }
      if (method === 'GET' && u.pathname === '/api/places') {
        const q = (u.searchParams.get('q') || '').slice(0, 80), city = u.searchParams.get('city') || '', type = u.searchParams.get('type') || '';
        let origin = null;
        if (u.searchParams.has('lat') || u.searchParams.has('lng')) {
          if (!u.searchParams.get('lat') || !u.searchParams.get('lng')) fail(400, 'INVALID_COORDINATE', '请同时提供经纬度。');
          origin = coordinate({ latitude: Number(u.searchParams.get('lat')), longitude: Number(u.searchParams.get('lng')), type: u.searchParams.get('coordinateType') });
        }
        const radius = Number(u.searchParams.get('radius') || 10000);
        if (!Number.isFinite(radius) || radius < 100 || radius > 50000) fail(400, 'INVALID_RADIUS', '附近范围应为100—50000米。');
        let list = data.places.filter(p => visible(p, config.publicMode) && (!city || p.city === city) && (!type || p.type === type) &&
          (!q || `${p.name}${p.address}${p.summary}`.includes(q))).map(p => {
            const out = publicPlace(p, sources,undefined,config.publicMode);
            if (origin && out.routeReady) { out.distanceMeters = distance(origin, out.routeCoordinate); out.distanceLabel = out.distanceMeters < 1000 ? `${out.distanceMeters}米 · 直线距离` : `${(out.distanceMeters / 1000).toFixed(1)}公里 · 直线距离`; }
            return out;
          });
        if (origin) list = list.filter(p => p.distanceMeters !== null && p.distanceMeters <= radius).sort((a, b) => a.distanceMeters - b.distanceMeters);
        return send(200, { items: list, mode: origin ? 'nearby' : 'city', coordinateType: 'gcj02', total: list.length,
          notice: origin && !list.length ? '附近暂无可用场馆地图点位；可以改用城市浏览。' : '距离是直线距离；步行距离以地图路线为准。' });
      }
      const match = u.pathname.match(/^\/api\/places\/([A-Za-z0-9_-]+)$/);
      if (method === 'GET' && match) {
        const place = data.places.find(p => p.id === match[1] && visible(p, config.publicMode));
        if (!place) fail(404, 'PLACE_NOT_FOUND', '地点不存在或资料尚未发布。');
        return send(200, publicPlace(place, sources,undefined,config.publicMode));
      }
      if(method==='GET'&&/^\/media\/venues\/(qqb-2017|qbc-2011|zwt-2011|ztl-2012|ldy-2020)\.jpg$/.test(u.pathname)){
        const place=data.places.find(p=>p.photo?.url===u.pathname&&visible(p,config.publicMode));
        if(!place||!publicPlace(place,sources,undefined,config.publicMode).photo)fail(404,'NOT_FOUND','图片尚未获准展示。');
        res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'});
        return res.end(fs.readFileSync(path.join(here,'../../media/venues',path.basename(u.pathname))));
      }
      const previewFiles = { '/': 'index.html', '/preview/': 'index.html', '/preview/app.js': 'app.js', '/preview/style.css': 'style.css','/preview/live-map.js':'live-map.js', '/preview/assets/ai-guide-xiaoying-v1.png':'assets/ai-guide-xiaoying-v1.png', '/preview/assets/ai-guide-xiaoying-v1.webp':'assets/ai-guide-xiaoying-v1.webp' };
      const webFiles = { '/web': 'index.html', '/web/': 'index.html', '/web/index.html': 'index.html', '/web/app.js': 'app.js', '/web/style.css': 'style.css', '/web/landscape.svg': 'landscape.svg', '/web/logo.png': 'logo.png', '/web/logo-mark.png': 'logo-mark.png' };
      webFiles['/web/'+encodeURIComponent('关联配置.js')]='关联配置.js';
      webFiles['/web/'+encodeURIComponent('统一视觉.css')]='统一视觉.css';
      previewFiles['/preview/'+encodeURIComponent('统一视觉.css')]='统一视觉.css';
      if (!config.publicMode && method === 'GET' && webFiles[u.pathname]) {
        const file=webFiles[u.pathname], full=path.join(here,'../../web',file);
        res.writeHead(200, {'Content-Type': file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8', 'X-Content-Type-Options':'nosniff'});
        return res.end(fs.readFileSync(full));
      }
      previewFiles['/preview/assets/'+encodeURIComponent('场馆意象.svg')]='assets/场馆意象.svg';
      for(const name of ['map-city.svg',...Array.from({length:5},(_,i)=>'map-route-'+i+'.svg')])previewFiles['/preview/assets/'+name]='assets/'+name;
      if (!config.publicMode && method === 'GET' && previewFiles[u.pathname]) {
        const file = previewFiles[u.pathname], full = path.join(here, '../../preview', file);
        if (!fs.existsSync(full)) fail(404, 'NOT_FOUND', '预览文件不存在。');
        res.writeHead(200, { 'Content-Type': file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
        return res.end(fs.readFileSync(full));
      }
      fail(404, 'NOT_FOUND', '接口不存在。');
    } catch (e) {
      if (controller.signal.aborted) return;
      send(e instanceof AppError ? e.status : 500, { error: { code: e instanceof AppError ? e.code : 'INTERNAL_ERROR', message: e instanceof AppError ? e.message : '服务暂时不可用，请稍后重试。' } });
    }
  });
  server.on('close',()=>{clearInterval(expiry);mapCache.dispose();poiCache.dispose();});
  server.requestTimeout = 20000; server.headersTimeout = 10000; return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = envConfig(), host = process.env.HOST || '127.0.0.1', port = Number(process.env.PORT || 3100);
  createApp({ config }).listen(port, host, () => console.log(`英迹AI与足迹服务：http://${host}:${port} · ${config.publicMode ? '公开模式' : '资料试读模式'}`));
}
