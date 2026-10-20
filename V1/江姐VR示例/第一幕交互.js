import * as THREE from './素材/three.module.js';
const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,texture,mesh,yaw=0,pitch=0,fov=75,targetYaw=0,targetPitch=0,auto=false,drag=false,moved=false,down={x:0,y:0,yaw:0,pitch:0},selected=-1,entered=false,rafTime=0,visible=true,phase='welcome',index=0,sound=false;
const visited=new Set(),nodes=[{yaw:-142,pitch:36}],marks=[];
const lines=[
 ['年轻狱友','江姐，你看，窗边有一点光。',-37,9],
 ['江姐','我看见了。',0,12],
 ['年轻狱友','我有时候会想，外面的日子，现在是什么样子。',-37,9],
 ['年长狱友','也许有人正赶着回家，也许有人在等一封信。',37,7],
 ['江姐','我也会想。想那些平常的日子，想人们能够安心地生活。',0,12],
 ['年轻狱友','真想亲眼看看。',-37,9],
 ['江姐','那就把这份盼望留住。我们可以一起，为它做一点事。',0,12],
 ['旁白','她们说起未来，也说起普通人的生活。那些看似平常的愿望，在这里显得格外珍贵。',0,0]
];
function nearest(a,c){return c+((a-c+540)%360)-180}
function stopVoice(){window.speechSynthesis?.cancel()}
function closePanel(){}
function save(){try{localStorage.setItem('江姐第一幕进度',JSON.stringify({index,phase}))}catch{}}
function speak(){stopVoice();if(!sound||!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(lines[index][1]);u.lang='zh-CN';u.rate=.9;speechSynthesis.speak(u)}
function showLine(){phase='dialogue';selected=index;$('#dialogue').hidden=false;$('#ending').hidden=true;$('#speaker').textContent=lines[index][0];$('#line').textContent=lines[index][1];$('#step').textContent=`${index+1} / ${lines.length}`;$('#previous').disabled=index===0;$('#next').textContent=index===lines.length-1?'完成本幕 →':'继续 →';targetYaw=nearest(lines[index][2],yaw);targetPitch=23;$('#objective').textContent='倾听她们的交流 · 气泡跟随发言人物';$('#dialogue').classList.toggle('narration',lines[index][0]==='旁白');save();speak();window.storyState={phase,index,speaker:lines[index][0]}}
function begin(){index=0;visited.add(0);showLine()}
const h=document.createElement('button');h.className='hotspot';h.innerHTML='<i></i>窗边的微光';h.onclick=begin;h.setAttribute('aria-label','点击窗边微光，开启第一幕对话');$('#hotspots').append(h);marks.push(h);
$('#enter').onclick=()=>{entered=true;$('#welcome').classList.add('hidden');let saved;try{saved=JSON.parse(localStorage.getItem('江姐第一幕进度'))}catch{}if(saved?.phase==='dialogue'&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<lines.length){index=saved.index;showLine()}else{phase='explore';targetYaw=nearest(-100,yaw);targetPitch=18;window.storyState={phase,index:0}}};
$('#next').onclick=()=>{if(index<lines.length-1){index++;showLine()}else{stopVoice();phase='complete';$('#dialogue').hidden=true;$('#ending').hidden=false;$('#objective').textContent='第一幕已完成';save();window.storyState={phase,index}}};
$('#previous').onclick=()=>{if(index>0){index--;showLine()}};
$('#replay').onclick=begin;$('#explore').onclick=()=>{$('#ending').hidden=true;phase='explore';$('#objective').textContent='自由环视 · 点击窗边热点可重看';window.storyState={phase,index}};
$('#sound').onclick=()=>{sound=!sound;$('#sound').setAttribute('aria-label',sound?'关闭系统朗读':'开启系统朗读');$('#sound').setAttribute('aria-pressed',String(sound));$('#hint').textContent=sound?'设备系统朗读已开启 · 非人物原声':'声音已关闭 · 可阅读字幕';if(sound&&phase==='dialogue')speak();else stopVoice()};
$('#notes').onclick=$('#help').onclick=()=>{$('#information').showModal();stopVoice()};$('#closeInfo').onclick=()=>$('#information').close();
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#experience').requestFullscreen()}catch{$('#hint').textContent='当前环境不支持全屏，可继续环视。'}};
document.addEventListener('fullscreenchange',()=>$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'全屏'));
function zoom(d){fov=THREE.MathUtils.clamp(fov+d,40,95);if(camera){camera.fov=fov;camera.updateProjectionMatrix()}$('#angle').textContent=`视野 ${Math.round(fov)}°`}
$('#zoomIn').onclick=()=>zoom(-8);$('#zoomOut').onclick=()=>zoom(8);$('#reset').onclick=()=>{targetYaw=0;targetPitch=0;zoom(75-fov)};

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

function dir(a,b){const y=THREE.MathUtils.degToRad(a),p=THREE.MathUtils.degToRad(b);return new THREE.Vector3(Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p))}
function resize(){if(!renderer)return;const w=$('#view').clientWidth,h=$('#view').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;$('#view').append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','使用拖动、方向键环视，滚轮或加减按钮缩放');
 scene=new THREE.Scene();scene.background=new THREE.Color('#27352d');camera=new THREE.PerspectiveCamera(fov,innerWidth/innerHeight,.1,100);resize();
 new THREE.TextureLoader().load('./素材/窗边交谈全景.png',t=>{texture=t;t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;const g=new THREE.SphereGeometry(30,80,48);g.scale(-1,1,1);mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:t}));mesh.rotation.y=-Math.PI/2;scene.add(mesh);$('#loadingStatus').textContent='画面已就绪 · 无需VR设备';window.sceneReady=true;$('#enter').disabled=false;$('#enter').textContent='进入第一幕 →'},undefined,()=>{$('#loadingStatus').textContent='全景图片未能加载，请刷新或检查素材文件。';$('#hint').textContent='图片未加载，仍可阅读对白';window.sceneReady=false;$('#enter').disabled=false;$('#enter').textContent='阅读对话版';});
 const canvas=renderer.domElement,pointers=new Map();let pinch=0;
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});auto=false;drag=true;moved=false;down={x:e.clientX,y:e.clientY,yaw,pitch};if(pointers.size===2){const a=[...pointers.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const a=[...pointers.values()],distance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);zoom((pinch-distance)*.08);pinch=distance;return}if(drag){const dx=e.clientX-down.x,dy=e.clientY-down.y;moved||=Math.abs(dx)+Math.abs(dy)>6;targetYaw=down.yaw-dx*.13;targetPitch=THREE.MathUtils.clamp(down.pitch+dy*.13,-65,65);if(reduced){yaw=targetYaw;pitch=targetPitch}}});
 function release(e){pointers.delete(e.pointerId);drag=pointers.size>0;if(drag){const [p]=pointers.values();down={...p,yaw,pitch};down.x=p.x;down.y=p.y}if(!drag&&moved)closePanel()}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY*.025)},{passive:false});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')targetYaw-=8;if(e.key==='ArrowRight')targetYaw+=8;if(e.key==='ArrowUp')targetPitch=Math.min(65,targetPitch+8);if(e.key==='ArrowDown')targetPitch=Math.max(-65,targetPitch-8);if(e.key==='+')zoom(-5);if(e.key==='-')zoom(5)});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#hint').textContent='图形显示暂时中断，请刷新；仍可使用文字导览。';window.sceneReady=false;$('#enter').disabled=false;$('#enter').textContent='阅读对话版';});
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible)stopVoice()});window.addEventListener('resize',resize);
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-rafTime)/1000,.05);rafTime=now;if(!visible)return;if(auto&&entered)targetYaw+=dt*3;const k=reduced?1:1-Math.exp(-dt*10);yaw+=(targetYaw-yaw)*k;pitch+=(targetPitch-pitch)*k;camera.lookAt(dir(yaw,pitch));renderer.render(scene,camera);const w=$('#view').clientWidth,h=$('#view').clientHeight,forward=camera.getWorldDirection(new THREE.Vector3());nodes.forEach((n,i)=>{const d=dir(n.yaw,n.pitch),front=d.dot(forward)>.12,p=d.multiplyScalar(10).project(camera),show=entered&&phase==='explore'&&front&&Math.abs(p.x)<.85&&Math.abs(p.y)<.8;marks[i].hidden=!show;if(show){marks[i].style.left=(p.x*.5+.5)*w+'px';marks[i].style.top=(-p.y*.5+.5)*h+'px'}});placeBubble();window.sceneState={yaw,pitch,fov,selected,visited:visited.size};}requestAnimationFrame(frame);
}catch(err){console.warn('全景渲染未初始化',err);$('#loadingStatus').textContent='此设备不支持WebGL，当前展示静态画面与文字导览。';$('#hint').textContent='静态兼容模式 · 点击下方卡片阅读';marks.forEach(m=>m.hidden=true);window.sceneReady=false;$('#zoomIn').disabled=$('#zoomOut').disabled=true;}
window.addEventListener('pagehide',stopVoice);
