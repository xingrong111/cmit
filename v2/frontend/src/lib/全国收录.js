import records from '../data/合并人物目录.json'
import directory from '../data/省份目录.json'
export {default as summary} from '../data/人物统计摘要.json'
export const allRecords=records
export const people=records.filter(p=>p.statEligible!==false)
export const provinces=[...directory].sort((a,b)=>a.code.localeCompare(b.code))
export const counts=Object.fromEntries(provinces.map(p=>[p.code,people.filter(x=>x.provinceCode===p.code).length]))
export function shortName(name){return name.replace(/壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区|省|市/g,'')}
export function list(code='',q=''){q=q.trim();return people.filter(p=>(!code||(code==='unknown'?!p.provinceCode:p.provinceCode===code))&&(!q||p.name.includes(q)||(p.aliases||[]).some(a=>a.includes(q))))}
export function approved(p){return p.reviewStatus==='approved'&&p.statEligible===true&&['identity','time','origin','deduplication','directSource'].every(k=>p.audit?.[k]===true)&&Boolean(p.reviewedBy&&p.reviewedAt&&p.sourceEvidence?.url)}
