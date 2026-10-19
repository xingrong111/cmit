let focusGroup=new URLSearchParams(location.search).get('group')||sessionStorage.getItem('yingji:learning-focus')||'';sessionStorage.removeItem('yingji:learning-focus');
if(!/^(QQB|LYS|SZZ|LDY|JZY)$/.test(focusGroup))focusGroup='';
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

let screen = 'learn';const accountFingerprint=localStorage.getItem('yingji_token')||'';if(sessionStorage.getItem('yingji:learning-account')!==accountFingerprint){sessionStorage.removeItem('yingji:attempt');sessionStorage.removeItem('yingji:earned');sessionStorage.setItem('yingji:learning-account',accountFingerprint);}
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

function learnerId(){return 'session-user';}
function say(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(say.timer);
  say.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}
async function api(path, options) {
  const response = await fetch(path.replace(/^\/api/,'/api/learning'),{...options,headers:{...(options?.headers||{}),Authorization:'Bearer '+(localStorage.getItem('yingji_token')||'')}});
  const data = await response.json();
  if(!response.ok){if(response.status===401){sessionStorage.setItem('yingji:learning-focus',focusGroup);parent.postMessage({type:'yingji-learning-login'},location.origin);}throw new Error(data.error||'请求失败');}
  return data;
}
function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function setTab(name) {
  tabs.forEach(button => button.classList.toggle('active', button.dataset.tab === name));
}

function shell(title, body) {
  document.body.classList.toggle('learning-embedded',parent!==window);document.body.dataset.learningScreen=screen;
  view.classList.toggle('focused',!!focusGroup);
  view.innerHTML = `<div class="learning-crumb"><button type="button" data-learning-back>${screen==='reward'?'← 作答结果':screen==='honors'?'← 返回挑战':'← 返回'}</button><button type="button" data-learning-all>全部挑战</button></div><section class="learning-cover"><span class="learning-cover-seal" aria-hidden="true">学以<br>知史</span><p class="eyebrow">山河有迹 · 学习与探索</p><h1><img class="learning-title-icon" src="/static/icons/${screen==='honors'?'medal':'learning'}.png" alt=""/>${title}</h1><p class="learning-cover-sub">循人物故事，读时代篇章。</p></section>${!localStorage.getItem('yingji_token')?'<p class="aux">登录后开始挑战，进度与学习称号保存在你的账户中。</p>':''}${body}`;
}
function otherModule(title, owner) {
  setTab(title === '山河' ? 'mountain' : title === '足迹' ? 'trace' : 'me');
  shell(title, `<p class="aux">${escape(owner)}负责这一页。这里不放未接入的内容。</p><button class="secondary" id="back-learn" type="button">返回学习</button>`);
  document.querySelector('#back-learn').onclick = () => showLearn();
}

async function showLearn() {
  screen = 'learn';
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
    return { group:beginner?.group, entryCount:beginner?.draw_count||5, advancedCount:advanced?.draw_count||8, name: group.name, personId: group.personId, beginnerCompleted: Boolean(beginner?.completed), advancedCompleted: Boolean(advanced?.completed), both, status, tone, primary, review, reviewAdvanced };
  });
}

function renderLearningCard(group){
 const photo=window.learningPortraits?.[group.group];
 const next=group.primary||(group.reviewAdvanced||group.review).replace('class="secondary"','class="primary"');
 return `<article class="card person-card journey-learning-card">
 <div class="learning-person-cover">${photo?`<img class="${group.group==='LYS'?'group-learning-photo':''}" src="${escape(photo.src)}" alt="${escape(photo.caption)}" loading="lazy"><span class="learning-image-kind">${escape(photo.label)}</span>`:`<span class="honor-mark">${escape(group.name.slice(0,1))}</span>`}<div class="learning-person-heading"><span class="eyebrow">人物主题学习</span><h2>${escape(group.name)}</h2><p>${group.group==='LYS'?'一个团体 · 五位成员':'循人物经历，理解时代'}</p></div></div>
 ${photo?`<details class="learning-photo-source"><summary>图注与来源</summary><p>${escape(photo.caption)}</p><p>${escape(photo.credit)}</p>${photo.sourceURL?`<a href="${escape(photo.sourceURL)}" target="_blank" rel="noopener noreferrer">查看来源 ↗</a>`:''}</details>`:''}
 <div class="learning-two-steps"><div class="learning-step ${group.beginnerCompleted?'is-done':'is-current'}"><span class="step-dot">${group.beginnerCompleted?'✓':'1'}</span><div><strong>入门 · ${group.entryCount}题</strong><small>${group.beginnerCompleted?'已完成':'待挑战'}</small></div></div><span class="step-connector" aria-hidden="true"></span><div class="learning-step ${group.advancedCompleted?'is-done':group.beginnerCompleted?'is-current':'is-locked'}"><span class="step-dot">${group.advancedCompleted?'✓':'2'}</span><div><strong>进阶 · ${group.advancedCount}题</strong><small>${group.advancedCompleted?'已完成':group.beginnerCompleted?'已解锁':'完成入门后解锁'}</small></div></div></div>
 <div class="person-actions">${group.personId?`<button class="card-reading-link" data-reading="${escape(group.personId)}">阅读档案 ↗</button>`:`<button class="card-reading-link" data-learning-group="${escape(group.group)}">查看两关 ↗</button>`}<div class="learning-next-actions">${group.beginnerCompleted?group.review:''}${next}</div></div></article>`;
}

function paintLearn() {
  const groups = presentGroups(hallView);
  const focusedName=groups.find(g=>hallView.items.some(x=>x.group===focusGroup&&x.person_name===g.name))?.name;
  const progressGroups=focusGroup?groups.filter(g=>hallView.items.some(x=>x.group===focusGroup&&x.person_name===g.name)):groups;
  const total = progressGroups.length || 5;
  const beginnerDone = progressGroups.filter(group => group.beginnerCompleted).length;
  const advancedDone = progressGroups.filter(group => group.advancedCompleted).length;
  const visible = groups.filter(group => !focusGroup || hallView.items.some(x=>x.group===focusGroup&&x.person_name===group.name)).filter(group => hallFilter === 'done' ? group.both : hallFilter === 'open' ? !group.both : true);
  const meter = count => `<div class="meter">${count ? `<span style="width:${Math.round((count * 100) / total)}%"></span>` : ''}</div>`;
  const cards = (focusGroup ? hallView.items.filter(x=>x.group===focusGroup).filter(x=>hallFilter==='done'?x.completed:hallFilter==='open'?!x.completed:true).map(level=>{const locked=level.difficulty==='进阶'&&!hallView.items.find(x=>x.group===focusGroup&&x.difficulty==='入门')?.completed;return `<article class="card stage-card"><span class="eyebrow">${level.difficulty==='入门'?'01 / 认识人物':'02 / 理解事件'}</span><h2>${escape(level.difficulty)}挑战</h2><p class="aux">本关随机抽取 ${level.draw_count} 题 · 答完即完成</p><span class="pill">${locked?'完成入门后解锁':level.completed?'已完成 · 可复习':'待挑战'}</span><button class="primary" data-level="${escape(level.id)}" ${locked?'disabled':''}>${locked?'尚未解锁':level.completed?'再次练习':'开始挑战'}</button></article>`}).join('') : visible.map(group => renderLearningCard(group)).join(''));
  const unfinished=sessionStorage.getItem('yingji:attempt');
  shell(focusGroup&&focusedName?focusedName+' · 主题挑战':'学习挑战', `${unfinished?'<button class="secondary" data-learning-resume>继续上次答题</button>':''}<p class="learning-intro">循人物故事，理解历史。每组先完成入门5题，再解锁进阶8题；答完即完成，不设分数线。题目待独立核验。</p><section class="card learning-progress"><h2>挑战进度</h2><div class="progress-split"><div><p class="aux">入门</p><p class="honor-stat">${beginnerDone} / ${total} <span class="aux">已完成</span></p>${meter(beginnerDone)}</div><div><p class="aux">进阶</p><p class="honor-stat">${advancedDone} / ${total} <span class="aux">已完成</span></p>${meter(advancedDone)}</div></div></section><div class="section-head"><span>角色挑战</span></div>${!focusGroup?'<div class="learning-path"><span>01 阅读人物</span><span>02 入门 · 5题</span><span>03 进阶 · 8题</span></div>':''}<div class="filters hall-filters"><button type="button" data-hall="all" class="${hallFilter === 'all' ? 'on' : ''}">全部</button><button type="button" data-hall="open" class="${hallFilter === 'open' ? 'on' : ''}">待挑战</button><button type="button" data-hall="done" class="${hallFilter === 'done' ? 'on' : ''}">已完成</button></div><div class="learning-section-title"><span>人物主题挑战</span><small>读档案 · 做挑战 · 看依据</small></div><div class="challenge-grid">${cards || '<p class="aux">这一栏还没有关卡。</p>'}</div><button class="secondary" id="open-honors" type="button">查看学习称号</button>`);
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
  const relatedPerson=hallView?.items.find(x=>x.person_name===attempt.person_name)?.reading_person_id;
  const sourceLink = feedback?.source_url ? `<a href="${escape(feedback.source_url)}" target="_blank" rel="noopener">查看来源</a>` : '';
  const result = feedback ? `<div class="feedback ${feedback.correct ? 'ok' : 'bad'}"><p>${feedback.correct ? '回答正确' : '回答不正确'}</p><p>正确答案是 ${escape(feedback.correct_answer)}。${escape(feedback.explanation)}</p><p class="aux">来源 ${escape(feedback.source_id)} · ${escape(feedback.evidence)} · 待核验${sourceLink ? ` · ${sourceLink}` : ''}</p>${relatedPerson?`<button class="secondary" data-reading="${escape(relatedPerson)}">回顾史料</button>`:''}</div>` : '';
  shell(`第 ${question.index + 1} 题，共 ${attempt.total} 题`, `<button class="secondary" id="leave" type="button">返回学习挑战</button><p class="aux">${escape(attempt.person_name)} · ${escape(attempt.difficulty)} · 待核验。提交后才显示答案和来源。未答完可返回大厅续答，答完全部题目才记为完成。</p><div class="quiz-meter" aria-label="答题进度"><span style="width:${Math.round(question.index/attempt.total*100)}%"></span></div><section class="card quiz-card"><p class="tag">${escape(question.type)}</p><p>${escape(question.stem)}</p>${choices}${result}<button class="primary" id="act" type="button" ${busy || (!feedback && !picked) ? 'disabled' : ''}>${feedback ? (attempt.finished ? '查看结果' : '下一题') : (busy ? '提交中' : '提交这题')}</button></section>`);
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
    if (data.finished){sessionStorage.setItem('yingji:earned',JSON.stringify(earned));sessionStorage.setItem('yingji:earned-attempt',data.id);}
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
  if(pendingReward())showReward();
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
  const titles = earned.length ? `<section class="card"><p class="aux">新获得的学习称号</p><h2>${escape(earned.map(item => item.name).join('、'))}</h2><button class="secondary" data-replay-reward>查看本次荣誉</button></section>` : '';
  const marks = attempt.questions.map((question, index) => `<li class="${question.feedback.correct ? 'hit' : 'miss'}"><span>${index + 1}</span><span>${question.feedback.correct ? '对' : '错'}</span></li>`).join('');
  const chart = `<section class="card score"><h2>本次作答</h2><div class="score-head"><div class="score-ring" style="background:conic-gradient(var(--success) ${score.accuracy}%, var(--line) 0)" role="img" aria-label="正确率 ${score.accuracy}%"><span>${score.accuracy}%<small>正确率</small></span></div><div class="score-side"><div class="score-bar" aria-label="答对 ${score.correct} 题，答错 ${score.wrong} 题">${score.correct ? `<span class="hit" style="flex:${score.correct}"></span>` : ''}${score.wrong ? `<span class="miss" style="flex:${score.wrong}"></span>` : ''}</div><div class="score-counts"><p><b class="hit">${score.correct}</b><span class="aux">答对</span></p><p><b class="miss">${score.wrong}</b><span class="aux">答错</span></p><p><b>${score.total}</b><span class="aux">本题</span></p></div></div></div><ol class="score-marks">${marks}</ol><p class="aux">${escape(attempt.person_name)} · ${escape(attempt.difficulty)} · 待核验。分数只说明这次作答，答完即通关，不表示题目已经核验。</p></section>`;
  const next = attempt.next_level ? `<button class="primary" id="next" type="button">下一关 · ${escape(attempt.next_level.person_name)} · ${escape(attempt.next_level.difficulty)}</button>` : '';
  const actions = next
    ? `<div class="result-actions"><button class="secondary" id="again" type="button">再答一次</button>${next}</div><button class="secondary" id="honors" type="button">查看学习称号</button>`
    : `<button class="primary" id="honors" type="button">查看学习称号</button><button class="secondary" id="again" type="button">再答一次</button>`;
  shell('这一关答完了', `${chart}${titles}<div class="filters"><button type="button" data-review="wrong" class="${resultReview === 'wrong' ? 'on' : ''}">${resultReview === 'wrong' ? '收起错题' : '查看我的错题'} ${score.wrong}</button><button type="button" data-review="all" class="${resultReview === 'all' ? 'on' : ''}">${resultReview === 'all' ? '收起题目' : '查看本次题目'} ${score.total}</button></div>${review}${actions}${(()=>{const id=hallView?.items.find(x=>x.person_name===attempt.person_name)?.reading_person_id;return id?`<div class="result-actions"><button class="secondary" data-reading="${id}">回顾人物</button><button class="secondary" data-radar="${id}">探索关联场馆</button></div>`:''})()}<button class="secondary" id="hall" type="button">返回学习挑战</button><p class="aux">学习讨论由账户模块接入，这里不展示评论。</p>`);
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
function paintHonors(){
 const rows=honorRows(honorView),owned=rows.filter(x=>x.state==='已获得'),current=owned[owned.length-1],next=rows.find(x=>x.state!=='已获得');
 const idOf=row=>honorView.titles.find(t=>t.name===row?.name)?.id;
 const emblem=window.learningBadges?.[idOf(current)||'H-PATH-1'];
 shell('学习徽章册',`<section class="card badge-album-cover"><div><span class="eyebrow">山河有迹 · 我的学习印记</span><h2>${current?escape(current.name):'从第一枚星火开始'}</h2><p>已获得 ${owned.length} / ${rows.length} 枚徽章 · 完整学习 ${honorView.completed_groups} / 5 组</p><p class="aux">${next?'下一目标：'+escape(next.detail):'五枚徽章已集齐，随时可以重温人物故事。'}</p></div><img class="album-current-badge ${current?'':'unearned'}" src="${escape(emblem.badge)}" alt="${current?escape(current.name):'星火初学者，尚未获得'}徽章"></section><div class="badge-album-grid">${rows.map((row,i)=>{const art=window.learningBadges?.[idOf(row)];return `<article class="badge-album-card ${row.state==='已获得'?'earned':row===next?'next':'locked'}"><span class="badge-position">${String(i+1).padStart(2,'0')} / 成长印记</span><button class="badge-preview-trigger" type="button" data-badge-preview="${escape(art?.id||'')}" aria-label="放大查看${escape(row.name)}徽章"><img src="${escape(art?.badge||'')}" alt="${escape(row.name)}徽章"><span>点击查看大图</span></button><h3>${escape(row.name)}</h3><span class="badge-state">${row.state==='已获得'?'已获得':row===next?'下一目标':'未解锁'}</span><p>${escape(row.detail)}</p><small>${escape(row.progress||'')}</small></article>`}).join('')}</div><p class="honor-rule-note">${escape(honorView.note)}</p><button class="primary" id="hall">继续学习</button><dialog class="badge-preview-dialog" aria-label="徽章大图"><button class="badge-preview-close" type="button" data-badge-close aria-label="关闭大图">× 关闭</button><img alt=""><h2></h2><p></p><span></span></dialog>`);
 document.querySelector('#hall').onclick=showLearn;
 const dialog=view.querySelector('.badge-preview-dialog');let returnFocus=null;
 view.querySelectorAll('[data-badge-preview]').forEach(button=>button.onclick=()=>{const art=window.learningBadges?.[button.dataset.badgePreview];if(!art)return;returnFocus=button;dialog.querySelector('img').src=art.badge;dialog.querySelector('img').alt=art.name+'徽章大图';dialog.querySelector('h2').textContent=art.name;dialog.querySelector('p').textContent=art.condition;dialog.querySelector('span').textContent=owned.some(row=>idOf(row)===art.id)?'已获得':'尚未获得 · 仅供预览';dialog.showModal();dialog.querySelector('[data-badge-close]').focus();});
 dialog.querySelector('[data-badge-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>returnFocus?.focus());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
}
function rewardItems(){const records=window.learningBadges||{};return [...new Map(earned.filter(x=>records[x.title_id]).map(x=>[x.title_id,records[x.title_id]])).values()].sort((a,b)=>a.id.localeCompare(b.id));}
function rewardSeenKey(){return 'yingji:reward-seen:'+(localStorage.getItem('yingji_user_id')||'guest')+':'+attempt?.id;}
function pendingReward(){return Boolean(attempt?.finished&&rewardItems().length&&sessionStorage.getItem('yingji:earned-attempt')===attempt.id&&!localStorage.getItem(rewardSeenKey()));}
function showReward(){
 const items=rewardItems();if(!items.length||!attempt?.finished)return;
 const top=items[items.length-1];screen='reward';localStorage.setItem(rewardSeenKey(),'1');
 shell('荣誉时刻',`<section class="reward-scene"><button class="reward-skip" data-reward-skip>跳过动画</button><span class="eyebrow">山河有迹 · 学习印记</span><div class="reward-badge-halo"><img class="reward-main-badge" src="${escape(top.badge)}" alt="新获得${escape(top.name)}徽章"></div><span class="reward-new">新称号已获得</span><h2 tabindex="-1">${escape(top.name)}</h2><p class="reward-condition">${escape(top.condition)}</p><p class="aux">这一段学习，留下了新的印记。</p>${items.length>1?`<div class="reward-additional"><span>本次共获得 ${items.length} 枚</span>${items.map(x=>`<div><img src="${escape(x.badge)}" alt=""><span>${escape(x.name)}</span></div>`).join('')}</div>`:''}<div class="reward-actions"><button class="primary" data-reward-learn>继续学习</button><button class="secondary" data-reward-album>查看徽章册</button></div><button class="reward-result-link" data-reward-result>查看作答结果 ↗</button><small>称号记录学习进度，不代表史料核验结论。</small></section>`);
 window.scrollTo(0,0);view.querySelector('.reward-scene h2')?.focus({preventScroll:true});
}
document.addEventListener('click',e=>{if(e.target.closest('[data-replay-reward]'))showReward();if(e.target.closest('[data-reward-skip]'))view.querySelector('.reward-scene')?.classList.add('motion-stopped');if(e.target.closest('[data-reward-learn]'))showLearn();if(e.target.closest('[data-reward-album]'))showHonors();if(e.target.closest('[data-reward-result]')){screen='result';paintResult();window.scrollTo(0,0);}});
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
if (new URLSearchParams(location.search).get('view')==='honors') showHonors();
else if (savedAttempt && !focusGroup) {
  api(`/api/attempts/${savedAttempt}`).then(data => {
    attempt = data;
    earned = sessionStorage.getItem('yingji:earned-attempt')===data.id?JSON.parse(sessionStorage.getItem('yingji:earned')||'[]'):[];
    if (attempt.finished) showResult();
    else showQuiz();
  }).catch(() => showLearn());
} else showLearn();

document.addEventListener('visibilitychange',()=>{if(!document.hidden&&screen==='learn')showLearn();});window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='yingji-refresh-learning'){if(screen==='learn')showLearn();};});

document.addEventListener('click',e=>{const b=e.target.closest('[data-reading]');if(b)parent.postMessage({type:'yingji-person',id:b.dataset.reading},location.origin);});

document.addEventListener('click',e=>{const b=e.target.closest('[data-radar]');if(b)parent.postMessage({type:'yingji-radar',id:b.dataset.radar},location.origin);});

document.addEventListener('click',e=>{
 if(e.target.closest('[data-learning-resume]')){const id=sessionStorage.getItem('yingji:attempt');if(id)api('/api/attempts/'+encodeURIComponent(id)).then(data=>{attempt=data;feedback=null;picked='';if(data.finished)showResult();else showQuiz();}).catch(err=>say(err.message));}
 if(e.target.closest('[data-learning-all]')){focusGroup='';sessionStorage.removeItem('yingji:learning-focus');history.replaceState(null,'',location.pathname);showLearn();}
 if(e.target.closest('[data-learning-back]')){if(screen==='reward'){screen='result';paintResult();return;}if(screen==='quiz'||screen==='result'||screen==='honors')showLearn();else parent.postMessage({type:'yingji-learning-back'},location.origin);}
});

document.addEventListener('click',e=>{const b=e.target.closest('[data-learning-group]');if(!b)return;const group=b.dataset.learningGroup;if(!/^(QQB|LYS|SZZ|LDY|JZY)$/.test(group))return;focusGroup=group;hallFilter='all';paintLearn();window.scrollTo(0,0);});
