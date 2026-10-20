from pathlib import Path
r=Path(__file__).parent
html=(r/'第一幕.html').read_text(encoding='utf-8')
html=html.replace('href="场景预览.html"','href="/#/pages/home/index"')
html=html.replace('第一幕样式.css','第一幕样式.css?v=dynamic1').replace('第一幕交互.js','动态第一幕交互.js')
html=html.replace('窗边的微光｜江姐互动第一幕','窗边的微光｜动态全景第一幕')
html=html.replace('<button id="sound"', '<button id="motion" aria-label="暂停人物轻动作" aria-pressed="true" title="暂停人物轻动作">Ⅱ</button><button id="sound"')
html=html.replace('<div class="bottom">','<button id="performance" class="performance-toggle" aria-pressed="false">自动演绎</button><div class="bottom">')
html=html.replace('人物在本版为全景画面，不含独立口型动画。','本版为分层全景轻动画：自然呼吸、节点式轻微抬头与点头，无精确口型，不支持自由行走。')
html=html.replace('</head>','<link rel="stylesheet" href="动态第一幕样式.css"></head>') if '</head>' in html else html.replace('<body>','<link rel="stylesheet" href="动态第一幕样式.css"><body>')
(r/'第一幕动态版.html').write_text(html,encoding='utf-8')
js=(r/'第一幕交互.js').read_text(encoding='utf-8')
js=js.replace("import * as THREE from './素材/three.module.js';","import * as THREE from './素材/three.module.js';import {createActors} from './动态人物层.js';")
js=js.replace("const visited=new Set(),nodes=[{yaw:-142,pitch:36}],marks=[];", "let actors=null,motionEnabled=!reduced,autoPlay=false,playTimer=0;\nconst visited=new Set(),nodes=[{yaw:-142,pitch:36}],marks=[];")
js=js.replace("localStorage.setItem('江姐第一幕进度'","localStorage.setItem('江姐动态第一幕进度'").replace("localStorage.getItem('江姐第一幕进度'","localStorage.getItem('江姐动态第一幕进度'")
js=js.replace('targetPitch=23','targetPitch=12')
js=js.replace("[-43,9]","[-40,9]").replace("[47,7]","[42,7]")
js=js.replace("'窗边交谈全景.png'","'牢房空景.png'").replace("./素材/窗边交谈全景.png","./素材/牢房空景.png")
js=js.replace("save();speak();window.storyState=", "save();speak();schedulePlay();window.storyState=")
js=js.replace("stopVoice();phase='complete';", "stopVoice();clearTimeout(playTimer);autoPlay=false;$('#performance').textContent='重新演绎';$('#performance').setAttribute('aria-pressed','false');phase='complete';")
js=js.replace("const w=innerWidth,h=innerHeight,d=dir(...a),", "const w=innerWidth,h=innerHeight,d=(actors?.anchor(lines[index][0])||dir(...a)).normalize(),")
js=js.replace("Math.max(192,Math.min(h-bh-70,ay-bh-50))", "Math.max(170,Math.min(h-bh-90,ay-bh-32))")
js=js.replace("$('#loadingStatus').textContent='画面已就绪 · 无需VR设备';window.sceneReady=true;$('#enter').disabled=false;$('#enter').textContent='进入第一幕 →'", "$('#loadingStatus').textContent='正在安放人物……';createActors(scene).then(layer=>{actors=layer;window.sceneReady=true;$('#enter').disabled=false;$('#enter').textContent='进入动态全景 →';$('#loadingStatus').textContent='三位人物已就绪 · 支持环视与全屏'}).catch(()=>{$('#loadingStatus').textContent='人物未能加载，请刷新重试。';window.sceneReady=false})")
js=js.replace('renderer.render(scene,camera);', "actors?.update(dt,{enabled:motionEnabled,entered,phase,index});renderer.render(scene,camera);")
js=js.replace("if(!visible)stopVoice()", "if(!visible){stopVoice();clearTimeout(playTimer)}else if(autoPlay)schedulePlay()")
js=js.replace("window.addEventListener('pagehide',stopVoice);", "window.addEventListener('pagehide',()=>{stopVoice();clearTimeout(playTimer);actors?.dispose()});")
controls='''
function schedulePlay(){clearTimeout(playTimer);if(!autoPlay||phase!=='dialogue'||document.hidden)return;playTimer=setTimeout(()=>$('#next').click(),Math.max(5500,lines[index][1].length*220+1800))}
$('#performance').onclick=()=>{autoPlay=!autoPlay;$('#performance').setAttribute('aria-pressed',String(autoPlay));$('#performance').textContent=autoPlay?'暂停演绎':'自动演绎';if(autoPlay){if(!entered)$('#enter').click();if(phase!=='dialogue')begin();else schedulePlay()}else clearTimeout(playTimer)};
$('#motion').setAttribute('aria-pressed',String(motionEnabled));$('#motion').textContent=motionEnabled?'Ⅱ':'▷';
$('#motion').onclick=()=>{motionEnabled=!motionEnabled;$('#motion').setAttribute('aria-pressed',String(motionEnabled));$('#motion').textContent=motionEnabled?'Ⅱ':'▷';$('#motion').setAttribute('aria-label',motionEnabled?'暂停人物轻动作':'开启动作');$('#hint').textContent=motionEnabled?'人物轻动作已开启 · 可拖动环视':'人物轻动作已暂停'};
'''
js=js.replace('function dir(a,b)',controls+'\nfunction dir(a,b)')
(r/'动态第一幕交互.js').write_text(js,encoding='utf-8')
print('动态版生成完成，旧版保留')
