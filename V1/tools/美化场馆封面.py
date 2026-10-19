from pathlib import Path
p=Path('V1/services/guide/web/app.js');s=p.read_text(encoding='utf-8');needle='function arrangeVenueDetail(layout){';s=s.replace(needle,'''function decorateVenueCover(){
 const cover=screen.querySelector('.hero'),p=state.current;if(!cover||!p||cover.querySelector('.venue-cover-art'))return;
 cover.classList.add('venue-cover');
 const words=panel('venue-cover-copy',[...cover.children].filter(e=>!e.matches('.motion-toggle')));
 words.querySelector('.eyebrow').textContent='山河有迹 · 循迹访馆';
 words.insertAdjacentHTML('beforeend','<div class="venue-cover-tags"><span>人物与场所</span><span>城市文化足迹</span></div>');
 cover.append(words);
 const art=document.createElement('div');art.className='venue-cover-art';
 art.innerHTML=p.photo?`<img class="venue-cover-photo" src="${esc(p.photo.url)}" alt="${esc(p.photo.caption)}"><div class="venue-cover-credit"><a href="${esc(p.photo.sourceURL)}" target="_blank" rel="noopener noreferrer">资料照片 · 来源 ↗</a><span>${esc(p.photo.author)} · ${esc(p.photo.license)}</span></div>`:'<img class="venue-cover-photo" src="/preview/assets/场馆意象.svg" alt="原创建筑意象，非实景复原">';
 art.insertAdjacentHTML('beforeend','<span class="venue-cover-seal" aria-hidden="true">循迹<br>访馆</span>');cover.append(art);
}
function arrangeVenueDetail(layout){
 decorateVenueCover();''',1);p.write_text(s,encoding='utf-8')
