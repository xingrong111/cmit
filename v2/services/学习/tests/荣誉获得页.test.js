const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');const records=require('../miniprogram/utils/称号徽章.json');
test('原生结果仅首次新称号自动打开荣誉页，重看不重复，无新称号不打开',async()=>{
 const store=new Map();let page,navigations=0;const attempt={id:'DEMO-ONLY',finished:true,person_name:'界面演练',difficulty:'入门',questions:[],score:{correct:0,wrong:0,total:0}};
 const wx={getStorageSync:k=>store.get(k),setStorageSync:(k,v)=>store.set(k,v),removeStorageSync:k=>store.delete(k),navigateTo:()=>navigations++,showToast(){}};
 const context={Page:x=>page=x,wx,require:src=>src.includes('称号徽章')?records:{learnerId:()=>'',request:async()=>attempt}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../miniprogram/pages/result/result.js'),'utf8'),context);
 page.data={...page.data};page.attemptId=attempt.id;page.setData=v=>Object.assign(page.data,v);
 store.set('yingji:earned:'+attempt.id,[{title_id:'H-PATH-1',name:'星火初学者'}]);await page.load();assert.equal(navigations,1);await page.load();assert.equal(navigations,1);
 store.delete('yingji:reward-seen:'+attempt.id);store.set('yingji:earned:'+attempt.id,[]);await page.load();assert.equal(navigations,1);
});
test('原生荣誉页合并去重、突出最高称号，缺少授予记录时不伪造',()=>{
 let page;const source=fs.readFileSync(path.join(__dirname,'../miniprogram/pages/reward/reward.js'),'utf8');let earned=[{title_id:'H-PATH-1'},{title_id:'H-PATH-2'},{title_id:'H-PATH-1'}];const context={Page:x=>page=x,wx:{getStorageSync:()=>earned},require:()=>records};vm.createContext(context);vm.runInContext(source,context);page.setData=v=>Object.assign(page.data,v);page.onLoad({id:'DEMO-ONLY'});assert.equal(page.data.items.length,2);assert.equal(page.data.top.id,'H-PATH-2');earned=[];page.onLoad({id:'DEMO-ONLY'});assert.equal(page.data.top,null);
});
