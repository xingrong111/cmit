from pathlib import Path
import json
r=Path(__file__).resolve().parents[1];s=r/'frontend/src';data=s/'data'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
summary=read(data/'人物统计摘要.json');people=read(data/'合并人物目录.json')
p=s/'pages/statistics/index.vue';t=p.read_text(encoding='utf-8').replace('const sections=[','const sections=[').replace("text:'全国原始375条，合并5组重复候选后370人；再与15份详细档案、5组IP涉及的9名自然人合并。重合人物只计一次，狼牙山五壮士计5人，不额外增加一个团体。当前合计390人，分省170人、地区待核220人。不是全国历史总人数或审核通过人数。'","text:`全国原始${summary.nationalRaw}条，合并重复候选后${summary.nationalUnique}人；再与${summary.dossiers}份详细档案、${summary.ipGroups}组IP涉及的${summary.ipPeople}名自然人合并。重合人物只计一次，狼牙山五壮士计5人。当前合计${summary.total}人，分省${summary.assigned}人、地区待核${summary.unassigned}人。不是全国历史总人数或审核通过人数。`")
p.write_text(t,encoding='utf-8')
p=s/'pages/province/index.vue';t=p.read_text(encoding='utf-8').replace('<view class="filter-panel">','<view v-if="code===\'320000\'" class="fact-card"><text class="section-title">江苏名单如何计算</text><text class="reading-body">全国原名单5人，详细档案新增11人，IP中的江苏人物已包含在详细档案中，共16人，不重复计数。</text><text class="small">15份详细档案中，本页归属12人。周恩来按所记祖籍归浙江，江苏淮安为出生关联；宋振中出生地有不同记载，不由父母籍贯推导本人；钱振标已有江阴出生依据，明确籍贯来源本轮未取得可核正文，暂不并入籍贯统计。后两人仍计入全国总目录。</text></view><view class="filter-panel">',1)
t=t.replace("<text class=\"small\">籍贯：{{p.originText||'待补充'}}</text>","<text class=\"small\">籍贯／地域原文：{{p.originText||'待补充'}}</text><text v-if=\"p.regionEvidence\" class=\"small\">地域依据：{{p.regionEvidence.title}}</text>")
p.write_text(t,encoding='utf-8')
p=s/'pages/registry/index.vue';t=p.read_text(encoding='utf-8').replace("const u=person.value?.sourceEvidence?.url", "const u=person.value?.regionEvidence?.url||person.value?.sourceEvidence?.url")
t=t.replace('<text class="reading-body">{{person.contribution', '<text v-if="person.regionEvidence" class="small">地域摘录：{{person.regionEvidence.excerpt}} · {{person.regionEvidence.location}}</text><text class="reading-body">{{person.contribution')
p.write_text(t,encoding='utf-8')
for name in ['检查合并统计.py','检查合并交付.py','复测合并统计页面.py']:
 p=r/'tools'/name;t=p.read_text(encoding='utf-8').replace('==170','==178').replace('===220','===212').replace('===9\")\njs(', '===16\")\njs(').replace('待核220人','待核212人');p.write_text(t,encoding='utf-8')
p=r/'tools/复测合并统计页面.py';t=p.read_text(encoding='utf-8').replace("nav('province/index?code=320000');wait(\"document.querySelectorAll('.registry-card').length===9\")", "nav('province/index?code=320000');wait(\"document.querySelectorAll('.registry-card').length===16\")")
p.write_text(t,encoding='utf-8')
out=r/'docs/合并人物统计/江苏归属修复说明.md';js=[x for x in people if x['provinceCode']=='320000']
out.write_text('# 江苏省份归属修复\n\n上一轮只验证合计，没有逐人检验新增档案的省份映射，导致漏计。江苏由9条修正为16条，新增史砚芬、张太雷、秦邦宪、许晓轩、郭纲琳、陆定一、顾正红。本轮打开地域来源正文，并保存短摘录、原链接和位置。日期与其他生平争议不因此关闭。\n\n|姓名|来源类别|地域原文|补证链接|\n|---|---|---|---|\n'+'\n'.join('|'+p['name']+'|'+'、'.join(p['memberships'])+'|'+p['originText']+'|'+p.get('regionEvidence',{}).get('url',p.get('detailUrl',''))+'|' for p in js)+'\n\n未强行归江苏的详细人物：周恩来（浙江祖籍，江苏出生，字段分开）；宋振中（出生地有分歧、不能继承父母籍贯）；钱振标（江阴出生直接依据已存，籍贯线索纪念馆网页本轮未取得正文，仍待补证）。后两人仍计全国总目录。\n\n总数390不变；已归属178，地区待核212。原始名录收录状态、时间条件及独立审核仍未被本次软件修复批准。',encoding='utf-8')
print('江苏16人：'+ '、'.join(x['name'] for x in js))
