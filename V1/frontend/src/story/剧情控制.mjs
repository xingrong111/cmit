const clone=value=>JSON.parse(JSON.stringify(value));
export class StoryController {
 constructor({story,view,reader,storage,account='guest',now=()=>Date.now()}){
  this.story=story;this.nodes=new Map(story.nodes.map(n=>[n.id,n]));this.view=view;this.reader=reader;this.storage=storage;this.account=String(account||'guest');this.now=now;this.lastAction=-Infinity;this.generation=0;this.busy=false;this.saved=false;this.disposed=false;
  this.validateGraph();this.state=this.fresh();
 }
 fresh(){return {storyId:this.story.id,version:this.story.version,visualVersion:this.story.visualVersion||null,nodeId:this.story.startId,act:this.node(this.story.startId).act,sceneId:this.node(this.story.startId).sceneId,mode:'panorama',trail:[this.story.startId],cursor:0,choices:{},completed:[],completedHotspots:[],read:false,finished:false};}
 node(id=this.state?.nodeId){const n=this.nodes.get(id);if(!n)throw new Error('剧情节点不存在：'+id);return n;}
 validateGraph(){
  if(this.nodes.size!==this.story.nodes.length||!this.nodes.has(this.story.startId))throw new Error('剧情ID重复或缺少起点');
  for(const n of this.nodes.values()){
   if(!['hotspot','dialogue','narration','choice','ending'].includes(n.type)||!n.sceneId||!n.text)throw new Error('剧情字段不完整：'+n.id);
   const edges=n.choices?.length?n.choices.map(c=>c.nextId):n.nextId?[n.nextId]:[];
   if(n.type!=='ending'&&!edges.length)throw new Error('剧情死路：'+n.id);
   if(n.type==='choice'&&new Set(n.choices.map(c=>c.id)).size!==n.choices.length)throw new Error('选项ID重复');
   for(const id of edges)if(!this.nodes.has(id))throw new Error('跳转节点不存在：'+id);
  }
 }
 key(){return `shanhe:story:${this.story.id}:${encodeURIComponent(this.account)}`;}
 snapshot(){return clone({...this.state,busy:this.busy,saved:this.saved,account:this.account});}
 edge(from,to){const n=this.node(from);return n.nextId===to||(n.choices||[]).some(c=>c.nextId===to);}
 pathMetadata(trail,cursor){
  const choices={},completedHotspots=[];
  for(let i=0;i<cursor;i++){const n=this.node(trail[i]);if(n.type==='choice')choices[n.id]=n.choices.find(c=>c.nextId===trail[i+1]).id;if(n.type==='hotspot')completedHotspots.push(n.triggerHotspotId);}
  return {choices,completedHotspots:[...new Set(completedHotspots)]};
 }
 validateRecord(record){
  if(!record||record.schema!==1||record.account!==this.account)return false;
  const s=record.state;if(!s||s.storyId!==this.story.id||s.version!==this.story.version||!['text','panorama'].includes(s.mode))return false;
  if(!Array.isArray(s.trail)||s.trail.length>1000||s.trail[0]!==this.story.startId||s.trail.some(id=>!this.nodes.has(id)))return false;
  if(!Number.isInteger(s.cursor)||s.cursor<0||s.cursor>=s.trail.length||s.nodeId!==s.trail[s.cursor])return false;
  for(let i=1;i<s.trail.length;i++)if(!this.edge(s.trail[i-1],s.trail[i]))return false;
  const n=this.node(s.nodeId),meta=this.pathMetadata(s.trail,s.cursor);
  if(n.sceneId!==s.sceneId||n.act!==s.act||typeof s.read!=='boolean'||typeof s.finished!=='boolean'||(s.finished&&(n.type!=='ending'||!s.read)))return false;
  if(JSON.stringify(s.choices)!==JSON.stringify(meta.choices)||JSON.stringify(s.completedHotspots)!==JSON.stringify(meta.completedHotspots))return false;
  if(!Array.isArray(s.completed)||s.completed.some(id=>!s.trail.includes(id))||new Set(s.completed).size!==s.completed.length)return false;
  if(s.trail.slice(0,-1).some(id=>!s.completed.includes(id)))return false;
  return true;
 }
 save(){
  this.saved=false;
  try{const text=JSON.stringify({schema:1,account:this.account,state:this.state});this.storage.setItem(this.key(),text);this.saved=this.storage.getItem(this.key())===text;}
  catch{this.saved=false;}
  this.reader.status?.(this.saved?'已保存进度（当前设备）':'进度未能保存，可继续阅读');return this.saved;
 }
 async start(){
  let raw;try{raw=this.storage.getItem(this.key());}catch{this.reader.status?.('无法读取本机进度，将从开头阅读');}
  let record;try{record=raw?JSON.parse(raw):null;}catch{}
  // 补图升级保留原节点与分支；仅迁移已知旧节点的派生场景，并一次恢复全景模式。
  const s=record?.state;
  if(this.story.visualVersion&&s&&s.storyId===this.story.id&&s.version===this.story.version&&s.visualVersion!==this.story.visualVersion){
   if(s.nodeId==='N02-01'&&s.sceneId==='SC02-TEXT')s.sceneId=this.node(s.nodeId).sceneId;
   if(['N03-04','N03-05','N03-06','G03-END'].includes(s.nodeId)&&s.sceneId==='SC03-TEXT')s.sceneId=this.node(s.nodeId).sceneId;
  }
  const valid=this.validateRecord(record);if(valid){this.state=clone(record.state);this.saved=true;}
  if(valid&&this.story.visualVersion&&this.state.visualVersion!==this.story.visualVersion){this.state.visualVersion=this.story.visualVersion;this.state.mode='panorama';this.save();}
  if(raw&&!valid){try{this.storage.setItem(this.key()+':incompatible:'+this.now(),raw);}catch{}}
  if(raw&&!valid)this.reader.status?.('旧进度版本或内容不适用，本次从开头开始。');
  await this.render();return valid;
 }
 async render(){
  if(this.disposed)return;const generation=++this.generation;this.busy=true;this.reader.setBusy?.(true);const n=this.node();
  try{
   const result=await this.view.loadScene(n.sceneId,{preserveView:false,visibleHotspots:n.hotspots});
   if(generation!==this.generation||this.disposed)return;
   if(this.state.mode==='text')this.view.enterTextMode();
   this.sceneReady=result?.status==='ready'||this.state.mode==='text';
   this.reader.render(n,this.snapshot(),this.story); // 一处唯一状态，界面仅上报用户动作
   this.reader.setSceneError?.(!this.sceneReady);
  }catch(error){
   if(generation!==this.generation||this.disposed)return;this.sceneReady=this.state.mode==='text';this.reader.render(n,this.snapshot(),this.story);this.reader.setSceneError?.(!this.sceneReady);this.reader.status?.('场景暂不可用，可重试或进入文字模式。');
  }finally{if(generation===this.generation&&!this.disposed){this.busy=false;this.reader.setBusy?.(false);}}
 }
 accept(){if(this.disposed||this.busy||!this.sceneReady||this.now()-this.lastAction<300)return false;this.lastAction=this.now();return true;}
 markRead(){if(this.disposed||this.busy||!this.sceneReady||this.state.read)return false;this.state.read=true;this.save();this.reader.update?.(this.snapshot());return true;}
 async move(id){
  const s=this.state;s.completed=[...new Set([...s.completed,s.nodeId])];
  const next=s.trail[s.cursor+1];if(next!==id){s.trail=s.trail.slice(0,s.cursor+1);s.completed=s.completed.filter(x=>s.trail.includes(x));s.trail.push(id);}
  s.cursor++;this.rebuild();s.read=false;s.finished=false;this.save();await this.render();return true;
 }
 rebuild(){const s=this.state,n=this.node(s.trail[s.cursor]);s.nodeId=n.id;s.sceneId=n.sceneId;s.act=n.act;Object.assign(s,this.pathMetadata(s.trail,s.cursor));}
 async next(){const n=this.node();if(!this.state.read||!n.nextId||['hotspot','choice'].includes(n.type)||!this.accept())return false;return this.move(n.nextId);}
 async choose(choiceId){const n=this.node(),choice=n.choices?.find(c=>c.id===choiceId);if(n.type!=='choice'||!choice||!this.state.read||!this.accept())return false;return this.move(choice.nextId);}
 async hotspot(id){const n=this.node();if(n.type!=='hotspot'||id!==n.triggerHotspotId||!n.hotspots.includes(id)||!this.accept())return false;this.state.read=true;return this.move(n.nextId);}
 async previous(){if(this.state.cursor===0||!this.accept())return false;this.state.cursor--;this.rebuild();this.state.read=false;this.state.finished=false;this.save();await this.render();return true;}
 async jumpTo(id){const index=this.state.trail.indexOf(id);if(index<0||(!this.state.completed.includes(id)&&index!==this.state.cursor)||!this.accept())return false;this.state.cursor=index;this.rebuild();this.state.read=false;this.state.finished=false;this.save();await this.render();return true;}
 async replay(){if(this.busy||this.disposed)return false;this.state=this.fresh();this.lastAction=this.now();this.save();await this.render();return true;}
 async skip(){
  if(!this.accept())return false;
  const act=this.node().act;let n=this.node(),steps=0;
  // 只跳过当前幕的对话，停在选择或幕末入口，不替用户决定分支。
  if(['choice','hotspot','ending'].includes(n.type))return false;
  while(n.nextId&&n.act===act&&!['choice','hotspot','ending'].includes(n.type)){
   const target=this.node(n.nextId);if(target.act!==act)break;
   const s=this.state;s.completed=[...new Set([...s.completed,s.nodeId])];
   if(s.trail[s.cursor+1]!==target.id){s.trail=s.trail.slice(0,s.cursor+1);s.completed=s.completed.filter(id=>s.trail.includes(id));s.trail.push(target.id);}
   s.cursor++;this.rebuild();n=target;if(++steps>this.nodes.size)throw new Error('剧情循环');
  }
  this.state.read=false;this.state.finished=false;this.save();await this.render();return true;
 }
 async setMode(mode){if(!['text','panorama'].includes(mode)||this.busy||this.disposed)return false;this.state.mode=mode;this.save();await this.render();return true;}
 async retry(){if(this.busy||this.disposed)return false;await this.render();return true;}
 finish(){if(this.node().type!=='ending'||!this.state.read||!this.accept())return false;this.state.finished=true;this.state.completed=[...new Set([...this.state.completed,this.state.nodeId])];this.save();this.reader.update?.(this.snapshot());return true;}
 async switchAccount(account){if(this.disposed)return;this.generation++;this.account=String(account||'guest');this.state=this.fresh();this.lastAction=-Infinity;this.saved=false;await this.start();}
 dispose(){this.disposed=true;this.generation++;this.view.dispose?.();this.reader.dispose?.();}
}
