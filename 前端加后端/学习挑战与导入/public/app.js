const view = document.querySelector('#view');
const toast = document.querySelector('#toast');
const tabs = document.querySelectorAll('.tabbar button');
const icons = {
  mountain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18h18M5 18l5-8 3 4 2-3 4 7"/></svg>',
  trace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="1.5"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6.5h7v12H5.5A1.5 1.5 0 0 1 4 17zM20 6.5h-7v12h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="3"/><path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19"/></svg>'
};
tabs.forEach(button => { button.insertAdjacentHTML('afterbegin', icons[button.dataset.tab]); });

let screen = 'learn';
let attempt = null;
let picked = '';
let feedback = null;
let earned = [];
let busy = false;
let honorView = null;
let honorFilter = 'all';
let honorFold = { group: true, cross: true };
let hallView = null;
let hallFilter = 'all';
let resultReview = '';

function learnerId() {
  let id = localStorage.getItem('yingji:learner') || '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = `lrn${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('yingji:learner', id);
  }
  return id;
}
function say(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(say.timer);
  say.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}
async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
}
function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function setTab(name) {
  tabs.forEach(button => button.classList.toggle('active', button.dataset.tab === name));
}

function shell(title, body) {
  view.innerHTML = `<p class="eyebrow">待核验</p><h1>${title}</h1>${body}`;
}
function otherModule(title, owner) {
  setTab(title === '山河' ? 'mountain' : title === '足迹' ? 'trace' : 'me');
  shell(title, `<p class="aux">${escape(owner)}负责这一页。这里不放未接入的内容。</p><button class="secondary" id="back-learn" type="button">返回学习</button>`);
  document.querySelector('#back-learn').onclick = () => showLearn();
}

async function showLearn() {
  screen = 'learn';
  sessionStorage.removeItem('yingji:attempt');
  setTab('learn');
  shell('学习挑战', '<p class="aux">正在读取关卡。</p>');
  try {
    hallView = await api(`/api/levels?learner_id=${learnerId()}`);
    paintLearn();
  } catch (error) {
    shell('学习挑战', `<div class="state"><h2>请求失败</h2><p class="aux">${escape(error.message)}</p><button class="primary" id="retry" type="button">重新读取</button></div>`);
    document.querySelector('#retry').onclick = showLearn;
  }
}
function presentGroups(data) {
  const groups = [];
  for (const level of data.items) {
    let group = groups.find(item => item.name === level.person_name);
    if (!group) { group = { name: level.person_name, personId: level.reading_person_id, levels: [] }; groups.push(group); }
    group.levels.push(level);
  }
  return groups.map(group => {
    const beginner = group.levels.find(level => level.difficulty === '入门');
    const advanced = group.levels.find(level => level.difficulty === '进阶');
    const both = Boolean(beginner?.completed && advanced?.completed);
    let status = '待挑战';
    let tone = '';
    let primary = '';
    let review = '';
    let reviewAdvanced = '';
    if (!beginner?.completed) primary = `<button class="primary" type="button" data-level="${escape(beginner.id)}">开始入门</button>`;
    else if (!advanced?.completed) {
      status = '入门已完成';
      tone = 'earned';
      primary = `<button class="primary" type="button" data-level="${escape(advanced.id)}">开始进阶</button>`;
      review = `<button class="secondary" type="button" data-level="${escape(beginner.id)}">复习入门</button>`;
    } else {
      status = '已完成';
      tone = 'earned';
      review = `<button class="secondary" type="button" data-level="${escape(beginner.id)}">复习入门</button>`;
      reviewAdvanced = `<button class="secondary" type="button" data-level="${escape(advanced.id)}">复习进阶</button>`;
    }
    return { name: group.name, personId: group.personId, beginnerCompleted: Boolean(beginner?.completed), advancedCompleted: Boolean(advanced?.completed), both, status, tone, primary, review, reviewAdvanced };
  });
}
function paintLearn() {
  const groups = presentGroups(hallView);
  const total = groups.length || 5;
  const beginnerDone = groups.filter(group => group.beginnerCompleted).length;
  const advancedDone = groups.filter(group => group.advancedCompleted).length;
  const visible = groups.filter(group => hallFilter === 'done' ? group.both : hallFilter === 'open' ? !group.both : true);
  const meter = count => `<div class="meter">${count ? `<span style="width:${Math.round((count * 100) / total)}%"></span>` : ''}</div>`;
  const cards = visible.map(group => `<article class="card person-card"><div class="person-main"><span class="honor-mark" aria-hidden="true">${escape(group.name.slice(0, 1))}</span><div class="copy"><h2>${escape(group.name)}</h2><p class="aux">${group.personId ? `人物档案 ${escape(group.personId)} 由成员2提供。` : '这一组还没有阅读库人物编号。'}</p></div></div><span class="pill ${group.tone}">${escape(group.status)}</span><div class="person-actions">${group.primary}${group.review}${group.reviewAdvanced}</div></article>`).join('');
  shell('学习挑战', `<p class="aux">先答完入门关，再开始本组进阶关。入门关抽 5 题，进阶关抽 8 题。题目仍是待核验。</p><section class="card"><h2>挑战进度</h2><div class="progress-split"><div><p class="aux">入门</p><p class="honor-stat">${beginnerDone} / ${total} <span class="aux">已完成</span></p>${meter(beginnerDone)}</div><div><p class="aux">进阶</p><p class="honor-stat">${advancedDone} / ${total} <span class="aux">已完成</span></p>${meter(advancedDone)}</div></div></section><div class="section-head"><span>角色挑战</span></div><div class="filters"><button type="button" data-hall="all" class="${hallFilter === 'all' ? 'on' : ''}">全部</button><button type="button" data-hall="open" class="${hallFilter === 'open' ? 'on' : ''}">待挑战</button><button type="button" data-hall="done" class="${hallFilter === 'done' ? 'on' : ''}">已完成</button></div>${cards || '<p class="aux">这一栏还没有关卡。</p>'}<button class="secondary" id="open-honors" type="button">查看学习称号</button>`);
  view.querySelectorAll('[data-hall]').forEach(button => { button.onclick = () => { hallFilter = button.dataset.hall; paintLearn(); }; });
  view.querySelectorAll('[data-level]').forEach(button => { button.onclick = () => begin(button.dataset.level); });
  document.querySelector('#open-honors').onclick = showHonors;
}

async function begin(levelId) {
  if (busy) return;
  busy = true;
  let started = false;
  try {
    attempt = await api('/api/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level_id: levelId, learner_id: learnerId() }) });
    picked = '';
    feedback = null;
    earned = [];
    sessionStorage.setItem('yingji:attempt', attempt.id);
    sessionStorage.removeItem('yingji:earned');
    started = true;
  } catch (error) { say(error.message); } finally { busy = false; }
  if (started) showQuiz();
}

function currentQuestion() {
  if (feedback) return attempt.questions.find(question => question.id === feedback.question_id);
  return attempt.questions.find(question => !question.answered);
}
function showQuiz() {
  const entered = screen !== 'quiz';
  screen = 'quiz';
  setTab('learn');
  const question = currentQuestion();
  if (!question) return showResult();
  const choices = question.options.map(option => {
    const classes = ['choice'];
    if (!feedback && picked === option.key) classes.push('picked');
    if (feedback && option.key === feedback.correct_answer) classes.push('right');
    if (feedback && option.key === feedback.choice && !feedback.correct) classes.push('wrong');
    const note = feedback && option.key === feedback.correct_answer ? '正确答案' : feedback && option.key === feedback.choice ? '你的选择' : '';
    const label = option.key === option.text ? option.key : `${option.key}　${option.text}`;
    return `<button class="${classes.join(' ')}" type="button" data-choice="${escape(option.key)}" ${feedback || busy ? 'disabled' : ''}>${escape(label)}${note ? ` · ${note}` : ''}</button>`;
  }).join('');
  const sourceLink = feedback?.source_url ? `<a href="${escape(feedback.source_url)}" target="_blank" rel="noopener">查看来源</a>` : '';
  const result = feedback ? `<div class="feedback ${feedback.correct ? 'ok' : 'bad'}"><p>${feedback.correct ? '回答正确' : '回答不正确'}</p><p>正确答案是 ${escape(feedback.correct_answer)}。${escape(feedback.explanation)}</p><p class="aux">来源 ${escape(feedback.source_id)} · ${escape(feedback.evidence)} · 待核验${sourceLink ? ` · ${sourceLink}` : ''}</p></div>` : '';
  shell(`第 ${question.index + 1} 题，共 ${attempt.total} 题`, `<button class="secondary" id="leave" type="button">返回学习挑战</button><p class="aux">${escape(attempt.person_name)} · ${escape(attempt.difficulty)} · 待核验。提交后才显示答案和来源。未答完就返回，这次不记通关。</p><section class="card"><p class="tag">${escape(question.type)}</p><p>${escape(question.stem)}</p>${choices}${result}<button class="primary" id="act" type="button" ${busy ? 'disabled' : ''}>${feedback ? (attempt.finished ? '查看结果' : '下一题') : (busy ? '提交中' : '提交这题')}</button></section>`);
  document.querySelector('#leave').onclick = showLearn;
  view.querySelectorAll('[data-choice]').forEach(button => { button.onclick = () => { picked = button.dataset.choice; showQuiz(); }; });
  document.querySelector('#act').onclick = feedback ? nextStep : submitAnswer;
  if (entered || showQuiz.shown !== question.index) window.scrollTo(0, 0);
  showQuiz.shown = question.index;
}
async function submitAnswer() {
  const question = currentQuestion();
  if (!picked) return say('请先选择一个答案');
  busy = true;
  showQuiz();
  try {
    const data = await api(`/api/attempts/${attempt.id}/answers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: question.id, choice: picked }) });
    feedback = data.feedback;
    earned = data.titles_earned || [];
    if (data.finished) sessionStorage.setItem('yingji:earned', JSON.stringify(earned));
    attempt = data;
  } catch (error) { say(error.message); } finally { busy = false; if (screen === 'quiz') showQuiz(); }
}
function nextStep() {
  if (attempt.finished) return showResult();
  feedback = null;
  picked = '';
  showQuiz();
}
function showResult() {
  screen = 'result';
  resultReview = '';
  setTab('learn');
  paintResult();
}
function paintResult() {
  const score = attempt.score;
  const optionText = option => option.key === option.text ? option.key : `${option.key}　${option.text}`;
  const cards = attempt.questions.map((question, index) => {
    const feedback = question.feedback;
    const sourceLink = feedback.source_url ? `<a href="${escape(feedback.source_url)}" target="_blank" rel="noopener">查看来源</a>` : '';
    const options = question.options.map(option => {
      const kind = option.key === feedback.correct_answer ? 'right' : option.key === feedback.choice ? 'wrong' : '';
      return `<div class="choice ${kind}">${escape(optionText(option))}</div>`;
    }).join('');
    const yours = question.options.find(option => option.key === feedback.choice);
    const answer = question.options.find(option => option.key === feedback.correct_answer);
    const summary = feedback.correct
      ? `你的选择 ${optionText(yours || { key: feedback.choice, text: feedback.choice })}，这是正确答案。`
      : `你的选择 ${optionText(yours || { key: feedback.choice, text: feedback.choice })}。正确答案 ${optionText(answer || { key: feedback.correct_answer, text: feedback.correct_answer })}。`;
    return { correct: feedback.correct, html: `<article class="card review"><div class="review-head"><span class="pill ${feedback.correct ? 'earned' : 'miss'}">${feedback.correct ? '答对' : '答错'}</span><span class="tag">${escape(question.type)}</span></div><h2>${index + 1}. ${escape(question.stem)}</h2>${options}<p>${escape(summary)}</p><p class="aux">解析</p><p>${escape(feedback.explanation)}</p><p class="aux">来源 ${escape(feedback.source_id)} · ${escape(feedback.evidence)} · 待核验${sourceLink ? ` · ${sourceLink}` : ''}</p></article>` };
  });
  const shown = resultReview === 'wrong' ? cards.filter(item => !item.correct) : resultReview === 'all' ? cards : [];
  const review = resultReview === 'wrong' && shown.length === 0 ? '<p class="aux">这次没有错题。</p>' : shown.map(item => item.html).join('');
  const titles = earned.length ? `<section class="card"><p class="aux">新获得的学习称号</p><h2>${escape(earned.map(item => item.name).join('、'))}</h2></section>` : '';
  const marks = attempt.questions.map((question, index) => `<li class="${question.feedback.correct ? 'hit' : 'miss'}"><span>${index + 1}</span><span>${question.feedback.correct ? '对' : '错'}</span></li>`).join('');
  const chart = `<section class="card score"><h2>本次作答</h2><div class="score-head"><div class="score-ring" style="background:conic-gradient(var(--success) ${score.accuracy}%, var(--line) 0)" role="img" aria-label="正确率 ${score.accuracy}%"><span>${score.accuracy}%<small>正确率</small></span></div><div class="score-side"><div class="score-bar" aria-label="答对 ${score.correct} 题，答错 ${score.wrong} 题">${score.correct ? `<span class="hit" style="flex:${score.correct}"></span>` : ''}${score.wrong ? `<span class="miss" style="flex:${score.wrong}"></span>` : ''}</div><div class="score-counts"><p><b class="hit">${score.correct}</b><span class="aux">答对</span></p><p><b class="miss">${score.wrong}</b><span class="aux">答错</span></p><p><b>${score.total}</b><span class="aux">本题</span></p></div></div></div><ol class="score-marks">${marks}</ol><p class="aux">${escape(attempt.person_name)} · ${escape(attempt.difficulty)} · 待核验。分数只说明这次作答，答完即通关，不表示题目已经核验。</p></section>`;
  const next = attempt.next_level ? `<button class="primary" id="next" type="button">下一关 · ${escape(attempt.next_level.person_name)} · ${escape(attempt.next_level.difficulty)}</button>` : '';
  const actions = next
    ? `<div class="result-actions"><button class="secondary" id="again" type="button">再答一次</button>${next}</div><button class="secondary" id="honors" type="button">查看学习称号</button>`
    : `<button class="primary" id="honors" type="button">查看学习称号</button><button class="secondary" id="again" type="button">再答一次</button>`;
  shell('这一关答完了', `${chart}${titles}<div class="filters"><button type="button" data-review="wrong" class="${resultReview === 'wrong' ? 'on' : ''}">${resultReview === 'wrong' ? '收起错题' : '查看我的错题'} ${score.wrong}</button><button type="button" data-review="all" class="${resultReview === 'all' ? 'on' : ''}">${resultReview === 'all' ? '收起题目' : '查看本次题目'} ${score.total}</button></div>${review}${actions}<button class="secondary" id="hall" type="button">返回学习挑战</button><p class="aux">学习讨论由账户模块接入，这里不展示评论。</p>`);
  view.querySelectorAll('[data-review]').forEach(button => { button.onclick = () => { resultReview = resultReview === button.dataset.review ? '' : button.dataset.review; paintResult(); }; });
  document.querySelector('#honors').onclick = showHonors;
  if (attempt.next_level) document.querySelector('#next').onclick = () => begin(attempt.next_level.id);
  document.querySelector('#again').onclick = () => begin(attempt.level_id);
  document.querySelector('#hall').onclick = showLearn;
}
function honorRows(data) {
  const rows = [];
  for (const title of data.titles) {
    if (title.scope === 'group') {
      for (const group of title.groups) {
        rows.push({ scope: 'group', name: title.name, detail: `${group.person_name} · ${title.condition}`, state: group.state, progress: '' });
      }
    } else {
      rows.push({ scope: 'cross', name: title.name, detail: title.condition, state: title.state, progress: title.progress });
    }
  }
  return rows;
}
function paintHonors() {
  const rows = honorRows(honorView);
  const earned = rows.filter(row => row.state === '已获得');
  const current = ['理想点灯人', '星火传承者', '红色寻迹者', '追光探寻者', '星火初学者'].find(name => earned.some(row => row.name === name)) || '暂无';
  const percent = rows.length ? Math.round((earned.length * 100) / rows.length) : 0;
  const card = row => `<article class="honor-card"><span class="honor-mark" aria-hidden="true">${escape(row.name.slice(0, 1))}</span><div class="copy"><h2>${escape(row.name)}</h2><p class="aux">${escape(row.detail)}</p></div>${row.progress ? `<span class="honor-progress">${escape(row.progress)}</span>` : ''}<span class="pill ${row.state === '已获得' ? 'earned' : ''}">${escape(row.state)}</span></article>`;
  const section = (key, label, items) => {
    if (honorFilter === 'group' && key === 'cross') return '';
    if (honorFilter === 'cross' && key === 'group') return '';
    return `<button class="section-head" type="button" data-fold="${key}"><span>${label}</span><span class="aux">共 ${items.length} 个 · ${honorFold[key] ? '收起' : '展开'}</span></button>${honorFold[key] ? items.map(card).join('') : ''}`;
  };
  shell('学习称号', `<section class="card"><div class="honor-profile"><span class="seal" aria-hidden="true">谱</span><div><p class="brand">山河英雄谱</p><p class="aux">学习挑战 · 待核验</p></div><span class="ribbon">待核验</span></div><div class="honor-stats"><div><p class="aux">当前称号</p><p class="honor-stat">${escape(current)}</p></div><div><p class="aux">已获得称号</p><p class="honor-stat"><b>${earned.length}</b> / ${rows.length}</p></div><div><p class="aux">收集进度</p><p class="honor-stat">${percent}%</p><div class="meter">${percent ? `<span style="width:${percent}%"></span>` : ''}</div></div></div><p class="aux">${escape(honorView.note)} 已读完 ${honorView.completed_groups} / 5 组。</p></section><div class="filters"><button type="button" data-filter="all" class="${honorFilter === 'all' ? 'on' : ''}">全部</button><button type="button" data-filter="group" class="${honorFilter === 'group' ? 'on' : ''}">单组</button><button type="button" data-filter="cross" class="${honorFilter === 'cross' ? 'on' : ''}">跨组</button></div>${section('group', '单组称号', rows.filter(row => row.scope === 'group'))}${section('cross', '跨组称号', rows.filter(row => row.scope === 'cross'))}<button class="primary" id="hall" type="button">返回学习挑战</button>`);
  view.querySelectorAll('[data-filter]').forEach(button => { button.onclick = () => { honorFilter = button.dataset.filter; paintHonors(); }; });
  view.querySelectorAll('[data-fold]').forEach(button => { button.onclick = () => { honorFold[button.dataset.fold] = !honorFold[button.dataset.fold]; paintHonors(); }; });
  document.querySelector('#hall').onclick = showLearn;
}
async function showHonors() {
  screen = 'honors';
  setTab('learn');
  shell('学习称号', '<p class="aux">正在读取称号。</p>');
  try {
    honorView = await api(`/api/honors?learner_id=${learnerId()}`);
    paintHonors();
  } catch (error) {
    shell('学习称号', `<div class="state"><h2>请求失败</h2><p class="aux">${escape(error.message)}</p><button class="primary" id="retry" type="button">重新读取</button></div>`);
    document.querySelector('#retry').onclick = showHonors;
  }
}

tabs.forEach(button => button.addEventListener('click', () => {
  const tab = button.dataset.tab;
  if (tab === 'learn') return showLearn();
  if (tab === 'mountain') return otherModule('山河', '成员1');
  if (tab === 'trace') return otherModule('足迹', '成员4');
  otherModule('我的', '成员3');
}));
const savedAttempt = sessionStorage.getItem('yingji:attempt');
if (savedAttempt) {
  api(`/api/attempts/${savedAttempt}`).then(data => {
    attempt = data;
    earned = JSON.parse(sessionStorage.getItem('yingji:earned') || '[]');
    if (attempt.finished) showResult();
    else showQuiz();
  }).catch(() => showLearn());
} else showLearn();
