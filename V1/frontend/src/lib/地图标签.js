// 以引线移开密集标签，不再因相邻省份拥挤而直接丢弃人数。
export function placeLabels(anchors,width,height,selectedCode){
 const occupied=[],result=[]
 const sorted=[...anchors].sort((a,b)=>Number(b.code===selectedCode)-Number(a.code===selectedCode))
 for(const a of sorted){
  if(a.x<0||a.x>width||a.y<0||a.y>height-24)continue
  let point=null
  for(let radius=0;radius<=Math.max(width,height)&&!point;radius+=16){
   const steps=radius?Math.max(8,Math.ceil(2*Math.PI*radius/16)):1
   for(let i=0;i<steps;i++){
    const x=a.x+Math.cos(i*2*Math.PI/steps)*radius,y=a.y+Math.sin(i*2*Math.PI/steps)*radius
    if(x<19||x>width-19||y<18||y>height-40)continue
    // 右上角为缩放控件保留空间。
    if(x>width-66&&y<145)continue
    if(occupied.some(p=>Math.abs(p.x-x)<39&&Math.abs(p.y-y)<29))continue
    point={...a,x,y,anchorX:a.x,anchorY:a.y};break
   }
  }
  if(point){occupied.push(point);result.push(point)}
 }
 return result
}
