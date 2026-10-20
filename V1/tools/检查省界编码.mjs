import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),src=path.join(root,'frontend/src');
const original=JSON.parse(fs.readFileSync(path.join(src,'data/中国省界.json'),'utf8')),packed=JSON.parse(fs.readFileSync(path.join(src,'data/省界编码.json'),'utf8'));
const code=fs.readFileSync(path.join(src,'lib/地图几何.js'),'utf8');const context={};vm.runInNewContext(code.slice(code.indexOf('export function'),code.indexOf('export default')).replace('export function','function')+';this.decode=decodeRing;',context);
let points=0;
for(let i=0;i<original.features.length;i++){const f=original.features[i],p=packed.features[i];assert.equal(String(f.properties.区划码),p.code);const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;const restored=p.polygons.map(polygon=>polygon.map(ring=>context.decode(ring,packed.factor)));assert.deepEqual(JSON.parse(JSON.stringify(restored)),polys);for(const p of restored)for(const ring of p)points+=ring.length;}
const mini=path.join(root,'小程序端/微信开发者工具导入包');
const app=JSON.parse(fs.readFileSync(path.join(mini,'app.json'),'utf8'));
const packageRoots=(app.subPackages||app.subpackages||[]).map(p=>p.root.replace(/\\/g,'/').replace(/\/$/,''));
let size=0;const subPackageBytes=Object.fromEntries(packageRoots.map(p=>[p,0]));
function walk(d){for(const entry of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,entry.name);if(entry.isDirectory())walk(f);else{const relative=path.relative(mini,f).split(path.sep).join('/'),packageRoot=packageRoots.find(p=>relative.startsWith(p+'/')),bytes=fs.statSync(f).size;if(packageRoot)subPackageBytes[packageRoot]+=bytes;else size+=bytes;}}}walk(mini);
assert(size<2*1024*1024,'主包超过2MiB');for(const [name,bytes] of Object.entries(subPackageBytes))assert(bytes<2*1024*1024,name+'分包超过2MiB');
const report={regions:original.features.length,points,allCoordinatesExactlyRestored:true,mainPackageBytes:size,mainPackageWithin2MiB:true,subPackageBytes,deviceTest:false};fs.writeFileSync(path.join(root,'docs/省界编码与包体检查.json'),JSON.stringify(report,null,2));console.log(report);
