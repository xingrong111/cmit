import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const panoramaSource=fileURLToPath(new URL('../全景场景/瞿秋白/',import.meta.url))
const panoramaOutput=fileURLToPath(new URL('./dist/build/h5/panorama/qqb/',import.meta.url))
function panoramaAssets(){return {name:'shanhe-panorama-assets',closeBundle(){if(process.env.UNI_PLATFORM==='h5')fs.cpSync(panoramaSource,panoramaOutput,{recursive:true})},configureServer(server){server.middlewares.use((req,res,next)=>{if(!req.url?.startsWith('/panorama/qqb/'))return next();let name;try{name=decodeURIComponent(req.url.split('?')[0].slice('/panorama/qqb/'.length))}catch{return next()}if(!['场景.html','全景样式.css','全景交互.js','three.module.js','书房全景.png','Three许可.txt'].includes(name))return next();const file=path.join(panoramaSource,name);if(!fs.existsSync(file))return next();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.txt':'text/plain; charset=utf-8'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)})}}}
export default defineConfig({ plugins: [uni(),panoramaAssets()], server: {host:'127.0.0.1',port:8791} })
