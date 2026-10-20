// ui.js —— 阅读界面组件（成员3交付，静态交互版）
// 职责：人物气泡、旁白框、选项、操作栏、进度与提示框的呈现与定位。
// 边界：只上报用户操作（onAction），不包含剧情顺序、解锁条件、音频或场景切换逻辑。
// 依赖：ui.css。宿主（成员4）每帧调用 updateAnchors 传入成员2提供的人物屏幕坐标。

const cfg = {
  onAction: () => {},
  names: { YOUNG: '年轻狱友', JJ: '江姐', ELDER: '年长狱友' },
  nameClass: { JJ: 'is-red', YOUNG: 'is-green', ELDER: 'is-green' },
  // 文案对齐成员1《10_界面文案表》V2
  helpHtml: '<p><b>环顾场景</b>——使用鼠标拖动，或用手指左右滑动。</p><p><b>探索故事</b>——点击微光标记，开启当前剧情。</p><p><b>阅读对话</b>——点击"继续"查看下一句，也可以关闭声音，仅阅读字幕。</p><p><b>查看细节</b>——部分物件可以点击放大，查看后返回场景。</p><p><b>重新观看</b>——故事完成后可以自由探索，也可以从菜单重新开始。</p>',
  aboutHtml: '本作品以"绣红旗"的文学意象为基础进行艺术化创作。场景、人物动作与对白为创作表达，不是历史现场复原，也不是小说原文摘录。两位狱友为虚构角色。关于江竹筠的真实经历，请查看人物档案及对应资料来源。',
};

let root, bubble, bName, bText, bProgress, tail, tailDot, connector, connectorPath, narration, choices, choicesTitle, choicesList, backBtn, progressEl, overlay, dialog;
let speaker = null;   // {id, name} 当前发言者（一次只突出一人）
let progressText = ''; // 成员4通过 setProgress 给定的进度文字
let staticAt = null;  // 一次性锚点 {x,y}（演示或兜底用）
let anchors = {};     // id -> {x, y, visible}，来源：成员2模块

function make(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  (parent || root).append(e);
  return e;
}
function emit(type, payload) { cfg.onAction && cfg.onAction(type, payload || {}); }

export function configure(options = {}) { Object.assign(cfg, options); }

export function init(options = {}) {
  // 同一页面重复接入时先释放上一层，避免留下旧气泡及窗口监听。
  if(root?.isConnected)dispose();
  configure(options);
  root = document.createElement('div');
  root.id = 'rui-root';
  document.body.append(root);

  // 人物气泡：米白纸色 + 淡金细边，姓名强调，尾部指向发言者；
  // 上一句/继续/进度内嵌在气泡内（参考"山河有迹"第一幕样式）
  bubble = make('div', 'rui-bubble'); bubble.hidden = true;
  connector = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  connector.setAttribute('class', 'rui-bubble-surface');connector.setAttribute('aria-hidden', 'true');
  connectorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');connector.append(connectorPath);bubble.append(connector);
  const bHead = make('div', 'rui-bubble-head', bubble);
  bName = make('div', 'rui-bubble-name', bHead);
  bProgress = make('span', 'rui-bubble-progress', bHead);
  bProgress.textContent = progressText;
  bText = make('div', 'rui-bubble-text', bubble);
  bText.tabIndex = 0; bText.setAttribute('aria-live', 'polite');
  const bFoot = make('div', 'rui-bubble-foot', bubble);
  const bPrev = make('button', 'rui-btn rui-ghost rui-mini', bFoot);
  bPrev.textContent = '〈 上一句'; bPrev.onclick = () => barAct('prev');
  const bNext = make('button', 'rui-btn rui-primary rui-pill', bFoot);
  bNext.textContent = '继续 ›'; bNext.onclick = () => barAct('continue');
  tail = make('i', 'rui-tail', bubble);
  tailDot = make('i', 'rui-tail-dot', bubble);

  // 旁白：独立阅读框，不指向任何人物
  narration = make('div', 'rui-narration'); narration.hidden = true;

  // 选项：展示成员4传入的选项，点击只上报选项ID
  choices = make('div', 'rui-choices'); choices.hidden = true;
  choicesTitle = make('p', 'rui-choices-title', choices);
  choicesList = make('div', 'rui-choices-list', choices);

  // 发言者不在视野时的定位入口
  backBtn = make('button', 'rui-back'); backBtn.hidden = true;
  backBtn.textContent = '↩ 回到发言人物';
  backBtn.onclick = () => emit('backToSpeaker', { speakerId: speaker && speaker.id });

  // 操作栏两行：第一行=阅读推进（上一句/重听/跳过/继续+进度），第二行=辅助功能（文字按钮）
  const bar = make('nav', 'rui-bar'); bar.setAttribute('aria-label', '阅读操作');
  const rowMain = make('div', 'rui-bar-row', bar);
  const rowAux = make('div', 'rui-bar-row rui-bar-aux', bar);
  const mk = (label, action, cls, parent, aria) => {
    const b = make('button', 'rui-btn ' + cls, parent);
    b.textContent = label;
    if (aria) b.setAttribute('aria-label', aria);
    b.onclick = () => barAct(action);
    return b;
  };
  mk('〈 上一句', 'prev', 'rui-ghost', rowMain);
  mk('重听当前句', 'replay', 'rui-ghost', rowMain);
  mk('跳过本段', 'skip', 'rui-ghost', rowMain);
  mk('继续 ›', 'continue', 'rui-primary', rowMain);
  progressEl = make('span', 'rui-progress', rowMain);
  mk('操作说明', 'help', 'rui-ghost rui-aux', rowAux);
  mk('内容说明', 'about', 'rui-ghost rui-aux', rowAux);
  mk('退出故事', 'exit', 'rui-ghost rui-aux', rowAux);

  // 通用弹层（说明/帮助/退出确认/失败提示共用）
  overlay = make('div', 'rui-overlay'); overlay.hidden = true;
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
  dialog = make('div', 'rui-dialog', overlay);

  // 轻提示条（首次拖动/首次对白说明等）
  hintEl = make('div', 'rui-hint'); hintEl.hidden = true;
  hintEl.setAttribute('role', 'status'); hintEl.setAttribute('aria-live', 'polite');

  addEventListener('resize', reposition);
}

function barAct(action) {
  if (action === 'help') { showInfo('操作说明', cfg.helpHtml); emit('help'); return; }
  if (action === 'about') { showInfo('内容说明', cfg.aboutHtml); emit('about'); return; }
  if (action === 'exit') { confirmExit(); return; }
  if (action === 'skip') { confirmSkip(); return; }
  emit(action); // continue / prev / replay：由成员4推进
}

// ---------- 锚点与定位 ----------
// 宿主每帧（或视角变化时）传入全部人物屏幕坐标；坐标为视口像素坐标。
export function updateAnchors(map) {
  anchors = map || {};
  if (speaker) reposition();
}

function reposition() {
  if(!bubble||!speaker)return;
  const a=anchors[speaker.id]||anchors[String(speaker.id).toLowerCase()]||staticAt;
  // 统一底部阅读区，不根据角色、距离或视角改放上方。
  bubble.hidden=false;
  backBtn.hidden=!a||a.visible!==false;
  const barTop=document.querySelector('.rui-bar')?.getBoundingClientRect().top||innerHeight-90;
  const left=Math.max(14,(innerWidth-bubble.offsetWidth)/2);
  const top=Math.max(14,barTop-bubble.offsetHeight-76);
  bubble.style.setProperty('--bubble-left',left+'px');bubble.style.setProperty('--bubble-top',top+'px');
  bubble.style.left=left+'px';bubble.style.top=top+'px';
  tail.style.display='none';tailDot.style.display='none';connectToSpeaker(a);
}

function connectToSpeaker(a){
 // 方框与尾尖共用一条轮廓；沿上边缘移动尾尖，朝向当前发言者。
 const w=bubble.offsetWidth,h=bubble.offsetHeight,r=14,b=bubble.getBoundingClientRect();
 let notch='';
 if(a&&a.visible!==false){
  const x=Math.max(32,Math.min(w-32,a.x-b.left));
  const dx=a.x-(b.left+x),dy=a.y-b.top,len=Math.hypot(dx,dy)||1;
  const tx=x+dx/len*28,ty=Math.min(-12,dy/len*28);
  notch=`H ${x-13} L ${tx} ${ty} L ${x+13} .5 `;
 }
 connector.style.display='block';
 connector.setAttribute('width',w);connector.setAttribute('height',h);
 connectorPath.setAttribute('d',`M ${r} .5 ${notch}H ${w-r} Q ${w-.5} .5 ${w-.5} ${r} V ${h-r} Q ${w-.5} ${h-.5} ${w-r} ${h-.5} H ${r} Q .5 ${h-.5} .5 ${h-r} V ${r} Q .5 .5 ${r} .5 Z`);
}

// ---------- 呈现接口 ----------
// 人物对白：带姓名与尾部指向。at 为可选一次性坐标（无锚点流时的兜底/演示）。
export function showDialogue({ speakerId, speakerName, text, at }) {
  clearSpeech();
  speaker = { id: speakerId, name: speakerName || cfg.names[speakerId] || speakerId || '' };
  staticAt = at || null;
  bName.textContent = speaker.name;
  bName.className = 'rui-bubble-name ' + (cfg.nameClass[speakerId] || 'is-green');
  bProgress.textContent = progressText;
  bText.textContent = text;
  bText.scrollTop = 0;
  bubble.hidden = false;
  reposition();
}

// 旁白：无人物指向的独立阅读框
export function showNarration(text) {
  clearSpeech();
  narration.textContent = text;
  narration.hidden = false;
}

// 选项：仅展示与上报，不做任何跳转
export function showChoices(title, list) {
  clearSpeech();
  choicesTitle.textContent = title || '';
  choicesTitle.hidden = !title;
  choicesList.innerHTML = '';
  for (const c of list) {
    const b = make('button', 'rui-choice', choicesList);
    b.textContent = c.label;
    b.onclick = () => emit('choice', { id: c.id });
  }
  choices.hidden = false;
}

export function setProgress(text) {
  progressText = text || '';
  if (progressEl) progressEl.textContent = progressText;
  if (bProgress) bProgress.textContent = progressText;
}

export function clearSpeech() {
  speaker = null; staticAt = null;
  if (!bubble) return;
  if(connector)connector.style.display='none';
  bubble.hidden = true; narration.hidden = true; choices.hidden = true; backBtn.hidden = true;
}

// ---------- 提示框（文案对齐成员1《10_界面文案表》V2） ----------
export function showInfo(title, html) {
  openDialog(title, html, [{ label: '关闭', cls: 'rui-primary', act: closeDialog }]);
}
// 退出确认：默认不预设"已保存"（C09——仅成员4验证保存成功后才可改用已保存文案）
export function confirmExit() {
  openDialog('暂时离开故事？', '现在返回人物档案吗？', [
    { label: '留在这里', cls: 'rui-ghost', act: closeDialog },
    { label: '返回档案', cls: 'rui-primary', act: () => { closeDialog(); emit('exit'); } },
  ]);
}
// 跳过确认：跳过后进入下一段，不提前显露未解锁内容
export function confirmSkip() {
  openDialog('跳过这段对话？', '跳过后将进入下一段，之后仍可在故事回顾中重看。', [
    { label: '继续阅读', cls: 'rui-ghost', act: closeDialog },
    { label: '跳过本段', cls: 'rui-primary', act: () => { closeDialog(); emit('skip'); } },
  ]);
}
// 失败提示：场景加载失败标准文案，可重试或转文字阅读
export function showError(message, onRetry) {
  openDialog('场景暂未加载成功', message || '请检查网络后重试，也可以先阅读文字版故事。', [
    { label: '重新加载', cls: 'rui-primary', act: () => { closeDialog(); onRetry && onRetry(); } },
    { label: '阅读文字版', cls: 'rui-ghost', act: closeDialog },
  ]);
}
// 轻提示条：首次拖动提示、首次对白原创说明等一次性提示（自动收起，不拦截操作）
let hintEl, hintT = 0;
export function hint(text, ms = 4000) {
  if (!hintEl) return;
  hintEl.textContent = text;
  hintEl.hidden = false;
  clearTimeout(hintT);
  hintT = setTimeout(() => { hintEl.hidden = true; }, ms);
}
function openDialog(title, text, actions) {
  dialog.innerHTML = '';
  const t = make('h3', 'rui-dialog-title', dialog); t.textContent = title;
  const body = make('div', 'rui-dialog-body', dialog); body.innerHTML = text;
  const row = make('div', 'rui-dialog-actions', dialog);
  for (const a of actions) {
    const b = make('button', 'rui-btn ' + a.cls, row);
    b.textContent = a.label; b.onclick = a.act;
  }
  overlay.hidden = false;
}
function closeDialog() { if (overlay) overlay.hidden = true; }

export function dispose() { removeEventListener('resize', reposition); clearTimeout(hintT); root?.remove(); anchors = {}; speaker = null; }
export const ReadingUI = { init, configure, updateAnchors, showDialogue, showNarration, showChoices, setProgress, clearSpeech, showInfo, confirmExit, confirmSkip, showError, hint, dispose };
// 供非模块脚本直接调用
if (typeof window !== 'undefined') window.ReadingUI = ReadingUI;
