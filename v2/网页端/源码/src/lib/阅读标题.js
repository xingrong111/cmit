// Presentation labels only. Source statements, dates and review status stay intact.
export function eventTitle(event){
 if(event.title&&event.title!=='历史节点')return event.title
 const text=event.summary||''
 const labels=[['出生','出生记载'],['赴无锡','无锡任教'],['赴日本','赴日求学'],['入学','求学经历'],['求学','求学经历'],['五四运动','投身五四运动'],['赴苏','赴苏经历'],['莫斯科','莫斯科经历'],['热血日报','《热血日报》相关记载'],['办报','办报工作'],['解放日报','《解放日报》相关记载'],['入党','入党记载'],['广州起义','广州起义相关记载'],['遵义会议','遵义会议相关记载'],['被捕','被捕记载'],['教读书','狱中学习'],['入狱','关押记载'],['转押','转押记载'],['政治协商会议','参与政治协商'],['政协','政协会议相关记载'],['牺牲','牺牲记载'],['遇害','遇害记载'],['飞机','航程与遇难记载']]
 return labels.find(([key])=>text.includes(key))?.[1]||'有据可查的史料片段'
}
export function readingPresentation(value){
 if(Array.isArray(value))return value.map(readingPresentation)
 if(!value||typeof value!=='object')return value
 const result=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,readingPresentation(v)]))
 if(typeof result.id==='string'&&result.id.startsWith('EV-')&&result.title==='历史节点')result.title=eventTitle(result)
 return result
}
