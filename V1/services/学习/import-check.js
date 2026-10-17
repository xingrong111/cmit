const fs = require('fs');
const path = require('path');

const ARRAYS = ['people', 'facts', 'sources', 'events', 'relations', 'places', 'questions'];
const ROOT = __dirname;
const CONTENT_PATH = path.resolve(ROOT, '../reading/data/content.json');
const PLACES_PATH = path.resolve(ROOT, '../guide/server/data/content.json');
const BANK_PATH = path.join(ROOT, '题库.json');
const UNIQUE_ANSWERS = new Set(['否', '是，限来源明确支持的问法']);

function loadContext() {
  const content = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
  const places = JSON.parse(fs.readFileSync(PLACES_PATH, 'utf8'));
  const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));
  return {
    personNames: new Map(content.people.map(person => [person.id, person.name])),
    factIds: new Set(content.facts.map(fact => fact.id)),
    sourceIds: new Set(content.sources.map(source => source.id)),
    eventIds: new Set(content.events.map(event => event.id)),
    relationIds: new Set(content.relations.map(relation => relation.id)),
    placeIds: new Set(places.places.map(place => place.id)),
    questionIds: new Set(bank.questions.map(question => question.题目ID))
  };
}

function systemOf(id) {
  const value = String(id ?? '');
  if (/^P\d{3}$/.test(value)) return 'reading-person';
  if (/^P\d{3}-S-\d{3}$/.test(value)) return 'reading-source';
  if (/^P\d{3}-F-\d{3}$/.test(value)) return 'reading-fact';
  if (/^P\d{3}-R-\d{3}$/.test(value)) return 'reading-relation';
  if (/^EV-P\d{3}-F-\d{3}$/.test(value)) return 'reading-event';
  if (/^[A-Z]{2,8}-S\d{2}$/.test(value)) return 'question-source';
  if (/^[A-Z]{2,8}-\d{3}$/.test(value)) return 'question';
  if (/^L-S\d+$/.test(value) || /^SRC-/.test(value)) return 'place-source';
  if (/^FACT-/.test(value)) return 'place-fact';
  if (/^PLACE-/.test(value)) return 'place';
  if (/^IP-/.test(value)) return 'design-person';
  if (/^F\d+$/.test(value)) return 'design-fact';
  return 'unknown';
}

function finish(errors) {
  return { ok: errors.length === 0, errors };
}

function checkImport(data, context = { personNames: new Map(), factIds: new Set(), sourceIds: new Set(), eventIds: new Set(), relationIds: new Set(), placeIds: new Set(), questionIds: new Set() }) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return finish(['请使用导入模板：顶层是一个对象，里面有七个数组。']);
  if (data._example === true) return finish(['这是填写示例，不是可导入的数据。']);
  const unknown = Object.keys(data).filter(key => key !== '_example' && !ARRAYS.includes(key));
  if (unknown.length) errors.push(`不能识别的字段：${unknown.join('、')}。请使用导入模板，不要直接提交阅读库或现有题库。`);
  const missing = ARRAYS.filter(key => !Array.isArray(data[key]));
  if (missing.length) {
    errors.push(`缺少 ${missing.join('、')}。请从 import-template.json 填写，不要直接导入 content.json 或五组题库。`);
    return finish(errors);
  }
  if (ARRAYS.every(key => data[key].length === 0)) return finish(['还没有可导入的条目。']);

  const people = new Map();
  const sourceIds = new Set();
  const factIds = new Set();
  const factAnswers = new Map();

  data.people.forEach((person, index) => checkPerson(person, index, errors, context, people));
  data.sources.forEach((source, index) => checkSource(source, index, errors, context, people, sourceIds));
  data.facts.forEach((fact, index) => checkFact(fact, index, errors, context, people, sourceIds, factIds, factAnswers));
  data.events.forEach((event, index) => checkEvent(event, index, errors, context, people, sourceIds, factIds));
  data.relations.forEach((relation, index) => checkRelation(relation, index, errors, context, people, sourceIds, factIds));
  data.places.forEach((place, index) => checkPlace(place, index, errors, context, people));
  data.questions.forEach((question, index) => checkQuestion(question, index, errors, context, people, factAnswers));
  return finish(errors);
}

function checkPerson(person, index, errors, context, people) {
  const at = `people[${index}]`;
  if (!person || typeof person !== 'object') return errors.push(`${at}：需要一条人物记录。`);
  if (person.name === '狼牙山五壮士') errors.push(`${at}：群体不写入人物表。`);
  if (person.kind !== 'person') errors.push(`${at}：kind 只能是 person。`);
  if (!/^P\d{3}$/.test(person.id || '')) errors.push(`${at}.id：人物编号要写成 P 加三位数字。`);
  else if (context.personNames.has(person.id)) errors.push(`${at}.id：${person.id} 已在阅读库中，不能通过导入覆盖。`);
  else if (people.has(person.id)) errors.push(`${at}.id：编号重复。`);
  else if (person.name) people.set(person.id, person.name);
  if (!String(person.name || '').trim()) errors.push(`${at}.name：缺少姓名。`);
  if (person.review_status !== 'draft') errors.push(`${at}.review_status：新导入只能是 draft。`);
  if (person.publication_status !== 'draft') errors.push(`${at}.publication_status：新导入只能是 draft，不能写成已发布。`);
  if (Array.isArray(person.member_ids) && person.member_ids.length) errors.push(`${at}.member_ids：人物不填写成员编号。`);
}

function knownPerson(id, context, people) {
  return context.personNames.has(id) || people.has(id);
}

function personName(id, context, people) {
  return people.get(id) || context.personNames.get(id);
}

function checkSource(source, index, errors, context, people, sourceIds) {
  const at = `sources[${index}]`;
  if (!source || typeof source !== 'object') return errors.push(`${at}：需要一条阅读库来源。`);
  const system = systemOf(source.id);
  if (system !== 'reading-source') errors.push(`${at}.id：阅读库来源要写成 P009-S-001 这种编号。题库的 QQB-S02、地点的 L-S12 和 SRC- 不能写进这里。`);
  else if (context.sourceIds.has(source.id)) errors.push(`${at}.id：${source.id} 已在阅读库中，不能通过导入覆盖。`);
  else if (sourceIds.has(source.id)) errors.push(`${at}.id：编号重复。`);
  else sourceIds.add(source.id);
  if (!knownPerson(source.person_id, context, people)) errors.push(`${at}.person_id：人物编号不在本次导入，也不在阅读库。`);
  if (!String(source.title || '').trim()) errors.push(`${at}.title：缺少标题。`);
  if (!/^https?:\/\//.test(source.original_url || '')) errors.push(`${at}.original_url：需要原始网址。`);
  if (!/^https?:\/\//.test(source.final_url || '')) errors.push(`${at}.final_url：需要最终网址。`);
  if (!String(source.boundary || '').trim()) errors.push(`${at}.boundary：需要写明这条来源支持到哪里为止。`);
}

function checkFact(fact, index, errors, context, people, sourceIds, factIds, factAnswers) {
  const at = `facts[${index}]`;
  if (!fact || typeof fact !== 'object') return errors.push(`${at}：需要一条事实。`);
  if (systemOf(fact.id) !== 'reading-fact') errors.push(`${at}.id：事实编号要写成 P009-F-001。不能使用 FACT-、F001 或题目编号。`);
  else if (context.factIds.has(fact.id)) errors.push(`${at}.id：${fact.id} 已在阅读库中，不能通过导入覆盖。`);
  else if (factIds.has(fact.id)) errors.push(`${at}.id：编号重复。`);
  else factIds.add(fact.id);
  factAnswers.set(fact.id, fact.unique_answer);
  if (!knownPerson(fact.person_id, context, people)) errors.push(`${at}.person_id：人物编号不在本次导入，也不在阅读库。`);
  if (!sourceIds.has(fact.source_id)) errors.push(`${at}.source_id：来源必须写在本次导入的 sources 里，不能只引用阅读库、题库或地点资料里的旧编号。`);
  if (!String(fact.text || '').trim()) errors.push(`${at}.text：缺少事实原文。`);
  if (!String(fact.boundary || '').trim()) errors.push(`${at}.boundary：需要写明这条事实的使用界限。`);
  if (fact.review_status !== 'draft') errors.push(`${at}.review_status：新导入只能是 draft。`);
  if (fact.publication_status !== 'draft') errors.push(`${at}.publication_status：新导入只能是 draft，不能写成已发布。`);
  if (!UNIQUE_ANSWERS.has(fact.unique_answer)) errors.push(`${at}.unique_answer：只能写「否」或「是，限来源明确支持的问法」。`);
}

function checkEvent(event, index, errors, context, people, sourceIds, factIds) {
  const at = `events[${index}]`;
  if (!event || typeof event !== 'object') return errors.push(`${at}：需要一条事件。`);
  if (systemOf(event.id) !== 'reading-event') errors.push(`${at}.id：事件编号要写成 EV-P009-F-001。`);
  else if (context.eventIds.has(event.id)) errors.push(`${at}.id：${event.id} 已在阅读库中，不能通过导入覆盖。`);
  if (!knownPerson(event.person_id, context, people)) errors.push(`${at}.person_id：人物编号不在本次导入，也不在阅读库。`);
  if (!String(event.title || '').trim()) errors.push(`${at}.title：缺少标题。`);
  if (!Array.isArray(event.fact_ids) || event.fact_ids.length === 0) errors.push(`${at}.fact_ids：至少要有一条本次导入的事实编号。`);
  else event.fact_ids.forEach(id => { if (!factIds.has(id)) errors.push(`${at}.fact_ids：${id} 不在本次导入的 facts 里，不能自动并入已有事实。`); });
  if (!Array.isArray(event.source_ids) || event.source_ids.length === 0) errors.push(`${at}.source_ids：至少要有一条本次导入的来源编号。`);
  else event.source_ids.forEach(id => { if (!sourceIds.has(id)) errors.push(`${at}.source_ids：${id} 不在本次导入的 sources 里。`); });
  if (event.review_status !== 'draft') errors.push(`${at}.review_status：新导入只能是 draft。`);
  if (event.publication_status !== 'draft') errors.push(`${at}.publication_status：新导入只能是 draft，不能写成已发布。`);
}

function checkRelation(relation, index, errors, context, people, sourceIds, factIds) {
  const at = `relations[${index}]`;
  if (!relation || typeof relation !== 'object') return errors.push(`${at}：需要一条关系。`);
  if (systemOf(relation.id) !== 'reading-relation') errors.push(`${at}.id：关系编号要写成 P009-R-001。`);
  else if (context.relationIds.has(relation.id)) errors.push(`${at}.id：${relation.id} 已在阅读库中，不能通过导入覆盖。`);
  if (!knownPerson(relation.from_id, context, people)) errors.push(`${at}.from_id：人物编号不在本次导入，也不在阅读库。`);
  if (relation.to_id != null && systemOf(relation.to_id) === 'design-person') errors.push(`${at}.to_id：不能使用 IP- 这种设计包人物编号。`);
  if (!factIds.has(relation.fact_id)) errors.push(`${at}.fact_id：事实必须来自本次导入，不能自动并入阅读库已有编号。`);
  if (!sourceIds.has(relation.source_id)) errors.push(`${at}.source_id：来源必须来自本次导入。`);
  if (!String(relation.boundary || '').trim()) errors.push(`${at}.boundary：需要写明这条关系的使用界限。`);
  if (relation.review_status !== 'draft') errors.push(`${at}.review_status：新导入只能是 draft。`);
  if (relation.publication_status !== 'draft') errors.push(`${at}.publication_status：新导入只能是 draft，不能写成已发布。`);
}

function checkPlace(place, index, errors, context, people) {
  const at = `places[${index}]`;
  if (!place || typeof place !== 'object') return errors.push(`${at}：需要一条地点。`);
  if (systemOf(place.id) !== 'place') errors.push(`${at}.id：地点编号要写成 PLACE- 开头。不能使用 IP- 或阅读库人物编号。`);
  else if (context.placeIds.has(place.id)) errors.push(`${at}.id：${place.id} 已在地点资料中，不能通过导入覆盖。`);
  if (!String(place.name || '').trim()) errors.push(`${at}.name：缺少地点名称。`);
  if (!Array.isArray(place.personIds)) errors.push(`${at}.personIds：需要数组。没有阅读库人物时写空数组。`);
  else place.personIds.forEach(id => {
    if (systemOf(id) !== 'reading-person') errors.push(`${at}.personIds：${id} 不能使用。地点只接受阅读库的 P 编号，不接受 IP-、L-S 或设计包编号。`);
    else if (!knownPerson(id, context, people)) errors.push(`${at}.personIds：${id} 不在本次导入，也不在阅读库。`);
  });
  if (!Object.hasOwn(place, 'coordinate') || place.coordinate !== null) errors.push(`${at}.coordinate：必须写 null。导入不记录导航坐标。`);
  if (!Object.hasOwn(place, 'opening') || place.opening !== null) errors.push(`${at}.opening：必须写 null。导入不记录开放时间。`);
  if (place.reviewStatus !== 'draft') errors.push(`${at}.reviewStatus：新导入只能是 draft。`);
  if (place.published !== false) errors.push(`${at}.published：必须是 false，不能写成已发布。`);
  if (place.sourceIds != null && (!Array.isArray(place.sourceIds) || place.sourceIds.length > 0)) errors.push(`${at}.sourceIds：地点来源不能在导入时自动合并，请留空数组。`);
}

function checkQuestion(question, index, errors, context, people, factAnswers) {
  const at = `questions[${index}]`;
  if (!question || typeof question !== 'object') return errors.push(`${at}：需要一道题。`);
  if (systemOf(question.题目ID) !== 'question') errors.push(`${at}.题目ID：要写成 QQB-001 这种编号，不能使用人物、事实或地点编号。`);
  else if (context.questionIds.has(question.题目ID)) errors.push(`${at}.题目ID：${question.题目ID} 已在审核题库中，不要重复导入。`);
  if (!String(question.涉及人物 || '').trim()) errors.push(`${at}.涉及人物：缺少人物或群体名称。`);
  if (!['判断题', '单项选择题'].includes(question.题型)) errors.push(`${at}.题型：只能是判断题或单项选择题。`);
  if (!['入门', '进阶'].includes(question.难度)) errors.push(`${at}.难度：只能是入门或进阶。`);
  if (!String(question.题干 || '').trim()) errors.push(`${at}.题干：缺少题干。`);
  if (!String(question.解析 || '').trim()) errors.push(`${at}.解析：缺少解析。`);
  if (!String(question.证据位置 || '').trim()) errors.push(`${at}.证据位置：缺少证据位置。`);
  if (question.状态 !== '待核验') errors.push(`${at}.状态：只能是待核验，不能写成已核验或已发布。`);
  if (systemOf(question.来源ID) !== 'question-source') errors.push(`${at}.来源ID：题库来源要写成 QQB-S02 这种编号。不能改成 P009-S-001、L-S12、SRC- 或 IP-。这三套编号不能合并。`);
  if (question.题型 === '判断题') {
    if (!['正确', '错误'].includes(question.正确答案)) errors.push(`${at}.正确答案：判断题只能是正确或错误。`);
    ['A', 'B', 'C', 'D'].forEach(key => { if (question[key]) errors.push(`${at}.${key}：判断题的选项留空。`); });
  }
  if (question.题型 === '单项选择题') {
    if (!['A', 'B', 'C', 'D'].includes(question.正确答案)) errors.push(`${at}.正确答案：单项选择题只能是 A、B、C、D。`);
    ['A', 'B', 'C', 'D'].forEach(key => { if (!String(question[key] || '').trim()) errors.push(`${at}.${key}：单项选择题四个选项都要填写。`); });
  }
  if (question.reading_person_id != null) {
    if (!knownPerson(question.reading_person_id, context, people)) errors.push(`${at}.reading_person_id：阅读库没有这个人物编号。江竹筠和狼牙山五壮士没有人物编号时写 null。`);
    else if (personName(question.reading_person_id, context, people) !== question.涉及人物) errors.push(`${at}.reading_person_id：编号对应的姓名和涉及人物不一致，不能自动对应。`);
  }
  if (question.reading_fact_id != null) {
    errors.push(`${at}.reading_fact_id：成员2确认前必须写 null。`);
    const answer = factAnswers.get(question.reading_fact_id);
    if (answer === '否' || String(answer || '').startsWith('否')) errors.push(`${at}.reading_fact_id：这条事实的 unique_answer 为否，不能当作题目的唯一依据。`);
  }
}

function checkFile(filePath, options = {}) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    const missing = error && error.code === 'ENOENT';
    return finish([missing ? '找不到导入文件。' : '文件不是有效的 JSON。']);
  }
  const checked = checkImport(data, options.context || loadContext());
  if (!checked.ok || options.persist === false) return checked;
  const saved = saveDraft(filePath, data, options);
  return { ...checked, saved };
}

function saveDraft(filePath, data, options) {
  const dir = options.draftsDir || path.join(ROOT, 'data', 'import-drafts');
  fs.mkdirSync(dir, { recursive: true });
  const date = options.now || new Date();
  const pad = value => String(value).padStart(2, '0');
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  const target = path.join(dir, `draft-${stamp}.json`);
  const draft = {
    status: '草稿',
    question_status: '待核验',
    published: false,
    source_file: path.basename(filePath),
    saved_at: date.toISOString(),
    note: '只保存草稿，不发布，不把题目标成已核验。',
    submission: data
  };
  fs.writeFileSync(target, `${JSON.stringify(draft, null, 2)}\n`);
  return target;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.log('用法：node import-check.js <导入文件.json>');
    process.exit(2);
  }
  const result = checkFile(path.resolve(file));
  if (!result.ok) {
    result.errors.forEach(error => console.log(error));
    process.exit(1);
  }
  console.log(`已另存草稿：${result.saved}`);
  console.log('状态是草稿、待核验，没有发布。原文件没有改动。');
}

function classifyImportError(message) {
  if (/重复|已在阅读库|已在审核题库|已在地点资料|不要重复导入|不能通过导入覆盖/.test(message)) return '重复';
  if (/不能合并|不能自动|不一致|unique_answer 为否|不接受|不能使用/.test(message)) return '冲突';
  return '格式错误';
}

function previewImport(data, context) {
  const checked = checkImport(data, context || loadContext());
  const counts = {};
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const key of ARRAYS) counts[key] = Array.isArray(data[key]) ? data[key].length : null;
  }
  return {
    ok: checked.ok,
    published: false,
    question_status: '待核验',
    counts,
    errors: checked.errors.map(message => ({ kind: classifyImportError(message), message }))
  };
}

module.exports = { checkImport, checkFile, loadContext, previewImport, saveDraft, systemOf, ARRAYS };
