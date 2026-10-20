// 成员2：静态360°全景展示层。只负责显示，不决定剧情顺序；热点状态由调用方（成员4）通过 setHotspotStates 指定。
import * as THREE from './素材/three.module.js';

const { degToRad, radToDeg, clamp } = THREE.MathUtils;
const HOTSPOT_STATES = ['hidden', 'locked', 'active', 'done'];

export function isPanoramaSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function dirOf(yaw, pitch) {
  const y = degToRad(yaw), p = degToRad(pitch);
  return new THREE.Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p));
}

function nearest(angle, current) {
  return current + ((angle - current + 540) % 360) - 180;
}

/**
 * 事件（onEvent(type, detail)）：
 *  sceneloading / sceneload / sceneerror / scenefallback
 *  hotspot { id, sceneId, state }  —— locked 状态也会上报，由成员4显示“先完成当前交流”
 *  closeupopen / closeupclose / closeupmissing / closeuperror
 */
export function createPanorama(container, { scenes, closeups = {}, onEvent = () => {} }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const emit = (type, detail = {}) => {
    try { onEvent(type, detail); } catch (err) { console.error('全景事件处理出错', type, err); }
  };

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.className = 'pano-canvas';
  canvas.setAttribute('aria-label', '拖动或方向键环视，滚轮或双指缩放');
  canvas.style.opacity = '0';
  canvas.style.transition = reduced ? 'none' : 'opacity .8s ease';
  container.append(canvas);

  const layer = document.createElement('div');
  layer.className = 'pano-hotspots';
  container.append(layer);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1f2622');
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  const geometry = new THREE.SphereGeometry(30, 80, 48);
  geometry.scale(-1, 1, 1);
  const material = new THREE.MeshBasicMaterial();
  const sphere = new THREE.Mesh(geometry, material);
  sphere.rotation.y = -Math.PI / 2;
  sphere.visible = false;
  scene.add(sphere);

  const loader = new THREE.TextureLoader();
  const textureCache = new Map();
  const buttons = new Map();
  const states = new Map();
  let highlightTimer = 0;
  const frameListeners = new Set();

  let current = null, currentId = null, ready = false, token = 0, disposed = false, raf = 0, last = 0;
  let yaw = 0, pitch = 0, fov = 75, targetYaw = 0, targetPitch = 0;
  let fovRange = [40, 95], pitchRange = [-65, 65];
  let closeup = null, sceneWasShown = false;

  function loadTexture(path) {
    if (!textureCache.has(path)) {
      const promise = new Promise((resolve, reject) => {
        loader.load(path, texture => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          resolve(texture);
        }, undefined, () => reject(new Error('图片加载失败：' + path)));
      });
      promise.catch(() => textureCache.delete(path));
      textureCache.set(path, promise);
    }
    return textureCache.get(path);
  }

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function setFov(value) {
    fov = clamp(value, fovRange[0], fovRange[1]);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }

  function setView({ yaw: y = 0, pitch: p = 0, fov: f } = {}, instant = false) {
    targetYaw = nearest(y, yaw);
    targetPitch = clamp(p, pitchRange[0], pitchRange[1]);
    if (f) setFov(f);
    if (instant || reduced) { yaw = targetYaw; pitch = targetPitch; }
  }

  function pointOf(id) {
    if (!current) return null;
    if (current.anchors?.[id]) return current.anchors[id];
    const spot = current.hotspots?.find(h => h.id === id);
    if (!spot) return null;
    return spot.anchor ? current.anchors?.[spot.anchor] ?? null : spot;
  }

  function clearHotspots() {
    buttons.forEach(b => b.remove());
    buttons.clear();
  }

  function buildHotspots() {
    clearHotspots();
    for (const spot of current.hotspots ?? []) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pano-hotspot';
      b.dataset.id = spot.id;
      b.hidden = true;
      b.style.display = 'none';
      b.innerHTML = '<span class="pano-dot"></span><span class="pano-label"></span>';
      b.querySelector('.pano-label').textContent = spot.label;
      b.setAttribute('aria-label', spot.label);
      b.addEventListener('click', () => emit('hotspot', { id: spot.id, sceneId: currentId, state: states.get(spot.id) ?? 'hidden' }));
      layer.append(b);
      buttons.set(spot.id, b);
    }
  }

  function project(point) {
    const w = container.clientWidth, h = container.clientHeight;
    const d = dirOf(point.yaw, point.pitch);
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const front = d.dot(forward) > 0.05;
    const p = d.multiplyScalar(10).project(camera);
    const inView = front && Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1;
    return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h, front, inView };
  }

  function loadScene(sceneId, { view = 'preset' } = {}) {
    if (disposed) return Promise.reject(new Error('全景模块已释放'));
    const cfg = scenes[sceneId];
    if (!cfg) return Promise.reject(new Error('未知场景：' + sceneId));
    const my = ++token;
    if (closeup) closeCloseup({ restoreView: false });
    ready = false;
    current = cfg;
    currentId = sceneId;
    clearHotspots();

    if (!cfg.image) {
      sphere.visible = false;
      canvas.style.opacity = '0';
      emit('scenefallback', { sceneId, reason: cfg.missing ?? '本场景没有可用全景图' });
      return Promise.resolve({ sceneId, mode: 'text' });
    }

    emit('sceneloading', { sceneId });
    return loadTexture(cfg.image).then(texture => {
      if (my !== token || disposed) return { sceneId, mode: 'stale' };
      if (material.map !== texture || canvas.style.opacity === '0') {
        canvas.style.transition = 'none';
        canvas.style.opacity = '0';
        void canvas.offsetWidth;
        canvas.style.transition = reduced ? 'none' : 'opacity .8s ease';
      }
      material.map = texture;
      material.needsUpdate = true;
      sphere.visible = true;
      canvas.style.opacity = '1';
      fovRange = cfg.fovRange ?? [40, 95];
      pitchRange = cfg.pitchRange ?? [-65, 65];
      if (view === 'preset' || !sceneWasShown) setView(cfg.defaultView, true);
      else setFov(fov);
      sceneWasShown = true;
      buildHotspots();
      ready = true;
      emit('sceneload', { sceneId });
      return { sceneId, mode: 'panorama' };
    }, err => {
      if (my !== token || disposed) return { sceneId, mode: 'stale' };
      sphere.visible = false;
      canvas.style.opacity = '0';
      emit('sceneerror', { sceneId, error: err.message });
      throw err;
    });
  }

  function setHotspotState(id, state) {
    if (!HOTSPOT_STATES.includes(state)) throw new Error('未知热点状态：' + state);
    if (state === 'hidden') states.delete(id); else states.set(id, state);
  }

  function setHotspotStates(map) {
    states.clear();
    for (const [id, state] of Object.entries(map)) setHotspotState(id, state);
  }

  function highlight(id, { ms = 2400, turn = true } = {}) {
    const b = buttons.get(id);
    if (!b || !states.has(id)) return false;
    clearTimeout(highlightTimer);
    buttons.forEach(x => x.classList.remove('is-highlight'));
    b.classList.add('is-highlight');
    highlightTimer = setTimeout(() => b.classList.remove('is-highlight'), ms);
    if (turn) lookAt(id);
    return true;
  }

  function getAnchor(id) {
    if (!ready) return null;
    const point = pointOf(id);
    if (!point) return null;
    return { id, yaw: point.yaw, pitch: point.pitch, ...project(point) };
  }

  function lookAt(target, { instant = false } = {}) {
    const point = typeof target === 'string' ? pointOf(target) : target;
    if (!point) return false;
    setView({ yaw: point.yaw, pitch: point.pitch }, instant);
    return true;
  }

  function screenToView(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector3(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1, 0.5);
    const d = ndc.unproject(camera).normalize();
    return { yaw: radToDeg(Math.atan2(d.x, -d.z)), pitch: radToDeg(Math.asin(clamp(d.y, -1, 1))) };
  }

  function openCloseup(id) {
    const cfg = closeups[id];
    if (!cfg) return Promise.reject(new Error('未知特写：' + id));
    if (!cfg.image) {
      emit('closeupmissing', { id, title: cfg.title, reason: cfg.missing ?? '没有对应细节图' });
      return Promise.resolve({ id, mode: 'text' });
    }
    if (closeup) closeCloseup({ restoreView: false });
    const saved = { yaw: targetYaw, pitch: targetPitch, fov };
    const box = document.createElement('div');
    box.className = 'pano-closeup';
    box.innerHTML = '<img alt=""><button type="button" class="pano-closeup-close">返回场景</button>';
    const img = box.querySelector('img');
    img.alt = cfg.title;
    box.querySelector('button').addEventListener('click', () => closeCloseup());
    closeup = { id, box, saved };
    container.append(box);
    return new Promise(resolve => {
      img.onload = () => { emit('closeupopen', { id }); resolve({ id, mode: 'image' }); };
      img.onerror = () => {
        if (closeup?.id === id) closeCloseup({ restoreView: false });
        emit('closeuperror', { id, error: '细节图加载失败：' + cfg.image });
        resolve({ id, mode: 'text' });
      };
      img.src = cfg.image;
    });
  }

  function closeCloseup({ restoreView = true } = {}) {
    if (!closeup) return;
    const { id, box, saved } = closeup;
    closeup = null;
    box.remove();
    if (restoreView) setView(saved);
    emit('closeupclose', { id });
  }

  function reset() {
    if (current?.defaultView) setView(current.defaultView);
  }

  async function toggleFullscreen(target = container) {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (target.requestFullscreen) await target.requestFullscreen();
      else return false;
      return true;
    } catch {
      return false;
    }
  }

  const pointers = new Map();
  let dragStart = null, pinch = 0;
  function onPointerDown(e) {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragStart = { x: e.clientX, y: e.clientY, yaw: targetYaw, pitch: targetPitch };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }
  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], distance = Math.hypot(a.x - b.x, a.y - b.y);
      setFov(fov + (pinch - distance) * 0.08);
      pinch = distance;
      return;
    }
    if (!dragStart) return;
    const k = 0.13 * fov / 75;
    targetYaw = dragStart.yaw - (e.clientX - dragStart.x) * k;
    targetPitch = clamp(dragStart.pitch + (e.clientY - dragStart.y) * k, pitchRange[0], pitchRange[1]);
    if (reduced) { yaw = targetYaw; pitch = targetPitch; }
  }
  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size === 1) {
      const [p] = pointers.values();
      dragStart = { x: p.x, y: p.y, yaw: targetYaw, pitch: targetPitch };
    } else if (pointers.size === 0) dragStart = null;
  }
  function onWheel(e) {
    e.preventDefault();
    setFov(fov + e.deltaY * 0.025);
  }
  function onKey(e) {
    const step = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
    if (step) {
      e.preventDefault();
      targetYaw += step[0];
      targetPitch = clamp(targetPitch + step[1], pitchRange[0], pitchRange[1]);
    } else if (e.key === '+' || e.key === '=') { e.preventDefault(); setFov(fov - 5); }
    else if (e.key === '-') { e.preventDefault(); setFov(fov + 5); }
  }
  function onContextLost(e) {
    e.preventDefault();
    ready = false;
    emit('sceneerror', { sceneId: currentId, error: '图形显示中断，请重新进入或使用文字阅读' });
  }
  let visible = !document.hidden;
  const onVisibility = () => { visible = !document.hidden; };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('webglcontextlost', onContextLost);
  document.addEventListener('visibilitychange', onVisibility);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 10);
    yaw += (targetYaw - yaw) * k;
    pitch += (targetPitch - pitch) * k;
    camera.lookAt(dirOf(yaw, pitch));
    renderer.render(scene, camera);
    for (const [id, b] of buttons) {
      const point = pointOf(id);
      const p = point && project(point);
      const state = states.get(id) ?? 'hidden';
      const show = ready && state !== 'hidden' && p?.inView;
      if (b.dataset.state !== state) {
        b.dataset.state = state;
        b.classList.toggle('is-locked', state === 'locked');
        b.classList.toggle('is-active', state === 'active');
        b.classList.toggle('is-done', state === 'done');
        b.setAttribute('aria-disabled', String(state === 'locked'));
      }
      b.hidden = !show;
      b.style.display = show ? '' : 'none';
      if (show) { b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; }
    }
    frameListeners.forEach(fn => fn());
  }
  raf = requestAnimationFrame(frame);

  function dispose() {
    if (disposed) return;
    disposed = true;
    token++;
    cancelAnimationFrame(raf);
    clearTimeout(highlightTimer);
    if (closeup) closeCloseup({ restoreView: false });
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    clearHotspots();
    frameListeners.clear();
    textureCache.forEach(p => p.then(t => t.dispose(), () => {}));
    textureCache.clear();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    layer.remove();
  }

  return {
    loadScene,
    setHotspotStates,
    setHotspotState,
    highlight,
    getAnchor,
    lookAt,
    openCloseup,
    closeCloseup,
    screenToView,
    zoom: delta => setFov(fov + delta),
    reset,
    toggleFullscreen,
    onFrame(fn) { frameListeners.add(fn); return () => frameListeners.delete(fn); },
    getState: () => ({ sceneId: currentId, ready, yaw, pitch, fov, closeup: closeup?.id ?? null, hotspots: Object.fromEntries(states) }),
    dispose,
  };
}
