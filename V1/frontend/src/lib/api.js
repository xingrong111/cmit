import deployment from '../data/部署配置.json';
import {readingPresentation} from './阅读标题.js';
let defaultBase=deployment.apiOrigin.replace(/\/$/,'')+'/api/reading'
// #ifdef H5
defaultBase=location.origin+'/api/reading'
// #endif
export const API_BASE=(import.meta.env.VITE_API_BASE||defaultBase).replace(/\/$/,'')
export function api(path,params={}){
 if(import.meta.env.VITE_DATA_MODE==='static') return staticApi(path,params)
 const query=Object.entries(params).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&')
 return new Promise((resolve,reject)=>uni.request({url:API_BASE+'/'+path+(query?'?'+query:''),timeout:12000,
  success:r=>r.statusCode>=200&&r.statusCode<300?resolve(readingPresentation(r.data)):reject(new Error(r.data?.error||'内容暂时无法读取')),
  fail:()=>reject(new Error('暂时无法连接资料服务，请检查网络后重试'))}))
}
function staticApi(path,params){
 const file=path==='timeline'&&params.person_id?'people/'+params.person_id+'/timeline':path
 return new Promise((resolve,reject)=>uni.request({url:'/data/'+file+'.json',timeout:12000,
 success:r=>{
  if(r.statusCode!==200) return reject(new Error('内容不存在或尚未公开'))
  let data=r.data
  if(path==='people'){
   const q=(params.q||'').trim().toLowerCase()
   const items=data.items.filter(p=>(!q||(p.name+' '+p.aliases.join(' ')).toLowerCase().includes(q))&&(!params.province||p.province===params.province))
   const page=Number(params.page||1),limit=Number(params.limit||100)
   data={...data,items:items.slice((page-1)*limit,page*limit),total:items.length,page,limit,has_more:page*limit<items.length}
  } else if(path==='timeline'||path.endsWith('/timeline')){
   const items=data.items.filter(e=>!params.stage||e.stage===params.stage)
   data={...data,items:items.slice(0,Number(params.limit||100)),total:items.length}
  }
  resolve(readingPresentation(data))
 },fail:()=>reject(new Error('资料暂时无法读取，请重试'))}))
}
