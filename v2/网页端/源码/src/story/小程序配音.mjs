const ids=new Set(["N00-01", "N00-02", "N00-03", "N01-01", "N01-02", "N01-03", "N01-04", "N01-05", "N01-06", "N01-07", "N01-08", "N02-01", "N02-02", "N02-03", "N02-04", "N02-05", "N02-06", "N02-07", "N02-08", "N02-A01", "N02-A02", "N02-A03", "N02-B01", "N02-B02", "N02-B03", "N03-01", "N03-02", "N03-03", "N03-04", "N03-05", "N03-06", "N04-01", "N04-02", "N04-03", "N04-04", "N04-05", "N04-06", "N04-07", "N04-08", "N05-00", "N05-01", "N05-02", "N05-03", "N05-04", "N05-05", "N05-06", "N05-07", "N05-08"]);
export function createMiniVoice({createAudio,loadPackage,onStatus=()=>{}}){
 let audio=null,nodeId=null,enabled=true,visible=true,disposed=false,generation=0;
 const loaded=new Map();
 function stop(){generation++;if(audio){audio.stop();audio.destroy();audio=null;}}
 async function play(){
  stop();if(!nodeId||!enabled||!visible||disposed)return;
  const id=nodeId,token=generation,name='voice-act'+Number(id.slice(1,3));
  onStatus('正在准备配音……');
  try{
   if(!loaded.has(name)){const task=loadPackage(name).catch(e=>{loaded.delete(name);throw e;});loaded.set(name,task);}
   await loaded.get(name);
   if(token!==generation||disposed||!visible||!enabled)return;
   const ctx=createAudio();audio=ctx;ctx.autoplay=false;ctx.obeyMuteSwitch=false;
   ctx.onError(()=>{if(token===generation)onStatus('本句配音暂时无法播放，可点击重听。');});
   ctx.onPlay(()=>{if(token===generation)onStatus('配音播放中');});
   ctx.onEnded(()=>{if(token===generation)onStatus('本句配音已播放完毕');});
   ctx.src='/'+name+'/'+id+'.mp3';ctx.play();
  }catch{if(token===generation)onStatus('配音资源加载失败，可点击重听；文字阅读不受影响。');}
 }
 return {show(n){nodeId=ids.has(n.id)?n.id:null;return play();},replay(){if(!nodeId){onStatus('本段没有配音。');return;}return play();},toggle(){enabled=!enabled;play();onStatus(enabled?'配音已开启':'配音已关闭');return enabled;},hide(){visible=false;stop();},showPage(){visible=true;},stop,dispose(){disposed=true;stop();}};
}
