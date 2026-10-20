from pathlib import Path
p=Path('V1/services/学习/public/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("if (data.finished) sessionStorage.setItem('yingji:earned', JSON.stringify(earned));", "if (data.finished){sessionStorage.setItem('yingji:earned',JSON.stringify(earned));sessionStorage.setItem('yingji:earned-attempt',data.id);}")
s=s.replace("  paintResult();\n}\nfunction paintResult()", "  paintResult();\n  if(pendingReward())showReward();\n}\nfunction paintResult()",1)
s=s.replace("<h2>${escape(earned.map(item => item.name).join('、'))}</h2></section>","<h2>${escape(earned.map(item => item.name).join('、'))}</h2><button class=\"secondary\" data-replay-reward>查看本次荣誉</button></section>",1)
a=s.index('function paintHonors(){');b=s.index('async function showHonors()',a)
s=s[:a]+'''function paintHonors(){
 const rows=honorRows(honorView),owned=rows.filter(x=>x.state==='已获得'),current=owned[owned.length-1],next=rows.find(x=>x.state!=='已获得');
 const idOf=row=>honorView.titles.find(t=>t.name===row?.name)?.id;
 const emblem=window.learningBadges?.[idOf(current)||'H-PATH-1'];
 shell('学习徽章册',`<section class="card badge-album-cover"><div><span class="eyebrow">山河有迹 · 我的学习印记</span><h2>${current?escape(current.name):'从第一枚星火开始'}</h2><p>已获得 ${owned.length} / ${rows.length} 枚徽章 · 完整学习 ${honorView.completed_groups} / 5 组</p><p class="aux">${next?'下一目标：'+escape(next.detail):'五枚徽章已集齐，随时可以重温人物故事。'}</p></div><img class="album-current-badge ${current?'':'unearned'}" src="${escape(emblem.badge)}" alt="${current?escape(current.name):'星火初学者，尚未获得'}徽章"></section><div class="badge-album-grid">${rows.map((row,i)=>{const art=window.learningBadges?.[idOf(row)];return `<article class="badge-album-card ${row.state==='已获得'?'earned':row===next?'next':'locked'}"><span class="badge-position">${String(i+1).padStart(2,'0')} / 成长印记</span><img src="${escape(art?.badge||'')}" alt="${escape(row.name)}徽章"><h3>${escape(row.name)}</h3><span class="badge-state">${row.state==='已获得'?'已获得':row===next?'下一目标':'未解锁'}</span><p>${escape(row.detail)}</p><small>${escape(row.progress||'')}</small></article>`}).join('')}</div><p class="honor-rule-note">${escape(honorView.note)}</p><button class="primary" id="hall">继续学习</button>`);
 document.querySelector('#hall').onclick=showLearn;
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
''' +s[b:]
# 自动恢复结果时只使用与当前答题记录匹配的新称号，防止串到别次练习。
s=s.replace("earned = JSON.parse(sessionStorage.getItem('yingji:earned') || '[]');", "earned = sessionStorage.getItem('yingji:earned-attempt')===data.id?JSON.parse(sessionStorage.getItem('yingji:earned')||'[]'):[];")
p.write_text(s,encoding='utf-8')
