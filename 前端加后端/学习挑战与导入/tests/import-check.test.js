const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkImport, checkFile, loadContext } = require('../import-check.js');

const context = {
  personNames: new Map([['P009', '瞿秋白'], ['P004', '宋振中'], ['P014', '陆定一']]),
  factIds: new Set(),
  sourceIds: new Set(),
  eventIds: new Set(),
  relationIds: new Set(),
  placeIds: new Set(['PLACE-WX-LDY']),
  questionIds: new Set(['QQB-001'])
};

function blank(extra = {}) {
  return { people: [], facts: [], sources: [], events: [], relations: [], places: [], questions: [], ...extra };
}

function question(extra = {}) {
  return {
    题目ID: 'QQB-901', 涉及人物: '瞿秋白', 题型: '判断题', 难度: '入门', 题干: '示范题干',
    A: '', B: '', C: '', D: '', 正确答案: '正确', 解析: '示范解析', 来源ID: 'QQB-S99',
    证据位置: '示范位置', 状态: '待核验', reading_person_id: 'P009', reading_fact_id: null,
    ...extra
  };
}

test('empty template has nothing to import', () => {
  const result = checkImport(blank(), context);
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ['还没有可导入的条目。']);
});

test('example file is refused before it can be saved', () => {
  const result = checkFile(path.join(__dirname, '../import-template.example.json'), { persist: false, context });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0], '这是填写示例，不是可导入的数据。');
});

test('example body is valid once the example flag is removed', () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../import-template.example.json'), 'utf8'));
  delete data._example;
  const result = checkImport(data, context);
  assert.deepEqual(result.errors, []);
});

test('question source ids stay separate from reading and place ids', () => {
  for (const sourceId of ['P009-S-001', 'L-S12', 'SRC-QQB-XH2018', 'IP-LDY']) {
    const result = checkImport(blank({ questions: [question({ 来源ID: sourceId })] }), context);
    assert.equal(result.errors.some(error => error.includes('三套编号不能合并')), true, sourceId);
  }
});

test('a place cannot borrow a design-pack person id or a coordinate', () => {
  const result = checkImport(blank({
    places: [{ id: 'PLACE-DRAFT-1', name: '示范地点', personIds: ['IP-LDY'], coordinate: { lat: 1 }, opening: '9:00', reviewStatus: 'source_checked', published: true, sourceIds: ['L-S12'] }]
  }), context);
  assert.equal(result.errors.some(error => error.includes('不接受 IP-')), true);
  assert.equal(result.errors.some(error => error.includes('coordinate')), true);
  assert.equal(result.errors.some(error => error.includes('opening')), true);
  assert.equal(result.errors.some(error => error.includes('published')), true);
  assert.equal(result.errors.some(error => error.includes('sourceIds')), true);
});

test('disputed facts cannot be cited as a question answer and fact links stay empty', () => {
  const data = blank({
    sources: [{ id: 'P009-S-901', person_id: 'P009', title: '示范', original_url: 'https://example.com/a', final_url: 'https://example.com/a', boundary: '仅本句' }],
    facts: [{ id: 'P009-F-901', person_id: 'P009', source_id: 'P009-S-901', text: '示范', review_status: 'draft', publication_status: 'draft', boundary: '仅本句', unique_answer: '否' }],
    questions: [question({ reading_fact_id: 'P009-F-901' })]
  });
  const result = checkImport(data, context);
  assert.equal(result.errors.some(error => error.includes('必须写 null')), true);
  assert.equal(result.errors.some(error => error.includes('unique_answer 为否')), true);
});

test('people without a reading id keep a null link and cannot reuse a verified question', () => {
  const jiang = checkImport(blank({ questions: [question({ 题目ID: 'JZY-901', 涉及人物: '江竹筠', 来源ID: 'JZY-S01', reading_person_id: null })] }), context);
  assert.deepEqual(jiang.errors, []);
  const mismatch = checkImport(blank({ questions: [question({ 涉及人物: '江竹筠', reading_person_id: 'P009' })] }), context);
  assert.equal(mismatch.errors.some(error => error.includes('不一致')), true);
  const duplicate = checkImport(blank({ questions: [question({ 题目ID: 'QQB-001' })] }), context);
  assert.equal(duplicate.errors.some(error => error.includes('不要重复导入')), true);
  const group = checkImport(blank({ people: [{ id: 'P016', name: '狼牙山五壮士', kind: 'person', review_status: 'draft', publication_status: 'draft', member_ids: [] }] }), context);
  assert.equal(group.errors.some(error => error.includes('群体不写入人物表')), true);
});

test('published statuses and an existing place id are rejected', () => {
  const person = checkImport(blank({ people: [{ id: 'P009', name: '瞿秋白', kind: 'person', review_status: 'verified_identity', publication_status: 'demo_published' }] }), context);
  assert.equal(person.ok, false);
  const place = checkImport(blank({ places: [{ id: 'PLACE-WX-LDY', name: '陆定一祖居陈列馆', personIds: [], coordinate: null, opening: null, reviewStatus: 'draft', published: false, sourceIds: [] }] }), context);
  assert.equal(place.errors.some(error => error.includes('不能通过导入覆盖')), true);
});

test('a passing file is copied as an unpublished draft and the submission stays unchanged', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yingji-import-'));
  const source = path.join(dir, 'submission.json');
  const original = `${JSON.stringify(blank({ questions: [question({ 题目ID: 'JZY-901', 涉及人物: '江竹筠', 来源ID: 'JZY-S01', reading_person_id: null })] }), null, 2)}\n`;
  fs.writeFileSync(source, original);
  const result = checkFile(source, { context, draftsDir: path.join(dir, 'drafts'), now: new Date('2026-10-12T08:00:00Z') });
  assert.equal(result.ok, true);
  assert.equal(fs.readFileSync(source, 'utf8'), original);
  const saved = JSON.parse(fs.readFileSync(result.saved, 'utf8'));
  assert.equal(saved.status, '草稿');
  assert.equal(saved.question_status, '待核验');
  assert.equal(saved.published, false);
  assert.equal(saved.submission.questions[0].题目ID, 'JZY-901');
});

test('real library ids are not treated as new drafts', () => {
  const library = loadContext();
  const person = checkImport(blank({ people: [{ id: 'P009', name: '瞿秋白', kind: 'person', review_status: 'draft', publication_status: 'draft', member_ids: [] }] }), library);
  const questionResult = checkImport(blank({ questions: [question({ 题目ID: 'QQB-001' })] }), library);
  assert.equal(person.errors.some(error => error.includes('已在阅读库')), true);
  assert.equal(questionResult.errors.some(error => error.includes('已在审核题库')), true);
  assert.equal(library.personNames.get('P004'), '宋振中');
  assert.equal([...library.personNames.values()].includes('江竹筠'), false);
  assert.equal([...library.personNames.values()].includes('狼牙山五壮士'), false);
});
