import {createContent} from '../services/reading/src/content.js';
const c=createContent();try{console.log('people',c.people().length);console.log('meta',c.meta());}finally{c.close()}
for(const [port,prefix] of [[3111,'/api'],[3110,'/api/reading']])for(const route of ['/meta','/people?limit=100']){try{const response=await fetch('http://127.0.0.1:'+port+prefix+route);console.log(port,route,response.status,(await response.text()).slice(0,200));}catch(e){console.log(e.message)}}
