import fs from 'node:fs';import path from 'node:path';
export function copyMiniVoice(source,out){
 const appPath=path.join(out,'app.json'),app=JSON.parse(fs.readFileSync(appPath,'utf8'));
 app.subPackages=(app.subPackages||[]).filter(p=>!p.root.startsWith('voice-act'));
 for(let act=0;act<=5;act++){
  const root='voice-act'+act,dir=path.join(out,root);fs.mkdirSync(dir,{recursive:true});
  const names=fs.readdirSync(source).filter(n=>n.startsWith('N0'+act+'-')&&n.endsWith('.mp3'));
  for(const name of names)fs.copyFileSync(path.join(source,name),path.join(dir,name));
  fs.writeFileSync(path.join(dir,'index.js'),'Page({})');fs.writeFileSync(path.join(dir,'index.json'),'{}');fs.writeFileSync(path.join(dir,'index.wxml'),'<view>故事配音资源</view>');fs.writeFileSync(path.join(dir,'index.wxss'),'');
  const bytes=fs.readdirSync(dir).reduce((n,f)=>n+fs.statSync(path.join(dir,f)).size,0);if(bytes>=2*1024*1024)throw Error(root+'音频分包超过2MB');
  app.subPackages.push({root,name:root,pages:['index']});
 }
 fs.writeFileSync(appPath,JSON.stringify(app,null,2));
}
