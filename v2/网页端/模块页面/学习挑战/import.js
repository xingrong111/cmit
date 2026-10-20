function learningFetch(url,options={}){return fetch(url.replace(/^\/api/,'/api/learning'),{...options,headers:{...options.headers,Authorization:'Bearer '+(localStorage.getItem('yingji_token')||'')}});}
const text = document.querySelector('#text');
const result = document.querySelector('#result');
const check = document.querySelector('#check');
let submission = null;
let lastErrors = [];

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
document.querySelector('#file').onchange = () => {
  const file = document.querySelector('#file').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { text.value = String(reader.result || ''); };
  reader.readAsText(file, 'utf-8');
};
function show(html, primary) {
  result.innerHTML = html;
  check.textContent = primary;
}
check.onclick = async () => {
  if (check.textContent === '确认存为草稿') return confirmDraft();
  let data;
  try { data = JSON.parse(text.value); } catch { show('<div class="feedback bad">文件不是有效的 JSON。</div>', '检查这份文件'); return; }
  const response = await learningFetch('/api/import/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submission: data }) });
  const body = await response.json();
  submission = body.ok ? data : null;
  lastErrors = body.errors || [];
  const counts = body.counts ? Object.entries(body.counts).filter(([, count]) => count).map(([key, count]) => `${key} ${count}`).join('、') : '';
  const errors = lastErrors.map(error => `<p><span class="tag">${escape(error.kind)}</span> ${escape(error.message)}</p>`).join('');
  if (!body.ok) {
    show(`<div class="card"><p class="eyebrow">待核验</p><p>未通过，没有保存。</p>${errors}<button class="secondary" id="download" type="button">下载错误列表</button></div>`, '检查这份文件');
    document.querySelector('#download').onclick = downloadErrors;
    return;
  }
  show(`<div class="card"><p class="eyebrow">待核验</p><p>可以存为草稿。未发布。</p><p class="aux">${escape(counts || '没有条目')}</p></div>`, '确认存为草稿');
};
function downloadErrors() {
  const lines = lastErrors.map(error => `${error.kind}\t${error.message}`);
  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '导入错误列表.txt';
  link.click();
  URL.revokeObjectURL(link.href);
}
async function confirmDraft() {
  const response = await learningFetch('/api/import/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submission }) });
  const body = await response.json();
  if (!response.ok) {
    show(`<div class="feedback bad">${(body.errors || [body.error || '没有保存']).map(escape).join('<br>')}</div>`, '检查这份文件');
    return;
  }
  submission = null;
  show(`<div class="feedback ok">已存草稿 ${escape(body.file)}。状态 ${escape(body.question_status)}。未发布。</div>`, '检查这份文件');
}
