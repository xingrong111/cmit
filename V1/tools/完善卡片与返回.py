from pathlib import Path
p=Path('V1/frontend/src/components/AppShell.vue')
s=p.read_text(encoding='utf-8').replace('<view class="shell-body"><slot/>','<view class="shell-body"><view v-if="active && active!==\'home\'" class="page-return"><button @tap="backOr(parentPage)">‹ 返回上一页</button><text>{{parentLabel}}</text></view><slot/>')
s=s.replace("import {ref} from 'vue'","import {ref,computed} from 'vue'").replace("import {go} from '../lib/navigation.js'","import {go,backOr} from '../lib/navigation.js'")
s=s.replace('onShow(()=>',"const parentPage=computed(()=>({person:'people',registry:'people',province:'home',event:'timeline',graph:'people',sources:'people',source:'radar',place:'radar',route:'radar',account:'me',admin:'me','my-comments':'me',discussion:'people',privacy:'me',statistics:'home'}[active.value]||'home'))\nconst parentLabel=computed(()=>({people:'人物索引',home:'山河首页',timeline:'时间长卷',radar:'历史足迹',me:'我的'}[parentPage.value])+' · 直接打开时返回此处')\nonShow(()=>")
s+='\n<style scoped>\n.page-return{display:flex;align-items:center;gap:14px;margin:0 0 18px;padding:8px 0;border-bottom:1px solid #e8dcc8}.page-return button{margin:0;padding:7px 12px;font-size:14px;line-height:1.5;color:#982b28;background:#f7efdf;border-radius:8px;min-height:36px}.page-return button:after{border:0}.page-return text{font-size:11px;color:#93836c}@media(max-width:600px){.page-return{margin-bottom:12px}.page-return text{display:none}}\n</style>\n'
p.write_text(s,encoding='utf-8')
p=Path('V1/services/guide/web/app.js');s=p.read_text(encoding='utf-8')
s=s.replace('const webOriginal =',"const venueBackStack=[];let restoringVenue=false;\nfunction rememberVenue(){if(!restoringVenue&&webBootComplete)venueBackStack.push({page:state.page,id:state.current?.id,scroll:window.scrollY});}\nfunction venueBack(){const prev=venueBackStack.pop();restoringVenue=true;const result=prev?.page==='place'?place(prev.id):go(prev?.page||'radar');Promise.resolve(result).finally(()=>{restoringVenue=false;setTimeout(()=>window.scrollTo(0,prev?.scroll||0),150)});}\nconst webOriginal =")
s=s.replace("const active=state.page==='place'?'radar':state.page;","const active=state.page==='place'?'radar':state.page;\n  if(state.page==='place'&&!screen.querySelector('.venue-return'))screen.insertAdjacentHTML('afterbegin','<button class=\"venue-return\" data-venue-back>‹ 返回上一页</button>');")
s=s.replace("place=async function(id){history", "place=async function(id){if(state.page!=='place'||state.current?.id!==id)rememberVenue();history")
s=s.replace("webOriginal.go(page);history.replaceState", "if(state.page!==page)rememberVenue();webOriginal.go(page);history.replaceState")
s+="\ndocument.addEventListener('click',e=>{if(e.target.closest('[data-venue-back]'))venueBack();});\n"
p.write_text(s,encoding='utf-8')
