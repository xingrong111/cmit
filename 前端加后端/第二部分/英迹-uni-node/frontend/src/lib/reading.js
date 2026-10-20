const KEY='yingji:reading-v1'
export function prefs(){return uni.getStorageSync('yingji:prefs')||{size:'normal'}}
export function setSize(size){uni.setStorageSync('yingji:prefs',{size})}
export function history(){return uni.getStorageSync(KEY)||[]}
export function remember(kind,id,title){const row={kind,id,title,at:Date.now()};uni.setStorageSync(KEY,[row,...history().filter(x=>!(x.kind===kind&&x.id===id))].slice(0,20))}
export function bookmarks(){return uni.getStorageSync('yingji:bookmarks-v1')||[]}
export function toggleBookmark(kind,id,title){const rows=bookmarks(),found=rows.find(x=>x.kind===kind&&x.id===id);uni.setStorageSync('yingji:bookmarks-v1',found?rows.filter(x=>x!==found):[{kind,id,title},...rows]);return !found}
export function isSaved(kind,id){return bookmarks().some(x=>x.kind===kind&&x.id===id)}
export function clearHistory(){uni.removeStorageSync(KEY)}
