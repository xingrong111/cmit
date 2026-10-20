// 只保存本机导览状态，不修改真实阅读和学习记录。
export const guideKey='shanhe:guide:v2';
let offered=false;
export function guideState(){try{const s=uni.getStorageSync(guideKey);if(s&&s.version===2&&['completed','skipped'].includes(s.status))return s;const old=uni.getStorageSync('shanhe:guide:v1');if(old==='done'||(typeof localStorage!=='undefined'&&localStorage.getItem('shanhe:guide:v1')==='done'))return {status:'legacy'};return null;}catch{return {status:'unavailable'};}}
export function shouldOfferGuide(){if(offered||guideState())return false;offered=true;return true;}
export function saveGuide(status){if(!['completed','skipped'].includes(status))return false;try{uni.setStorageSync(guideKey,{version:2,status,at:Date.now()});return true;}catch{return false;}}
export function requestQuickGuide(){try{uni.setStorageSync('shanhe:guide:open',true);}catch{}uni.$emit('shanhe:guide:open');}
export function takeGuideRequest(){try{const value=uni.getStorageSync('shanhe:guide:open');uni.removeStorageSync('shanhe:guide:open');return value===true;}catch{return false;}}
