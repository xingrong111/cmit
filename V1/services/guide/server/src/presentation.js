export function present(result) {
 const kind=result.placeCards?.length?'places':result.mode==='model_chat'||result.mode==='chat_fallback'?'chat':result.citations?.length?'history':'guide';
 const ids=new Set((result.placeCards||[]).map(p=>p.id));
 const actions=(result.actions||[]).filter(a=>!(['place','add'].includes(a.type)&&ids.has(a.id)));
 const modelNotice=result.modelStatus==='unavailable'?'模型暂不可用 · 基础回答':result.modelStatus==='not_configured'?'基础回答':result.modelStatus==='available'?'AI辅助回答':'';
 const reviewNotice=kind==='places'||kind==='history'?'资料状态请查看出处':'';
 return {...result,actions,modelNotice,reviewNotice,presentation:{kind,title:{places:'文化地点建议',chat:'小迹',history:'资料如何记载',guide:'小迹的使用指导'}[kind],paragraphs:String(result.answer||'').split(/\n+/).filter(Boolean)},retryable:['unavailable','not_configured'].includes(result.modelStatus)};
}
