import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContent } from '../src/content.js';
import { createApp } from '../src/server.js';

const testRoot = fileURLToPath(new URL('.', import.meta.url));
const temp = mkdtempSync(join(testRoot, '.test-'));
const content = createContent({ dbPath: join(temp, 'test.sqlite3') });
let server, base;
before(async () => {
  const { app } = createApp({ content, allowedOrigins: ['http://127.0.0.1:5173'] });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  content.close();
  const target = resolve(temp), offset = relative(resolve(testRoot), target);
  assert.ok(offset && !offset.startsWith('..') && !offset.includes(':'));
  rmSync(target, { recursive: true });
});
const get = async path => { const response = await fetch(base + path); return { status: response.status, data: await response.json() }; };
const ok = async path => { const { status, data } = await get(path); assert.equal(status, 200, path); return data; };

test('01 aliases and natural-person count', async () => {
  assert.equal((await ok('/api/people?q=' + encodeURIComponent('博古'))).items[0].id, 'P010');
  assert.equal((await ok('/api/meta')).people_count, 15);
});
test('02 unknown and unpublished facts return 404', async () => {
  assert.equal((await get('/api/people/P999')).status, 404);
  const draft = content.rows('facts').find(f => f.publication_status === 'draft');
  assert.equal((await get('/api/facts/' + draft.id)).status, 404);
});
test('03 every published fact retains an accessible source', async () => {
  for (const f of content.publicFacts()) assert.equal((await get('/api/sources/' + f.source_id)).status, 200);
});
test('04 attributed dates do not appear as confirmed timeline events', async () => {
  for (const p of content.people()) {
    for (const e of (await ok(`/api/people/${p.id}/timeline`)).items) {
      for (const fid of e.fact_ids) assert.equal(content.byId('facts', fid).review_status, 'verified');
    }
  }
  for (const id of ['EV-P009-F-006', 'EV-P009-F-007', 'EV-P001-F-003']) assert.equal((await get('/api/events/' + id)).status, 404);
});
test('05 exact source day is retained', async () => {
  const e = await ok('/api/events/EV-P009-F-008');
  assert.equal(e.date_text, '1916年2月13日'); assert.equal(e.date_precision, 'day');
});
test('06 graph excludes unreviewed relationships', async () => {
  for (const p of content.people()) for (const edge of (await ok(`/api/people/${p.id}/graph`)).edges) assert.equal(content.byId('facts', edge.fact_id).review_status, 'verified');
  assert.ok(!(await ok('/api/people/P013/graph')).edges.some(e => e.id === 'P013-R-001'));
});
test('07 source attribution and evidence boundary survive migration', async () => {
  const s = await ok('/api/sources/P009-S-023');
  for (const key of ['boundary', 'original_url', 'final_url', 'location']) assert.ok(s[key]);
});
test('08 all published event records have facts and sources', async () => {
  for (const e of content.rows('events')) {
    const row = await ok('/api/events/' + e.id);
    assert.ok(row.facts.length); assert.ok(row.sources.length); assert.equal(row.background, null);
  }
});
test('09 merged event retains both date precisions and sources', async () => {
  const e = await ok('/api/events/EV-P009-F-003');
  assert.equal(e.date_precision, 'multiple'); assert.equal(e.sources.length, 2); assert.ok(e.date_text.includes('1934年2月 / 1934年2月5日'));
});
test('10 birth conflicts remain empty instead of guessed', async () => {
  for (const id of ['P001', 'P004', 'P011']) assert.equal((await ok('/api/people/' + id)).birth, null);
  assert.equal((await ok('/api/people/P010')).birth.text, '1907年6月24日');
  assert.equal((await ok('/api/people/P014')).birth.text, '1906-06-09');
});
test('11 multiple-year text is not turned into a single event', async () => assert.equal((await get('/api/events/EV-P010-F-001')).status, 404));
test('12 province and empty search filters', async () => {
  assert.deepEqual((await ok('/api/people?province=' + encodeURIComponent('湖北'))).items.map(p => p.id), ['P007']);
  assert.deepEqual((await ok('/api/people?q=' + encodeURIComponent('没有此人'))).items, []);
});
test('13 initialization does not overwrite existing SQLite data', async () => {
  const before = content.rows('facts').length;
  const p = content.byId('people', 'P009');
  content.db.prepare('UPDATE records SET payload=? WHERE kind=? AND id=?').run(JSON.stringify({ ...p, bio: '保留现有数据库编辑' }), 'people', p.id);
  content.initialize();
  assert.equal(content.rows('facts').length, before);
  assert.equal((await ok('/api/people/P009')).bio, '保留现有数据库编辑');
  content.db.prepare('UPDATE records SET payload=? WHERE kind=? AND id=?').run(JSON.stringify(p), 'people', p.id);
});
test('14 group counts and member links avoid counting the group as a person', async () => {
  const group = { ...content.byId('people', 'P009'), id: 'TEST-GROUP', name: '测试团体', kind: 'group', member_ids: ['P009', 'P010'] };
  content.db.prepare('INSERT INTO records VALUES(?,?,?)').run('people', group.id, JSON.stringify(group));
  try {
    assert.equal((await ok('/api/people/TEST-GROUP')).members.length, 2);
    const meta = await ok('/api/meta'); assert.equal(meta.people_count, 15); assert.equal(meta.group_count, 1);
  } finally { content.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run('people', group.id); }
});
test('15 pagination preserves total and IDs', async () => {
  const a = await ok('/api/people?page=1&limit=2'), b = await ok('/api/people?page=2&limit=2');
  assert.equal(a.total, 15); assert.equal(a.items.length, 2); assert.equal(a.has_more, true);
  assert.equal(new Set([...a.items, ...b.items].map(p => p.id)).size, 4);
});
test('16 parameter schema rejects invalid and unknown values with 400', async () => {
  for (const path of ['/api/people?page=0', '/api/people?limit=101', '/api/people?page=abc', '/api/people?q=a&q=b', '/api/people?unknown=1', '/api/timeline?stage=unknown', '/api/timeline?limit=-1', '/api/timeline?person_id=%3Cscript%3E']) assert.equal((await get(path)).status, 400, path);
});
test('17 global timeline filtering and homepage counts', async () => {
  const all = await ok('/api/timeline?limit=100'); assert.ok(all.items.length); assert.ok(all.items.every(e => e.person_name));
  const selected = await ok('/api/timeline?person_id=P009&stage=' + encodeURIComponent('早年求索'));
  assert.ok(selected.items.every(e => e.person_id === 'P009' && e.stage === '早年求索'));
  const home = await ok('/api/home'); assert.equal(home.meta.people_count, 15); assert.ok(home.featured_people.length); assert.ok(home.events.length);
});
test('18 draft-only sources and explicit draft sources are inaccessible', async () => {
  const publicIds = new Set(content.publicFacts().map(f => f.source_id));
  for (const s of content.rows('sources').filter(s => !publicIds.has(s.id))) assert.equal((await get('/api/sources/' + s.id)).status, 404);
  const s = content.byId('sources', 'P009-S-023');
  content.db.prepare('UPDATE records SET payload=? WHERE kind=? AND id=?').run(JSON.stringify({ ...s, publication_status: 'draft' }), 'sources', s.id);
  try { assert.equal((await get('/api/sources/' + s.id)).status, 404); } finally { content.db.prepare('UPDATE records SET payload=? WHERE kind=? AND id=?').run(JSON.stringify(s), 'sources', s.id); }
});
test('19 CORS is exact-origin, production requires explicit origins, writes are disabled', async () => {
  assert.equal((await fetch(base + '/api/meta', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
  const allowed = await fetch(base + '/api/meta', { headers: { Origin: 'http://127.0.0.1:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173');
  assert.equal((await fetch(base + '/api/people', { method: 'POST' })).status, 405);
  assert.throws(() => createApp({ content, production: true, allowedOrigins: [] }), /ALLOWED_ORIGINS/);
});
