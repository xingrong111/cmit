import { fail } from './domain.js';
export function preferences(input, data) {
 const prior=input.guideContext || {};
 if(typeof prior!=='object'||Array.isArray(prior)||Object.keys(prior).some(k=>!['city','timeBudget','walking','active','lastPlaceId'].includes(k)))fail(400,'INVALID_CONTEXT','导览需求参数无效。');
 for(const key of ['city','timeBudget','walking','lastPlaceId'])if(prior[key]!==undefined&&(typeof prior[key]!=='string'||prior[key].length>40))fail(400,'INVALID_CONTEXT','导览需求过长或格式无效。');
 if(prior.active!==undefined&&typeof prior.active!=='boolean')fail(400,'INVALID_CONTEXT','导览会话状态无效。');
 const question=input.question.trim();const cities=[...new Set(data.places.map(p=>p.city))];
 const named=question.match(/(?:我在|我去|改去|换到|换成|到)([\u4e00-\u9fa5]{2,8}?市)(?:[，。\s]|$)/)?.[1];
 const city=cities.find(c=>question.includes(c.replace(/市$/,'')))||named||input.city||prior.city||'';
 const timeBudget=question.match(/(?:\d{1,3}|[一二两三四五六七八九十]+)\s*(?:个?小时|分钟)|半天|一天|一日/)?.[0]||prior.timeBudget||'';
 const walking=/无障碍|轮椅/.test(question)?'需要无障碍':/少走|少步行|不想走|老人/.test(question)?'尽量少步行':/正常步行|可以步行|多走/.test(question)?'可正常步行':prior.walking||'';
 return {city,timeBudget,walking,lastPlaceId:prior.lastPlaceId||'',active:true};
}
