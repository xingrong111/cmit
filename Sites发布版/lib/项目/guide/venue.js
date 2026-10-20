// Visitor information keeps the date of the original record, not a live-open claim.
export function visitorInfo(place, sources) {
 const labels={hours:'开放时段记录',reservation:'预约与讲解',admission:'门票记录',accessibility:'无障碍设施',photography:'摄影规定'};
 const info=place.visitorInfo||{};
 const entries=Object.entries(labels).map(([key,label])=>{
  const item=info[key];const sourceIds=item?.sourceIds?.filter(id=>sources[id])||[];
  return {key,label,text:sourceIds.length?item.text:'暂无可确认资料，请向场馆核实。',recordDate:sourceIds.length?(item.recordDate||'未显示'):'未记录',sourceIds,status:sourceIds.length?'source_record':'unknown',statusLabel:sourceIds.length?'来源记录 · 非实时':'待核实'};
 });
 const contacts=(info.contacts||[]).filter(c=>/^0\d{2,3}-\d{7,8}$/.test(c.number)&&c.sourceIds?.length&&c.sourceIds.every(id=>sources[id])).map(c=>({...c,notice:'来源所列电话，当前是否接通及业务范围需确认。'}));
 return {entries,contacts,checkedAt:info.checkedAt||'未记录',currentNotice:'当前开放状态尚未确认。旧公告、活动记录和地图营业标签不能保证今天可入馆。',checklist:['出发前确认当天开放、停止入场时间及临时闭馆安排。','团队讲解和个人参观的预约要求分别确认。','确认游客入口、无障碍通道及同行者需要的设施。','入馆前确认摄影规定；拍摄展品不自动获得再使用许可。']};
}
