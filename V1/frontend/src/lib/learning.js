import links from '../data/人物关联.json';
export const learningGroups=Object.fromEntries(links.filter(x=>x.readingId).map(x=>[x.readingId,x.group]));export function challengeGroup(id){return learningGroups[id]||''}
