from pathlib import Path
p=Path('V1/services/guide/web/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("if(state.page!=='assistant')return;\n  const welcome",'''if(state.page!=='assistant')return;
  fitAssistantViewport();
  const heading=screen.querySelector('.hero');if(heading){heading.classList.add('assistant-cover');heading.querySelector('h2').innerHTML='<img class="module-feature-icon" src="/static/icons/assistant.png" alt="">小迹 · 你的山河导览员';heading.querySelector('p').textContent='读人物、寻足迹，把每一次好奇变成一段旅程。';if(!heading.querySelector('.assistant-cover-seal'))heading.insertAdjacentHTML('beforeend','<span class="assistant-cover-seal" aria-hidden="true">循迹<br>问知</span>');}
  const welcome''',1)
s=s.replace("<p>可以聊人物、问功能，<br>也可以告诉我你的城市和可用时间。</p></div>'", "<p>聊一位人物，或说说你想去的城市。</p><div class=\"assistant-starts\"><button data-action=\"quick\" data-value=\"这个小程序有哪些功能？\">小程序怎么用？ <span>↗</span></button><button data-action=\"quick\" data-value=\"帮我安排无锡两小时文化路线\">无锡两小时怎么逛？ <span>↗</span></button><button data-action=\"quick\" data-value=\"介绍一下瞿秋白，并给出资料依据\">读一读瞿秋白 <span>↗</span></button></div></div>'")
s+='''
function fitAssistantViewport(){
 try{if(parent!==window&&window.frameElement){const f=window.frameElement,holder=f.parentElement,tab=parent.document.querySelector('uni-tabbar'),height=tab&&parent.getComputedStyle(tab).display!=='none'?tab.getBoundingClientRect().height:0;holder.style.setProperty('height',Math.max(320,parent.innerHeight-f.getBoundingClientRect().top-height-8)+'px','important');}}catch{}
}
window.addEventListener('resize',()=>{if(state.page==='assistant')fitAssistantViewport()});
'''
p.write_text(s,encoding='utf-8')
