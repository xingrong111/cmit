const itinerary=require('../../utils/itinerary');
const api = require('../../utils/api'); const location = require('../../utils/location');
Page({
 data: { mapZoom:1,mapPoints:[{left:20,top:23},{left:59,top:23},{left:58,top:73},{left:21,top:73}],motionOff:false, stayOptions:['15分钟','30分钟','45分钟','60分钟'],stays:{},budgetIndex:0,budgets:['不限时间','1小时','2小时','半天（4小时）'],budgetValues:[0,60,120,240],visitMinutes:0,walkMinutes:null,totalMinutes:null,overBudget:false, places: [], busy: false, error: '', route: null, polylines: [], markers: [], pendingCount:0, stage:'尚未选择地点', ready:false, originLabel: '尚未选择当前位置', latitude: 0, longitude: 0 },
 onShow() { try{const v=wx.getStorageSync('yingji-stay-v1');if(v&&typeof v==='object')this.setData({stays:v});const b=wx.getStorageSync('yingji-budget-v1');if(Number.isInteger(b)&&b>=0&&b<4)this.setData({budgetIndex:b});}catch(e){}  try{wx.setStorageSync('yingji-route-v1',getApp().globalData.routeIds);}catch(e){} this.loadStops(); },
 zoomMap(e) {const v=e.currentTarget.dataset.zoom;this.setData({mapZoom:v==='reset'?1:Math.max(1,Math.min(1.6,this.data.mapZoom+(v==='in'?.2:-.2)))});},
 toggleMotion() { this.setData({motionOff:!this.data.motionOff}); },
 onUnload() { this.destroyed = true; if (this.pending) this.pending.abort(); },
 async loadStops() {
  const ids = getApp().globalData.routeIds;
  if(this.data.route && this.data.route.legs.map(x=>x.placeId).join(',')!==ids.join(','))this.setData({route:null,polylines:[],markers:[]});
  const generation = this.loadGeneration = (this.loadGeneration || 0) + 1;
  const values = await Promise.all(ids.map(id => api.request('/api/places/' + id).promise.catch(() => null)));
  if (!this.destroyed && generation === this.loadGeneration) this.setData({ places: values.filter(Boolean), pendingCount:values.filter(v=>v&&!v.routeReady).length, ready:values.length>0&&values.every(v=>v&&v.routeReady), stage:!values.length?'尚未选择地点':values.some(v=>!v||!v.routeReady)?'已选地点 · 部分点位待确认':'场馆位置可用 · 可设置起点', error: values.some(v => !v) ? '部分地点已下架或读取失败，请返回足迹雷达重新选择。' : '', originLabel: getApp().globalData.position ? '当前位置 · GCJ-02' : '尚未选择当前位置' });
  if(!this.destroyed&&generation===this.loadGeneration)this.updateSummary();
 },
 remove(e) { if (this.data.busy) return; getApp().globalData.routeIds = getApp().globalData.routeIds.filter(id => id !== e.currentTarget.dataset.id); this.setData({ route: null, polylines: [], markers: [] }); try{wx.setStorageSync('yingji-route-v1',getApp().globalData.routeIds);}catch(e){} this.loadStops(); },
 up(e) {
  if (this.data.busy) return;
  const ids = getApp().globalData.routeIds, i = ids.indexOf(e.currentTarget.dataset.id);
  if (i > 0) { const temp = ids[i - 1]; ids[i - 1] = ids[i]; ids[i] = temp; this.setData({ route: null, polylines: [], markers: [] }); try{wx.setStorageSync('yingji-route-v1',ids);}catch(e){}this.loadStops(); }
 },
 async locate() { if (this.data.busy) return; try { const position = await location.locate(); if (this.destroyed) return; getApp().globalData.position = position; this.setData({ originLabel: '当前位置 · GCJ-02', route: null, polylines: [], markers: [], error: '' }); this.updateSummary(); } catch (e) { if (!this.destroyed) this.setData({ error: e.message }); } },
 async plan() {
  if (this.data.busy) return;
  if(!this.data.ready)return this.setData({error:'所选地点地图点位尚未全部确认，可以继续调整参观顺序；暂不能计算步行路线。'});
  const origin = getApp().globalData.position;
  if (!origin) return this.setData({ error: '请先选择当前位置，才能计算步行路线。' });
  if (this.data.places.length !== getApp().globalData.routeIds.length) return this.setData({ error: '有地点尚未读取成功，请重新选择。' });
  this.setData({ busy: true, error: '', route: null });this.updateSummary();
  this.pending = api.request('/api/routes', { method: 'POST', data: { origin, placeIds: this.data.places.map(p => p.id) } });
  try {
   const route = await this.pending.promise;
   if (this.destroyed) return;
   const points = route.legs.reduce((all, leg) => all.concat(leg.points), []);
   this.setData({ route, polylines: [{ points, color: '#9c3029', width: 5 }], latitude: origin.latitude, longitude: origin.longitude,
    markers: this.data.places.map((p, i) => ({ id: i + 1, latitude: p.routeCoordinate.latitude, longitude: p.routeCoordinate.longitude, title: (i + 1) + '. ' + p.name })) });
  this.updateSummary();
  } catch (e) { if (!this.destroyed) this.setData({ error: e.message }); }
  finally { if (!this.destroyed) this.setData({ busy: false }); }
 },
 updateSummary() { this.setData(itinerary.summary(this.data.places,this.data.stays,this.data.route,this.data.budgetValues[this.data.budgetIndex])); },
 budget(e) { const i=Number(e.detail.value);if(!Number.isInteger(i)||i<0||i>=4)return;this.setData({budgetIndex:i});try{wx.setStorageSync('yingji-budget-v1',i);}catch(e){}this.updateSummary(); },
 stay(e) { const id=e.currentTarget.dataset.id;const value=Number(e.detail.value);if(!Number.isInteger(value)||value<0||value>3||!this.data.places.some(p=>p.id===id))return;const stays={...this.data.stays,[id]:[15,30,45,60][value]};this.setData({stays});try{wx.setStorageSync('yingji-stay-v1',stays);}catch(e){}this.updateSummary(); },
 copyPlan() { const text=['英迹 · 我的文化路线计划',...this.data.places.map((p,i)=>(i+1)+'. '+p.name+'（停留'+(this.data.stays[p.id]||30)+'分钟）'),'此为路线计划，不代表已到访；开放与预约需出发前确认。'].join('\n');wx.setClipboardData({data:text}); },
 radar() { wx.navigateTo({ url: '/pages/radar/index' }); },
 place(e) { wx.navigateTo({ url: '/pages/place/index?id=' + e.currentTarget.dataset.id }); },
 navigate() { const p = this.data.places[0]; if (p && p.routeCoordinate) wx.openLocation({ latitude: p.routeCoordinate.latitude, longitude: p.routeCoordinate.longitude, name: p.name, address: p.address }); }
});
