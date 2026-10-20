from pathlib import Path
r=Path(__file__).parent
p=r/'第一幕交互.js';s=p.read_text(encoding='utf-8')
s=s.replace('监狱第一幕全景.png','窗边交谈全景.png')
s=s.replace("$('#objective').textContent='倾听她们的交流 · 可随时拖动环视';", "$('#objective').textContent='倾听她们的交流 · 气泡跟随发言人物';$('#dialogue').classList.toggle('narration',lines[index][0]==='旁白');")
s=s.replace("targetPitch=lines[index][3];","targetPitch=23;")
s=s.replace("window.sceneState={yaw,pitch,fov,selected,visited:visited.size};", "placeBubble();window.sceneState={yaw,pitch,fov,selected,visited:visited.size};")
s=s.replace("$('#hint').textContent='图片未加载，仍可阅读下方四项内容'", "$('#hint').textContent='图片未加载，仍可阅读对白'")
insert='''
// 发言锚点位于全景球面人物头部，随镜头投影到屏幕。
const actorAnchors={'年轻狱友':[-43,9],'江姐':[0,9],'年长狱友':[47,7]};
const connector=document.createElementNS('http://www.w3.org/2000/svg','svg');
connector.id='bubble-connector';connector.setAttribute('aria-hidden','true');
connector.innerHTML='<path id="bubble-tail"/><circle id="speaker-point" r="5"/>';
$('#experience').append(connector);
const focus=document.createElement('button');focus.id='focus-speaker';focus.textContent='回到发言人物';focus.hidden=true;$('#experience').append(focus);
focus.onclick=()=>{targetYaw=nearest(lines[index][2],yaw);targetPitch=23};
function placeBubble(){
 const box=$('#dialogue');
 connector.style.display='none';focus.hidden=true;
 if(phase!=='dialogue'||box.hidden)return;
 const a=actorAnchors[lines[index][0]];
 if(!a){box.style.left='50%';box.style.top='auto';box.style.bottom='65px';box.style.transform='translateX(-50%)';return}
 const w=innerWidth,h=innerHeight,d=dir(...a),front=d.dot(camera.getWorldDirection(new THREE.Vector3()))>.1;
 const point=d.multiplyScalar(10).project(camera),ax=(point.x*.5+.5)*w,ay=(-point.y*.5+.5)*h;
 const on=front&&ax>8&&ax<w-8&&ay>70&&ay<h-45;
 box.classList.toggle('speaker-offscreen',!on);focus.hidden=on;
 const bw=box.offsetWidth,bh=box.offsetHeight;
 const x=on?Math.max(14,Math.min(w-bw-14,ax-bw*.5)):Math.max(14,(w-bw)/2);
 const y=on?Math.max(192,Math.min(h-bh-70,ay-bh-50)):Math.max(192,h-bh-125);
 box.style.left=x+'px';box.style.top=y+'px';box.style.bottom='auto';box.style.transform='none';
 box.dataset.speaker=lines[index][0];
 if(!on)return;
 const sx=Math.max(x+22,Math.min(x+bw-22,ax)),sy=y+bh-2;
 connector.style.display='block';connector.setAttribute('viewBox',`0 0 ${w} ${h}`);
 $('#bubble-tail').setAttribute('d',`M ${sx-10} ${sy} Q ${sx} ${sy+15} ${ax} ${ay-14} Q ${sx+12} ${sy+8} ${sx+10} ${sy} Z`);
 $('#speaker-point').setAttribute('cx',ax);$('#speaker-point').setAttribute('cy',ay-9);
}
'''
s=s.replace('function dir(a,b)',insert+'\nfunction dir(a,b)')
p.write_text(s,encoding='utf-8')
p=r/'第一幕样式.css';s=p.read_text(encoding='utf-8').replace('监狱第一幕全景.png','窗边交谈全景.png')
s+='''
/* 人物旁的投影聊天气泡，替代固定底部对话面板。 */
#bubble-connector{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;overflow:hidden}#bubble-tail{fill:#f9f1e4;stroke:#c7ad7d;stroke-width:1}#speaker-point{fill:#efd7a6;stroke:#fff6df;stroke-width:2}
#dialogue{z-index:4;width:330px;padding:16px 19px 12px;border-radius:22px;background:#f9f1e4;box-shadow:0 12px 35px #0004;transition:opacity .2s}#line{font-size:17px;line-height:1.75;min-height:0;margin:9px 0 12px}.dialogue-top b{font-size:15px}.dialogue-top span{font-size:10px}#dialogue footer button{min-height:34px;padding:5px 13px;font-size:12px;border-radius:16px}#dialogue small{font-size:9px;margin-top:8px}#dialogue.narration{width:min(580px,calc(100% - 28px));border-radius:15px}#dialogue.speaker-offscreen{opacity:.94}#focus-speaker{position:absolute;left:50%;transform:translateX(-50%);bottom:55px;z-index:5;font-size:12px;background:#354d43}.heading{max-width:58%}.heading h1{font-size:30px}.heading p{font-size:11px}#ending{z-index:6}header,.tools,.bottom{z-index:5}#welcome{z-index:10}dialog{z-index:20}
@media(max-width:600px){#dialogue{width:min(270px,calc(100% - 28px));padding:13px 16px 10px}#line{font-size:15px;min-height:0}.heading h1{font-size:24px}.heading{max-width:70%}.tools{top:88px;gap:6px}.tools button{width:36px;min-height:36px}.heading p{font-size:10px}#dialogue small{font-size:8px}}
'''
p.write_text(s,encoding='utf-8')
p=r/'第一幕.html';s=p.read_text(encoding='utf-8').replace('人物在本版为全景画面，不含独立口型动画。','本幕为窗边交谈，没有绣旗情节。人物在本版为全景画面，不含独立口型动画。');p.write_text(s,encoding='utf-8')
print('已更新非绣旗场景与人物跟随气泡')
