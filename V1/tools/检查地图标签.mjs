import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const root=new URL('../',import.meta.url),src=new URL('frontend/src/',root);
const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('lib/地图标签.js',src),'utf8').replace('export function','function')+';this.placeLabels=placeLabels',sandbox);
const geo=JSON.parse(fs.readFileSync(new URL('data/中国省界.json',src),'utf8')),data=JSON.parse(fs.readFileSync(new URL('data/合并人物目录.json',src),'utf8'));
assert.equal(data.filter(p=>p.provinceCode==='130000').length,9);
const area=r=>Math.abs(r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1]},0));
const anchors=geo.features.map(f=>{const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;const ring=polys.map(p=>p[0]).sort((a,b)=>area(b)-area(a))[0];return {code:String(f.properties.区划码),p:[(Math.min(...ring.map(p=>p[0]))+Math.max(...ring.map(p=>p[0])))/2,(Math.min(...ring.map(p=>p[1]))+Math.max(...ring.map(p=>p[1])))/2]}});
const points=geo.features.flatMap(f=>f.geometry.coordinates.flat(f.geometry.type==='Polygon'?1:2));const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
for(const width of [300,343,640,900]){const height=Math.max(300,Math.min(460,width*.68)),r=Math.min((width-32)/(maxX-minX),(height-40)/(maxY-minY));const input=anchors.map(a=>({...a,x:(a.p[0]-(minX+maxX)/2)*r+width/2,y:((minY+maxY)/2-a.p[1])*r+height/2}));for(const selected of ['320000','130000','110000']){const labels=sandbox.placeLabels(input,width,height,selected);assert.equal(labels.length,34,`${width}: missing labels`);assert(labels.some(p=>p.code==='130000'));for(const a of labels)assert(!labels.some(b=>a.code!==b.code&&Math.abs(a.x-b.x)<39&&Math.abs(a.y-b.y)<29));}}
console.log('通过：河北9条名单；300—900px地图全部34省标签保留、无重叠，选中省优先。');
