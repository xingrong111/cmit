// 新手引导文案：全部使用当前导航名（首页、人物、长卷、足迹、小迹、学习、我的）。

// 上手三步：同时用于首页任务卡与使用指南页，完成状态由 lib/新手任务.js 记录
export const steps=[
 {id:'person',no:'01',title:'读一个人物',copy:'从瞿秋白的档案读起，看人物概览与生平片段。',button:'走近瞿秋白',page:'person',params:{id:'P009'}},
 {id:'source',no:'02',title:'看一次资料依据',copy:'每段阅读都能回到来源。打开「事实与来源」，核对依据。',button:'查看来源',page:'sources',params:{id:'P009'}},
 {id:'ask',no:'03',title:'问小迹一个问题',copy:'不知道怎么用，或想了解人物，直接问。右下角的圆形小迹随时可点。',button:'和小迹聊聊',page:'assistant'}
];

// 按目标选路径：想做什么，就从哪里开始
export const paths=[
 {icon:'people',title:'想读一个人物',copy:'搜姓名或籍贯，进入详细档案。',button:'去人物',page:'people'},
 {icon:'timeline',title:'想顺着年代读',copy:'把人物经历放回时间里，逐段展开。',button:'去长卷',page:'timeline'},
 {icon:'pin',title:'想看一处全景',copy:'拖动环视，换个角度读历史。',button:'体验宋振中全景',page:'ip',params:{group:'SZZ'}},
 {icon:'route',title:'想去现场看看',copy:'先按城市浏览，再把地点加入路线。',button:'去足迹',page:'radar'},
 {icon:'assistant',title:'想问个问题',copy:'问使用方法、人物资料，或让小迹排路线草案。',button:'问问小迹',page:'assistant'},
 {icon:'learning',title:'想检验所学',copy:'五组主题，先入门再进阶，答完即完成。',button:'去学习',page:'learning'}
];

// 各页一次性小提示：只出现一次，点“知道了”后不再出现
export const pageTips={
 people:'先搜一个名字，或点开一位人物，从「人物概览」开始读。',
 timeline:'选一个人物或年份，每个片段都能点开看经过与来源。',
 radar:'先选城市浏览地点，不必授权定位；想去现场时，再把地点加入路线。',
 learning:'先选一个主题。入门 5 题、进阶 8 题，答完即完成，不设分数线。'
};

export const questions=[
 {q:'不登录可以使用吗？',a:'可以先浏览地图、人物、史料和全景。需要保存账户学习进度或发表评论时，再按提示登录。'},
 {q:'为什么有人只有姓名，没有完整档案？',a:'全国名单与深度档案是两个层次。项目逐步收录人物，只有部分人物已有详细材料；名单人数不等于完整档案数量。'},
 {q:'全景和人物对白是真实历史影像吗？',a:'不是。全景与IP为艺术化表达；江姐互动故事包含原创对白和虚构狱友。史实请回到人物档案及来源阅读。'},
 {q:'不授权定位，还能看地图吗？',a:'可以先选择城市浏览地点。需要附近距离和从当前位置规划路线时，再授权定位。'}
];
