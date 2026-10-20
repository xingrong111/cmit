from pathlib import Path
p=Path('V1/services/guide/web/app.js');s=p.read_text(encoding='utf-8')
code='''
function arrangeVenueDetail(layout){
 const service=layout.querySelector('.venue-service'),highlights=layout.querySelector('.venue-highlights');
 const related=layout.querySelector('[data-action="person"]')?.closest('.card');
 if(related){related.classList.add('venue-related');related.querySelectorAll('p.small').forEach(p=>{if(p.textContent.includes('团队主工程'))p.remove()});related.querySelectorAll('[data-action="person"]').forEach(b=>{b.classList.add('venue-person-link');b.textContent=b.textContent.replace(' · 人物档案','');b.insertAdjacentHTML('beforeend','<span aria-hidden="true"> ↗</span>')});}
 const reading=panel('venue-reading-columns',[panel('venue-reading-left',[highlights,related]),panel('venue-reading-right',[service])]);
 layout.querySelector('.venue-story')?.after(reading);
 const candidate=layout.querySelector('.venue-candidate');
 const refs=panel('venue-reference-grid',[]);
 if(candidate){const folded=document.createElement('details');folded.className='card venue-poi-fold';const summary=document.createElement('summary');summary.textContent='地图位置与坐标参考';folded.append(summary);while(candidate.firstChild)folded.append(candidate.firstChild);candidate.replaceWith(folded);refs.append(folded);}
 [...layout.children].filter(e=>e.matches('details.card')).forEach(e=>refs.append(e));
 if(refs.children.length)layout.append(refs);
 const routeButton=layout.querySelector('[data-action="page"][data-value="route"]');
 const dock=screen.querySelector('.detail-dock');
 if(dock){dock.classList.add('venue-action-bar');const ask=dock.querySelector('[data-action="ask-place"]'),add=dock.querySelector('[data-action="add"]');if(ask)ask.textContent='问小迹';if(add)add.textContent=state.stops.includes(state.current.id)?'已加入路线':'加入路线';if(routeButton){routeButton.textContent='查看路线';routeButton.className='ghost';dock.insertBefore(routeButton,add);}const old=layout.querySelector('.actions:empty');if(old)old.remove();}
 const actions=service?.querySelector('.actions');
 if(actions){const copy=actions.querySelector('[data-action="copy-address"]'),map=actions.querySelector('.venue-call'),plan=actions.querySelector('[data-action="navigate"]');if(copy)copy.textContent='复制地址';if(map)map.textContent='地图查看 ↗';if(plan){plan.textContent=state.current.routeReady?'规划到这里':'暂不可规划';plan.className='primary';actions.prepend(plan);}}
}
'''
s=s.replace('place=async function(id){',code+'\nplace=async function(id){',1).replace("screen.append(layout);const dock=screen.querySelector('.detail-dock');", "arrangeVenueDetail(layout);screen.append(layout);const dock=screen.querySelector('.detail-dock');",1)
p.write_text(s,encoding='utf-8')
