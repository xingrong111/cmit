import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import path from 'node:path';
const result=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/drizzle-kit/bin.cjs',import.meta.url)),'generate'],{stdio:'inherit',cwd:fileURLToPath(new URL('..',import.meta.url))});
if(result.error)throw result.error;if(result.status)process.exit(result.status);
// 首次远程构建生成的迁移未回写源码；后续构建必须保持初始迁移名稳定，
// 且仅对已经存在的初始表执行幂等建表，不删除或重建任何用户数据。
const dir=fileURLToPath(new URL('../drizzle/',import.meta.url)),journal=path.join(dir,'meta','_journal.json');
if(fs.existsSync(journal)){
 const meta=JSON.parse(fs.readFileSync(journal,'utf8'));
 const first=meta.entries.find(entry=>entry.idx===0);
 if(first){
  const original=path.join(dir,first.tag+'.sql');
  if(fs.existsSync(original)){
   const sql=fs.readFileSync(original,'utf8');
   if(/CREATE TABLE\s+`app_state`/.test(sql)||/CREATE TABLE IF NOT EXISTS\s+`app_state`/.test(sql)){
    const stable='0000_shanhe_initial',target=path.join(dir,stable+'.sql');
    fs.writeFileSync(target,sql.replace(/CREATE TABLE\s+`app_state`/g,'CREATE TABLE IF NOT EXISTS `app_state`'));
    if(original!==target)fs.unlinkSync(original);
    first.tag=stable;first.when=Date.UTC(2026,9,17);
    fs.writeFileSync(journal,JSON.stringify(meta,null,2));
   }
  }
 }
}
