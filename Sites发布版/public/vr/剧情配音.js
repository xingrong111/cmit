// 单一播放器防止串音；浏览器限制自动播放时等待用户点击。
const voiced=new Set(["N00-01", "N00-02", "N00-03", "N01-01", "N01-02", "N01-03", "N01-04", "N01-05", "N01-06", "N01-07", "N01-08", "N02-01", "N02-02", "N02-03", "N02-04", "N02-05", "N02-06", "N02-07", "N02-08", "N02-A01", "N02-A02", "N02-A03", "N02-B01", "N02-B02", "N02-B03", "N03-01", "N03-02", "N03-03", "N03-04", "N03-05", "N03-06", "N04-01", "N04-02", "N04-03", "N04-04", "N04-05", "N04-06", "N04-07", "N04-08", "N05-00", "N05-01", "N05-02", "N05-03", "N05-04", "N05-05", "N05-06", "N05-07", "N05-08"]);
export function createStoryVoice(hint){
 const audio=new Audio();audio.preload='metadata';audio.id='storyVoice';document.body.append(audio);
 let current=null,enabled=true,pending=false,revision=0;
 const stop=()=>{revision++;pending=false;audio.pause();audio.removeAttribute('src');audio.load();};
 async function play(){
  if(!enabled||!current)return;
  const token=revision;pending=false;
  try{await audio.play();}catch(e){
   if(token!==revision)return;
   if(e.name==='NotAllowedError'){pending=true;hint('点击“重听当前句”开启配音。');}
   else if(e.name!=='AbortError')hint('本句配音暂时无法播放，可继续阅读或点击重听。');
  }
 }
 function show(node){stop();current=voiced.has(node.id)?node.id:null;if(current&&enabled){audio.src=new URL('./配音/'+current+'.mp3',import.meta.url).href;play();}}
 function replay(){if(!current){hint('本段没有配音。');return;}if(!enabled){hint('请先在故事菜单开启配音。');return;}audio.currentTime=0;play();}
 const gesture=()=>{if(pending)play();};
 const visibility=()=>{if(document.hidden){audio.pause();pending=false;}};
 document.addEventListener('pointerup',gesture);document.addEventListener('keydown',gesture);document.addEventListener('visibilitychange',visibility);
 audio.addEventListener('error',()=>{if(audio.getAttribute('src'))hint('本句配音加载失败，可继续阅读或点击重听。');});
 return {show,stop,replay,toggle(){enabled=!enabled;stop();if(enabled&&current){audio.src=new URL('./配音/'+current+'.mp3',import.meta.url).href;play();}return enabled;},dispose(){stop();audio.remove();document.removeEventListener('pointerup',gesture);document.removeEventListener('keydown',gesture);document.removeEventListener('visibilitychange',visibility);}};
}
