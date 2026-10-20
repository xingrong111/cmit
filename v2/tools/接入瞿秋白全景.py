from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
p=r/'frontend/src/pages/person/index.vue';text=p.read_text(encoding='utf-8')
if 'PersonPanorama' not in text:
 text=text.replace('<view class="person-cover">','<PersonPanorama v-if="person.id===\'P009\'"/><view v-else class="person-cover">',1)
 text=text.replace("import PersonPortrait from '../../components/PersonPortrait.vue';","import PersonPanorama from '../../components/PersonPanorama.vue';import PersonPortrait from '../../components/PersonPortrait.vue';",1)
 p.write_text(text,encoding='utf-8')
p=r/'frontend/src/pages.json';d=json.loads(p.read_text(encoding='utf-8-sig'))
if not any(x['path']=='pages/panorama/index' for x in d['pages']):d['pages'].append({'path':'pages/panorama/index','style':{'navigationBarTitleText':'瞿秋白 · 360°全景'}})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
(r/'全景场景/瞿秋白/使用说明.md').write_text('''# 瞿秋白档案顶部全景

用户提供的原始2:1场景图作为球面全景纹理，加入360度环视交互。原图不是三维模型，不支持在房间内自由行走；人物、服饰、建筑、陈设等只作为艺术化示意，不作为已核历史依据。

网页：瞿秋白人物档案（P009）顶部，支持鼠标拖动、触摸拖动、滚轮/双指缩放、按钮缩放、复位、键盘方向键及全屏。全屏API不可用时尝试展开页面全屏，并保留退出入口。无WebGL或图片加载失败时提供原图与重试入口。

保留人物史料照片、IP切换与图注来源，通过左下角人物卡片打开；其他人物页面使用原来的封面。

渲染库为Three.js 0.170.0，MIT许可见Three许可.txt。大图和渲染库仅进入网页构建，不加入微信主包；微信端通过独立web-view页面访问线上全景，真机必须配置对应的HTTPS业务域名。

运行V1/tools/构建合并版本.py可同步构建双端。前端H5开发与构建都由vite配置提供全景资源。
''',encoding='utf-8')
print('已接入瞿秋白人物封面、H5全景资源及微信web-view入口。')
