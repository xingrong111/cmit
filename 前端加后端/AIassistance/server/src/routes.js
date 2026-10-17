import { fail, coordinate, usablePoint, routePoint, opening, distance, visible } from './domain.js';
import {createHash} from 'node:crypto';
export function decodePolyline(values) {
  if (!Array.isArray(values) || values.length < 4 || values.length % 2 || values.some(v => typeof v !== 'number' || !Number.isFinite(v)))
    fail(502, 'INVALID_ROUTE', '地图服务返回的路线数据无效。');
  const a = [...values];
  for (let i = 2; i < a.length; i++) a[i] = a[i - 2] + a[i] / 1e6;
  const points = [];
  for (let i = 0; i < a.length; i += 2) points.push(coordinate({ latitude: a[i], longitude: a[i + 1], type: 'gcj02' }));
  return points;
}
export async function walking(input, data, config, signal, fetcher = fetch, cache, execute = fn=>fn()) {
  const origin = coordinate(input?.origin);
  if (!Array.isArray(input.placeIds) || !input.placeIds.length || input.placeIds.length > 4 || new Set(input.placeIds).size !== input.placeIds.length)
    fail(400, 'INVALID_STOPS', '请选择1—4个不同的地点，按加入顺序规划。');
  const stops = input.placeIds.map(id => data.places.find(p => p.id === id && visible(p, config.publicMode)));
  if (stops.some(p => !p)) fail(404, 'PLACE_NOT_FOUND', '所选地点不存在或尚未发布。');
  if (stops.some(p => !routePoint(p,config.publicMode))) fail(409, 'COORDINATE_PENDING', '有地点的导航入口尚未核验，暂时无法规划路线。');
  if (stops.some(p => opening(p).status === 'closed')) fail(409, 'PLACE_CLOSED', '有地点在最新信息中暂停开放，请调整路线。');
  const destinations=stops.map(p=>routePoint(p,config.publicMode));
  let previous = origin;
  for (const p of stops) {
    if (distance(previous, routePoint(p,config.publicMode).coordinate) > 20000) fail(422, 'TOO_FAR', '有站点距离过远，请减少站点或改用地图应用出行。');
    previous = routePoint(p,config.publicMode).coordinate;
  }
  if (!config.mapKey) fail(503, 'MAP_NOT_CONFIGURED', '步行路线服务尚未配置；可以先查看地点与官方信息。');
  if(signal?.aborted)throw signal.reason || new Error('aborted');
  const cacheKey=createHash('sha256').update(JSON.stringify({origin,stops:stops.map(p=>({id:p.id,name:p.name,coordinate:routePoint(p,config.publicMode).coordinate,destinationKind:routePoint(p,config.publicMode).kind,sourceId:routePoint(p,config.publicMode).sourceId,opening:p.opening})),publicMode:config.publicMode,key:config.mapKey})).digest('hex');
  const produce=async signal=>execute(async()=>{
  const legs = []; previous = origin;
  for (const p of stops) {
    const u = new URL('https://apis.map.qq.com/ws/direction/v1/walking/');
    u.search = new URLSearchParams({ from: `${previous.latitude},${previous.longitude}`, to: `${routePoint(p,config.publicMode).coordinate.latitude},${routePoint(p,config.publicMode).coordinate.longitude}`, key: config.mapKey });
    let payload;
    try {
      const resp = await fetcher(u, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) });
      if (!resp.ok) throw new Error('upstream'); payload = await resp.json();
    } catch (e) { if (signal?.aborted) throw e; fail(502, 'MAP_UNAVAILABLE', '地图服务暂时不可用，请稍后重试。'); }
    if(payload.status===112)fail(503,'MAP_IP_DENIED','地图服务出口IP尚未授权，请联系维护人员；反复重试不会恢复。');
    if(payload.status===121)fail(503,'MAP_QUOTA_EXCEEDED','地图服务今日额度已用完，可先保存参观顺序，额度恢复后再规划。');
    if (payload.status !== 0 || !payload.result?.routes?.length) fail(502, 'NO_WALKING_ROUTE', '地图平台没有返回可达步行路线，请调整起点或站点。');
    const route = payload.result.routes[0];
    if (!Number.isFinite(route.distance) || !Number.isFinite(route.duration) || route.distance < 0 || route.duration < 0)
      fail(502, 'INVALID_ROUTE', '地图服务返回的距离或时间无效。');
    legs.push({ placeId: p.id, name: p.name, distanceMeters: route.distance, durationMinutes: route.duration,
      destinationKind:routePoint(p,config.publicMode).kind, sourceId:routePoint(p,config.publicMode).sourceId, points: decodePolyline(route.polyline), steps: (route.steps || []).map(s => ({ instruction: String(s.instruction || ''), distanceMeters: s.distance || 0 })) });
    previous = routePoint(p,config.publicMode).coordinate;
  }
  const result = { provider: '腾讯位置服务', generatedAt: new Date().toISOString(), transport: 'walking', cacheHit:false,
    distanceMeters: legs.reduce((n, l) => n + l.distanceMeters, 0), durationMinutes: legs.reduce((n, l) => n + l.durationMinutes, 0), legs,
    destinationScope:destinations.some(d=>d.kind==='venue_area')?'venue_area':'entrance', notice: '地图平台估算，终点可能为场馆附近；实际游客入口请以现场指引为准。耗时不含寻找入口、排队和预约等待；开放与预约请出发前确认。' };
  return result;
  });
  return cache ? cache.run(cacheKey,produce,signal) : produce(signal);
}
