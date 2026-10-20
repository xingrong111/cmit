const api = require('../../utils/api'); const location = require('../../utils/location');
Page({
 data: {listExpanded:false, hasPosition:false,mapZoom:1,mapPoints:[{left:20,top:23},{left:59,top:23},{left:58,top:73},{left:21,top:73}],motionOff:false, viewMode:'map', selectedId:'', selected:null, items: [], cities: ['无锡市', '常州市'], city: '无锡市', type: '', q: '', busy: false, error: '', notice: '', locationLabel: '手动浏览 · 无锡市', markers: [], includePoints:[],latitude: 0, longitude: 0, hasMap: false, radius: 10000, ranges: ['3公里', '10公里', '30公里'], rangeIndex: 1, label: '' },
 toggleList(){this.setData({listExpanded:!this.data.listExpanded})},
 onLoad() {
  this.requestId=0;
  api.request('/api/config').promise.then(c=>{if(!this.destroyed)this.setData({cities:c.cities.length?c.cities:['无锡市','常州市'],label:c.contentLabel});}).catch(()=>{});
 },
 onShow(){const pending=wx.getStorageSync('yingji:radar-person');if(pending!==''&&pending!=null){this.archiveFilter=typeof pending==='string'?pending:pending.id||'';wx.removeStorageSync('yingji:radar-person');this.setData({archiveOnly:!!this.archiveFilter,selectedId:''});}this.load();},
 clearArchive(){this.archiveFilter='';this.setData({archiveOnly:false});this.load();},
 zoomMap(e) {const v=e.currentTarget.dataset.zoom;this.setData({mapZoom:v==='reset'?1:Math.max(1,Math.min(1.6,this.data.mapZoom+(v==='in'?.2:-.2)))});},
 toggleMotion() { this.setData({motionOff:!this.data.motionOff}); },
 onUnload() { this.destroyed = true; this.locateGeneration = (this.locateGeneration || 0) + 1; this.requestId++; if (this.pending) this.pending.abort(); },
 async load() {
  const id = ++this.requestId; if (this.pending) this.pending.abort();
  this.setData({ busy: true, error: '' });
  const p = this.position;
  const params = { city: p ? '' : this.data.city, type: this.data.type, q: this.data.q, radius: this.data.radius, lat: p && p.latitude, lng: p && p.longitude, coordinateType: p && p.type };
  this.pending = api.request('/api/places?' + api.query(params));
  try {
   const res = await this.pending.promise;const map=Object.fromEntries(require('../../utils/人物关联.json').filter(x=>x.readingId).map(x=>[x.guideId,x.readingId]));if(this.archiveFilter)res.items=res.items.filter(p=>p.relatedPeople.some(x=>map[x.id]===this.archiveFilter)); if (id !== this.requestId) return;
   this.markerPlaces = res.items.filter(x => x.coordinate || (x.candidateMapReady && x.mapCandidate?.coordinate)).map(x=>({...x,displayCoordinate:x.coordinate||x.mapCandidate.coordinate}));
   const markers = this.markerPlaces.map((x, i) => ({ id: i + 1,iconPath:'/assets/map-pins/'+(i+1)+'.png',width:34,height:43,anchor:{x:.5,y:.9},latitude: x.displayCoordinate.latitude, longitude: x.displayCoordinate.longitude, title: x.name,
     callout: { content: x.name+(x.routeReady?'':' · 候选点'), color: '#9c3029', fontSize: 12, bgColor: '#fff9ec', padding: 8, borderRadius: 8, display: 'ALWAYS' } }));
   const overview=this.data.city==='常州市'?{latitude:31.78,longitude:119.97}:{latitude:31.57,longitude:120.30};const point = p || (this.markerPlaces[0] && this.markerPlaces[0].displayCoordinate)||overview;
   const selected=res.items.find(x=>x.id===this.data.selectedId)||res.items[0]||null;
   this.setData({ hasPosition:!!p,selected, selectedId:selected?selected.id:'', items: res.items, notice: res.notice, markers,includePoints:markers.map(m=>({latitude:m.latitude,longitude:m.longitude})), hasMap: !!point, latitude: point ? point.latitude : 0, longitude: point ? point.longitude : 0 });
  } catch (e) { if (id === this.requestId && !e.cancelled) this.setData({ error: e.message }); }
  finally { if (id === this.requestId) this.setData({ busy: false }); }
 },
 async locate() {
  const generation = this.locateGeneration = (this.locateGeneration || 0) + 1;
  this.setData({ error: '', busy: true });
  try { const position = await location.locate(); if (this.destroyed || generation !== this.locateGeneration) return; this.position = position; getApp().globalData.position = this.position; this.setData({ locationLabel: '当前位置 · 附近已核入口' }); await this.load(); }
  catch (e) { if (!this.destroyed && generation === this.locateGeneration) this.setData({ error: e.message, busy: false }); }
 },
 city(e) { this.locateGeneration = (this.locateGeneration || 0) + 1; this.position = null; getApp().globalData.position = null; const city = this.data.cities[Number(e.detail.value)]; this.setData({ city, locationLabel: '手动浏览 · ' + city }); this.load(); },
 settings() { wx.openSetting({}); },
 filter(e) { this.setData({ type: e.currentTarget.dataset.type }); this.load(); },
 input(e) { this.setData({ q: e.detail.value }); },
 search() { this.load(); },
 range(e) { const n = Number(e.detail.value); this.setData({ rangeIndex: n, radius: [3000, 10000, 30000][n] }); this.load(); },
 place(e) { wx.navigateTo({ url: '/pages/place/index?id=' + encodeURIComponent(e.currentTarget.dataset.id) }); },
 marker(e) { const item = this.markerPlaces[e.detail.markerId - 1]; if(item)this.selectPlace(item); },
 selectPlace(item) { const markers=this.data.markers.map(m=>({...m,callout:{...m.callout,bgColor:this.markerPlaces[m.id-1]?.id===item.id?'#982b28':'#fff9ec',color:this.markerPlaces[m.id-1]?.id===item.id?'#fff9ec':'#982b28'}}));this.setData({markers,selected:item,selectedId:item.id,...((item.coordinate||item.mapCandidate?.coordinate)?{latitude:(item.coordinate||item.mapCandidate.coordinate).latitude,longitude:(item.coordinate||item.mapCandidate.coordinate).longitude}: {})}); },
 select(e) { const item=this.data.items.find(x=>x.id===e.currentTarget.dataset.id);if(item)this.selectPlace(item); },
 view(e) { this.setData({viewMode:e.currentTarget.dataset.view}); },
 browseCity() { this.locateGeneration=(this.locateGeneration||0)+1;this.position=null;getApp().globalData.position=null;this.setData({locationLabel:'手动浏览 · '+this.data.city});this.load(); },
 route() { wx.navigateTo({ url: '/pages/route/index' }); },
 assistant() { wx.switchTab({ url: '/pages/assistant/index' }); }
});
