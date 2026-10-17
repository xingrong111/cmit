const test = require('node:test');
const assert = require('node:assert/strict');
const { createLearning } = require('../learn.js');
const question = (id, answer, difficulty) => ({ 题目ID: id, 题型: '判断题', 难度: difficulty, 题干: `题干${id}`, 正确答案: answer, 解析: `解析${id}`, 来源ID: 'SRC-1', 证据位置: '第1段', A: '', B: '', C: '', D: '' });
const level = (id, group, name, difficulty, pool) => ({ id, person_name: name, group, reading_person_id: null, difficulty, draw_count: 1, pool, status: '待核验', published: false });
const honors = {
  note: '测试',
  groups: [
    { id: 'QQB', person_name: '瞿秋白', reading_person_id: 'P009', beginner_level_id: 'QQB-入门', advanced_level_id: 'QQB-进阶' },
    { id: 'LYS', person_name: '狼牙山五壮士', reading_person_id: null, beginner_level_id: 'LYS-入门', advanced_level_id: 'LYS-进阶' }
  ],
  titles: [
    { id: 'H-GROUP-BEGINNER', name: '星火初学者', scope: 'group', condition: '答完本组入门关', requires: 'beginner_level_id' },
    { id: 'H-GROUP-ADVANCED', name: '追光探寻者', scope: 'group', condition: '答完本组进阶关', requires: 'advanced_level_id', counts_as_completed_group: false },
    { id: 'H-CROSS-2', name: '红色寻迹者', scope: 'cross_group', condition: '任意2组都答完', completed_groups: 2 }
  ]
};
const learning = createLearning({
  persist: false,
  nextInt: bound => bound - 1,
  questions: [question('QQB-001', '正确', '入门'), question('QQB-016', '错误', '进阶'), question('LYS-001', '正确', '入门'), question('LYS-016', '错误', '进阶')],
  levels: { rule: '测试', levels: [level('QQB-入门', 'QQB', '瞿秋白', '入门', ['QQB-001']), level('QQB-进阶', 'QQB', '瞿秋白', '进阶', ['QQB-016']), level('LYS-入门', 'LYS', '狼牙山五壮士', '入门', ['LYS-001']), level('LYS-进阶', 'LYS', '狼牙山五壮士', '进阶', ['LYS-016'])] },
  honors
});

async function finish(levelId, learner, choice) {
  const started = await learning.start(levelId, learner);
  assert.equal(started.status, 201);
  assert.equal(JSON.stringify(started.body).includes('correct_answer'), false);
  const answered = await learning.answer(started.body.id, choice, started.body.questions[0].id);
  assert.equal(answered.status, 200);
  return answered.body;
}

test('beginner and advanced draws stay in their own pools', async () => {
  const real = createLearning({ persist: false, nextInt: () => 0 });
  const beginner = await real.start('QQB-入门', 'learner-real');
  assert.equal(beginner.body.total, 5);
  assert.ok(beginner.body.questions.every(item => /^QQB-0(0[1-9]|1[0-5])$/.test(item.id)));
  for (const question of beginner.body.questions) {
    const step = await real.answer(beginner.body.id, question.options[0].key, question.id);
    assert.equal(step.status, 200);
  }
  const advanced = await real.start('QQB-进阶', 'learner-real');
  assert.equal(advanced.status, 201);
  assert.equal(advanced.body.total, 8);
  assert.ok(advanced.body.questions.every(item => /^QQB-0(1[6-9]|2\d|30)$/.test(item.id)));
});

test('advanced level opens only after the beginner level is finished', async () => {
  const blocked = await learning.start('QQB-进阶', 'learner-b1');
  assert.equal(blocked.status, 409);
  const beginner = await finish('QQB-入门', 'learner-b1', '正确');
  assert.deepEqual(beginner.titles_earned.map(title => title.name), ['星火初学者']);
  assert.equal(learning.titles('learner-b1').completed_groups, 0);
  const advanced = await finish('QQB-进阶', 'learner-b1', '错误');
  assert.equal(advanced.titles_earned.some(title => title.name === '追光探寻者'), true);
  assert.equal(learning.titles('learner-b1').completed_groups, 1);
});

test('finishing a beginner level offers the same group advanced level', async () => {
  const result = await finish('QQB-入门', 'learner-next', '正确');
  assert.equal(result.next_level.id, 'QQB-进阶');
  assert.equal(result.next_level.person_name, '瞿秋白');
  assert.equal(result.feedback.source_url, undefined);
  assert.deepEqual(result.score, { correct: 1, wrong: 0, total: 1, accuracy: 100 });
});

test('guest level list hides knowledge point ids and source urls stay hidden until submit', async () => {
  const real = createLearning({ persist: false, nextInt: () => 0 });
  const hall = real.levels('learner-points');
  const beginner = hall.items.find(item => item.id === 'QQB-入门');
  assert.equal(beginner.knowledge_points, undefined);
  assert.equal(JSON.stringify(hall).includes('QQB-K-身份'), false);
  assert.equal(JSON.stringify(beginner).includes('正确答案'), false);
  const started = await real.start('QQB-入门', 'learner-points');
  assert.equal(JSON.stringify(started.body).includes('source_url'), false);
  const answered = await real.answer(started.body.id, '正确', started.body.questions[0].id);
  if (answered.body.feedback.source_url) assert.match(answered.body.feedback.source_url, /^https?:\/\//);
});

test('two fully finished groups grant the cross-group title once', async () => {
  await finish('QQB-入门', 'learner-c1', '正确');
  await finish('QQB-进阶', 'learner-c1', '错误');
  const before = await finish('LYS-入门', 'learner-c1', '正确');
  assert.equal(before.titles_earned.some(title => title.name === '红色寻迹者'), false);
  const after = await finish('LYS-进阶', 'learner-c1', '错误');
  assert.equal(after.titles_earned.some(title => title.name === '红色寻迹者'), true);
  const repeat = await finish('LYS-进阶', 'learner-c1', '错误');
  assert.equal(repeat.titles_earned.some(title => title.name === '追光探寻者'), false);
});
