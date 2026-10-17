const test = require('node:test');
const assert = require('node:assert/strict');
const { createManage } = require('../manage.js');
const { previewImport } = require('../import-check.js');

const levels = { levels: [
  { id: 'QQB-入门', person_name: '瞿秋白', group: 'QQB', reading_person_id: 'P009', difficulty: '入门', draw_count: 5, pool: ['QQB-001'], status: '待核验', published: false },
  { id: 'LYS-入门', person_name: '狼牙山五壮士', group: 'LYS', reading_person_id: null, difficulty: '入门', draw_count: 5, pool: ['LYS-001'], status: '待核验', published: false }
] };
const bank = [
  { 题目ID: 'QQB-001', 涉及人物: '瞿秋白', 题型: '判断题', 难度: '入门', 题干: '原题干', A: '', B: '', C: '', D: '', 正确答案: '正确', 解析: '原解析', 来源ID: 'QQB-S02', 证据位置: '第1段', 状态: '待核验' },
  { 题目ID: 'LYS-001', 涉及人物: '马宝玉', 题型: '判断题', 难度: '入门', 题干: '原题干', A: '', B: '', C: '', D: '', 正确答案: '正确', 解析: '原解析', 来源ID: 'LYS-S01', 证据位置: '第1段', 状态: '待核验' }
];
function manage() {
  return createManage({ persist: false, levels, questions: bank });
}
function input(extra = {}) {
  return { level_id: 'QQB-入门', 题目ID: 'QQB-001', 涉及人物: '瞿秋白', 题型: '判断题', 难度: '入门', 题干: '改后的题干', A: '', B: '', C: '', D: '', 正确答案: '正确', 解析: '改后的解析', 来源ID: 'QQB-S02', 证据位置: '第2段', 状态: '待核验', published: false, reading_fact_id: null, ...extra };
}

test('level list stays unpublished and does not reveal the draw pool', () => {
  const body = manage().listLevels();
  assert.equal(body.published, false);
  assert.equal(body.items[0].status, '待核验');
  assert.equal(Object.hasOwn(body.items[0], 'pool'), false);
});

test('preview keeps a question unverified and out of the live pool', () => {
  const result = manage().preview(input());
  assert.equal(result.status, 200);
  assert.equal(result.body.preview.状态, '待核验');
  assert.equal(result.body.preview.published, false);
  assert.equal(result.body.preview.reading_fact_id, null);
  assert.equal(result.body.note.includes('不进入闯关'), true);
});

test('verified status, fact links, foreign source ids and duplicate options are rejected', () => {
  const desk = manage();
  assert.equal(desk.preview(input({ 状态: '已核验' })).body.errors.some(error => error.includes('不能标成已核验')), true);
  assert.equal(desk.preview(input({ reading_fact_id: 'P009-F-001' })).body.errors.some(error => error.includes('必须写 null')), true);
  assert.equal(desk.preview(input({ 来源ID: 'L-S12' })).body.errors.some(error => error.includes('不能改成阅读库或地点编号')), true);
  assert.equal(desk.preview(input({ 题型: '单项选择题', 正确答案: 'A', A: '同一句', B: '同一句', C: '丙', D: '丁' })).body.errors.some(error => error.includes('不能重复')), true);
});

test('saving a draft does not change the audited question or its level pool', () => {
  const desk = manage();
  const first = desk.save(input());
  const second = desk.save(input({ 题干: '再改一版' }));
  assert.equal(first.body.published, false);
  assert.equal(first.body.version, 1);
  assert.equal(second.body.version, 2);
  assert.equal(bank[0].题干, '原题干');
  assert.deepEqual(levels.levels[0].pool, ['QQB-001']);
  const listed = desk.listQuestions('QQB-入门').body.items;
  assert.equal(listed[0].source, '草稿');
  assert.equal(listed.at(-1).source, '审核题库');
  assert.equal(listed.at(-1).题干, '原题干');
});

test('a new question id stays outside the live pool', () => {
  const desk = manage();
  const saved = desk.save(input({ 题目ID: 'QQB-099', 题干: '新题干' }));
  assert.equal(saved.status, 201);
  assert.equal(saved.body.published, false);
  assert.deepEqual(levels.levels[0].pool, ['QQB-001']);
  const listed = desk.listQuestions('QQB-入门').body.items;
  assert.equal(listed.some(item => item.题目ID === 'QQB-099' && item.source === '草稿'), true);
  assert.equal(bank.some(item => item.题目ID === 'QQB-099'), false);
});

test('deleting a draft leaves the audited question and later version numbers in place', () => {
  const desk = manage();
  const first = desk.save(input());
  const second = desk.save(input({ 题干: '第二版' }));
  const removed = desk.remove(first.body.draft_id);
  assert.equal(removed.status, 200);
  assert.equal(removed.body.published, false);
  assert.equal(removed.body.note.includes('审核题库没有改动'), true);
  const listed = desk.listQuestions('QQB-入门').body.items.filter(item => item.source === '草稿');
  assert.deepEqual(listed.map(item => item.version), [2]);
  assert.equal(listed[0].题干, '第二版');
  assert.equal(bank[0].题干, '原题干');
  assert.equal(desk.remove(first.body.draft_id).status, 404);
  const third = desk.save(input({ 题干: '第三版' }));
  assert.equal(third.body.version, 3);
  assert.equal(second.body.draft_id !== third.body.draft_id, true);
});

test('a group without a reading person id cannot be given one', () => {
  const result = manage().preview(input({ level_id: 'LYS-入门', 题目ID: 'LYS-001', 涉及人物: '马宝玉', 来源ID: 'LYS-S01', reading_person_id: 'P009' }));
  assert.equal(result.body.errors.some(error => error.includes('必须写 null')), true);
});

test('import preview separates conflicts from a passable empty check', () => {
  const context = { personNames: new Map([['P009', '瞿秋白']]), factIds: new Set(), sourceIds: new Set(), eventIds: new Set(), relationIds: new Set(), placeIds: new Set(), questionIds: new Set() };
  const conflict = previewImport({ people: [], facts: [], sources: [], events: [], relations: [], places: [], questions: [{ 题目ID: 'QQB-901', 涉及人物: '瞿秋白', 题型: '判断题', 难度: '入门', 题干: '示范', A: '', B: '', C: '', D: '', 正确答案: '正确', 解析: '示范', 来源ID: 'P009-S-001', 证据位置: '示范', 状态: '待核验', reading_person_id: 'P009', reading_fact_id: null }] }, context);
  assert.equal(conflict.ok, false);
  assert.equal(conflict.published, false);
  assert.equal(conflict.errors.some(error => error.kind === '冲突'), true);
});
