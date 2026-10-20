import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const supplement=JSON.parse(readFileSync(new URL('../data/图谱补充索引.json',import.meta.url),'utf8'));
const published=r=>r?.publication_status==='demo_published';
const stableId=(kind,name)=>'N-'+kind+'-'+createHash('sha256').update(name).digest('hex').slice(0,20);
const themeFor=type=>/父|母|亲|哥哥|夫妻|结婚/.test(type)?'亲友交往':/教读书|任教|师生/.test(type)?'求学任教':'组织活动';
function classify(row){if(/父亲|母亲|教读书|亲属|夫妻|师生/.test(row.type))return 'person';if(/党|同盟|县委|代表团|共青团/.test(row.target_name))return 'group';return 'entity'}
// Build only from public, verified facts. No co-location or co-year edges are inferred.
export function buildRelationAtlas(data,pid,focus){
 const allPeople=new Map(data.people.map(p=>[p.id,p])),people=data.people.filter(published),personMap=new Map(people.map(p=>[p.id,p]));if(!personMap.has(pid))return null;
 const sourceMap=new Map(data.sources.filter(s=>!s.publication_status||published(s)).map(s=>[s.id,s]));
 const publicFacts=data.facts.filter(f=>published(f)&&personMap.has(f.person_id)&&sourceMap.has(f.source_id));
 const publicSources=new Set(publicFacts.map(f=>f.source_id)),facts=new Map(publicFacts.filter(f=>f.review_status==='verified').map(f=>[f.id,f]));
 const nodes=new Map(),edges=new Map();
 for(const p of people)nodes.set(p.id,{id:p.id,name:p.name,kind:p.kind||'person',person_id:p.id,description:p.bio||'',source_ids:[]});
 function target(name,kind,explicit){
  const raw=explicit&&allPeople.get(explicit);if(raw&&!published(raw))return null;
  const matches=kind==='person'?people.filter(p=>p.name===name):[];
  const p=raw|| (matches.length===1?matches[0]:null),id=p?.id||stableId(kind,name);
  if(!nodes.has(id))nodes.set(id,{id,name,kind,person_id:p?.id||null,source_ids:[],description:''});return id;
 }
 function add(row,toId,category='relationship',theme){
  const f=facts.get(row.fact_id);if(!f||f.person_id!==row.from_id||f.source_id!==row.source_id||!publicSources.has(row.source_id)||!nodes.has(row.from_id)||!toId)return;
  const displayType=row.from_id==='P004'&&row.type.includes('教读书')?row.type.replace('教读书','受其教读书'):row.type;
  const edge={...row,original_type:row.type,type:displayType,to_id:toId,category,theme:theme||themeFor(row.type),excerpt:f.text,period:f.date?.text||f.date_text||'',review_status:'verified'};
  if([...edges.values()].some(e=>e.from_id===edge.from_id&&e.to_id===edge.to_id&&e.fact_id===edge.fact_id&&e.type===edge.type))return;
  edges.set(edge.id,edge);
 }
 for(const r of data.relations){if(!published(r)||r.review_status!=='verified'||!facts.has(r.fact_id)||!publicSources.has(r.source_id))continue;const kind=allPeople.get(r.to_id)?.kind||classify(r);add(r,target(r.target_name,kind,r.to_id))}
 for(const r of supplement){const f=facts.get(r.fact_id);if(!f||f.text!==r.evidence_text)continue;const to=target(r.target_name,r.target_kind);add({...r,from_id:f.person_id,source_id:f.source_id},to,['place','artifact','event'].includes(r.target_kind)?'context':'relationship',r.theme)}
 for(const e of data.events){if(!published(e)||!personMap.has(e.person_id)||!e.fact_ids?.length||!e.fact_ids.every(id=>facts.has(id)&&facts.get(id).person_id===e.person_id)||!e.source_ids.every(id=>publicSources.has(id)))continue;
  nodes.set(e.id,{id:e.id,name:e.title==='历史节点'?(e.summary||'史料片段').slice(0,26):e.title,kind:'event',event_id:e.id,description:e.summary||'',period:e.date_text,source_ids:e.source_ids});
  add({id:'EDGE-'+e.id,from_id:e.person_id,to_id:e.id,type:e.date_text+' · 相关事迹',fact_id:e.fact_ids[0],source_id:e.source_ids[0],boundary:'事实片段关联，不推断其他参与者'},e.id,'context',e.stage==='早年求索'?'求学任教':'革命活动');
 }
 // A sparse dossier still has a readable source excerpt, without inventing a dated event.
 for(const p of people){if([...edges.values()].some(e=>e.from_id===p.id||e.to_id===p.id))continue;for(const f of [...facts.values()].filter(f=>f.person_id===p.id).slice(0,3)){
  const id='EX-'+f.id;nodes.set(id,{id,name:'史料摘读',kind:'record',description:f.text,source_ids:[f.source_id]});add({id:'EDGE-'+id,from_id:p.id,type:'现有史料片段',fact_id:f.id,source_id:f.source_id,boundary:'来源摘读，不据此增加人物交往关系。'},id,'context','史料摘读');
 }}
 const adjacency=new Map();for(const e of edges.values())for(const id of [e.from_id,e.to_id]){if(!adjacency.has(id))adjacency.set(id,[]);adjacency.get(id).push(e)}
 const center=focus||pid;if(!nodes.has(center))return null;
 if(focus){const seen=new Set([pid]),queue=[pid];while(queue.length){const id=queue.shift();for(const e of adjacency.get(id)||[]){const next=e.from_id===id?e.to_id:e.from_id;if(!seen.has(next)){seen.add(next);queue.push(next)}}}if(!seen.has(focus))return null}
 const selected=adjacency.get(center)||[],ids=new Set([center]);for(const e of selected){ids.add(e.from_id);ids.add(e.to_id)}
 const expanded=[...ids].map(id=>{const n=nodes.get(id),links=adjacency.get(id)||[],sources=[...new Set(links.map(e=>e.source_id))];return {...n,source_ids:sources,related_count:links.length,description:n.description||links[0]?.excerpt||'',source_count:sources.length}});
 return {root_id:pid,anchor_id:center,nodes:expanded,edges:selected,excluded_note:'只呈现公开且有已核事实支持的联系；相同机构、时间或地点不自动构成人物交往。'};
}
