import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.argv[2]||process.env.PORT||3156);
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.txt':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{
  let name;
  try { name=decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch { res.writeHead(400);res.end('地址错误');return; }
  if(name==='/') name='/场景预览.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('禁止访问');return;}
  let body;
  try { body=fs.readFileSync(file); }
  catch { res.writeHead(404);res.end('资源不存在');return; }
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  res.end(body);
});
server.once('error',(error)=>{if(error.code==='EADDRINUSE'){console.error(`端口 ${port} 已被占用。请在启动命令末尾加 3157，再打开 http://127.0.0.1:3157/`);process.exitCode=1;return}throw error});
server.listen(port,'127.0.0.1',()=>console.log('狼牙山五壮士VR场景：http://127.0.0.1:'+port+'/'));
