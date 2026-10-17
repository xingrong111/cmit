export class MapCache {
 constructor({ttl=180000,max=100,now=Date.now}={}){this.ttl=ttl;this.max=max;this.now=now;this.items=new Map();this.pending=new Map();}
 get(key){const item=this.items.get(key);if(!item)return null;if(this.now()-item.time>=this.ttl){this.items.delete(key);return null;}return structuredClone(item.value);}
 set(key,value){for(const[k,v]of this.items)if(this.now()-v.time>=this.ttl)this.items.delete(k);if(this.items.size>=this.max)this.items.delete(this.items.keys().next().value);this.items.set(key,{time:this.now(),value:structuredClone(value)});}
 async run(key,producer,signal){
  if(signal?.aborted)throw signal.reason||new Error('aborted');
  const hit=this.get(key);if(hit)return {...hit,cacheHit:true,coalesced:false};
  let task=this.pending.get(key);const joined=Boolean(task);
  if(!task){
   task={controller:new AbortController(),users:0};this.pending.set(key,task);
   task.promise=Promise.resolve().then(()=>producer(task.controller.signal)).then(result=>{if(!task.controller.signal.aborted)this.set(key,result);return result;}).finally(()=>{if(this.pending.get(key)===task)this.pending.delete(key);});
  }
  task.users++;
  return new Promise((resolve,reject)=>{
   let done=false;
   const finish=(error,value)=>{if(done)return;done=true;signal?.removeEventListener('abort',abort);task.users--;if(task.users===0&&this.pending.get(key)===task){this.pending.delete(key);task.controller.abort();}if(error)reject(error);else resolve({...structuredClone(value),cacheHit:false,coalesced:joined});};
   const abort=()=>finish(signal.reason||new Error('aborted'));signal?.addEventListener('abort',abort,{once:true});
   task.promise.then(value=>finish(null,value),error=>finish(error));
   if(signal?.aborted)abort();
  });
 }
 sweep(){for(const [key,item] of this.items)if(this.now()-item.time>=this.ttl)this.items.delete(key);}
 clear(){this.items.clear();}
 dispose(){this.clear();for(const task of this.pending.values())task.controller.abort();this.pending.clear();}
}
