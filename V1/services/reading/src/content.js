import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const defaultSeedPath = fileURLToPath(new URL('../data/content.json', import.meta.url));
export const defaultDbPath = fileURLToPath(new URL('../data/app.sqlite3', import.meta.url));
export const STAGES = ['早年求索', '时代风云', '革命实践', '信念与传承'];
const published = r => r?.publication_status === 'demo_published';

export function createContent({ dbPath = defaultDbPath, seedPath = defaultSeedPath } = {}) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(kind,id));');
  function initialize() {
    // Existing records are never overwritten on application startup.
    if (db.prepare('SELECT COUNT(*) AS count FROM records').get().count) return;
    const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
    db.exec('BEGIN IMMEDIATE');
    try {
      const insert = db.prepare('INSERT INTO records VALUES(?,?,?)');
      for (const kind of ['people', 'facts', 'sources', 'events', 'relations']) {
        for (const row of seed[kind]) insert.run(kind, row.id, JSON.stringify(row));
      }
      insert.run('meta', 'version', JSON.stringify({ version: seed.version }));
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  initialize();
  const rows = kind => db.prepare('SELECT payload FROM records WHERE kind=? ORDER BY rowid').all(kind).map(r => JSON.parse(r.payload));
  const byId = (kind, id) => { const row = db.prepare('SELECT payload FROM records WHERE kind=? AND id=?').get(kind, id); return row ? JSON.parse(row.payload) : null; };
  const people = () => rows('people').filter(published);
  const publicFacts = pid => { const ids = new Set(people().map(p => p.id)); return rows('facts').filter(f => published(f) && (()=>{const source=byId('sources',f.source_id);return source&&(!source.publication_status||published(source));})() && ids.has(f.person_id) && (!pid || f.person_id === pid)); };
  const source = id => {
    const facts = publicFacts().filter(f => f.source_id === id);
    const row = byId('sources', id);
    return row && (!row.publication_status || published(row)) && facts.length ? { ...row, facts } : null;
  };
  const events = pid => {
    const valid = new Set(publicFacts(pid).filter(f => f.review_status === 'verified').map(f => f.id));
    return rows('events').filter(e => published(e) && people().some(p => p.id === e.person_id) && (!pid || e.person_id === pid) && e.fact_ids.length > 0 && e.fact_ids.every(id => valid.has(id)) && e.source_ids.every(id => source(id))).sort((a, b) => a.sort_year - b.sort_year || a.id.localeCompare(b.id));
  };
  function meta() {
    return { version: byId('meta', 'version').version, scope: '本批15位人物资料预览，非全国人数统计', publication: '资料预览；正式发布待统一审核', people_count: new Set(people().filter(p => p.kind === 'person').map(p => p.id)).size, group_count: people().filter(p => p.kind === 'group').length, event_count: events().length };
  }
  function person(id) {
    const p = byId('people', id);
    if (!published(p)) return null;
    const facts = publicFacts(id);
    return { ...p, facts, events: events(id), source_count: new Set(facts.map(f => f.source_id)).size, members: people().filter(m => p.member_ids?.includes(m.id)) };
  }
  function timeline(pid, stage, limit = 100) {
    const filtered = events(pid).filter(e => !stage || e.stage === stage);
    const items = filtered.slice(0, limit).map(e => ({ ...e, person_name: byId('people', e.person_id).name }));
    const all = events(pid);
    return { ...(pid ? { person_id: pid } : {}), items, total: filtered.length, stages: STAGES, undated_count: publicFacts(pid).filter(f => f.review_status === 'verified' && !all.some(e => e.fact_ids.includes(f.id))).length, note: '按明确年份排序；片段不等于完整生平' };
  }
  function graph(pid) {
    const p = person(pid);
    if (!p) return null;
    const nodes = [{ id: pid, name: p.name, kind: p.kind, person_id: pid }];
    const edges = [];
    const valid = new Set(p.facts.filter(f => f.review_status === 'verified').map(f => f.id));
    for (const r of rows('relations')) {
      if (r.from_id !== pid || !published(r) || r.review_status !== 'verified' || !valid.has(r.fact_id) || !source(r.source_id)) continue;
      const target = byId('people', r.to_id);
      // Unpublished person records must not leak through graph labels.
      if (target && !published(target)) continue;
      nodes.push({ id: r.to_id, name: r.target_name, kind: target ? target.kind : 'entity', person_id: target?.id ?? null });
      edges.push(r);
    }
    for (const e of p.events) {
      nodes.push({ id: e.id, name: e.title, kind: 'event', event_id: e.id });
      edges.push({ id: 'EDGE-' + e.id, from_id: pid, to_id: e.id, type: e.date_text + ' · 相关事迹', fact_id: e.fact_ids[0], source_id: e.source_ids[0], boundary: '事实片段关联，不推断其他参与者' });
    }
    return { nodes: [...new Map(nodes.map(n => [n.id, n])).values()], edges, excluded_note: '未核或存在争议的关系不进入确定图谱' };
  }
  return { db, initialize, rows, byId, people, publicFacts, source, events, meta, person, timeline, graph, close: () => db.close() };
}
