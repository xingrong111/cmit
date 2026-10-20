import fs from 'node:fs';import path from 'node:path';import {createContent,STAGES} from '../../V1/services/reading/src/content.js';
const c=createContent({dbPath:':memory:'}),out={};
out['/meta']=c.meta();out['/home']={meta:c.meta(),featured_people:c.people().slice(0,6),events:c.timeline().items.slice(-4).reverse(),provinces:[...new Set(c.people().map(p=>p.province))],stages:STAGES};
out['/people']={items:c.people()};out['/timeline']=c.timeline(undefined,undefined,100);
for(const p of c.people()){out['/people/'+p.id]=c.person(p.id);out['/people/'+p.id+'/timeline']=c.timeline(p.id);out['/people/'+p.id+'/graph']=c.graph(p.id);out['/people/'+p.id+'/sources']={items:[...new Set(c.person(p.id).facts.map(f=>f.source_id))].sort().map(c.source)}}
for(const e of c.events())out['/events/'+e.id]={...e,facts:c.publicFacts().filter(f=>e.fact_ids.includes(f.id)),sources:e.source_ids.map(c.source)};
for(const f of c.publicFacts()){out['/facts/'+f.id]={...f,source:c.source(f.source_id)};out['/sources/'+f.source_id]=c.source(f.source_id)}
fs.writeFileSync(new URL('../data/阅读接口.json',import.meta.url),JSON.stringify(out));c.close();console.log('已导出阅读接口',Object.keys(out).length,'条');
