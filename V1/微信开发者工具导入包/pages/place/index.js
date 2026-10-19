const api = require('../../utils/api');
Page({__returnPrevious(){const fallback=()=>wx.switchTab({url:'/pages/radar/index'});if(getCurrentPages().length>1)wx.navigateBack({delta:1,fail:fallback});else fallback();},
 data: { motionOff:false, evidenceOpen:false, checklistOpen:false,photoFailed:false, place: null, busy: true, error: '', added: false },
 onLoad(o) { this.id = o.id; this.load(); },
 onShow() { if (this.id) this.setData({ added: getApp().globalData.routeIds.includes(this.id) }); },
 toggleMotion() { this.setData({motionOff:!this.data.motionOff}); },
 onUnload() { this.destroyed = true; if (this.pending) this.pending.abort(); },
 async load() {
  if(this.pending)this.pending.abort();const generation=this.generation=(this.generation||0)+1;this.setData({ busy: true, error: '' }); this.pending = api.request('/api/places/' + encodeURIComponent(this.id || ''));
  try { const place = await this.pending.promise; if(place.photo)place.photo.displayURL=api.assetURL(place.photo.url);if(place.visitorService)place.visitorService.entries=place.visitorService.entries.filter(e=>e.status!=='unknown'&&e.sourceIds?.length); if (!this.destroyed && generation===this.generation) this.setData({ place }); }
  catch (e) { if (!this.destroyed && generation===this.generation) this.setData({ error: e.message }); }
  finally { if (!this.destroyed && generation===this.generation) this.setData({ busy: false }); }
 },
 toggleEvidence() { this.setData({evidenceOpen:!this.data.evidenceOpen}); },
 source() { api.sources(this.data.place.sources); },
 copyAddress(){wx.setClipboardData({data:this.data.place.name+' · '+this.data.place.address});},
 copyPoi(){const c=this.data.place.mapCandidate;if(c)wx.setClipboardData({data:c.name+' · '+c.coordinate.latitude+', '+c.coordinate.longitude+'（GCJ-02，候选点，非场馆地图位置）'});},
 serviceSource(e){const key=e.currentTarget.dataset.key;const item=this.data.place.visitorService.entries.find(x=>x.key===key);if(item)api.sources(this.data.place.sources.filter(s=>item.sourceIds.includes(s.id)));},
 contactSource(e){const item=this.data.place.visitorService.contacts[Number(e.currentTarget.dataset.index)];if(item)api.sources(this.data.place.sources.filter(s=>item.sourceIds.includes(s.id)));},
 callContact(e){const c=this.data.place.visitorService.contacts[Number(e.currentTarget.dataset.index)];if(!c)return;wx.showModal({title:'咨询场馆',content:c.label+'：'+c.number+'\n来源日期：'+c.recordDate+'，当前是否接通需确认。',confirmText:'拨打',success:r=>{if(r.confirm)wx.makePhoneCall({phoneNumber:c.number.replace(/-/g,''),fail:()=>wx.showToast({title:'未完成拨号，可复制号码',icon:'none'})});}});},
 copyContact(e){const c=this.data.place.visitorService.contacts[Number(e.currentTarget.dataset.index)];if(c)wx.setClipboardData({data:c.number});},
 photoSource(){wx.setClipboardData({data:this.data.place.photo.sourceURL});},
 photoLicense(){wx.setClipboardData({data:this.data.place.photo.licenseURL});},
 toggleChecklist(){this.setData({checklistOpen:!this.data.checklistOpen});},
 photoError(){this.setData({photoFailed:true});},
 previewPhoto(){const url=this.data.place.photo?.displayURL;if(url)wx.previewImage({current:url,urls:[url]});},
 navigate() {
  const p = this.data.place;
  if (!p.routeReady) return wx.showToast({ title: '导航入口坐标待核验', icon: 'none' });
  wx.openLocation({ latitude: p.routeCoordinate.latitude, longitude: p.routeCoordinate.longitude, name: p.name, address: p.address, scale: 17,
    fail() { wx.showToast({ title: '地图未能打开，请重试', icon: 'none' }); } });
 },
 add() {
  const ids = getApp().globalData.routeIds;
  if (!ids.includes(this.id)) { if (ids.length >= 4) return wx.showToast({ title: '路线最多添加4站', icon: 'none' }); ids.push(this.id); }
  try{wx.setStorageSync(require('../../utils/账户存储').key('yingji-route-v1'),ids);}catch(e){wx.showToast({title:'本机保存失败，当前仍可使用',icon:'none'});} this.setData({ added: true }); wx.showToast({ title: '已加入文化路线', icon: 'success' });
 },
 route() { wx.navigateTo({ url: '/pages/route/index' }); },
 person(e) { api.team('person', e.currentTarget.dataset.id); },
 assistant() { const p=this.data.place;getApp().globalData.pendingGuideContext={placeId:p.id,city:p.city,name:p.name,personId:p.personIds[0]||''};wx.switchTab({url:'/pages/assistant/index'}); }
});
