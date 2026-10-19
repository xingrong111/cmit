const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {createLearning}=require('../learn');const honors=require('../honors.json');
test('五个成长称号由已有完成记录派生，按阈值递进并保留历史记录',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'yingji-honors-'));try{
 const cases=[[0,false,0],[0,true,1],[1,false,2],[2,false,3],[3,false,3],[4,false,4],[5,false,5]];
 for(const [count,entry,expected] of cases){const completions=honors.groups.slice(0,count).flatMap(g=>[{level_id:g.beginner_level_id},{level_id:g.advanced_level_id}]);if(entry)completions.push({level_id:honors.groups[0].beginner_level_id});const old={title_id:'H-GROUP-BEGINNER',group_id:'QQB',name:'历史称号'};const store={learners:{tester01:{completions,titles:[old]}},attempts:{}};const file=path.join(folder,'progress.json');fs.writeFileSync(file,JSON.stringify(store));const api=createLearning({storePath:file});const result=api.titles('tester01');assert.equal(result.titles.length,5);assert.equal(result.titles.filter(x=>x.state==='已获得').length,expected);assert(result.titles.every(x=>!x.groups));assert.deepEqual(JSON.parse(fs.readFileSync(file)),store);}
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});
test('旧完成记录迁移后重复练习，不将历史已达成称号当成本次新获得',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'yingji-honors-repeat-'));try{
 const file=path.join(folder,'progress.json');const completions=honors.groups.flatMap(g=>[{level_id:g.beginner_level_id},{level_id:g.advanced_level_id}]);fs.writeFileSync(file,JSON.stringify({learners:{tester01:{completions,titles:[]}},attempts:{}}));const api=createLearning({storePath:file});let run=(await api.start('QQB-入门','tester01')).body;
 while(!run.finished){const q=run.questions.find(x=>!x.answered);assert(q);const reply=await api.answer(run.id,q.options[0].key,q.id);assert.equal(reply.status,200);run=reply.body;if(run.finished)assert.equal(run.titles_earned.length,0);}
 assert.equal(api.titles('tester01').titles.filter(x=>x.state==='已获得').length,5);
 }finally{fs.rmSync(folder,{recursive:true,force:true})}
});

