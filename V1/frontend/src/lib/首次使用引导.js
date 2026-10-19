// 网站首次使用引导：本机保存完成状态，可从“我的”重新打开。
const key='shanhe:guide:v1';
const steps=[
 ['home','从山河出发','首页地图展示本项目按省份收录的人物。选择省份，查看对应名单；这里的数量是项目收录数。'],
 ['people','找到一位人物','搜索姓名或籍贯，按省份浏览全国名单；切换“详细档案”阅读照片、简介与史料。“IP专项”还可进入狼牙山360°互动场景。'],
 ['timeline','沿时间读故事','选择人物、年份与阶段，展开事件卡片。点进事件阅读原文依据，也可以返回人物档案继续探索。'],
 ['radar','把阅读变成一段旅程','先选择城市，再点地点查看介绍。将地点加入文化路线后安排顺序；需要附近距离时再授权当前位置。地图导航到场馆附近。'],
 ['assistant','和小迹聊一聊','在下方输入问题并发送，可以询问人物、使用方法与路线建议。历史回答请结合附带来源阅读，模型未完成时可重试。'],
 ['learning','读一段，挑战一次','选择五组主题之一，依次完成入门与进阶。答完即完成；登录后学习进度随账户保存，达到成长条件可获得荣誉称号。'],
 ['me','留下你的阅读足迹','这里可以管理账户、查看书签与最近阅读、切换全局字号。以后想重新了解功能，点击“使用指南”即可。']
];
export function setupFirstGuide(navigate){
 if(window.__shanheGuide)return;window.__shanheGuide=true;
 const style=document.createElement('style');style.textContent=`.first-guide{position:fixed;inset:0;z-index:99999;background:#203b312e;display:flex;align-items:flex-end;justify-content:center;padding:24px;box-sizing:border-box;pointer-events:auto}.first-guide-card{width:550px;max-width:100%;background:#fffaf0;border:1px solid #c8aa7a;border-radius:20px;box-shadow:0 16px 70px #243c3340;padding:26px;box-sizing:border-box;color:#354d43;font:16px/1.8 sans-serif}.first-guide-card h2{font:28px/1.4 serif;margin:10px 0}.first-guide-card p{margin:12px 0 22px;color:#6c5c48}.first-guide-head,.first-guide-actions{display:flex;justify-content:space-between;align-items:center;gap:12px}.first-guide button{cursor:pointer;font:14px/1.5 sans-serif;border-radius:9px;padding:10px 18px;border:1px solid #d9c6a5;background:transparent;color:#982b28}.first-guide button.primary{background:#982b28;color:#fffaf0;border-color:#982b28}.first-guide button:focus-visible{outline:3px solid #bd9a67;outline-offset:3px}.first-guide-progress{display:flex;gap:5px;margin-top:20px}.first-guide-progress i{height:3px;flex:1;background:#e9deca}.first-guide-progress i.current{background:#982b28}.first-guide-target{outline:3px solid #bd9a67!important;outline-offset:5px!important}@media(max-width:600px){.first-guide{padding:12px 12px 76px}.first-guide-card{padding:20px}.first-guide-card h2{font-size:24px}}`;document.head.append(style);
 let overlay,index=0,returnHash='',target;
 function clear(){target?.classList.remove('first-guide-target');target=null;overlay?.remove();overlay=null;document.removeEventListener('keydown',keys)}
 function finish(){localStorage.setItem(key,'done');clear();if(returnHash&&location.hash!==returnHash)location.hash=returnHash}
 function keys(e){if(e.key==='Escape')finish();if(e.key==='Tab'&&overlay){const b=[...overlay.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus()}}}
 function render(){clear();navigate(steps[index][0]);overlay=document.createElement('section');overlay.className='first-guide';overlay.innerHTML=`<div class="first-guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-copy"><div class="first-guide-head"><span>山河有迹 · 初次使用 ${index+1} / ${steps.length}</span><button data-skip>跳过引导</button></div><h2 id="guide-title">${steps[index][1]}</h2><p id="guide-copy">${steps[index][2]}</p><div class="first-guide-actions"><button data-prev ${index===0?'disabled':''}>上一步</button><button class="primary" data-next>${index===steps.length-1?'开始探索':'下一步'}</button></div><div class="first-guide-progress" aria-hidden="true">${steps.map((_,i)=>`<i class="${i<=index?'current':''}"></i>`).join('')}</div></div>`;document.body.append(overlay);overlay.querySelector('[data-skip]').onclick=finish;overlay.querySelector('[data-prev]').onclick=()=>{if(index>0){index--;render()}};overlay.querySelector('[data-next]').onclick=()=>{if(index===steps.length-1)finish();else{index++;render()}};overlay.querySelector('[data-next]').focus();document.addEventListener('keydown',keys);setTimeout(()=>{if(!overlay)return;target=[...document.querySelectorAll('.desktop-nav uni-button, .desktop-nav button')].find(b=>b.textContent.trim()===['首页','人物','长卷','足迹','小迹','学习','我的'][index]);target?.classList.add('first-guide-target')},300)}
 window.addEventListener('shanhe:open-guide',()=>{if(overlay)return;returnHash=location.hash;index=0;render()});
 setTimeout(()=>{if(!localStorage.getItem(key)&&(/^#\/?$/.test(location.hash)||location.hash.includes('/pages/home/'))){returnHash=location.hash;render()}},1600);
}

