const api = require('../../utils/api');
Page({
  data: { preferencesOpen:false,waitSeconds:0,showLatest:false,guideCities:['无锡市','常州市'],guideCityIndex:0,timeOptions:['1小时','2小时','半天'],timeIndex:1,walkingOptions:['尽量少步行','可正常步行'],walkingIndex:0,motionOff:false, keyboardHeight:0,scene:'guide', followUps:[], guideContext: {}, preferenceLabel: '', personIndex: 0, people: [{name:'全部已接入资料',id:''},{name:'瞿秋白',id:'IP-QC'},{name:'狼牙山五壮士',id:'IP-LYS'},{name:'宋振中',id:'IP-SZZ'},{name:'陆定一',id:'IP-LDY'},{name:'江竹筠',id:'IP-JZY'}], mode: 'auto', question: '', messages: [], busy: false, label: '', contextName: '', personId: '', eventId: '', quick: ['这个小程序怎么使用？', '无锡文化路线怎么安排？', '瞿秋白有哪些求学经历？'] },
  onLoad(options) {options={...options,...(getApp().globalData.pendingGuideContext||{})};getApp().globalData.pendingGuideContext=null;
    this.setData({scene:options.placeId?'guide':'guide'});
    this.setData({ personId: options.personId || '', eventId: options.eventId || '', contextName: options.name || '', mode:options.placeId?'guide':'auto' });
    const personIndex = this.data.people.findIndex(p => p.id === this.data.personId);
    if (personIndex >= 0) this.setData({ personIndex });
    api.request('/api/config').promise.then(c => { if (!this.destroyed) this.setData({ label: c.contentLabel }); }).catch(() => { if (!this.destroyed) this.setData({ label: '服务连接待检查' }); });
    if(options.city)this.setData({guideContext:{city:options.city,active:true},preferenceLabel:options.city});this.placeId=options.placeId||'';
    this.sequence = 0;
    if(wx.onKeyboardHeightChange){this.keyboardListener=e=>{if(!this.destroyed)this.setData({keyboardHeight:e.height||0});};wx.onKeyboardHeightChange(this.keyboardListener);}
  },
  onShow(){const person=wx.getStorageSync('yingji:guide-person');if(person){wx.removeStorageSync('yingji:guide-person');const map=Object.fromEntries(require('../../utils/人物关联.json').filter(x=>x.readingId).map(x=>[x.readingId,x.guideId]));this.setData({personIndex:Math.max(0,this.data.people.findIndex(p=>p.id===map[person.id])),contextName:person.name||'',personId:map[person.id]||'',scene:map[person.id]?'history':'guide',mode:map[person.id]?'history':'auto',guideContext:{personName:person.name||''}});}const o=getApp().globalData.pendingGuideContext;if(o){this.placeId=o.placeId;this.setData({scene:'guide',personId:o.personId||'',guideContext:{city:o.city},preferenceLabel:o.city});getApp().globalData.pendingGuideContext=null;}},
  togglePreferences(){this.setData({preferencesOpen:!this.data.preferencesOpen})},
  toggleMotion() { this.setData({motionOff:!this.data.motionOff}); },
 onPageScroll(e) { if(this.data.busy&&this.previousScroll!==undefined&&e.scrollTop<this.previousScroll-15)this.readingEarlier=true;this.previousScroll=e.scrollTop; },
 latest() { this.readingEarlier=false;this.setData({showLatest:false});wx.pageScrollTo({selector:'#reply-'+(this.data.messages.length-1),duration:this.data.motionOff?0:180}); },
 copy(e) { const m=this.data.messages[e.currentTarget.dataset.index];if(m)wx.setClipboardData({data:m.text}); },
 editQuestion(e) { if(this.data.busy)return;const m=this.data.messages[e.currentTarget.dataset.index];if(m)this.setData({question:m.text}); },
 onUnload() { clearInterval(this.waitTimer); if(this.keyboardListener&&wx.offKeyboardHeightChange)wx.offKeyboardHeightChange(this.keyboardListener);this.destroyed = true; this.sequence++; if (this.pending) this.pending.abort(); },
  choosePerson(e) { if (this.data.busy) return; const personIndex = Number(e.detail.value); const person = this.data.people[personIndex]; if (!person) return; this.setData({personIndex, personId:person.id, contextName:person.id ? person.name : '', eventId:'', quick:person.id ? [person.name+'有哪些相关经历？',person.name+'的资料出处是什么？'] : ['瞿秋白有哪些求学经历？','陆定一大学学什么专业？']}); },
  resetGuide() { if(this.data.busy)return;this.placeId='';this.setData({guideContext:{},preferenceLabel:'',messages:[],followUps:[]}); },
  scenario(e) { if(this.data.busy)return; const scene=e.currentTarget.dataset.scene; const choices={help:['这个小程序怎么使用？','如何查看资料出处？','如何使用历史足迹？'],history:['瞿秋白有哪些求学经历？','陆定一大学学什么专业？','狼牙山五壮士有哪些成员？'],guide:['无锡文化路线怎么安排？','我只有一小时，尽量少步行','常州有哪些已接入地点？']};if(!choices[scene])return; this.setData({scene,personIndex:scene==='history'?this.data.personIndex:0,personId:scene==='history'?this.data.personId:'',eventId:scene==='history'?this.data.eventId:'',contextName:scene==='history'?this.data.contextName:'',mode:scene==='history'?'history':scene==='help'?'help':'guide',quick:choices[scene]}); },
  preference(e) { if(this.data.busy)return;const key=e.currentTarget.dataset.key;const ranges={guideCityIndex:this.data.guideCities,timeIndex:this.data.timeOptions,walkingIndex:this.data.walkingOptions};const i=Number(e.detail.value);if(ranges[key]?.[i])this.setData({[key]:i}); },
  suggestRoute() { if(this.data.busy)return;this.setData({question:'我在'+this.data.guideCities[this.data.guideCityIndex]+'，有'+this.data.timeOptions[this.data.timeIndex]+'，'+this.data.walkingOptions[this.data.walkingIndex]+'，文化路线怎么安排？'});this.send(); },
  input(e) { this.setData({ question: e.detail.value }); },
  mode(e) {
    if (this.data.busy) return;
    const mode = e.currentTarget.dataset.mode;
    this.setData({ mode, scene:mode==='help'?'help':'guide', quick: mode === 'help' ? ['我该从哪里开始？', '我只有一小时，怎么安排文化路线？', '如何查看资料出处？'] : ['瞿秋白有哪些求学经历？', '陆定一大学学什么专业？', '瞿秋白纪念馆有什么？'] });
  },
  quick(e) { this.setData({ question: e.currentTarget.dataset.text }); this.send(); },
  async send(retryIndex) {
    const question = this.data.question.trim(); if (!question || this.data.busy) return;
    const retrying=Number.isInteger(retryIndex)&&retryIndex>=1;const original=retrying?this.data.messages[retryIndex-1]?.requestContext:null;if(original){this.placeId=original.placeId;this.setData({mode:original.mode,personId:original.personId,eventId:original.eventId,guideContext:original.guideContext,preferenceLabel:[original.guideContext.city,original.guideContext.timeBudget,original.guideContext.walking].filter(Boolean).join(' · ')});}const requestContext={mode:this.data.mode,personId:this.data.personId,eventId:this.data.eventId,guideContext:{...this.data.guideContext},placeId:this.placeId||''};const previous=retrying?this.data.messages.slice(0,retryIndex-1):this.data.messages;
    const history=previous.filter(m=>!m.failed&&['user','assistant'].includes(m.role)).slice(-8).map(m=>({role:m.role,content:m.text.slice(0,600)}));
    const seq = ++this.sequence;
    this.lastQuestion = question;this.readingEarlier=false;clearInterval(this.waitTimer);this.setData({waitSeconds:0,showLatest:false});this.waitTimer=setInterval(()=>{if(!this.destroyed)this.setData({waitSeconds:this.data.waitSeconds+1});},1000);
    this.setData({ busy: true, question: '', messages: previous.concat([{ role: 'user', text: question,requestContext }]).slice(-20) });
    this.pending = api.request('/api/chat', { method: 'POST', data: { question, history, mode: this.data.mode, personId: this.data.personId, eventId: this.data.eventId, guideContext:this.data.guideContext, placeId:this.placeId } });
    try {
      const result = await this.pending.promise; if (seq !== this.sequence) return;
      this.setData({followUps:result.followUps||['如何查看资料出处？','如何使用历史足迹？']});
      if(result.guideContext)this.setData({guideContext:result.guideContext,preferenceLabel:[result.guideContext.city,result.guideContext.timeBudget,result.guideContext.walking].filter(Boolean).join(" · ")});
      this.setData({ messages: this.data.messages.concat([{ role: 'assistant', text: result.answer, sources: result.citations||[], presentation:result.presentation,retryQuestion:question,failed:result.retryable, placeCards:result.placeCards||[], label: result.contentLabel, actions: result.actions,
        notice:result.modelNotice || '',label:'' }]) });
    } catch (e) {
      if (seq !== this.sequence) return;
      if(e.cancelled)this.setData({question});
      this.setData({ messages: this.data.messages.concat([{ role: 'assistant', text: e.cancelled?'本次回答已停止，原提问已保留。':e.message, retryQuestion:question,failed: !e.cancelled }]) });
    } finally { if (seq === this.sequence){clearInterval(this.waitTimer);this.setData({ busy: false,showLatest:!!this.readingEarlier });if(!this.readingEarlier&&wx.pageScrollTo)this.latest();} }
  },
  stop() { if (this.pending) this.pending.abort(); },
  retry(e) { const m=this.data.messages[e?.currentTarget?.dataset?.index];this.setData({ question: m?.retryQuestion || this.lastQuestion || '' }); this.send(Number(e?.currentTarget?.dataset?.index)); },
  source(e) { api.sources(this.data.messages[e.currentTarget.dataset.index].sources || []); },
  action(e) { const type = e.currentTarget.dataset.type; if(type==='add'){const ids=getApp().globalData.routeIds,id=e.currentTarget.dataset.id;if(ids.includes(id))return wx.showToast({title:'地点已在路线中',icon:'none'});if(ids.length>=4)return wx.showToast({title:'最多4站',icon:'none'});ids.push(id);try{wx.setStorageSync('yingji-route-v1',ids);}catch(e){}return wx.showToast({title:'已加入路线'});} if(type === 'route') return wx.navigateTo({url:'/pages/route/index'}); if(type === 'place') return wx.navigateTo({url:'/pages/place/index?id='+encodeURIComponent(e.currentTarget.dataset.id)}); if (type === 'radar') return this.radar(); api.team(type, this.data.personId); },
  radar() { wx.switchTab({ url: '/pages/radar/index' }); },
  clearContext() { this.setData({ personIndex: 0, personId: '', eventId: '', contextName: '',guideContext:{...this.data.guideContext,personName:''} }); }
});
