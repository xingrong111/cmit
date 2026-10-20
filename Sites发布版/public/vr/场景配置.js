// 每张AI艺术化全景独立标定；像素基准1774×887，方向角不依赖屏幕尺寸。
export const STORY_VERSION = 'static-v1';
export const GENERATED_ASSETS = ['素材/第一幕-窗边交谈-v1.png','素材/第二幕-红布初现-v1.png','素材/第三幕-布角理平-v1.png'];
const point = (label,x,y) => ({label,yaw:x/1774*360-180,pitch:90-y/887*180});
const act1Anchors = {
 JJ:point('江姐',875,422),YOUNG:point('年轻狱友',706,425),ELDER:point('年长狱友',1053,442),
 GROUP:point('三人',888,485),WINDOW:point('窗边微光',190,260),CLOTH:point('桌面',890,572),
};
const act2Anchors = {
 JJ:point('江姐',893,426),YOUNG:point('年轻狱友',706,426),ELDER:point('年长狱友',1054,443),
 GROUP:point('三人',888,485),WINDOW:point('窗边微光',190,260),CLOTH:point('红布',888,571),
};
const act3Anchors = {
 JJ:point('江姐',886,426),YOUNG:point('年轻狱友',706,424),ELDER:point('年长狱友',1055,440),
 GROUP:point('三人',888,485),WINDOW:point('窗边微光',190,260),CLOTH:point('红布',888,571),
};
const sewingAnchors = {
 JJ:{label:'江姐',yaw:0.7,pitch:3.9},YOUNG:{label:'年轻狱友',yaw:-34.6,pitch:2.2},ELDER:{label:'年长狱友',yaw:32,pitch:-0.9},
 GROUP:{label:'三人',yaw:-3.3,pitch:-8},WINDOW:{label:'高窗',yaw:-144.5,pitch:38.3},CLOTH:{label:'红布',yaw:6.7,pitch:-22.6},
};
const hotspots = [
 {id:'H01',label:'窗边微光',anchor:'WINDOW'},
 {id:'H02',label:'走近她们',anchor:'GROUP'},
 {id:'H03',label:'一块红布',anchor:'CLOTH'},
 {id:'H04',label:'继续制作',anchor:'CLOTH'},
 {id:'H05',label:'一起完成',anchor:'CLOTH'},
];
const scene=(title,image,anchors,note='')=>({title,image,anchors,hotspots:hotspots.map(h=>({...h})),defaultView:{yaw:0,pitch:-4,fov:75},fovRange:[40,95],pitchRange:[-55,55],note});
export const scenes={
 SC00:scene('序章','./素材/第一幕-窗边交谈-v1.png',act1Anchors),
 SC01:scene('第一幕 窗边的微光','./素材/第一幕-窗边交谈-v1.png',act1Anchors),
 'SC02-EMPTY':scene('第二幕 尚未拿出红布','./素材/第一幕-窗边交谈-v1.png',act1Anchors),
 'SC02-TEXT':scene('第二幕 红布初现','./素材/第二幕-红布初现-v1.png',act2Anchors),
 SC02:scene('第二幕 红布初现','./素材/第二幕-红布初现-v1.png',act2Anchors),
 'SC03-TEXT':scene('第三幕 理平之前','./素材/第二幕-红布初现-v1.png',act2Anchors),
 'SC03-FLAT':scene('第三幕 布角理平','./素材/第三幕-布角理平-v1.png',act3Anchors),
 SC03:scene('第三幕 布角理平','./素材/第三幕-布角理平-v1.png',act3Anchors),
 SC04:scene('第四幕 针线之间','./素材/江姐主题全景.png',sewingAnchors),
 'SC05-PROCESS':scene('制作过渡','./素材/江姐主题全景.png',sewingAnchors),
 'SC05-COMPLETE':scene('第五幕 文学回顾','./素材/江姐主题全景.png',sewingAnchors,'结尾回顾 · 背景保留制作过程，不是成品画面'),
};
// 暂无独立特写；不显示虚假的放大操作。前三幕已改为完整全景。
export const closeups={
 CU03:{title:'一块红布',image:null,missing:'请在全景中观察红布，本版没有独立特写。'},
 CU04:{title:'针线之间',image:null,missing:'请在全景中观察，本版没有独立针线特写。'},
 CU05:{title:'制作过程',image:null,missing:'采用现有制作全景，不展示未经生成的成品画面。'},
};
