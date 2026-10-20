const PRODUCT_META = {
  "WC001": {
    "category": "书签",
    "kind": "bookmark",
    "tagline": "江竹筠主题书签",
    "cover": "http://127.0.0.1:3210/modules/wenchuang/images/WC001.png",
    "meaning": "正面为确认版人物书签：顶部「山河有迹」用免费商用中华薪火体写成铺满内框的大字，右上朱砂印章呼应；中部名言「踏着父母之足迹，为建设新中国奋斗到底」以三列竖排框格呈现，右侧细字竖排标注出处，左侧缀同源红梅、竖排题字与名章；下方完整呈现江竹筠大半身 IP 立绘（发型、面部完整不遮挡），姓名与生卒年竖排于人物身旁。背面为「针线里的黎明」概念图（不放人物形象、不设标题大字）：右上初升的红日晕染晨雾，山河沉着于下半幅，一枚钢针引出红绸只在山峦湖雾间蔓延、不与日相连；名言横排安放在太阳与山河之间的晨雾留白带，朱砂印章与正面同风格，并收录江竹筠狱中书信的另一句名言。"
  },
  "WC002": {
    "category": "明信片",
    "kind": "postcard",
    "tagline": "数字明信片",
    "cover": "http://127.0.0.1:3210/modules/wenchuang/images/WC002.png",
    "meaning": "以层叠远山与一条大江构成“山河”意象，取“初识”之意，呼应第一次答完一组题目、点亮第一枚称号的起点。淡青设色与大片留白让画面安静，左上题签区与右下编号区留出可读空间。"
  },
  "WC003": {
    "category": "纪念册",
    "kind": "album",
    "tagline": "学习纪念册（成册 PDF）",
    "cover": "http://127.0.0.1:3210/modules/wenchuang/images/WC003.png",
    "meaning": "以拾级而上的石阶与隐约足迹为封面主视觉，阶顶一点晨光对应「循迹」与「成长」。全册共七页：封面、五页称号实录（星火初学者 / 追光探寻者 / 山河寻迹者 / 薪火传习者 / 山河知音，每页含五枚进度金点、解锁条件、寓意短句与名章，页面下方缀与称号意象呼应的山河画带——灯火、日出、足迹、红梅、江景）、封底；随称号点亮逐页集齐，最终合成完整一册。"
  },
  "WC004": {
    "category": "书签",
    "kind": "bookmark",
    "tagline": "瞿秋白主题书签",
    "cover": "http://127.0.0.1:3210/modules/wenchuang/images/WC004.png",
    "meaning": "正面沿用江竹筠书签确认版式：顶部「山河有迹」中华薪火体大字铺满内框，右上朱砂印章；中部名言「总想为大家辟一条光明的路」以三列竖排框格呈现，右侧细字竖排标注出处，左侧缀红梅、竖排题字「向光明去」与名章「秋白」；下方完整呈现瞿秋白大半身 IP 立绘（圆框眼镜、发型、面部完整不遮挡），姓名与生卒年竖排于人物身旁。背面不放人物形象、不设标题大字：右上初升红日晕染晨雾，山河下沉于下半幅，钢针引出红绸只在山峦湖雾间蔓延；名言横排安放在太阳与山河之间的晨雾留白带。"
  },
  "WC005": {
    "category": "书签",
    "kind": "bookmark",
    "tagline": "山河通用书签",
    "cover": "http://127.0.0.1:3210/modules/wenchuang/images/WC005.png",
    "meaning": "双面山河、两处景象：正面为全新青绿山水——远山淡墨层叠、江面如镜一叶小舟、坡岸苍松村落炊烟，顶部「山河有迹」大字，名言「江山留胜迹，我辈复登临」两列框格竖排、安放于江面留白带；背面沿用日出山河意象——右上初升红日晕染晨雾，山河沉着于下半幅，钢针红绸延续「针线里的黎明」的系列视觉，名言「欲穷千里目，更上一层楼」横排晨雾留白带。「登临」与「更上一层楼」前后呼应，供任意学习阶段的用户随身收藏。"
  },
  "WC006": {
    "category": "明信片",
    "kind": "postcard",
    "tagline": "数字明信片",
    "cover": "http://127.0.0.1:3210/modules/wenchuang/images/WC006.png",
    "meaning": "与「山河初识」成对的进阶款：同一片山水转入暮色，层叠远山之间，村落与渔船点亮成串暖黄灯火，灯影随江水轻晃，天际一弯淡月；取「山河灯明」之意——五枚称号集齐时，学习走过的山河被灯火逐一照亮。左侧题签区与左下编号区留出可读空间，版式与 WC002 一致。"
  }
}
const CATEGORIES = ['书签', '明信片', '纪念册']
const TITLE_NAMES = { 'H-GROUP-BEGINNER': '星火初学者', 'H-GROUP-ADVANCED': '追光探寻者', 'H-CROSS-2': '红色寻迹者', 'H-CROSS-4': '星火传承者', 'H-CROSS-5': '理想点灯人' }
const GROUP_NAMES = { QQB: '瞿秋白', LYS: '狼牙山五壮士', SZZ: '宋振中', LDY: '陆定一', JZY: '江竹筠' }
const GROUP_LEVEL = { 'H-GROUP-BEGINNER': '入门关', 'H-GROUP-ADVANCED': '进阶关' }

function metaOf(id) {
  return Object.assign({ category: '文创', kind: 'postcard', tagline: '数字文创', meaning: '', cover: '' }, PRODUCT_META[id] || {})
}
function describeCondition(c) {
  if (!c) return ''
  if (c.type === 'group_level') return `完成「${GROUP_NAMES[c.group_id] || c.group_id}」${c.difficulty}挑战`
  if (c.type === 'free') return '登录后即可领取'
  if (c.type === 'group_title') {
    const g = GROUP_NAMES[c.group_id] || c.group_id, t = TITLE_NAMES[c.title_id] || c.title_id, lv = GROUP_LEVEL[c.title_id]
    return lv ? `答完「${g}」${lv}，获得称号「${t}」` : `在「${g}」组获得称号「${t}」`
  }
  if (c.type === 'distinct_titles') return c.count <= 1 ? '获得任意 1 个学习称号' : `累计获得 ${c.count} 个不同的学习称号`
  return ''
}
function stateOf(p) {
  if (!p) return { key: 'locked', label: '未解锁' }
  if (p.guest) return { key: 'guest', label: '登录后查看' }
  if (p.claimed) return { key: 'claimed', label: '已领取' }
  if (!p.unlocked) return { key: 'locked', label: '未解锁' }
  if (p.asset_status !== '已就绪') return { key: 'pending', label: '已解锁 · 待上架' }
  return { key: 'ready', label: '可领取' }
}
function progressText(p) {
  if (p && p.guest) return '登录后查看解锁进度'
  if (!p || !p.required) return ''
  return p.claimed ? '已收入我的收藏' : `解锁进度 ${p.progress} / ${p.required}`
}
function percent(p) { return p && p.required ? Math.min(100, Math.round(p.progress / p.required * 100)) : 0 }
function assetLabel(file, i, total) {
  if (/\.pdf$/i.test(file)) return '打开完整纪念册 PDF'
  if (/front/i.test(file)) return '保存正面'
  if (/back/i.test(file)) return '保存反面'
  return total > 1 ? `保存图片 ${i + 1}` : '保存图片'
}
function formatDate(iso) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
function decorate(p) {
  const m = metaOf(p.id)
  const st = stateOf(p)
  return Object.assign({}, p, m, {
    stateKey: st.key,
    stateLabel: st.label,
    progressLabel: progressText(p),
    percent: percent(p),
    conditionText: describeCondition(p.condition)
  })
}

module.exports = { CATEGORIES, metaOf, describeCondition, stateOf, progressText, percent, assetLabel, formatDate, decorate }
