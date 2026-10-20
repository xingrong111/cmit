import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const server=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'yingji-rehearsal-'));
for(const folder of ['src','scripts','data'])fs.cpSync(path.join(server,folder),path.join(temp,folder),{recursive:true,filter:p=>!p.includes('backups')});
fs.copyFileSync(path.join(server,'package.json'),path.join(temp,'package.json'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const realHash=hash(path.join(server,'data/content.json'));const target=path.join(temp,'data/content.json');const before=hash(target);
const data=JSON.parse(fs.readFileSync(target));const id=data.places[0].id;data.places[0].summary='独立测试资料：仅用于导入、重启和回滚演练，不是真实历史内容。';const draft=path.join(temp,'draft.json');fs.writeFileSync(draft,JSON.stringify(data));
const report={at:new Date().toISOString(),isolatedDirectory:temp,productionUnchanged:false,steps:[]};
function command(file){const r=spawnSync(process.execPath,['scripts/manage-data.js','import',file,'--apply'],{cwd:temp,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);report.steps.push({operation:'import --apply',result:r.stdout.trim()});}
async function check(expected){
 const port=3191;const child=spawn(process.execPath,['src/server.js'],{cwd:temp,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',PUBLIC_MODE:'false',MODEL_API_KEY:'',TENCENT_MAP_KEY:''},stdio:['ignore','pipe','pipe']});
 try{await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('exit',()=>reject(Error('测试进程退出')));child.stderr.once('data',d=>reject(Error(d.toString())));});const r=await fetch(`http://127.0.0.1:${port}/api/places/${id}`);const p=await r.json();if(!r.ok||p.summary!==expected)throw Error('重启后内容不一致');report.steps.push({operation:'新进程HTTP验证',status:r.status,summary:p.summary});}
 finally{child.kill();await once(child,'exit');}
}
await check(JSON.parse(fs.readFileSync(target)).places[0].summary);
command(draft);await check(data.places[0].summary);
const backups=fs.readdirSync(path.join(temp,'data/backups')).filter(n=>n.endsWith('.json'));const backup=path.join(temp,'data/backups',backups[0]);if(hash(backup)!==before)throw Error('备份不同于原始资料');report.steps.push({operation:'备份哈希校验',passed:true});
command(backup);await check(JSON.parse(fs.readFileSync(path.join(server,'data/content.json'))).places[0].summary);
if(hash(target)!==before){const original=JSON.parse(fs.readFileSync(path.join(server,'data/content.json'))),restored=JSON.parse(fs.readFileSync(target));if(JSON.stringify(original)!==JSON.stringify(restored))throw Error('回滚数据不一致');}
report.productionUnchanged=hash(path.join(server,'data/content.json'))===realHash;report.passed=report.productionUnchanged;
fs.writeFileSync(path.join(server,'../docs/资料管理/导入重启回滚演练.json'),JSON.stringify(report,null,2));console.log('独立演练通过；正式资料未改动。');
