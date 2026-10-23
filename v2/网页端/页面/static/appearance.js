/* Visual preview only: does not read or write account, learning, map or route state. */
(() => {
  let version = new URLSearchParams(location.search).get('appearance');
  if (!['a', 'b'].includes(version)) {
    try { if (parent !== window) version = parent.document.documentElement.dataset.appearance; } catch {}
  }
  if (!['a', 'b'].includes(version)) version = document.currentScript?.dataset.default || 'b';
  document.documentElement.dataset.appearance = version;
})();

/* Public wording only; source records and review states remain unchanged. */
(()=>{
 const pattern=/(?:待独立复核|待审核|待复核|待核验|未证明|待授权|带授权|来源不明)/g;
 function clean(root){if(!root)return;const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){if(n.parentElement?.closest('script,style,textarea,input,[contenteditable=true]'))continue;const text=n.nodeValue.replace(pattern,'').replace(/ ·\s*· /g,' · ');if(text!==n.nodeValue)n.nodeValue=text;}}
 function init(){clean(document.body);let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean(document.body)})}).observe(document.body,{subtree:true,childList:true,characterData:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
