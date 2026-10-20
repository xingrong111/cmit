from pathlib import Path
import re
r=Path(__file__).resolve().parents[1]
p=r/'services/学习/public/app.js';s=p.read_text(encoding='utf-8')
line="const focusedName=groups.find(g=>hallView.items.some(x=>x.group===focusGroup&&x.person_name===g.name))?.name;"
s=re.sub('(?:'+re.escape(line)+r'\s*)+',line+'\n  ',s)
path='${!focusGroup?\'<div class="learning-path"><span>01 阅读人物</span><span>02 入门 · 5题</span><span>03 进阶 · 8题</span></div>\':\'\'}'
s=s.replace(path,'').replace('<div class="filters hall-filters">',path+'<div class="filters hall-filters">',1)
p.write_text(s,encoding='utf-8')
p=r/'services/学习/miniprogram/pages/learn/learn.wxml';s=p.read_text(encoding='utf-8');path='<view class="learning-path"><text>01 阅读人物</text><text>02 入门 · 5题</text><text>03 进阶 · 8题</text></view>'
s=s.replace(path,'').replace('<view class="section-head">',path+'<view class="section-head">',1);p.write_text(s,encoding='utf-8')
p=r/'frontend/src/components/人物目录.vue';s=p.read_text(encoding='utf-8').replace("p.birthText+'年'","p.birthText");p.write_text(s,encoding='utf-8')
if 'dossier-link' not in s:
 s=s.replace('<template v-if="mode===\'directory\'">','''<template v-if="mode==='directory'"><view class="directory-dossiers"><view class="section-head"><text>详细档案 · 按出生地域</text><text class="small">与研究条目分别展示</text></view><view v-for="section in detailSections" :key="section.name"><text class="small">{{section.name}}</text><view class="dossier-links"><button v-for="p in section.items" :key="p.id" class="outline dossier-link" @tap="go('person',{id:p.id})">{{p.name}} ↗</button></view></view></view>''',1)
 # The directory picker must filter both panels, without treating birthplace as origin.
 s=s.replace("p.province===name&&matches(p)","p.province===name&&matches(p)&&(mode.value!=='directory'||!code.value||(code.value==='unknown'?name==='待核':shortName(provinces.find(x=>x.code===code.value)?.name||'')===name))")
 p.write_text(s,encoding='utf-8')
p=r/'tools/检查人物与挑战.py';s=p.read_text(encoding='utf-8').replace("wait(\"document.querySelectorAll('.archive-name').length===1\")","wait(\"document.querySelectorAll('.dossier-link').length===1\")").replace("js(\"document.querySelector('.archive-name').click()\")","js(\"document.querySelector('.dossier-link').click()\")")
p.write_text(s,encoding='utf-8')
