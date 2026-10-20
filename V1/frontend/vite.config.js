import integratedStoryAssets from './story-assets.mjs'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const panoramaSource=fileURLToPath(new URL('../全景场景/瞿秋白/',import.meta.url))
const panoramaOutput=fileURLToPath(new URL('./dist/build/h5/panorama/qqb/',import.meta.url))
function panoramaAssets(){return {name:'shanhe-panorama-assets',closeBundle(){if(process.env.UNI_PLATFORM==='h5')fs.cpSync(panoramaSource,panoramaOutput,{recursive:true})},configureServer(server){server.middlewares.use((req,res,next)=>{if(!req.url?.startsWith('/panorama/qqb/'))return next();let name;try{name=decodeURIComponent(req.url.split('?')[0].slice('/panorama/qqb/'.length))}catch{return next()}if(!['场景.html','全景样式.css','全景交互.js','three.module.js','书房全景.png','宋振中全景.png','Three许可.txt'].includes(name))return next();const file=path.join(panoramaSource,name);if(!fs.existsSync(file))return next();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.txt':'text/plain; charset=utf-8'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)})}}}
function storyAssets(){return {name:'jiang-story-assets',closeBundle(){if(process.env.UNI_PLATFORM!=='h5')return;const src=fileURLToPath(new URL('../江姐VR示例/',import.meta.url)),out=fileURLToPath(new URL('./dist/build/h5/panorama/jiang/',import.meta.url));fs.mkdirSync(path.join(out,'素材'),{recursive:true});for(const n of ['第一幕.html','第一幕样式.css','第一幕交互.js','第一幕动态版.html','动态第一幕样式.css','动态第一幕交互.js','动态人物层.js'])fs.copyFileSync(path.join(src,n),path.join(out,n));for(const n of ['窗边交谈全景.png','牢房空景.png','三人独立素材.png','three.module.js','Three许可.txt'])fs.copyFileSync(path.join(src,'素材',n),path.join(out,'素材',n));}}}
export default defineConfig({ plugins: [uni(),panoramaAssets(),storyAssets(),wolfAssets(),integratedStoryAssets(),ldyAssets()], server: {host:'127.0.0.1',port:8791,proxy:{
 '/api/guide':{target:'http://127.0.0.1:3113',rewrite:p=>p.replace(/^\/api\/guide/,'/api')},
 '/api/reading':{target:'http://127.0.0.1:3111',rewrite:p=>p.replace(/^\/api\/reading/,'/api')},
 '/api/account':{target:'http://127.0.0.1:3112',rewrite:p=>p.replace(/^\/api\/account/,'/api')},
 '/api/learning':{target:'http://127.0.0.1:3114',rewrite:p=>p.replace(/^\/api\/learning/,'/api')},
 '/web':{target:'http://127.0.0.1:3113'},
 '/preview':{target:'http://127.0.0.1:3113'},
 '/media':{target:'http://127.0.0.1:3113'},
 '/modules/learning':{target:'http://127.0.0.1:3114',rewrite:p=>p.replace(/^\/modules\/learning/,'')},
 '/modules/account':{target:'http://127.0.0.1:3112',rewrite:p=>p.replace(/^\/modules\/account/,'')}
}} })

function wolfAssets(){return {name:"wolf-panorama",closeBundle(){if(process.env.UNI_PLATFORM!=="h5")return;const src=fileURLToPath(new URL("../全景场景/狼牙山五壮士VR场景/",import.meta.url)),out=fileURLToPath(new URL("./dist/build/h5/panorama/lys/",import.meta.url));fs.mkdirSync(path.join(out,"素材"),{recursive:true});for(const n of ["场景预览.html","场景样式.css","接地修正.css","全景交互.js"])fs.copyFileSync(path.join(src,n),path.join(out,n));for(const n of ["狼牙山五壮士-清晰接地全景-v8.png","狼牙山五壮士-清晰人物全景-v6.png","three.module.js","Three许可.txt"])fs.copyFileSync(path.join(src,"素材",n),path.join(out,"素材",n));}}}

function ldyAssets(){return {name:"ldy-panorama-assets",closeBundle(){if(process.env.UNI_PLATFORM!=="h5")return;fs.cpSync(fileURLToPath(new URL("../全景场景/陆定一/",import.meta.url)),fileURLToPath(new URL("./dist/build/h5/panorama/ldy/",import.meta.url)),{recursive:true});}}}
