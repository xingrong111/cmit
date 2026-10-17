from pathlib import Path
r=Path(__file__).resolve().parents[1];p=r/'frontend/src/components/山河地图.vue';t=p.read_text(encoding='utf-8')
t=t.replace("import {placeLabels} from '../lib/地图标签.js'\n",'').replace(',lastTouch=0,labelHits=[]',',lastTouch=0')
start=t.index(" c.setTextAlign('center')");end=t.index('\n}\nfunction redraw',start)
t=t[:start]+''' const selected=anchors.find(a=>a.code===selectedCode.value)
 if(selected){const [x,y]=project(selected.p);if(x>8&&x<width.value-8&&y>8&&y<height.value-26){c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.setFillStyle('#FBF5E9');c.fill();c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.setFillStyle('#BD9A67');c.fill()}}
 c.draw(false,()=>{ready.value=true})'''+t[end:]
t=t.replace("const label=labelHits.find(a=>Math.abs(a.x-p[0])<=18&&Math.abs(a.y-p[1])<=13);if(label){choose(label.code);return}",'')
t=t.replace('<view class="atlas-tools">','<view class="atlas-current"><text class="atlas-current-caption">当前选中</text><text class="atlas-current-name">{{shortName(selectedProvince.name)}}<text class="atlas-current-number">{{counts[selectedProvince.code]||0}}人</text></text></view><view class="atlas-tools">',1)
t=t.replace('合并收录人物</text><text>拖动探索','已选省份</text><text>点选省份 · 拖动探索')
t=t.replace('  <view v-show="directoryOpen"', '''  <view class="atlas-switch-heading"><text class="small">沿山河选一站</text><text class="small">左右滑动切换省份 →</text></view>
  <scroll-view scroll-x class="atlas-region-scroll" :scroll-into-view="'atlas-chip-'+selectedCode" :scroll-with-animation="true"><view class="atlas-region-row"><button v-for="p in provinces" :id="'atlas-chip-'+p.code" :key="p.code" :class="['atlas-region-chip',{active:p.code===selectedCode}]" :aria-label="p.name+'，'+(counts[p.code]||0)+'位收录人物'" @tap="choose(p.code)"><text>{{shortName(p.name)}}</text><text class="atlas-chip-count">{{counts[p.code]||0}}</text></button></view></scroll-view>
  <view v-show="directoryOpen"''',1)
t+='''
<style scoped>
.atlas-current{position:absolute;left:16px;top:16px;z-index:2;pointer-events:none;background:#fffaf1ee;border:1px solid #d9c29f;border-radius:12px;padding:10px 14px;box-shadow:0 5px 18px #54371c0a;min-width:76px}.atlas-current-caption{display:block;font-size:10px;letter-spacing:2px;color:#8c7457;margin-bottom:4px}.atlas-current-name{display:flex;align-items:baseline;gap:12px;color:#982b28;font-family:STSong,SimSun,serif;font-size:19px}.atlas-current-number{font-family:Georgia,serif;font-size:16px;color:#725b40}.atlas-switch-heading{display:flex;justify-content:space-between;gap:10px;margin:16px 0 10px}.atlas-region-scroll{width:100%;white-space:nowrap;margin-bottom:18px}.atlas-region-row{display:inline-flex;gap:8px;padding:2px 2px 8px}.atlas-region-chip{display:inline-flex!important;align-items:center;justify-content:center;gap:10px;margin:0!important;padding:10px 14px!important;min-height:44px;font-size:13px!important;line-height:1.5!important;border:1px solid #e2d0b3!important;border-radius:11px!important;background:#fffaf1!important;color:#6e5943!important;flex-shrink:0}.atlas-region-chip.active{background:#982b28!important;border-color:#982b28!important;color:#fffaf1!important}.atlas-chip-count{font-family:Georgia,serif;font-size:16px;color:#982b28}.active .atlas-chip-count{color:#fffaf1}.atlas-region-chip:after{border:0}.atlas-region-chip:active{opacity:.8}
@media(max-width:650px){.atlas-current{left:12px;top:12px;padding:8px 12px}.atlas-current-name{font-size:17px}.atlas-switch-heading .small{font-size:11px}.atlas-region-chip{padding:9px 12px!important}}
</style>
'''
p.write_text(t,encoding='utf-8')
print('地图改为单省高亮、固定人数卡与横向省份切换；移除全图密集标签与引线。')
