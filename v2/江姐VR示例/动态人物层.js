import * as THREE from './素材/three.module.js';
const radians=THREE.MathUtils.degToRad;
export const actorSpecs=[
 {name:'年轻狱友',yaw:-40,phase:0},
 {name:'江姐',yaw:0,phase:1.7},
 {name:'年长狱友',yaw:42,phase:3.1}
];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
function direction(yaw,pitch,r=9){const a=radians(yaw),b=radians(pitch);return new THREE.Vector3(Math.sin(a)*Math.cos(b)*r,Math.sin(b)*r,-Math.cos(a)*Math.cos(b)*r)}
function patch(center,width,bottom,height,radius=9){
 const geo=new THREE.PlaneGeometry(1,1,24,40),pos=geo.attributes.position,uv=geo.attributes.uv;
 for(let i=0;i<pos.count;i++){const p=direction(center+(uv.getX(i)-.5)*width,bottom+uv.getY(i)*height,radius);pos.setXYZ(i,p.x,p.y,p.z)}
 pos.needsUpdate=true;geo.computeBoundingSphere();return geo;
}
export async function createActors(scene){
 const sheet=await new THREE.TextureLoader().loadAsync('./素材/三人独立素材.png');
 const image=sheet.image,actors=[];
 for(let column=0;column<3;column++){
  const left=Math.floor(image.width*column/3),right=Math.floor(image.width*(column+1)/3),canvas=document.createElement('canvas');canvas.width=right-left;canvas.height=image.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(image,left,0,right-left,image.height,0,0,canvas.width,canvas.height);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;
  const spec=actorSpecs[column],geo=patch(spec.yaw,36,-49,66),material=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.035,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,material);mesh.renderOrder=2;scene.add(mesh);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=64;const c=shadowCanvas.getContext('2d');const g=c.createRadialGradient(128,32,0,128,32,110);g.addColorStop(0,'rgba(20,17,12,.38)');g.addColorStop(1,'rgba(20,17,12,0)');c.scale(1,.25);c.fillStyle=g;c.fillRect(0,0,256,256);
  const shadow=new THREE.Mesh(patch(spec.yaw,38,-52,8,9.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.renderOrder=1;scene.add(shadow);
  actors.push({spec,mesh,geo,texture:tex,head:direction(spec.yaw,-49+66*.88),delta:0});
 }
 sheet.dispose();let lastIndex=-1,gestureStart=-100,elapsed=0,frames=0;
 return {
  update(dt,{enabled,entered,phase,index}){
   if(enabled&&entered)elapsed+=dt;
   if(index!==lastIndex){lastIndex=index;gestureStart=elapsed}
   const gestureTime=elapsed-gestureStart;
   for(const a of actors){
    const {spec,geo}=a,uv=geo.attributes.uv,pos=geo.attributes.position;
    const breath=enabled&&entered?Math.sin(elapsed*1.35+spec.phase)*.13:0;
    let nod=0;
    if(enabled&&phase==='dialogue'&&gestureTime>=0&&gestureTime<2.4){
     const envelope=Math.sin(Math.PI*gestureTime/2.4)**2;
     if(index===0&&spec.name==='年轻狱友')nod=envelope*.8;
     if(index===1&&spec.name==='江姐')nod=-envelope*.55;
     if(index===3&&spec.name==='年长狱友')nod=-envelope*.4;
    }
    for(let j=0;j<pos.count;j++){
     const u=uv.getX(j),v=uv.getY(j);
     // 双脚、凳子和膝上双手固定；动作限于胸口及头颈。
     const torso=smooth(.52,.68,v)*(1-smooth(.80,.94,v));
     const head=smooth(.71,.86,v);
     const lift=breath*torso+nod*head;
     const p=direction(spec.yaw+(u-.5)*36,-49+v*66+lift);
     pos.setXYZ(j,p.x,p.y,p.z);
    }
    pos.needsUpdate=true;a.delta=breath+nod;
    a.head.copy(direction(spec.yaw,-49+66*.88+nod));
   }
   frames++;
   window.actorMotionState={enabled,elapsed,frames,layered:true,footAnchored:true,actors:actors.map(a=>({name:a.spec.name,delta:a.delta,foot:[...a.geo.attributes.position.array.slice(-3)]}))};
  },
  anchor(name){return actors.find(a=>a.spec.name===name)?.head.clone()},
  dispose(){for(const a of actors){a.geo.dispose();a.texture.dispose();a.mesh.material.dispose();scene.remove(a.mesh)}}
 };
}
