const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const questionBankPath = path.join(root, '题库.json');
const learnerIdPattern = /^[A-Za-z0-9_-]{8,80}$/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function sample(pool, count, nextInt) {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = nextInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function optionsOf(question) {
  if (question.题型 === '判断题') return [{ key: '正确', text: '正确' }, { key: '错误', text: '错误' }];
  return ['A', 'B', 'C', 'D'].filter(key => String(question[key] || '').trim()).map(key => ({ key, text: question[key] }));
}

function publicQuestion(question) {
  return { id: question.题目ID, type: question.题型, stem: question.题干, options: optionsOf(question), status: '待核验' };
}

function feedbackOf(question, choice, sourceUrl) {
  const feedback = {
    question_id: question.题目ID,
    choice,
    correct: choice === question.正确答案,
    correct_answer: question.正确答案,
    explanation: question.解析,
    source_id: question.来源ID,
    evidence: question.证据位置,
    status: '待核验'
  };
  if (typeof sourceUrl === 'string' && /^https?:\/\//.test(sourceUrl)) feedback.source_url = sourceUrl;
  return feedback;
}

function createLearning(options = {}) {
  const levels = options.levels || readJson(path.join(root, 'levels.json'));
  const honors = options.honors || readJson(path.join(root, 'honors.json'));
  const bankFile = options.questions ? null : readJson(questionBankPath);
  const questions = options.questions || bankFile.questions;
  const sources = options.sources || (bankFile ? bankFile.sources : []);
  const storePath = options.storePath || process.env.LEARNING_PROGRESS_PATH || path.join(root, 'data', 'progress.json');
  const nextInt = options.nextInt || (bound => crypto.randomInt(bound));
  const persistEnabled = options.persist !== false;
  const byId = new Map(questions.map(question => [question.题目ID, question]));
  const sourceUrl = new Map((sources || []).filter(source => source && /^https?:\/\//.test(source.原始URL || '')).map(source => [source.来源ID, source.原始URL]));
  const urlOf = question => sourceUrl.get(question?.来源ID);
  const levelById = new Map(levels.levels.map(level => [level.id, level]));
  for (const level of levels.levels) {
    if (level.pool.length < level.draw_count) throw new Error(`${level.id} 题池少于抽取数量`);
    for (const id of level.pool) {
      const question = byId.get(id);
      if (!question) throw new Error(`${level.id} 缺少题目 ${id}`);
      if (question.难度 !== level.difficulty) throw new Error(`${id} 的难度与关卡不一致`);
    }
  }
  const emptyStore = () => ({ learners: {}, attempts: {} });
  let store = emptyStore();
  if (persistEnabled && fs.existsSync(storePath)) store = readJson(storePath);
  let writing = Promise.resolve();
  const persist = () => {
    if (!persistEnabled) return Promise.resolve();
    writing = writing.then(() => {
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      const temp = `${storePath}.${process.pid}.tmp`;
      fs.writeFileSync(temp, `${JSON.stringify(store)}\n`);
      fs.renameSync(temp, storePath);
    });
    return writing;
  };
  const learnerOf = id => {
    if (!store.learners[id]) store.learners[id] = { completions: [], titles: [] };
    return store.learners[id];
  };
  const completedLevels = learner => new Set(learner.completions.map(item => item.level_id));
  const grantKey = title => `${title.title_id}:${title.group_id || ''}`;
  const desiredTitles = learner => {
    const done = completedLevels(learner);
    const grants = [];
    const beginner = honors.titles.find(title => title.requires === 'beginner_level_id');
    const advanced = honors.titles.find(title => title.requires === 'advanced_level_id');
    for (const group of honors.groups) {
      if (beginner && done.has(group.beginner_level_id)) grants.push({ title_id: beginner.id, group_id: group.id, name: beginner.name });
      if (advanced && done.has(group.advanced_level_id)) grants.push({ title_id: advanced.id, group_id: group.id, name: advanced.name });
    }
    const completedGroups = honors.groups.filter(group => done.has(group.beginner_level_id) && done.has(group.advanced_level_id)).length;
    for (const title of honors.titles.filter(item => item.scope === 'cross_group')) {
      if (completedGroups >= title.completed_groups) grants.push({ title_id: title.id, group_id: null, name: title.name });
    }
    return { grants, completedGroups };
  };
  const syncTitles = learner => {
    const { grants } = desiredTitles(learner);
    const owned = new Set(learner.titles.map(grantKey));
    const earned = [];
    for (const title of grants) {
      if (owned.has(grantKey(title))) continue;
      const row = { ...title, earned_at: new Date().toISOString() };
      learner.titles.push(row);
      earned.push(row);
    }
    return earned;
  };
  const titleView = learnerIdValue => {
    const learner = learnerIdValue && store.learners[learnerIdValue] ? store.learners[learnerIdValue] : { completions: [], titles: [] };
    const done = completedLevels(learner);
    const completedGroups = honors.groups.filter(group => done.has(group.beginner_level_id) && done.has(group.advanced_level_id)).length;
    const owned = new Set(learner.titles.map(grantKey));
    return {
      question_status: '待核验',
      completed_groups: completedGroups,
      note: honors.note,
      titles: honors.titles.map(title => {
        if (title.scope === 'group') {
          return {
            id: title.id, name: title.name, scope: title.scope, condition: title.condition,
            groups: honors.groups.map(group => {
              const levelId = title.requires === 'advanced_level_id' ? group.advanced_level_id : group.beginner_level_id;
              return { group_id: group.id, person_name: group.person_name, level_id: levelId, state: owned.has(`${title.id}:${group.id}`) ? '已获得' : '可解锁' };
            })
          };
        }
        return {
          id: title.id, name: title.name, scope: title.scope, condition: title.condition,
          progress: `${Math.min(completedGroups, title.completed_groups)}/${title.completed_groups}`,
          state: owned.has(`${title.id}:`) ? '已获得' : '可解锁'
        };
      })
    };
  };
  const publicAttempt = attempt => {
    const level = levelById.get(attempt.level_id);
    return {
      id: attempt.id,
      level_id: attempt.level_id,
      person_name: level.person_name,
      reading_person_id: level.reading_person_id,
      difficulty: level.difficulty,
      question_status: '待核验',
      published: false,
      total: attempt.question_ids.length,
      finished: Boolean(attempt.finished_at),
      questions: attempt.question_ids.map((id, index) => {
        const prior = attempt.answers.find(answer => answer.question_id === id);
        return { ...publicQuestion(byId.get(id)), index, answered: Boolean(prior), feedback: prior ? feedbackOf(byId.get(id), prior.choice, urlOf(byId.get(id))) : null };
      }),
      score: attempt.finished_at ? scoreOf(attempt) : null,
      next_level: attempt.finished_at ? nextLevel(attempt.level_id, completedLevels(learnerOf(attempt.learner_id))) : null
    };
  };
  function scoreOf(attempt) {
    const total = attempt.question_ids.length;
    const correct = attempt.answers.filter(answer => answer.choice === byId.get(answer.question_id).正确答案).length;
    const wrong = total - correct;
    return { correct, wrong, total, accuracy: total ? Math.round((correct * 100) / total) : 0 };
  }
  function nextLevel(levelId, done) {
    const items = levels.levels;
    const index = items.findIndex(level => level.id === levelId);
    if (index < 0) return null;
    const current = items[index];
    const brief = level => ({ id: level.id, person_name: level.person_name, difficulty: level.difficulty, status: '待核验' });
    if (current.difficulty === '入门') {
      const advanced = items.find(level => level.group === current.group && level.difficulty === '进阶');
      if (advanced && !done.has(advanced.id)) return brief(advanced);
    }
    const found = items.slice(index + 1).find(level => !done.has(level.id) && advancedOpen(level, done)) || items.slice(0, index).find(level => !done.has(level.id) && advancedOpen(level, done));
    return found ? brief(found) : null;
  }
  function advancedOpen(level, done) {
    if (level.difficulty !== '进阶') return true;
    const beginner = levels.levels.find(item => item.group === level.group && item.difficulty === '入门');
    return Boolean(beginner && done.has(beginner.id));
  }
  return {
    levels(learnerIdValue) {
      const done = learnerIdValue && store.learners[learnerIdValue] ? completedLevels(store.learners[learnerIdValue]) : new Set();
      return {
        question_status: '待核验',
        published: false,
        rule: levels.rule,
        items: levels.levels.map(level => ({
          id: level.id,
          person_name: level.person_name,
          group: level.group,
          reading_person_id: level.reading_person_id,
          difficulty: level.difficulty,
          draw_count: level.draw_count,
          pool_size: level.pool.length,
          status: '待核验',
          published: false,
          completed: done.has(level.id)
        }))
      };
    },
    titles: titleView,
    async start(levelIdValue, learnerIdValue) {
      const level = levelById.get(levelIdValue);
      if (!level) return { error: '关卡不存在', status: 404 };
      if (!learnerIdPattern.test(learnerIdValue || '')) return { error: '学习者编号无效', status: 400 };
      const done = store.learners[learnerIdValue] ? completedLevels(store.learners[learnerIdValue]) : new Set();
      if (!advancedOpen(level, done)) return { error: '请先答完本组入门关', status: 409 };
      const attempt = {
        id: `att_${crypto.randomUUID().replace(/-/g, '')}`,
        learner_id: learnerIdValue,
        level_id: level.id,
        question_ids: sample(level.pool, level.draw_count, nextInt),
        answers: [],
        created_at: new Date().toISOString(),
        finished_at: null
      };
      store.attempts[attempt.id] = attempt;
      learnerOf(learnerIdValue);
      await persist();
      return { status: 201, body: publicAttempt(attempt) };
    },
    owner(id){return store.attempts[id]?.learner_id||null;},
    attempt(id) {
      const attempt = store.attempts[id];
      return attempt ? { status: 200, body: publicAttempt(attempt) } : { error: '答题不存在', status: 404 };
    },
    async answer(id, choice, questionId) {
      const attempt = store.attempts[id];
      if (!attempt) return { error: '答题不存在', status: 404 };
      const prior = questionId && attempt.answers.find(item => item.question_id === questionId);
      if (prior) return { status: 200, body: { ...publicAttempt(attempt), feedback: feedbackOf(byId.get(questionId), prior.choice, urlOf(byId.get(questionId))), titles_earned: [] } };
      if (attempt.finished_at) return { error: '本次答题已结束', status: 409 };
      const expected = attempt.question_ids[attempt.answers.length];
      if (questionId && questionId !== expected) return { error: '请按顺序作答', status: 409 };
      const question = byId.get(expected);
      if (!optionsOf(question).some(option => option.key === choice)) return { error: '选项无效', status: 400 };
      attempt.answers.push({ question_id: expected, choice });
      let earned = [];
      if (attempt.answers.length === attempt.question_ids.length) {
        attempt.finished_at = new Date().toISOString();
        const learner = learnerOf(attempt.learner_id);
        if (!learner.completions.some(item => item.attempt_id === attempt.id)) {
          learner.completions.push({ level_id: attempt.level_id, attempt_id: attempt.id, finished_at: attempt.finished_at });
        }
        earned = syncTitles(learner);
      }
      await persist();
      return { status: 200, body: { ...publicAttempt(attempt), feedback: feedbackOf(question, choice, urlOf(question)), titles_earned: earned } };
    }
  };
}

module.exports = { createLearning };
