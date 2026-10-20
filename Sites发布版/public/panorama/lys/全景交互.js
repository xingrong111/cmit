import * as THREE from './素材/three.module.js';

const $ = (selector) => document.querySelector(selector);
const frameFov = (value) => window.innerWidth < 721 ? Math.max(value, 122) : value;
const chapters = [
  {
    kicker: '1941年9月', title: '山脊上的任务', label: '进入狼牙山',
    subtitle: '左右拖动，逐一看清山脊上的五人',
    body: '1941年9月，五名八路军战士在河北易县狼牙山一带担负掩护任务。全景将山脊、远处烟尘和转移队伍作叙事合成；画面不复原同一时刻的真实站位或路线。',
    view: { yaw: 0, pitch: -0.04, fov: 86 }
  },
  {
    kicker: '章节 02 · 掩护转移', title: '把追兵引向山顶', label: '掩护转移',
    subtitle: '转向山路，理解掩护与转移的关系',
    body: '史料记载，七连掩护机关、部队和群众转移，五名战士随后担负最后的阻击任务。画面中的小队伍和烟尘只是艺术示意，不对应已考证的具体人员、方位或同步发生的场景。',
    view: { yaw: 2.25, pitch: -0.38, fov: 88 }
  },
  {
    kicker: '章节 03 · 五壮士', title: '五名战士的集体称谓', label: '五壮士',
    subtitle: '葛振林、宋学义、胡德林、胡福才、马宝玉',
    body: '后世以“狼牙山五壮士”称呼马宝玉、葛振林、宋学义、胡德林、胡福才。场景中的五个人物形象仅表达集体形象与叙事节奏，不对应人物真实相貌或当时的固定站位。',
    view: { yaw: 0, pitch: -0.04, fov: 82 }
  },
  {
    kicker: '章节 04 · 纪念与传承', title: '让史料回到阅读中', label: '纪念与传承',
    subtitle: '纪念，不等于把艺术加工当作史实',
    body: '狼牙山五壮士的事迹长期被纪念、研究与传播。这个数字场景把空间感作为理解入口，但人物外观、云雾、光影与镜头构图都须和文献记载区分开来。',
    view: { yaw: 0.78, pitch: 0, fov: 80 }
  }
];

const canvas = $('#vr-canvas');
const fallback = $('#fallback');
const opening = $('#opening');
const sourceDialog = $('#source-dialog');
let activeChapter = 0;
let isDragging = false;
let previousPointer = { x: 0, y: 0 };
let yaw = 0;
let pitch = -0.04;
let targetYaw = 0;
let targetPitch = -0.04;
let targetFov = frameFov(86);
let renderer;
let camera;
let scene;

// 全景球体会把纹理的左右边缘接在一起。生成图虽为 2:1，边缘仍不连续；
// 在加载时对两侧做平滑闭环，保留中央人物与脚下岩石的原始画面。
function makeSeamlessTexture(texture) {
  const image = texture.image;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = height;
  const context = surface.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  const data = pixels.data;
  const blendWidth = Math.round(width * .13);
  for (let row = 0; row < height; row++) {
    const leftEdge = (row * width) * 4;
    const rightEdge = (row * width + width - 1) * 4;
    const difference = [0, 1, 2].map((channel) => data[rightEdge + channel] - data[leftEdge + channel]);
    for (let offset = 0; offset <= blendWidth; offset++) {
      const progress = offset / blendWidth;
      const smooth = progress * progress * (3 - 2 * progress);
      const correction = (1 - smooth) / 2;
      const left = (row * width + offset) * 4;
      const right = (row * width + width - 1 - offset) * 4;
      for (let channel = 0; channel < 3; channel++) {
        data[left + channel] += difference[channel] * correction;
        data[right + channel] -= difference[channel] * correction;
      }
    }
  }
  context.putImageData(pixels, 0, 0);
  const result = new THREE.CanvasTexture(surface);
  result.colorSpace = THREE.SRGBColorSpace;
  result.wrapS = THREE.RepeatWrapping;
  result.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return result;
}

function setChapter(index, ease = true) {
  activeChapter = (index + chapters.length) % chapters.length;
  const chapter = chapters[activeChapter];
  $('#scene-index').textContent = `0${activeChapter + 1} / 04`;
  $('#scene-title').textContent = chapter.label;
  $('#scene-subtitle').textContent = chapter.subtitle;
  $('#card-kicker').textContent = chapter.kicker;
  $('#card-title').textContent = chapter.title;
  $('#card-body').textContent = chapter.body;
  $('#next-button').textContent = activeChapter === chapters.length - 1 ? '学习反馈' : '下一章节';
  document.querySelectorAll('.chapter').forEach((button) => button.classList.toggle('active', Number(button.dataset.chapter) === activeChapter));
  targetYaw = chapter.view.yaw;
  targetPitch = chapter.view.pitch;
  targetFov = frameFov(chapter.view.fov);
  if (!ease) { yaw = targetYaw; pitch = targetPitch; camera.fov = targetFov; camera.updateProjectionMatrix(); }
}

async function initialize() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(frameFov(86), window.innerWidth / window.innerHeight, .1, 100);

    const loader = new THREE.TextureLoader();
    const sourceTexture = await loader.loadAsync('./素材/狼牙山五壮士-清晰人物全景-v6.png');
    const panorama = makeSeamlessTexture(sourceTexture);
    sourceTexture.dispose();
    const mountain = new THREE.Mesh(
      new THREE.SphereGeometry(48, 96, 48),
      new THREE.MeshBasicMaterial({ map: panorama, side: THREE.BackSide })
    );
    mountain.rotation.y = Math.PI / 2;
    scene.add(mountain);
    setChapter(0, false);
    animate();
  } catch (error) {
    console.error(error);
    fallback.hidden = false;
    opening.classList.add('is-hidden');
  }
}

function animate(time = 0) {
  requestAnimationFrame(animate);
  yaw += (targetYaw - yaw) * .055;
  pitch += (targetPitch - pitch) * .055;
  camera.fov += (targetFov - camera.fov) * .055;
  camera.updateProjectionMatrix();
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  renderer.render(scene, camera);
}

function rotateFromPointer(event) {
  const point = event.touches?.[0] || event;
  const dx = point.clientX - previousPointer.x;
  const dy = point.clientY - previousPointer.y;
  previousPointer = { x: point.clientX, y: point.clientY };
  targetYaw -= dx * .006;
  targetPitch = THREE.MathUtils.clamp(targetPitch - dy * .004, -.56, .34);
}

canvas.addEventListener('pointerdown', (event) => {
  isDragging = true;
  previousPointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => { if (isDragging) rotateFromPointer(event); });
canvas.addEventListener('pointerup', () => { isDragging = false; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  targetFov = THREE.MathUtils.clamp(targetFov + event.deltaY * .03, 46, 145);
}, { passive: false });
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') targetYaw += .14;
  if (event.key === 'ArrowRight') targetYaw -= .14;
  if (event.key === 'ArrowUp') targetPitch = THREE.MathUtils.clamp(targetPitch + .1, -.56, .34);
  if (event.key === 'ArrowDown') targetPitch = THREE.MathUtils.clamp(targetPitch - .1, -.56, .34);
});
window.addEventListener('resize', () => {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  targetFov = frameFov(chapters[activeChapter].view.fov);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

document.querySelectorAll('.chapter').forEach((button) => button.addEventListener('click', () => setChapter(Number(button.dataset.chapter))));
$('#card-toggle').addEventListener('click', () => {
  const collapsed = $('#reading-card').classList.toggle('is-collapsed');
  $('#card-toggle').textContent = collapsed ? '展开' : '收起';
  $('#card-toggle').setAttribute('aria-expanded', String(!collapsed));
});
$('#next-button').addEventListener('click', () => {
  if (activeChapter === chapters.length - 1) { $('#quiz').hidden = false; return; }
  setChapter(activeChapter + 1);
});
$('#source-button').addEventListener('click', () => sourceDialog.showModal());
$('#close-dialog').addEventListener('click', () => sourceDialog.close());
$('#help-button').addEventListener('click', () => sourceDialog.showModal());
$('#enter-button').addEventListener('click', () => opening.classList.add('is-hidden'));
document.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => {
  $('#answer').textContent = button.dataset.answer === 'correct'
    ? '回答正确：空间与人物是艺术化表达，核心事件仍需回到可核对的史料。'
    : '请再想一想：本页已明确标注，环境和人物都是为叙事制作的艺术化呈现。';
}));

initialize();
