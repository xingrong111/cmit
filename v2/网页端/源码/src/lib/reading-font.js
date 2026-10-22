// Scale each visible text from its standard size, including embedded modules.
const documents = new WeakMap();
export function applyReadingFont(doc, enabled) {
  if (!doc?.body) return;
  let state = documents.get(doc);
  if (!state) {
    state = { nodes: new Map(), enabled, timer: null };
    state.observer = new MutationObserver(() => {
      clearTimeout(state.timer);
      state.timer = setTimeout(() => applyReadingFont(doc, state.enabled), 100);
    });
    state.observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
    documents.set(doc, state);
  }
  state.enabled = enabled;
  for (const [node, saved] of state.nodes) {
    if (saved.value) node.style.setProperty('font-size', saved.value, saved.priority);
    else node.style.removeProperty('font-size');
  }
  state.nodes.clear();
  const largeNodes = [...doc.querySelectorAll('.global-large')];
  largeNodes.forEach(node => node.classList.remove('global-large'));
  if (enabled) {
    const entries = [...doc.body.querySelectorAll('*')].filter(node =>
      !node.matches('script,style,svg,svg *,iframe,option') &&
      (node.matches('input,textarea,select') || [...node.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
    ).map(node => [node, parseFloat(doc.defaultView.getComputedStyle(node).fontSize)]);
    for (const [node, size] of entries) {
      if (!Number.isFinite(size) || size <= 0) continue;
      state.nodes.set(node, { value: node.style.getPropertyValue('font-size'), priority: node.style.getPropertyPriority('font-size') });
      node.style.setProperty('font-size', `${Math.round(size * 1.18 * 100) / 100}px`, 'important');
    }
  }
  largeNodes.forEach(node => node.classList.add('global-large'));
  doc.documentElement.classList.toggle('global-large', enabled);
}
