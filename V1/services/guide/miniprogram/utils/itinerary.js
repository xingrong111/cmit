// 用户自行设置的停留预算，不是场馆测量数据或地图步行时间。
function summary(places, stays, route, budget) {
 const visitMinutes=places.reduce((n,p)=>n+([15,30,45,60].includes(Number(stays[p.id]))?Number(stays[p.id]):30),0);
 const walkMinutes=route && Number.isFinite(route.durationMinutes)?Math.ceil(route.durationMinutes):null;
 const totalMinutes=walkMinutes===null?null:visitMinutes+walkMinutes;
 return {visitMinutes,walkMinutes,totalMinutes,overBudget:totalMinutes!==null&&Number(budget)>0&&totalMinutes>Number(budget),budgetMinutes:Number(budget)||0};
}
module.exports={summary};
