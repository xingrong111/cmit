const tabs=['home','people','radar','assistant','me']
export function backOr(page='home'){
 if(getCurrentPages().length>1)uni.navigateBack({delta:1,fail:()=>go(page)})
 else go(page)
}
export function go(page,params={}){
 if(page==='me'&&params.auth)uni.setStorageSync('yingji:account-intent',{mode:params.auth,returnTo:params.returnTo||''});
 const query=Object.entries(params).filter(([,v])=>v!=null).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&')
 if(page==='timeline')uni.setStorageSync('yingji:timeline-person',{person_id:params.person_id||''})
 if(page==='assistant'&&params.person_id)uni.setStorageSync('yingji:guide-person',{id:params.person_id,name:params.name||''})
 if(page==='radar'&&params.person_id)uni.setStorageSync('yingji:radar-person',params.person_id)
 if(tabs.includes(page)){
  if(page==='timeline')uni.setStorageSync('yingji:timeline-person',{person_id:params.person_id||''})
  uni.switchTab({url:'/pages/'+page+'/index'})
 }else uni.navigateTo({url:'/pages/'+page+'/index'+(query?'?'+query:'')})
}
export function connected(name){uni.showToast({title:name+'正在接入，当前可阅读人物与史料',icon:'none',duration:2500})}
