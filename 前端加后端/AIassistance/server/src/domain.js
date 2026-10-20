import {visitorInfo} from './venue.js';
export class AppError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export const fail = (status, code, message) => { throw new AppError(status, code, message); };
export function coordinate(value) {
  if (!value || typeof value !== 'object' || value.type !== 'gcj02' ||
      typeof value.latitude !== 'number' || typeof value.longitude !== 'number' ||
      !Number.isFinite(value.latitude) || !Number.isFinite(value.longitude) ||
      Math.abs(value.latitude) > 90 || Math.abs(value.longitude) > 180) {
    fail(400, 'INVALID_COORDINATE', '位置参数无效，请使用GCJ-02坐标。');
  }
  return value;
}
export function distance(a, b) {
  const rad = n => n * Math.PI / 180;
  const v = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, v))));
}
export function usablePoint(place) {
  if (!place.coordinate?.verified || !place.coordinate.sourceId) return false;
  try { coordinate(place.coordinate); return true; } catch { return false; }
}
// A venue-area destination never becomes a verified visitor entrance.
export function routePoint(place, publicMode=false) {
 if(usablePoint(place))return {coordinate:place.coordinate,kind:'entrance',sourceId:place.coordinate.sourceId};
 const m=place.mapCandidate;
 if(!publicMode&&m?.displayApproved&&m.nearbyNavigationApproved===true&&m.sourceId&&place.sourceIds?.includes(m.sourceId)){
  try{coordinate(m.coordinate);return {coordinate:m.coordinate,kind:'venue_area',sourceId:m.sourceId,poiId:m.id};}catch{}
 }
 return null;
}
export function opening(place, now = Date.now()) {
  const item = place.opening;
  const age = item?.checkedAt ? now - Date.parse(item.checkedAt) : Infinity;
  if (!item?.sourceId || !Number.isFinite(age) || age < 0 || age > 7 * 86400000) {
    return { status: 'unknown', text: '开放与预约信息尚未核实，请出发前向场馆确认。', fresh: false };
  }
  return { ...item, fresh: true };
}
export function visible(record, publicMode) {
  return publicMode ? record.reviewStatus === 'verified' && record.published === true :
    ['source_checked', 'verified'].includes(record.reviewStatus);
}
export function safeSource(source) {
  if (!source) return null;
  try {
    const u = new URL(source.url);
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) return null;
    return { ...source };
  } catch { return null; }
}
export function publicPlace(place, sources, now, publicMode=false) {
  const point = usablePoint(place);const destination=routePoint(place,publicMode);
  const linked=place.sourceIds.map(id=>safeSource(sources[id])).filter(Boolean);
  const accessed=linked.map(s=>s.accessedAt).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const evidenceInfo={lastSourceAccess:accessed.at(-1)||'未记录',independentReviewDate:place.reviewedAt||'未记录',reviewLabel:place.reviewStatus==='verified'?'资料状态标记为已核验；请结合复核记录查看':'待独立复核',entranceLabel:point?'有坐标核验记录':'游客入口待核验',openingCheckedAt:place.opening?.checkedAt||'未记录',imageLabel:place.imageStatus||'图片许可待核查'};
  const photo=place.photo&&(!publicMode||(place.photo.status==='verified'&&place.photo.published===true))?place.photo:null;
  const mapCandidate=!publicMode&&place.mapCandidate?.displayApproved?place.mapCandidate:null;
  return { ...place,photo,mapCandidate,candidateMapReady:Boolean(mapCandidate),evidenceInfo,visitorService:visitorInfo(place,sources), coordinate: point ? place.coordinate : null, navigationReady: point, entranceReady:point, routeReady:Boolean(destination), routeCoordinate:destination?.coordinate||null, destinationKind:destination?.kind||null, navigationNotice:destination?.kind==='venue_area'?'地图点位用于前往场馆附近，实际游客入口请以现场指引为准；不代表场馆正在开放。':'开放和预约请出发前确认。',
    opening: opening(place, now), sources: place.sourceIds.map(id => safeSource(sources[id])).filter(Boolean),
    distanceMeters: null, distanceLabel: destination ? '选择当前位置后显示至地图点位的直线距离' : '场馆地图点位待确认',
    contentLabel: place.reviewStatus === 'verified' ? '已核验资料' : '资料试读 · 待独立复核' };
}
export function validateData(data) {
  const errors = [], sources = new Map(), ids = new Set();
  if (!Array.isArray(data.sources) || !Array.isArray(data.facts) || !Array.isArray(data.places)) return ['数据必须包含sources、facts、places数组。'];
  for (const f of data.facts) if (!f.text || !f.personId || !Array.isArray(f.keywords) || !f.keywords.length) errors.push(`史实条目缺字段：${f.id}`);
  for (const p of data.places) if (!p.name || !p.city || !p.type || !p.address || !Array.isArray(p.visitFocus) || !p.visitFocus.length || !Array.isArray(p.relatedPeople)) errors.push(`地点条目缺字段：${p.id}`);
  for (const s of data.sources || []) {
    if (!s.id || sources.has(s.id) || !safeSource(s) || !s.title || !s.institution || !s.accessedAt || !s.position)
      errors.push(`来源缺字段/重复/地址无效：${s.id}`);
    sources.set(s.id, s);
  }
  for (const record of [...(data.facts || []), ...(data.places || [])]) {
    if (!record.id || ids.has(record.id)) errors.push(`条目ID重复：${record.id}`);
    ids.add(record.id);
    if (!['draft', 'source_checked', 'verified', 'conflict'].includes(record.reviewStatus)) errors.push(`核验状态无效：${record.id}`);
    if (record.published && record.reviewStatus !== 'verified') errors.push(`未核条目不得公开：${record.id}`);
    if (!record.sourceIds?.length || record.sourceIds.some(id => !sources.has(id))) errors.push(`来源关联缺失：${record.id}`);
    if (record.text && !record.keywords?.length) errors.push(`检索关键词缺失：${record.id}`);
    if (record.name && (!record.city || !record.address || !record.visitFocus?.length)) errors.push(`地点缺字段：${record.id}`);
    if (record.coordinate?.verified) {
      if (!usablePoint(record) || !sources.has(record.coordinate.sourceId)) errors.push(`导航坐标依据缺失：${record.id}`);
    }
    if (record.opening?.sourceId && !sources.has(record.opening.sourceId)) errors.push(`开放信息来源缺失：${record.id}`);
    if(record.visitorInfo){
      for(const key of ['hours','reservation','admission','accessibility','photography']){
        const item=record.visitorInfo[key];
        if(item&&(!item.text||!item.sourceIds?.length||item.sourceIds.some(id=>!sources.has(id)||!record.sourceIds.includes(id))))errors.push(`参观信息来源无效：${record.id}/${key}`);
      }
      for(const c of record.visitorInfo.contacts||[])if(!/^0\d{2,3}-\d{7,8}$/.test(c.number)||!c.label||!c.sourceIds?.length||c.sourceIds.some(id=>!sources.has(id)||!record.sourceIds.includes(id)))errors.push(`场馆联系电话依据无效：${record.id}`);
    }
    if(record.photo&&(!safeSource({url:record.photo.sourceURL})||!safeSource({url:record.photo.licenseURL})||record.photo.license!=='CC BY-SA 4.0'||!record.photo.author||!record.photo.caption||!record.photo.changes||record.photo.url!=='/media/venues/qqb-2017.jpg'||(record.photo.published&&record.photo.status!=='verified')))errors.push(`照片来源或许可记录无效：${record.id}`);
    if(record.mapCandidate){const m=record.mapCandidate;if(m.nearbyNavigationApproved===true&&(m.nearbyNavigationScope!=='venue_area'||!/^\d{4}-\d{2}-\d{2}$/.test(m.nearbyNavigationApprovedAt||'')))errors.push(`附近导航范围或日期无效：${record.id}`);try{coordinate(m.coordinate);}catch{errors.push(`候选坐标无效：${record.id}`);}if(!m.id||!m.name||!m.address||!m.sourceId||!record.sourceIds.includes(m.sourceId)||!sources.has(m.sourceId)||m.entranceVerified!==false)errors.push(`地图候选依据无效：${record.id}`);}
  }
  return errors;
}
