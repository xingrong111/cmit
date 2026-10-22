// 悬浮小迹的全局状态：所有页面共用同一份位置、展开状态与对话，跳转页面后保持一致。
import {ref} from 'vue';
import {markTask} from './新手任务.js';

export const store={inited:false};
export const expanded=ref(false),docked=ref(false),side=ref('right');
export const x=ref(0),y=ref(0),winX=ref(0),winY=ref(0),winW=ref(338),winH=ref(428);
export const question=ref(''),messages=ref([]),busy=ref(false),error=ref(''),waitText=ref('小迹正在生成回答…');
export const followLatest=ref(true),threadTop=ref(0);

let pending=null,waitTimer=null,sequence=0;

export function scrollEnd(){
 if(!followLatest.value)return;
 threadTop.value=threadTop.value===1?0:1;
 setTimeout(()=>{threadTop.value=99999},40);
}

export function stop(){
 if(pending?.abort)pending.abort();
 clearInterval(waitTimer);
 busy.value=false;
}

export function quick(q){question.value=q;send()}

export async function send(){
 const text=question.value.trim();if(!text||busy.value)return;
 const history=messages.value.filter(m=>['user','assistant'].includes(m.role)).slice(-8).map(m=>({role:m.role,content:String(m.text||'').slice(0,600)}));
 messages.value=[...messages.value,{role:'user',text}].slice(-20);
 question.value='';error.value='';busy.value=true;followLatest.value=true;waitText.value='小迹正在生成回答…';
 const seq=++sequence;let seconds=0;
 clearInterval(waitTimer);waitTimer=setInterval(()=>{seconds+=1;if(seconds>=8)waitText.value='回答仍在生成，请稍候；你也可以停止'},1000);
 scrollEnd();
 markTask('ask');
 try{
  const data=await new Promise((resolve,reject)=>{
   pending=uni.request({
    url:'/api/guide/chat',method:'POST',timeout:55000,header:{'content-type':'application/json'},
    data:{question:text,history,mode:'auto',personId:'',guideContext:{},placeId:''},
    success:r=>r.statusCode>=200&&r.statusCode<300?resolve(r.data):reject(new Error(r.data?.error?.message||'服务暂时不可用')),
    fail:e=>reject(new Error(/abort/.test(e.errMsg||'')?'本次回答已停止。':'暂时无法连接小迹，请稍后重试'))
   });
  });
  if(seq!==sequence)return;
  messages.value=[...messages.value,{role:'assistant',text:data.answer||'',notice:data.modelNotice||'',sources:data.citations||[]}];
 }catch(e){
  if(seq!==sequence)return;
  error.value=e.message;messages.value=[...messages.value,{role:'assistant',text:e.message,failed:true}];
 }finally{
  if(seq===sequence){clearInterval(waitTimer);busy.value=false;pending=null;scrollEnd()}
 }
}
