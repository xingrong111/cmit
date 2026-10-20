function learningFetch(url,options={}){return fetch(url.replace(/^\/api/,'/api/learning'),{...options,headers:{...options.headers,Authorization:'Bearer '+(localStorage.getItem('yingji_token')||'')}});}
const view = document.querySelector('#view');
const toast = document.querySelector('#toast');
let levels = [];
let questions = [];
let current = null;
let selected = '';
let previewReady = false;
let listFilter = 'all';
let panel = '';
let pendingDelete = '';

function pad(value) {
  return String(value).padStart(2, '0');
}

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function say(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(say.timer);
  say.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}
async function api(path, options) {
  const response = await learningFetch(path, options);
  const data = await response.json();
  if (!response.ok && !data.errors) throw new Error(data.error || '请求失败');
  return data;
}
function levelId() {
  return selected || levels[0]?.id || '';
}
function formValue() {
  const value = id => document.querySelector(id)?.value ?? '';
  return {
    level_id: levelId(),
    题目ID: value('#qid'),
    涉及人物: value('#person'),
    题型: value('#type'),
    难度: document.querySelector('#level')?.selectedOptions[0]?.dataset.difficulty || '',
    题干: value('#stem'),
    A: value('#optA'),
    B: value('#optB'),
    C: value('#optC'),
    D: value('#optD'),
    正确答案: value('#answer'),
    解析: value('#explain'),
    来源ID: value('#source'),
    证据位置: value('#evidence'),
    状态: '待核验',
    published: false,
    reading_person_id: document.querySelector('#level')?.selectedOptions[0]?.dataset.person === 'null' ? null : document.querySelector('#level')?.selectedOptions[0]?.dataset.person,
    reading_fact_id: null
  };
}

function render(message) {
  const level = levels.find(item => item.id === levelId()) || levels[0];
  const levelIndex = Math.max(0, levels.findIndex(item => item.id === level?.id));
  const drafts = questions.filter(item => item.source === '草稿');
  const bank = questions.filter(item => item.source === '审核题库');
  const visible = questions.filter(item => listFilter === 'draft' ? item.source === '草稿' : listFilter === 'bank' ? item.source === '审核题库' : true);
  const choice = current?.题型 === '单项选择题';
  const detail = panel === 'detail' && current ? `<section class="card"><p class="eyebrow">${escape(current.source)}</p><h2>${escape(current.题目ID)}</h2><p>${escape(current.题干)}</p><p class="aux">${escape(current.题型)} · ${escape(current.难度)} · 待核验 · 未发布${current.version ? ` · 第 ${current.version} 版` : ''}</p>${choice ? ['A', 'B', 'C', 'D'].map(key => `<p>${key}. ${escape(current[key])}</p>`).join('') : ''}<p>正确答案 ${escape(current.正确答案)}</p><p>${escape(current.解析)}</p><p class="aux">来源 ${escape(current.来源ID)} · ${escape(current.证据位置)}</p><div class="q-actions"><button class="secondary" id="to-edit" type="button">${current.source === '草稿' ? '编辑草稿' : '按这题做草稿'}</button></div></section>` : '';
  const editor = panel === 'edit' && current ? `<section class="card"><p class="eyebrow">草稿</p><h2>${current.fresh ? '新草稿' : escape(current.题目ID)}</h2>
      ${current.fresh ? `<label class="field">题目编号<input id="qid" value="${escape(current.题目ID)}" placeholder="例如 QQB-099"></label>` : `<input id="qid" type="hidden" value="${escape(current.题目ID)}">`}
      <label class="field">题干<textarea id="stem">${escape(current.题干)}</textarea></label>
      <label class="field">题型<select id="type"><option ${current.题型 === '判断题' ? 'selected' : ''}>判断题</option><option ${current.题型 === '单项选择题' ? 'selected' : ''}>单项选择题</option></select></label>
      <label class="field">涉及人物<input id="person" value="${escape(current.涉及人物)}" ${level?.reading_person_id ? 'readonly' : ''}></label>
      ${choice ? ['A', 'B', 'C', 'D'].map(key => `<label class="field">选项 ${key}<input id="opt${key}" value="${escape(current[key])}"></label>`).join('') : '<input id="optA" type="hidden" value=""><input id="optB" type="hidden" value=""><input id="optC" type="hidden" value=""><input id="optD" type="hidden" value="">'}
      <label class="field">正确答案<input id="answer" value="${escape(current.正确答案)}"></label>
      <label class="field">解析<textarea id="explain">${escape(current.解析)}</textarea></label>
      <label class="field">来源编号<input id="source" value="${escape(current.来源ID)}"></label>
      <label class="field">证据位置<input id="evidence" value="${escape(current.证据位置)}"></label>
      <p class="aux">阅读事实编号保持空白。状态保持待核验。难度跟随所选关卡。保存后仍不进入闯关。</p>
      ${message ? `<div class="feedback ${previewReady ? 'ok' : 'bad'}">${message}</div>` : ''}
      <button class="primary" id="act" type="button">${previewReady ? '保存草稿' : '预览这份草稿'}</button>
    </section>` : '';
  const panelHtml = `${detail}${editor}`;
  const sameItem = item => current && !current.fresh && ((item.draft_id || current.draft_id) ? item.draft_id === current.draft_id : item.题目ID === current.题目ID && item.source === current.source);
  const rows = visible.map(item => {
    const index = questions.indexOf(item);
    const openHere = sameItem(item);
    const confirming = item.source === '草稿' && pendingDelete === item.draft_id;
    const row = item.source === '草稿'
      ? `<article class="card" data-draft="${escape(item.draft_id)}"><div class="q-top row"><div><h2>${escape(item.题目ID)} · 草稿</h2><p class="aux">第 ${item.version} 版 · 尚未发布</p></div><span class="pill">待核验</span></div><div class="q-actions"><button class="primary" type="button" data-act="edit" data-index="${index}">${openHere && panel === 'edit' ? '收起编辑' : '编辑草稿'}</button><button class="secondary" type="button" data-act="detail" data-index="${index}">${openHere && panel === 'detail' ? '收起详情' : '查看详情'}</button><button class="secondary" type="button" data-act="delete" data-index="${index}">${confirming ? '确认删除' : '删除草稿'}</button></div>${confirming ? '<p class="aux">再点一次确认删除。只删这一份草稿，审核题库不变。</p>' : ''}</article>`
      : `<button class="q-bank" type="button" data-act="detail" data-index="${index}"><span class="honor-mark" aria-hidden="true">库</span><span class="copy"><strong>审核题库 · ${escape(item.题目ID)}</strong><span class="aux">${openHere ? '已展开 · 再点一次收起 · 待核验' : '已入库 · 可查看详情 · 待核验'}</span></span><span aria-hidden="true">${openHere ? '⌃' : '›'}</span></button>`;
    return row + (openHere ? `<div id="open-panel">${panelHtml}</div>` : '');
  }).join('') || '<p class="aux">这一栏还没有题目。</p>';
  const freshPanel = current?.fresh ? `<div id="open-panel">${panelHtml}</div>` : '';
  const heldPanel = current && !current.fresh && !visible.some(sameItem) ? `<div id="open-panel">${panelHtml}</div>` : '';
  view.innerHTML = `<div class="desk-head"><div><p class="eyebrow">管理工作台 · 待核验</p><h1>题库与关卡草稿</h1></div><button class="secondary" id="reload" type="button">刷新</button></div>
    <p class="aux">管理关卡对应的草稿与审核题库。草稿可以删除，审核题库不能在这里删除。草稿修改不会进入正在进行的闯关，也不能在这里发布。题目状态保持待核验。资料导入在 <a href="/import.html">导入预览</a>。</p>
    <div class="stat-grid">
      <section class="card"><p class="aux">当前关卡</p><p class="stat-num">${pad(levelIndex + 1)}</p><p class="aux">${escape(level?.person_name || '')} · ${escape(level?.difficulty || '')}</p></section>
      <section class="card"><p class="aux">草稿题目</p><p class="stat-num">${pad(drafts.length)}</p><p class="aux">待核验</p></section>
      <section class="card"><p class="aux">审核题库</p><p class="stat-num">${pad(level?.pool_count || 0)}</p><p class="aux">现有题目</p></section>
    </div>
    <label class="field">选择关卡<select id="level">${levels.map(item => `<option value="${escape(item.id)}" data-difficulty="${escape(item.difficulty)}" data-person="${item.reading_person_id ?? 'null'}" ${item.id === level?.id ? 'selected' : ''}>${escape(item.person_name)} · ${escape(item.difficulty)}</option>`).join('')}</select></label>
    <p class="aux">${level?.draw_count || 0} 道目标题 · 当前草稿 ${drafts.length} 份 · 待核验 · 未发布</p>
    <div class="filters"><button type="button" data-filter="all" class="${listFilter === 'all' ? 'on' : ''}">全部题目 ${questions.length}</button><button type="button" data-filter="draft" class="${listFilter === 'draft' ? 'on' : ''}">草稿 ${drafts.length}</button><button type="button" data-filter="bank" class="${listFilter === 'bank' ? 'on' : ''}">审核题库 ${bank.length}</button></div>
    <div class="section-head"><span>题目列表</span><span class="aux">共 ${visible.length} 道</span></div>
    ${freshPanel}${heldPanel}${rows}
    <button class="${current?.fresh && panel === 'edit' ? 'secondary' : 'primary'}" id="fresh" type="button">${current?.fresh && panel === 'edit' ? '收起新题' : '新开一道题'}</button>`;
  document.querySelector('#reload').onclick = boot;
  document.querySelector('#level').onchange = event => { selected = event.target.value; listFilter = 'all'; loadQuestions(); };
  view.querySelectorAll('[data-filter]').forEach(button => { button.onclick = () => { listFilter = button.dataset.filter; pendingDelete = ''; render(''); }; });
  view.querySelectorAll('[data-act]').forEach(button => { button.onclick = () => openItem(Number(button.dataset.index), button.dataset.act); });
  document.querySelector('#fresh').onclick = () => {
    if (current?.fresh && panel === 'edit') {
      current = null;
      panel = '';
      previewReady = false;
      render('');
      return;
    }
    current = { fresh: true, source: '草稿', 题目ID: '', 涉及人物: level?.reading_person_id ? level.person_name : '', 题型: '判断题', 题干: '', A: '', B: '', C: '', D: '', 正确答案: '正确', 解析: '', 来源ID: '', 证据位置: '' };
    panel = 'edit';
    previewReady = false;
    render('');
  };
  const toEdit = document.querySelector('#to-edit');
  if (toEdit) toEdit.onclick = () => { current = { ...current, fresh: false }; panel = 'edit'; previewReady = false; render(''); };
  const type = document.querySelector('#type');
  if (type) type.onchange = () => { current = { ...current, ...formValue(), 题型: type.value, fresh: current.fresh }; previewReady = false; render(''); };
  const act = document.querySelector('#act');
  if (act) act.onclick = () => { if (previewReady) save(); else preview(); };
  const opened = document.querySelector('#open-panel');
  const row = opened?.previousElementSibling;
  if (row) row.scrollIntoView({ block: 'start' });
  else if (pendingDelete) document.querySelector(`[data-draft="${pendingDelete}"]`)?.scrollIntoView({ block: 'nearest' });
}
function askDelete(item) {
  if (!item || item.source !== '草稿' || !item.draft_id) return say('审核题库不能在这里删除。');
  if (pendingDelete === item.draft_id) return removeDraft(item);
  pendingDelete = item.draft_id;
  render('');
}
async function removeDraft(item) {
  try {
    const data = await api('/api/manage/questions/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft_id: item.draft_id }) });
    pendingDelete = '';
    say(data.note);
    await loadQuestions();
  } catch (error) {
    pendingDelete = '';
    say(error.message);
  }
}
function openItem(index, act) {
  const item = questions[index];
  if (act === 'delete') return askDelete(item);
  pendingDelete = '';
  const same = current && !current.fresh && ((item.draft_id || current.draft_id) ? item.draft_id === current.draft_id : item.题目ID === current.题目ID && item.source === current.source);
  if (same && panel === act) {
    current = null;
    panel = '';
    previewReady = false;
    render('');
    return;
  }
  current = { ...item, fresh: false };
  panel = act;
  previewReady = false;
  render('');
}

async function loadQuestions() {
  selected = selected || levels[0]?.id || '';
  const data = await api(`/api/manage/questions?level_id=${encodeURIComponent(selected)}`);
  questions = data.items;
  current = null;
  panel = '';
  pendingDelete = '';
  previewReady = false;
  render('');
}
async function preview() {
  const data = await api('/api/manage/questions/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formValue()) });
  if (!data.ok) { previewReady = false; render(data.errors.map(escape).join('<br>')); return; }
  previewReady = true;
  render(`${escape(data.note)}<br>状态 ${escape(data.preview.状态)}。未发布。正确答案 ${escape(data.preview.正确答案)}。`);
}
async function save() {
  const data = await api('/api/manage/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formValue()) });
  if (!data.ok) { previewReady = false; render(data.errors.map(escape).join('<br>')); return; }
  say(data.note);
  await loadQuestions();
}
async function boot() {
  try {
    const data = await api('/api/manage/levels');
    levels = data.items;
    await loadQuestions();
  } catch (error) {
    view.innerHTML = `<div class="state"><h2>请求失败</h2><p class="aux">${escape(error.message)}</p></div>`;
  }
}
boot();
