// 渐进式新手引导：不弹模态窗，只记录“上手三步”的完成情况和各页一次性小提示是否看过。
// 状态保存在本机；游客与登录账户共用，可在使用指南页重置。
import {ref,computed} from 'vue';

export const onboardKey='shanhe:onboard:v1';
const legacyKey='shanhe:guide:v2';
export const taskIds=['person','source','ask'];

function blank(){return {version:1,tasks:{},tips:{},cardClosed:false}}

function read(){
 try{
  const saved=uni.getStorageSync(onboardKey);
  if(saved&&saved.version===1)return {...blank(),...saved,tasks:{...saved.tasks},tips:{...saved.tips}};
  // 旧版弹窗导览已看过或跳过的用户，不再展示首页任务卡
  const old=uni.getStorageSync(legacyKey);
  if(old&&['completed','skipped'].includes(old.status))return {...blank(),cardClosed:true};
 }catch{}
 return blank();
}

export const onboard=ref(read());
export const doneCount=computed(()=>taskIds.filter(id=>onboard.value.tasks[id]).length);
export const allDone=computed(()=>doneCount.value===taskIds.length);

function commit(next){
 onboard.value=next;
 try{uni.setStorageSync(onboardKey,next)}catch{}
}

export function markTask(id){
 if(!taskIds.includes(id)||onboard.value.tasks[id])return;
 commit({...onboard.value,tasks:{...onboard.value.tasks,[id]:Date.now()}});
}

export function tipSeen(key){return !!onboard.value.tips[key]}

export function dismissTip(key){
 if(onboard.value.tips[key])return;
 commit({...onboard.value,tips:{...onboard.value.tips,[key]:true}});
}

export function closeTaskCard(){
 if(onboard.value.cardClosed)return;
 commit({...onboard.value,cardClosed:true});
}

// 在使用指南页点“重新开始”：清空任务进度，重新显示首页任务卡和各页提示
export function resetOnboard(){commit(blank())}
