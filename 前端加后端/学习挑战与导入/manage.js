const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { systemOf } = require('./import-check.js');

const root = __dirname;
const bankPath = path.resolve(root, '../英迹-五组150题题库审核包/五组题库总数据.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function createManage(options = {}) {
  const levelsDoc = options.levels || readJson(path.join(root, 'levels.json'));
  const bank = options.questions || readJson(options.bankPath || bankPath).questions;
  const byId = new Map(bank.map(question => [question.题目ID, question]));
  const storePath = options.storePath || path.join(root, 'data', 'question-drafts.json');
  const persist = options.persist !== false;
  const drafts = options.drafts ? options.drafts.slice() : [];
  if (persist && !options.drafts && fs.existsSync(storePath)) {
    const saved = readJson(storePath);
    if (Array.isArray(saved.questions)) drafts.push(...saved.questions);
  }

  function levelById(id) {
    return levelsDoc.levels.find(level => level.id === id);
  }

  function listLevels() {
    return {
      published: false,
      question_status: '待核验',
      note: '草稿不进入正在进行的闯关。发布要等成员3的管理员工作台接入。',
      items: levelsDoc.levels.map(level => ({
        id: level.id,
        person_name: level.person_name,
        group: level.group,
        reading_person_id: level.reading_person_id,
        difficulty: level.difficulty,
        draw_count: level.draw_count,
        pool_count: level.pool.length,
        status: '待核验',
        published: false
      }))
    };
  }

  function viewOf(question, level, source, draft) {
    return {
      source,
      draft_id: draft ? draft.draft_id : null,
      version: draft ? draft.version : null,
      题目ID: question.题目ID,
      涉及人物: question.涉及人物,
      题型: question.题型,
      难度: question.难度,
      题干: question.题干,
      A: question.A || '',
      B: question.B || '',
      C: question.C || '',
      D: question.D || '',
      正确答案: question.正确答案,
      解析: question.解析,
      来源ID: question.来源ID,
      证据位置: question.证据位置,
      状态: '待核验',
      published: false,
      level_id: level.id,
      reading_person_id: level.reading_person_id,
      reading_fact_id: null
    };
  }

  function listQuestions(levelId) {
    const level = levelById(levelId);
    if (!level) return { status: 404, body: { error: '关卡不存在' } };
    const bankItems = level.pool.map(id => byId.get(id)).filter(Boolean).map(question => viewOf(question, level, '审核题库', null));
    const draftItems = drafts.filter(item => item.level_id === level.id).map(item => viewOf(item.question, level, '草稿', item));
    return { status: 200, body: { level_id: level.id, status: '待核验', published: false, items: [...draftItems, ...bankItems] } };
  }

  function check(input) {
    const errors = [];
    const level = levelById(input.level_id);
    if (!level) errors.push('关卡不存在。');
    if (input.published === true) errors.push('这里不能发布。');
    if (input.状态 && input.状态 !== '待核验') errors.push('草稿只能保持待核验，不能标成已核验。');
    if (input.reading_fact_id != null) errors.push('阅读事实编号在成员2确认前必须写 null。');
    const id = String(input.题目ID || '');
    if (systemOf(id) !== 'question') errors.push('题目编号要写成 QQB-001 这种形式。');
    else if (level && !id.startsWith(`${level.group}-`)) errors.push('题目编号和关卡不是同一组，不能自动归入。');
    if (level && input.难度 && input.难度 !== level.difficulty) errors.push('题目难度和所选关卡不一致。');
    if (level && level.reading_person_id && input.涉及人物 && input.涉及人物 !== level.person_name) errors.push('涉及人物和关卡不是同一个人，不能自动对应。');
    if (level && !level.reading_person_id && input.reading_person_id != null) errors.push('这一组还没有阅读库人物编号，reading_person_id 必须写 null。');
    if (level && !level.reading_person_id && !String(input.涉及人物 || '').trim()) errors.push('缺少涉及人物。');
    if (!['判断题', '单项选择题'].includes(input.题型)) errors.push('题型只能是判断题或单项选择题。');
    if (!String(input.题干 || '').trim()) errors.push('缺少题干。');
    if (!String(input.解析 || '').trim()) errors.push('缺少解析。');
    if (!String(input.证据位置 || '').trim()) errors.push('缺少证据位置。');
    if (systemOf(input.来源ID) !== 'question-source') errors.push('题库来源要写成 QQB-S02 这种编号，不能改成阅读库或地点编号。');
    if (input.题型 === '判断题' && !['正确', '错误'].includes(input.正确答案)) errors.push('判断题的正确答案只能是正确或错误。');
    if (input.题型 === '单项选择题') {
      const values = ['A', 'B', 'C', 'D'].map(key => String(input[key] || '').trim());
      if (values.some(value => !value)) errors.push('单项选择题四个选项都要填写。');
      if (new Set(values.filter(Boolean)).size !== values.filter(Boolean).length) errors.push('选项内容不能重复。');
      if (!['A', 'B', 'C', 'D'].includes(input.正确答案)) errors.push('单项选择题的正确答案只能是 A、B、C、D。');
    }
    return { errors, level };
  }

  function draftQuestion(input, level) {
    const choice = input.题型 === '单项选择题';
    return {
      题目ID: input.题目ID,
      涉及人物: level.reading_person_id ? level.person_name : String(input.涉及人物 || '').trim(),
      题型: input.题型,
      难度: level.difficulty,
      题干: String(input.题干).trim(),
      A: choice ? String(input.A || '').trim() : '',
      B: choice ? String(input.B || '').trim() : '',
      C: choice ? String(input.C || '').trim() : '',
      D: choice ? String(input.D || '').trim() : '',
      正确答案: input.正确答案,
      解析: String(input.解析).trim(),
      来源ID: input.来源ID,
      证据位置: String(input.证据位置).trim(),
      状态: '待核验',
      reading_person_id: level.reading_person_id,
      reading_fact_id: null
    };
  }

  function preview(input) {
    const { errors, level } = check(input || {});
    if (errors.length) return { status: 400, body: { ok: false, errors, published: false, status: '待核验' } };
    return {
      status: 200,
      body: {
        ok: true,
        published: false,
        status: '待核验',
        preview: viewOf(draftQuestion(input, level), level, '草稿预览', null),
        note: '这是发布前预览。确认后只存草稿，不进入闯关。'
      }
    };
  }

  function save(input) {
    const { errors, level } = check(input || {});
    if (errors.length) return { status: 400, body: { ok: false, errors, published: false } };
    const question = draftQuestion(input, level);
    const versions = drafts.filter(item => item.base_id === question.题目ID).map(item => item.version);
    const record = {
      draft_id: `qd_${crypto.randomBytes(8).toString('hex')}`,
      version: (versions.length ? Math.max(...versions) : 0) + 1,
      base_id: question.题目ID,
      level_id: level.id,
      saved_at: new Date().toISOString(),
      status: '待核验',
      published: false,
      question
    };
    drafts.push(record);
    if (persist) {
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, `${JSON.stringify({ questions: drafts }, null, 2)}\n`);
    }
    return {
      status: 201,
      body: {
        ok: true,
        draft_id: record.draft_id,
        version: record.version,
        status: '草稿',
        question_status: '待核验',
        published: false,
        note: '已存草稿，没有发布，闯关仍使用原来的审核题库。'
      }
    };
  }

  function remove(draftId) {
    const index = drafts.findIndex(item => item.draft_id === draftId);
    if (index < 0) return { status: 404, body: { error: '草稿不存在', published: false } };
    const [record] = drafts.splice(index, 1);
    if (persist) {
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, `${JSON.stringify({ questions: drafts }, null, 2)}\n`);
    }
    return {
      status: 200,
      body: {
        ok: true,
        draft_id: record.draft_id,
        version: record.version,
        published: false,
        question_status: '待核验',
        note: '已删除这份草稿。审核题库没有改动。'
      }
    };
  }

  return { listLevels, listQuestions, preview, save, remove };
}

module.exports = { createManage };
