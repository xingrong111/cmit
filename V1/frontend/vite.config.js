import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const scenes={
  qqb:{source:fileURLToPath(new URL('../全景场景/瞿秋白/',import.meta.url)),files:['场景.html','全景样式.css','全景交互.js','three.module.js','书房全景.png','Three许可.txt']},
  ldy:{source:fileURLToPath(new URL('../全景场景/陆定一/',import.meta.url)),files:['场景.html','全景样式.css','全景交互.js','three.module.js','陆定一全景.jpg','Three许可.txt']}
}
function panoramaAssets(){return {name:'shanhe-panorama-assets',closeBundle(){if(process.env.UNI_PLATFORM==='h5')for(const [slug,scene] of Object.entries(scenes))fs.cpSync(scene.source,fileURLToPath(new URL(`./dist/build/h5/panorama/${slug}/`,import.meta.url)),{recursive:true})},configureServer(server){server.middlewares.use((req,res,next)=>{const m=req.url?.match(/^\/panorama\/(qqb|ldy)\//);if(!m)return next();const scene=scenes[m[1]];let name;try{name=decodeURIComponent(req.url.split('?')[0].replace(/^\/panorama\/(qqb|ldy)\//,''))}catch{return next()}if(!scene.files.includes(name))return next();const file=path.join(scene.source,name);if(!fs.existsSync(file))return next();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.txt':'text/plain; charset=utf-8'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)})}}}
export default defineConfig({ plugins: [uni(),panoramaAssets()], server: {host:'127.0.0.1',port:8791} })
