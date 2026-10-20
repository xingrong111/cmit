const tabs=['home','people','timeline','me']
export function go(page,params={}){
 const query=Object.entries(params).filter(([,v])=>v!=null).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&')
 if(tabs.includes(page)){
  if(page==='timeline')uni.setStorageSync('yingji:timeline-person',{person_id:params.person_id||''})
  uni.switchTab({url:'/pages/'+page+'/index'})
 }else uni.navigateTo({url:'/pages/'+page+'/index'+(query?'?'+query:'')})
}
export function connected(name){uni.showToast({title:name+'正在接入，当前可阅读人物与史料',icon:'none',duration:2500})}
