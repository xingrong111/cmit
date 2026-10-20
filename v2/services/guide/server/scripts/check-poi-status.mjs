const key=process.env.TENCENT_MAP_KEY;
const u=new URL('https://apis.map.qq.com/ws/place/v1/search/');u.search=new URLSearchParams({keyword:'陆定一祖居陈列馆',boundary:'region(无锡市,0)',page_size:'5',key});
try{const r=await fetch(u,{signal:AbortSignal.timeout(12000)});const d=await r.json();console.log(JSON.stringify({httpStatus:r.status,providerStatus:d.status,providerMessage:d.message,dataIsArray:Array.isArray(d.data),count:d.count,keys:Object.keys(d).filter(k=>!['key','request','url'].includes(k))}));}catch(e){console.log(JSON.stringify({error:e.name}));}
