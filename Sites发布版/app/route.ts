import html from '../data/首页HTML.json';
export function GET(){return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}})}
