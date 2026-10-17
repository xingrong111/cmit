import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const target=resolve(process.argv[2]||'frontend/dist/build/h5/data');
const base='http://127.0.0.1:8790/api/';
let files=0;
async function save(path){
 const r=await fetch(base+path);if(!r.ok)throw Error(path+': '+r.status);
 const data=await r.json();const file=resolve(target,path+'.json');
 await mkdir(resolve(file,'..'),{recursive:true});await writeFile(file,JSON.stringify(data));files++;return data;
}
await save('meta');await save('home');const people=await save('people');await save('timeline');
const events=new Set(),facts=new Set(),sources=new Set();
for(const p of people.items){
 const person=await save('people/'+p.id);
 for(const e of person.events)events.add(e.id);
 for(const f of person.facts){facts.add(f.id);sources.add(f.source_id);}
 for(const suffix of ['timeline','graph','sources'])await save('people/'+p.id+'/'+suffix);
}
for(const id of events)await save('events/'+id);
for(const id of facts)await save('facts/'+id);
for(const id of sources)await save('sources/'+id);
console.log(JSON.stringify({files,people:people.total,events:events.size,facts:facts.size,sources:sources.size,target}));
