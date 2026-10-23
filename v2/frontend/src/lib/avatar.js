const avatarEngine=(()=>{
 const completed=new Map(),pictures=new Map();
 function hash(key){let h=2166136261;for(const c of String(key||'山河读者'))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}
 function landscapeAvatar(key){return '/static/avatars/reader-'+(hash(key)%4+1)+'.webp';}
 function picture(url){if(!pictures.has(url))pictures.set(url,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{pictures.delete(url);reject(Error('头像暂时无法加载'))};image.src=url;}));return pictures.get(url);}
 function renderAvatar(key='山河读者'){
  key=String(key);if(completed.has(key))return completed.get(key);
  const promise=picture(landscapeAvatar(key)).then(image=>{
   let seed=hash(key);const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');if(!ctx)return landscapeAvatar(key);
   ctx.save();ctx.beginPath();ctx.arc(128,128,127,0,Math.PI*2);ctx.clip();ctx.fillStyle='#f4ead7';ctx.fillRect(0,0,256,256);
   const side=Math.min(image.width,image.height),zoom=.9+random()*.08,crop=side*zoom,sx=(image.width-crop)*(.3+random()*.4),sy=(image.height-crop)*(.15+random()*.3);
   ctx.filter='hue-rotate('+(-7+random()*14).toFixed(3)+'deg) saturate('+(.9+random()*.2).toFixed(3)+')';ctx.drawImage(image,sx,sy,crop,crop,0,0,256,256);ctx.filter='none';
   const tones=['#8b9b7c','#c0a270','#658579','#b29a7b','#a5af94','#997a61'];const accent=tones[Math.floor(random()*tones.length)];
   ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.beginPath();ctx.arc(128,128,124,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fff7e5';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(128,128,120,0,Math.PI*2);ctx.stroke();
   // Account-specific botanical signature, kept away from the face.
   ctx.save();if(random()>.5){ctx.translate(256,0);ctx.scale(-1,1);}const x=25+random()*12,y=222+random()*8;ctx.strokeStyle=accent;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(x+20,y+6);ctx.bezierCurveTo(x-8,y-18,x+9,y-38,x+2,y-62);ctx.stroke();
   for(let n=0;n<6;n++){const px=x+random()*10,py=y-7-n*8,a=(n%2?1:-1)*(0.3+random()*.8);ctx.fillStyle=accent;ctx.globalAlpha=.55+random()*.3;ctx.beginPath();ctx.ellipse(px+(n%2?6:-3),py,3+random()*2,7+random()*3,a,0,Math.PI*2);ctx.fill();}ctx.restore();ctx.restore();
   return canvas.toDataURL('image/webp',.92);
  }).catch(error=>{completed.delete(key);throw error;});completed.set(key,promise);return promise;
 }
 return {landscapeAvatar,renderAvatar};
})();
export const landscapeAvatar=avatarEngine.landscapeAvatar;
export const renderAvatar=avatarEngine.renderAvatar;
