/* Visual preview only: does not read or write account, learning, map or route state. */
(() => {
  let version = new URLSearchParams(location.search).get('appearance');
  if (!['a', 'b'].includes(version)) {
    try { if (parent !== window) version = parent.document.documentElement.dataset.appearance; } catch {}
  }
  if (!['a', 'b'].includes(version)) version = document.currentScript?.dataset.default || 'b';
  document.documentElement.dataset.appearance = version;
})();
