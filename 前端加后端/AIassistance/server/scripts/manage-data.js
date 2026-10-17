import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateData} from '../src/domain.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'data/content.json');
export function managementErrors(data){
 const errors=validateData(data);
 for(const p of data.places||[]){
  if(!p.coordinate?.verified)continue;
  const e=p.entranceEvidence;
  if(!e||!['official_entrance_map','onsite_record'].includes(e.method)||!e.reviewer||!e.checkedAt||!Number.isFinite(Date.parse(e.checkedAt))||Date.parse(e.checkedAt)>Date.now()||!e.position||!e.record||!e.sourceIds?.length||e.sourceIds.some(id=>!data.sources.some(s=>s.id===id))||!e.sourceIds.includes(p.coordinate.sourceId))errors.push('入口核验记录缺失或无效：'+p.id);
  else if(!e.coordinate||['latitude','longitude','type'].some(key=>e.coordinate[key]!==p.coordinate[key]))errors.push('入口证据坐标与启用坐标不一致：'+p.id);
 }
 return errors;
}
function escape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command='report',input,flag]=process.argv.slice(2);
 try{
  if(command==='import'){
   if(!input)throw Error('请提供完整JSON资料文件路径');
   const data=JSON.parse(fs.readFileSync(path.resolve(input),'utf8').replace(/^\uFEFF/,''));const errors=managementErrors(data);if(errors.length)throw Error(errors.join('\n'));
   if(flag!=='--apply'){console.log('校验通过，仅预检；加 --apply 才写入。');process.exit(0);}
   const backup=path.join(root,'data/backups');fs.mkdirSync(backup,{recursive:true});const stamp=Date.now();fs.copyFileSync(target,path.join(backup,stamp+'.json'));
   const temp=target+'.tmp';fs.writeFileSync(temp,JSON.stringify(data,null,2));fs.renameSync(temp,target);
   fs.appendFileSync(path.join(backup,'versions.jsonl'),JSON.stringify({at:new Date().toISOString(),backup:stamp+'.json',places:data.places.length,facts:data.facts.length,sources:data.sources.length})+'\n');console.log('已备份并导入；重启后端生效。');
  }else if(command==='export'){
   if(!input)throw Error('请提供导出文件路径');const out=path.resolve(input);if(out===target)throw Error('导出路径不能覆盖当前资料');fs.copyFileSync(target,out);console.log('资料已导出。');
  }else if(command==='report'){
   const data=JSON.parse(fs.readFileSync(target,'utf8'));const out=path.join(root,'../docs/资料管理');fs.mkdirSync(out,{recursive:true});const errors=managementErrors(data);
   const report={generatedAt:new Date().toISOString(),errors,places:data.places.map(p=>({id:p.id,name:p.name,sourceIds:p.sourceIds,reviewStatus:p.reviewStatus,published:p.published,entrance:p.coordinate?.verified?'有核验记录待检查':'待核验',opening:p.opening?.checkedAt||'未知',imageStatus:p.imageStatus||'待授权'}))};
   fs.writeFileSync(path.join(out,'资料检查.json'),JSON.stringify(report,null,2));
   fs.writeFileSync(path.join(out,'资料管理.html'),'<!doctype html><meta charset="utf-8"><title>地点资料管理</title><style>body{padding:30px;background:#fbf5e9;font:16px/1.8 sans-serif;color:#35281d}h1{color:#982b28}table{border-collapse:collapse}td,th{border:1px solid #cbb38a;padding:10px}textarea{width:100%;height:350px}</style><h1>地点资料管理 · 本地工具</h1><p>查看状态，编辑完整JSON并下载草稿。导入前运行校验；本页面不能批准史实或图片授权。</p><table><tr><th>地点</th><th>来源</th><th>入口</th><th>发布</th></tr>'+report.places.map(p=>'<tr><td>'+escape(p.name)+'</td><td>'+escape(p.sourceIds.join('、'))+'</td><td>'+escape(p.entrance)+'</td><td>'+escape(p.published)+'</td></tr>').join('')+'</table><h2>编辑草稿</h2><textarea id="data">'+escape(JSON.stringify(data,null,2))+'</textarea><button onclick="save()">校验JSON格式并下载草稿</button><p id="message"></p><script>function save(){try{const d=JSON.parse(document.getElementById("data").value);const u=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download="content-draft.json";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);document.getElementById("message").textContent="仅检查JSON格式；请运行服务端导入预检。";}catch(e){document.getElementById("message").textContent="JSON格式有误，请修正。";}}</script>');
   console.log('本地管理页与检查报告已生成。'+(errors.length?' 有'+errors.length+'处问题。':'结构检查通过；不代表历史核验。'));
  }else throw Error('支持 report、export <路径>、import <路径> [--apply]');
 }catch(e){console.error(e.message);process.exitCode=1;}
}
