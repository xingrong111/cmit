/* 文创页面（成员2：页面设计与交互）。纯静态，无需构建。
 * 页面：#/ 文创馆 · #/detail/WC001 详情 · #/success/WC001 领取成功 · #/collection 我的收藏 · #/view/WC001 收藏里再看一件
 * 接口约定见成员3《接口与接入操作说明》：/api/wenchuang/*，身份只传登录令牌。
 */
(function () {
  'use strict'

  // ---------- 接入时只需要改这里 ----------
  var CONFIG = {
    apiBase: '/api/wenchuang',
    tokenKey: 'yingji_token',                       // 主站 H5 的登录令牌位置
    loginUrl: '/modules/account/?returnTo=wenchuang#login', // 账户页；登录后需回到本页（需主站账户模块配合）
    learningUrl: '/#/pages/learning/index',                               // “去学习挑战”跳转位置
    homeUrl: '/'
  }

  // ---------- 展示信息：解锁、领取、素材状态一律以接口为准 ----------
  // meaning 为临时文案，成员1的产品资料表交付后替换；cover 填图稿路径（建议 4:5）后自动替换占位图。
  var PRODUCT_META = {
  "WC001": {
    "category": "书签",
    "kind": "bookmark",
    "tagline": "江竹筠主题书签",
    "cover": "/modules/wenchuang/images/WC001.png",
    "meaning": "正面为确认版人物书签：顶部「山河有迹」用免费商用中华薪火体写成铺满内框的大字，右上朱砂印章呼应；中部名言「踏着父母之足迹，为建设新中国奋斗到底」以三列竖排框格呈现，右侧细字竖排标注出处，左侧缀同源红梅、竖排题字与名章；下方完整呈现江竹筠大半身 IP 立绘（发型、面部完整不遮挡），姓名与生卒年竖排于人物身旁。背面为「针线里的黎明」概念图（不放人物形象、不设标题大字）：右上初升的红日晕染晨雾，山河沉着于下半幅，一枚钢针引出红绸只在山峦湖雾间蔓延、不与日相连；名言横排安放在太阳与山河之间的晨雾留白带，朱砂印章与正面同风格，并收录江竹筠狱中书信的另一句名言。"
  },
  "WC002": {
    "category": "明信片",
    "kind": "postcard",
    "tagline": "数字明信片",
    "cover": "/modules/wenchuang/images/WC002.png",
    "meaning": "以层叠远山与一条大江构成“山河”意象，取“初识”之意，呼应第一次答完一组题目、点亮第一枚称号的起点。淡青设色与大片留白让画面安静，左上题签区与右下编号区留出可读空间。"
  },
  "WC003": {
    "category": "纪念册",
    "kind": "album",
    "tagline": "学习纪念册（成册 PDF）",
    "cover": "/modules/wenchuang/images/WC003.png",
    "meaning": "以拾级而上的石阶与隐约足迹为封面主视觉，阶顶一点晨光对应「循迹」与「成长」。全册共七页：封面、五页称号实录（星火初学者 / 追光探寻者 / 山河寻迹者 / 薪火传习者 / 山河知音，每页含五枚进度金点、解锁条件、寓意短句与名章，页面下方缀与称号意象呼应的山河画带——灯火、日出、足迹、红梅、江景）、封底；随称号点亮逐页集齐，最终合成完整一册。"
  },
  "WC004": {
    "category": "书签",
    "kind": "bookmark",
    "tagline": "瞿秋白主题书签",
    "cover": "/modules/wenchuang/images/WC004.png",
    "meaning": "正面沿用江竹筠书签确认版式：顶部「山河有迹」中华薪火体大字铺满内框，右上朱砂印章；中部名言「总想为大家辟一条光明的路」以三列竖排框格呈现，右侧细字竖排标注出处，左侧缀红梅、竖排题字「向光明去」与名章「秋白」；下方完整呈现瞿秋白大半身 IP 立绘（圆框眼镜、发型、面部完整不遮挡），姓名与生卒年竖排于人物身旁。背面不放人物形象、不设标题大字：右上初升红日晕染晨雾，山河下沉于下半幅，钢针引出红绸只在山峦湖雾间蔓延；名言横排安放在太阳与山河之间的晨雾留白带。"
  },
  "WC005": {
    "category": "书签",
    "kind": "bookmark",
    "tagline": "山河通用书签",
    "cover": "/modules/wenchuang/images/WC005.png",
    "meaning": "双面山河、两处景象：正面为全新青绿山水——远山淡墨层叠、江面如镜一叶小舟、坡岸苍松村落炊烟，顶部「山河有迹」大字，名言「江山留胜迹，我辈复登临」两列框格竖排、安放于江面留白带；背面沿用日出山河意象——右上初升红日晕染晨雾，山河沉着于下半幅，钢针红绸延续「针线里的黎明」的系列视觉，名言「欲穷千里目，更上一层楼」横排晨雾留白带。「登临」与「更上一层楼」前后呼应，供任意学习阶段的用户随身收藏。"
  },
  "WC006": {
    "category": "明信片",
    "kind": "postcard",
    "tagline": "数字明信片",
    "cover": "/modules/wenchuang/images/WC006.png",
    "meaning": "与「山河初识」成对的进阶款：同一片山水转入暮色，层叠远山之间，村落与渔船点亮成串暖黄灯火，灯影随江水轻晃，天际一弯淡月；取「山河灯明」之意——五枚称号集齐时，学习走过的山河被灯火逐一照亮。左侧题签区与左下编号区留出可读空间，版式与 WC002 一致。"
  }
}
  var CATEGORIES = ['书签', '明信片', '纪念册']
  var TITLE_NAMES = { 'H-GROUP-BEGINNER': '星火初学者', 'H-GROUP-ADVANCED': '追光探寻者', 'H-CROSS-2': '红色寻迹者', 'H-CROSS-4': '星火传承者', 'H-CROSS-5': '理想点灯人' }
  var GROUP_NAMES = { QQB: '瞿秋白', LYS: '狼牙山五壮士', SZZ: '宋振中', LDY: '陆定一', JZY: '江竹筠' }
  var GROUP_LEVEL = { 'H-GROUP-BEGINNER': '入门关', 'H-GROUP-ADVANCED': '进阶关' }
  var ID_RE = /^WC\d{3}$/
  var FILE_RE = /^[A-Za-z0-9_-]+\.(png|jpe?g|webp|pdf)$/i
  var RETURN_KEY = 'yingji:wc:return-product'

  function metaOf(id) {
    var base = { category: '文创', kind: 'postcard', tagline: '数字文创', meaning: '', cover: '' }
    var hit = PRODUCT_META[id] || {}
    for (var k in hit) base[k] = hit[k]
    return base
  }
  function describeCondition(c) {
    if (!c) return ''
    if (c.type === 'group_level') return '完成「' + (GROUP_NAMES[c.group_id] || c.group_id) + '」' + c.difficulty + '挑战'
    if (c.type === 'free') return '登录后即可领取'
    if (c.type === 'group_title') {
      var g = GROUP_NAMES[c.group_id] || c.group_id, t = TITLE_NAMES[c.title_id] || c.title_id, lv = GROUP_LEVEL[c.title_id]
      return lv ? '答完「' + g + '」' + lv + '，获得称号「' + t + '」' : '在「' + g + '」组获得称号「' + t + '」'
    }
    if (c.type === 'distinct_titles') return c.count <= 1 ? '获得任意 1 个学习称号' : '累计获得 ' + c.count + ' 个不同的学习称号'
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
    if (!p || p.guest) return p && p.guest ? '登录后查看解锁进度' : ''
    if (!p.required) return ''
    return p.claimed ? '已收入我的收藏' : '解锁进度 ' + p.progress + ' / ' + p.required
  }
  function percent(p) { return p && p.required ? Math.min(100, Math.round(p.progress / p.required * 100)) : 0 }
  function assetLabel(file, i, total) {
    if (/\.pdf$/i.test(file)) return '保存完整纪念册 PDF'
    if (/front/i.test(file)) return '保存正面'
    if (/back/i.test(file)) return '保存反面'
    return total > 1 ? '保存图片 ' + (i + 1) : '保存图片'
  }
  function formatDate(iso) {
    var d = new Date(iso)
    return isNaN(d.getTime()) ? '' : d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] })
  }

  // ---------- 演示数据：仅本机/文件打开时可用，线上不会出现 ----------
  // 地址加 ?mock=1（或 login / error / empty / slow / claimfail / off）。直接双击打开文件默认就是演示数据。
  var LOCAL = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  function mockMode() {
    if (!LOCAL) return ''
    var hit = /[?&]mock=([\w-]+)/.exec(location.search + location.hash)
    if (hit) {
      if (hit[1] === 'off') sessionStorage.setItem('yingji:wc:mock', 'off')
      else sessionStorage.setItem('yingji:wc:mock', hit[1])
    }
    var mode = sessionStorage.getItem('yingji:wc:mock')
    if (mode === 'off') return ''
    if (mode) return mode
    return location.protocol === 'file:' ? '1' : ''
  }
  var MOCK_PRODUCTS = [
    { id: 'WC001', name: '针线里的黎明', condition: { type: 'group_title', title_id: 'H-GROUP-BEGINNER', group_id: 'JZY' }, unlocked: true, progress: 1, required: 1, asset_status: '已就绪' },
    { id: 'WC002', name: '山河初识', condition: { type: 'distinct_titles', count: 1 }, unlocked: true, progress: 1, required: 1, asset_status: '待素材' },
    { id: 'WC003', name: '循迹成长纪念册', condition: { type: 'distinct_titles', count: 5 }, unlocked: false, progress: 2, required: 5, asset_status: '待素材' }
  ]
  var MOCK_ASSETS = { WC001: ['WC001-front.png', 'WC001-back.png'] }
  function mockClaimed() { try { return JSON.parse(sessionStorage.getItem('yingji:wc:mock-claims') || '{}') } catch (e) { return {} } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  function fail(message, status, code) { var e = new Error(message); e.status = status; e.code = code; return e }

  function publicCatalog() {
    return fetch(CONFIG.apiBase + '/products').then(function (res) { return res.json() }).then(function (data) { return data.products || [] })
  }
  function mockRequest(mode, path, method) {
    return wait(mode === 'slow' ? 1600 : 250).then(function () {
      if (mode === 'login' && path === '/products') return { products: publicCatalog() }
      if (mode === 'login') throw fail('请先登录账户', 401)
      if (mode === 'error') throw fail('暂时无法核验账户或称号，请稍后重试', 503)
      var claimed = mockClaimed()
      if (path === '/products') {
        if (mode === 'empty') return { products: [] }
        return { products: MOCK_PRODUCTS.map(function (p) { return Object.assign({}, p, { claimed: !!claimed[p.id], assets: claimed[p.id] ? MOCK_ASSETS[p.id] || [] : [] }) }) }
      }
      if (path === '/claims') {
        if (mode === 'empty') return { claims: [] }
        return { claims: Object.keys(claimed).map(function (id) {
          var p = MOCK_PRODUCTS.filter(function (x) { return x.id === id })[0]
          return { product_id: id, claimed_at: claimed[id], name: p ? p.name : id, assets: MOCK_ASSETS[id] || [] }
        }) }
      }
      var hit = /^\/products\/(WC\d{3})\/claim$/.exec(path)
      if (hit && method === 'POST') {
        if (mode === 'claimfail') throw fail('文创服务暂时不可用', 500)
        var product = MOCK_PRODUCTS.filter(function (x) { return x.id === hit[1] })[0]
        if (!product) throw fail('作品不存在', 404)
        if (claimed[product.id]) return { claim: { product_id: product.id, claimed_at: claimed[product.id] }, already_claimed: true }
        if (!product.unlocked) throw fail('尚未满足解锁条件', 403)
        if (product.asset_status !== '已就绪') throw fail('作品原图待交付，暂不能领取', 409, 'ASSET_PENDING')
        claimed[product.id] = new Date().toISOString()
        sessionStorage.setItem('yingji:wc:mock-claims', JSON.stringify(claimed))
        return { claim: { product_id: product.id, claimed_at: claimed[product.id] }, already_claimed: false }
      }
      throw fail('接口不存在', 404)
    })
  }

  // ---------- 接口 ----------
  function token() { return localStorage.getItem(CONFIG.tokenKey) || '' }
  function request(path, method) {
    method = method || 'GET'
    var mode = mockMode()
    if (mode) return mockRequest(mode, path, method)
    if (!token() && path !== '/products') return Promise.reject(fail('请先登录账户', 401))
    var ctl = new AbortController()
    var timer = setTimeout(function () { ctl.abort() }, 12000)
    return fetch(CONFIG.apiBase + path, { method: method, headers: { Authorization: 'Bearer ' + token() }, signal: ctl.signal })
      .catch(function () { throw fail('无法连接文创服务，请检查网络后重试') })
      .then(function (res) {
        return res.json().catch(function () { return {} }).then(function (data) {
          if (!res.ok) throw fail(data.error || '请求失败', res.status, data.code)
          return data
        })
      })
      .finally(function () { clearTimeout(timer) })
  }
  function listProducts() {
    var mode = mockMode()
    if (mode === 'login') return Promise.resolve(MOCK_PRODUCTS.map(function (p) { return Object.assign({}, p, { guest: true }) }))
    return request('/products').then(function (d) { return d.products || [] })
  }
  function listClaims() { return request('/claims').then(function (d) { return d.claims || [] }) }
  function claimProduct(id) {
    if (!ID_RE.test(id)) return Promise.reject(fail('作品编号无效'))
    return request('/products/' + encodeURIComponent(id) + '/claim', 'POST')
  }
  function errorText(e) {
    if (!e) return '操作失败，请稍后重试'
    if (e.status === 401) return '请先登录账户'
    if (e.status === 403) return '还没有满足解锁条件，继续学习挑战就能解锁'
    if (e.code === 'ASSET_PENDING') return '这件作品还在整理上架，暂时不能领取'
    return e.message || '操作失败，请稍后重试'
  }

  var IN_WECHAT = /MicroMessenger/i.test(navigator.userAgent)
  function saveImage(productId, file) {
    if (!ID_RE.test(productId) || !FILE_RE.test(file)) return Promise.reject(fail('素材编号无效'))
    if (mockMode()) return Promise.reject(fail('演示数据没有真实原图，正式数据领取后即可保存'))
    return fetch(CONFIG.apiBase + '/claims/' + productId + '/assets/' + file, { headers: { Authorization: 'Bearer ' + token() } })
      .catch(function () { throw fail('无法连接文创服务，请检查网络后重试') })
      .then(function (res) {
        if (!res.ok) throw fail(res.status === 404 ? '素材尚未领取或暂不可用' : '图片保存失败', res.status)
        return res.blob()
      })
      .then(function (blob) {
        var href = URL.createObjectURL(blob)
        // 微信内置浏览器中的图片可长按保存，PDF 使用下载入口
        if (IN_WECHAT && !/\.pdf$/i.test(file)) { openPreview('<img class="wc-preview-img" alt="' + esc(file) + '" src="' + href + '">', '长按图片，选择“保存图片”'); return 'wechat' }
        var a = document.createElement('a')
        a.href = href; a.download = file
        document.body.appendChild(a); a.click(); a.remove()
        setTimeout(function () { URL.revokeObjectURL(href) }, 60000)
        return 'download'
      })
  }

  // ---------- 登录往返 ----------
  function goLogin(productId) {
    if (ID_RE.test(productId || '')) sessionStorage.setItem(RETURN_KEY, productId)
    location.href = CONFIG.loginUrl
  }
  function takeReturnProduct() {
    var id = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
    return ID_RE.test(id || '') ? id : null
  }

  // ---------- 视图片段 ----------
  var app = document.getElementById('app')
  var previewBox = document.getElementById('wc-preview')
  var routeToken = 0

  function art(id, large, forPreview) {
    var m = metaOf(id)
    var cls = 'wc-art' + (large ? ' wc-art-large' : '')
    if (m.cover) return '<div class="' + cls + '"><img src="' + esc(m.cover) + '" alt="' + esc(id) + '"></div>'
    return '<div class="' + cls + '"><div class="wc-ph wc-ph-' + m.kind + '"><i class="seal"></i><i class="l1"></i><i class="l2"></i></div>' +
      '<span class="wc-ph-note">示意占位 · 正式图稿待上架</span></div>'
  }
  function card(p, open, sub) {
    var m = metaOf(p.id), st = stateOf(p)
    return '<button class="wc-card is-' + st.key + '" data-open="' + esc(open) + '" aria-label="' + esc(p.name + '，' + st.label) + '">' +
      art(p.id, false) +
      '<span class="wc-card-body"><span class="wc-card-top"><span class="tag">' + esc(m.category) + '</span><span class="wc-badge is-' + st.key + '">' + esc(st.label) + '</span></span>' +
      '<span class="wc-card-name">' + esc(p.name) + '</span><span class="small">' + esc(m.tagline) + '</span>' +
      (sub || '') + '</span></button>'
  }
  function statePanel(o) {
    return '<section class="wc-state" role="status">' +
      (o.loading ? '<div class="wc-spinner" aria-hidden="true"></div>' : '') +
      '<span class="wc-state-title">' + esc(o.title) + '</span><span class="muted">' + esc(o.message || '') + '</span>' +
      (o.action ? '<button class="btn btn-primary" data-act="' + esc(o.action) + '"' + (o.arg ? ' data-arg="' + esc(o.arg) + '"' : '') + '>' + esc(o.actionText) + '</button>' : '') +
      '</section>'
  }
  function loading(text) { return statePanel({ loading: true, title: text || '正在读取', message: '请稍候…' }) }
  function failPanel(e, retryArg) {
    if (e && e.status === 401) {
      return statePanel({ title: '登录后查看收藏与领取', message: '文创馆可以先逛。解锁进度、领取和收藏跟随你的账户保存。', action: 'login', arg: retryArg || '', actionText: '去登录 ↗' })
    }
    return statePanel({ title: '暂时无法展开', message: errorText(e), action: 'retry', actionText: '重新读取' })
  }
  var NOTE = ''

  // ---------- 预览 ----------
  var lastFocus = null
  function openPreview(html, caption) {
    lastFocus = document.activeElement
    previewBox.innerHTML = html + (caption ? '<span class="wc-preview-cap">' + esc(caption) + '</span>' : '') + '<button class="wc-preview-close" data-act="closePreview">关闭</button>'
    previewBox.hidden = false
    var close = previewBox.querySelector('.wc-preview-close')
    if (close) close.focus()
  }
  function closePreview() {
    if (previewBox.hidden) return false
    previewBox.hidden = true
    previewBox.innerHTML = ''
    if (lastFocus && lastFocus.focus) lastFocus.focus()
    return true
  }

  // ---------- 页面 ----------
  var category = '全部'
  var indexCache = null

  function renderIndex(token_) {
    app.innerHTML = loading('正在读取文创馆')
    return listProducts().then(function (products) {
      if (token_ !== routeToken) return
      indexCache = products
      drawIndex(products)
    }).catch(function (e) { if (token_ === routeToken) app.innerHTML = failPanel(e) })
  }

  function drawIndex(products) {
    {
      var total = products.length
      var guest = products.some(function (p) { return p.guest })
      var unlocked = products.filter(function (p) { return p.unlocked }).length
      var claimed = products.filter(function (p) { return p.claimed }).length
      var summary = guest
        ? '<strong>登录后可查看你的解锁进度与领取</strong>'
        : (total ? '<strong>已解锁 ' + unlocked + ' / ' + total + ' 件 · 已领取 ' + claimed + ' 件</strong><div class="wc-meter"><span style="width:' + Math.round(unlocked / total * 100) + '%"></span></div>' : '')
      var action = guest
        ? '<button class="btn btn-outline" data-act="login">登录 ↗</button>'
        : '<a class="btn btn-outline" href="#/collection">我的收藏 ↗</a>'
      var head = '<section class="wc-banner"><span class="eyebrow">文创馆 / CULTURAL GIFTS</span>' +
        '<h1 class="page-title">把学过的故事，带走一份纪念</h1>' +
        '<span class="muted">完成学习挑战、获得称号，就能解锁对应的数字文创。称号永久保留，领取不会消耗称号。</span>' +
        '<div class="wc-banner-bar"><div class="wc-summary">' + summary + '</div>' + action + '</div></section>'
      if (!total) {
        app.innerHTML = head + statePanel({ title: '新作品正在整理中', message: '文创馆暂时还没有上架作品，稍后再来看看。' }) + NOTE
        return
      }
      var cats = ['全部'].concat(CATEGORIES.filter(function (c) { return products.some(function (p) { return metaOf(p.id).category === c }) }))
      if (cats.indexOf(category) < 0) category = '全部'
      var shown = products.filter(function (p) { return category === '全部' || metaOf(p.id).category === category })
      var chips = '<div class="chips" role="tablist" aria-label="作品分类">' + cats.map(function (c) {
        return '<button class="chip' + (c === category ? ' is-active' : '') + '" role="tab" aria-selected="' + (c === category) + '" data-act="filter" data-arg="' + esc(c) + '">' + esc(c) + '</button>'
      }).join('') + '</div>'
      var grid = shown.length
        ? '<div class="wc-grid">' + shown.map(function (p) {
            var meter = p.required ? '<span class="wc-meter"><span style="width:' + percent(p) + '%"></span></span><span class="small">' + esc(progressText(p)) + '</span>' : ''
            return card(p, '#/detail/' + p.id, meter)
          }).join('') + '</div>'
        : statePanel({ title: '这一类暂时没有作品', message: '换一个分类看看。' })
      app.innerHTML = head + chips + grid + NOTE
    }
  }

  function renderDetail(id, token_) {
    if (!ID_RE.test(id)) { app.innerHTML = statePanel({ title: '没有找到这件作品', message: '它可能已经下架，回文创馆看看其他作品。', action: 'index', actionText: '回到文创馆 ↗' }); return }
    app.innerHTML = loading('正在读取作品')
    return listProducts().then(function (products) {
      if (token_ !== routeToken) return
      var p = products.filter(function (x) { return x.id === id })[0]
      if (!p) { app.innerHTML = statePanel({ title: '没有找到这件作品', message: '它可能已经下架，回文创馆看看其他作品。', action: 'index', actionText: '回到文创馆 ↗' }); return }
      var m = metaOf(id), st = stateOf(p)
      var actions
      if (st.key === 'guest') actions = '<button class="btn btn-primary" data-act="login" data-arg="' + id + '">登录后领取 ↗</button>'
      else if (st.key === 'claimed') actions = '<a class="btn btn-outline" href="#/view/' + id + '">查看收藏 ↗</a>'
      else if (st.key === 'ready') actions = '<button class="btn btn-primary" data-act="claim" data-arg="' + id + '">领取这件文创</button>'
      else if (st.key === 'pending') actions = '<button class="btn btn-primary" disabled>原图整理中，暂不能领取</button>'
      else actions = '<button class="btn btn-primary" disabled>尚未解锁</button><button class="btn btn-outline" data-act="learning">去学习挑战 ↗</button>'
      app.innerHTML = '<button class="wc-back" data-act="back">← 返回文创馆</button>' +
        '<section class="wc-detail"><div><button class="wc-zoom" data-act="zoom" data-arg="' + id + '" aria-label="放大查看图稿">' + art(id, true) + '</button><span class="small" style="text-align:center">点击图稿放大查看</span></div>' +
        '<div><span class="wc-badge is-' + st.key + '">' + esc(st.label) + '</span>' +
        '<h1 class="page-title">' + esc(p.name) + '</h1><span class="muted">' + esc(m.tagline) + '</span>' +
        (m.meaning ? '<div class="wc-block"><h2>设计寓意</h2><p>' + esc(m.meaning) + '</p></div>' : '') +
        '<div class="wc-block"><h2>获取条件</h2><p>' + esc(describeCondition(p.condition)) + '</p>' +
        (p.required ? '<div class="wc-meter" style="max-width:380px"><span style="width:' + percent(p) + '%"></span></div><span class="small">' + esc(progressText(p)) + '</span>' : '') + '</div>' +
        '<div class="wc-actions">' + actions + '</div><span class="wc-hint" id="wc-hint" role="alert"></span>' +
        '</div></section>'
    }).catch(function (e) { if (token_ === routeToken) app.innerHTML = failPanel(e, id) })
  }

  function renderSuccess(id, fresh, token_) {
    app.innerHTML = loading('正在读取收藏')
    return listClaims().then(function (claims) {
      if (token_ !== routeToken) return
      var c = claims.filter(function (x) { return x.product_id === id })[0]
      if (!c) { app.innerHTML = statePanel({ title: '这件作品还没有领取', message: '回到详情页看看解锁条件。', action: 'detail', arg: id, actionText: '查看详情 ↗' }); return }
      var assets = (c.assets || []).filter(function (f) { return FILE_RE.test(f) })
      var saves = assets.map(function (f, i) {
        return '<button class="btn btn-primary" data-act="save" data-arg="' + id + '" data-file="' + esc(f) + '">' + esc(assetLabel(f, i, assets.length)) + '</button>'
      }).join('')
      var date = formatDate(c.claimed_at)
      app.innerHTML = '<section class="wc-success">' +
        '<span class="eyebrow">' + (fresh ? 'CLAIMED' : 'MY COLLECTION') + '</span>' +
        '<h1 class="page-title">' + (fresh ? '领取成功' : esc(c.name)) + '</h1>' +
        '<span class="muted">' + (fresh ? '「' + esc(c.name) + '」已收入你的收藏' : (date ? '领取于 ' + esc(date) : '已在你的收藏中')) + '</span>' +
        '<button class="wc-success-art wc-zoom" data-act="zoom" data-arg="' + id + '" aria-label="放大查看图稿">' + art(id, true) + '</button>' +
        '<div class="wc-actions">' + (saves || '<span class="muted">暂时没有可保存的图片</span>') +
        (fresh ? '<a class="btn btn-outline" href="#/collection">查看收藏 ↗</a>' : '') +
        '<a class="btn btn-text" href="' + (fresh ? '#/' : '#/collection') + '">' + (fresh ? '返回文创馆' : '返回我的收藏') + '</a></div>' +
        '<span class="wc-hint" id="wc-hint" role="alert"></span>' +
        '<p class="wc-note">' + esc(metaOf(id).meaning) + '</p></section>'
    }).catch(function (e) { if (token_ === routeToken) app.innerHTML = failPanel(e, id) })
  }

  function renderCollection(token_) {
    app.innerHTML = loading('正在读取收藏')
    return listClaims().then(function (claims) {
      if (token_ !== routeToken) return
      var head = '<span class="eyebrow">我的收藏 / COLLECTION</span><h1 class="page-title">领取过的文创，都收在这里</h1><span class="muted">可以再次打开，也可以再次保存图片。</span><div style="height:22px"></div>'
      if (!claims.length) {
        app.innerHTML = head + statePanel({ title: '还没有领取的文创', message: '完成学习挑战、获得称号后，就能在文创馆领取第一件。', action: 'index', actionText: '去文创馆看看 ↗' })
        return
      }
      app.innerHTML = head + '<div class="wc-grid">' + claims.map(function (c) {
        var date = formatDate(c.claimed_at)
        return card({ id: c.product_id, name: c.name, claimed: true }, '#/view/' + c.product_id, date ? '<span class="small">领取于 ' + esc(date) + '</span>' : '')
      }).join('') + '</div>'
    }).catch(function (e) { if (token_ === routeToken) app.innerHTML = failPanel(e) })
  }

  // ---------- 路由 ----------
  function route() {
    closePreview()
    routeToken++
    var token_ = routeToken
    var parts = (location.hash || '#/').replace(/^#\/?/, '').split('?')[0].split('/')
    var page = parts[0] || 'index', id = parts[1] || ''
    var back = takeReturnProduct()
    if (back && token() && page === 'index') { location.replace('#/detail/' + back); return }
    var navKey = page === 'collection' || page === 'view' || page === 'success' ? 'collection' : 'index'
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (a) { a.classList.toggle('is-active', a.getAttribute('data-nav') === navKey) })
    var mode = mockMode(), bar = document.getElementById('wc-mock-bar')
    bar.hidden = !mode
    if (mode) bar.textContent = '当前为演示数据（mock=' + mode + '），不是真实解锁与领取记录'
    window.scrollTo(0, 0)
    if (page === 'detail') renderDetail(id, token_)
    else if (page === 'success') renderSuccess(id, true, token_)
    else if (page === 'view') renderSuccess(id, false, token_)
    else if (page === 'collection') renderCollection(token_)
    else renderIndex(token_)
  }
  function currentId() { return (location.hash.replace(/^#\/?/, '').split('/')[1] || '').split('?')[0] }
  function hint(text) { var h = document.getElementById('wc-hint'); if (h) h.textContent = text || '' }

  // ---------- 交互 ----------
  var busy = false
  document.addEventListener('click', function (event) {
    var openEl = event.target.closest('[data-open]')
    if (openEl) { location.hash = openEl.getAttribute('data-open'); return }
    var el = event.target.closest('[data-act]')
    if (!el) { if (event.target === previewBox) closePreview(); return }
    var act = el.getAttribute('data-act'), arg = el.getAttribute('data-arg') || ''
    if (act === 'filter') { category = arg; if (indexCache) drawIndex(indexCache); else route() }
    else if (act === 'retry') route()
    else if (act === 'index') location.hash = '#/'
    else if (act === 'detail') location.hash = '#/detail/' + arg
    else if (act === 'login') goLogin(arg)
    else if (act === 'learning') location.href = CONFIG.learningUrl
    else if (act === 'back') { if (history.length > 1 && document.referrer.indexOf(location.host) >= 0) history.back(); else location.hash = '#/' }
    else if (act === 'zoom') openPreview(art(arg, true), '')
    else if (act === 'closePreview') closePreview()
    else if (act === 'claim') {
      if (busy) return
      busy = true; el.disabled = true; el.textContent = '领取中…'; hint('')
      claimProduct(arg).then(function () { busy = false; location.replace('#/success/' + arg) })
        .catch(function (e) {
          busy = false; el.disabled = false; el.textContent = '领取这件文创'
          if (e && e.status === 401) return goLogin(arg)
          hint(errorText(e))
        })
    } else if (act === 'save') {
      if (busy) return
      busy = true; var label = el.textContent; el.disabled = true; el.textContent = '保存中…'; hint('')
      saveImage(arg, el.getAttribute('data-file')).then(function (how) { if (how === 'download') hint('已开始下载，请在浏览器下载记录里查看') })
        .catch(function (e) { hint(errorText(e)) })
        .finally(function () { busy = false; el.disabled = false; el.textContent = label })
    }
  })
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closePreview() })
  window.addEventListener('hashchange', route)
  window.addEventListener('pageshow', function (e) { if (e.persisted) route() })
  route()
})()
