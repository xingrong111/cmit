import {createHash} from 'node:crypto';
import {coordinate,fail,visible} from './domain.js';
// Candidate records never modify the curated places or approve navigation.
export async function poiCandidates(input,data,config,signal,fetcher=fetch,cache,execute=fn=>fn()){
 const p=data.places.find(p=>p.id===input?.placeId&&visible(p,config.publicMode));
 if(!p)fail(404,'PLACE_NOT_FOUND','地点不存在或尚未发布。');
 if(!config.mapKey)fail(503,'MAP_NOT_CONFIGURED','地图服务尚未配置。');
 const key=createHash('sha256').update(JSON.stringify({city:p.city,name:p.name,key:config.mapKey})).digest('hex');
 const produce=async shared=>execute(async()=>{
  const url=new URL('https://apis.map.qq.com/ws/place/v1/search/');
  url.search=new URLSearchParams({keyword:p.name,boundary:`region(${p.city},0)`,page_size:'5',key:config.mapKey});
  let payload;
  try{const response=await fetcher(url,{signal:shared?AbortSignal.any([shared,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});if(!response.ok)throw Error('upstream');payload=await response.json();}
  catch(e){if(shared?.aborted)throw e;fail(502,'MAP_UNAVAILABLE','地图候选查询暂时不可用。');}
  if(payload.status===112)fail(503,'MAP_IP_DENIED','地图服务出口IP尚未授权。');
  if(payload.status===121)fail(503,'MAP_QUOTA_EXCEEDED','地图服务今日额度已用完。');
  if(payload.status!==0||!Array.isArray(payload.data))fail(502,'INVALID_POI','地图候选结果无效。');
  const items=payload.data.slice(0,5).map(item=>({id:String(item.id||''),name:String(item.title||''),address:String(item.address||''),coordinate:coordinate({latitude:item.location?.lat,longitude:item.location?.lng,type:'gcj02'}),category:String(item.category||''),telephone:String(item.tel||''),entranceVerified:false}));
  return {placeId:p.id,provider:'腾讯位置服务',generatedAt:new Date().toISOString(),items,notice:'仅为地图POI候选，不证明游客入口、营业状态或历史关联。'};
 });
 return cache?cache.run(key,produce,signal):produce(signal);
}
