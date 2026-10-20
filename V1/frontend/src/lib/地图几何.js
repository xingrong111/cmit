import packed from '../data/省界编码.json'
// Delta/variable-length encoding restores every original coordinate; no simplification.
export function decodeRing(text,factor){let i=0,x=0,y=0;const points=[];function read(){let n=0,power=1,b;do{b=text.charCodeAt(i++)-63;n+=(b&31)*power;power*=32}while(b>=32);return n%2?-(n+1)/2:n/2}while(i<text.length){x+=read();y+=read();points.push([x/factor,y/factor])}return points}
export default {type:'FeatureCollection',features:packed.features.map(f=>({properties:{'区划码':f.code},geometry:{type:'MultiPolygon',coordinates:f.polygons.map(p=>p.map(r=>decodeRing(r,packed.factor)))}}))}
