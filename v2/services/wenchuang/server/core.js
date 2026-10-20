const fs = require('node:fs');
const path = require('node:path');

function grantsFromHonors(view) {
  if (!view || !Array.isArray(view.titles)) throw new Error('学习称号响应格式错误');
  const grants = [];
  for (const title of view.titles) {
    if (title.scope === 'group') {
      for (const group of title.groups || []) {
        if (group.state === '已获得') grants.push({ title_id: title.id, group_id: group.group_id });
      }
    } else if (title.state === '已获得') grants.push({ title_id: title.id, group_id: null });
  }
  return grants;
}

function grantsFromLevels(view) {
  if (!view || !Array.isArray(view.items)) throw new Error('学习关卡响应格式错误');
  return view.items.filter(level => level.completed).map(level => ({
    level_id: level.id, group_id: level.group, difficulty: level.difficulty
  }));
}

function evaluate(product, grants, levels = []) {
  const rule = product.condition;
  if (rule.type === 'group_level') {
    const earned = levels.some(level => level.group_id === rule.group_id && level.difficulty === rule.difficulty);
    return { unlocked: earned, progress: earned ? 1 : 0, required: 1 };
  }
  if (rule.type === 'free') return { unlocked: true, progress: 1, required: 1 };
  if (rule.type === 'group_title') {
    const earned = grants.some(g => g.title_id === rule.title_id && g.group_id === rule.group_id);
    return { unlocked: earned, progress: earned ? 1 : 0, required: 1 };
  }
  if (rule.type === 'distinct_titles') {
    const count = new Set(grants.map(g => g.title_id)).size;
    return { unlocked: count >= rule.count, progress: Math.min(count, rule.count), required: rule.count };
  }
  throw new Error('未知的解锁规则');
}

function createStore(file) {
  let data = { version: 1, claims: {} };
  if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let queue = Promise.resolve();
  const list = userId => Object.values(data.claims[userId] || {});
  function claim(userId, productId, row) {
    const op = queue.then(async () => {
      if (data.claims[userId]?.[productId]) return { created: false, row: data.claims[userId][productId] };
      const next = structuredClone(data);
      next.claims[userId] ||= {};
      next.claims[userId][productId] = row;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const temp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
      fs.renameSync(temp, file);
      data = next;
      return { created: true, row };
    });
    queue = op.catch(() => {});
    return op;
  }
  return { list, claim };
}

module.exports = { grantsFromHonors, grantsFromLevels, evaluate, createStore };
