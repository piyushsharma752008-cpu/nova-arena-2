import { state } from './state.js';

const MM_SIZE  = 170;
const MM_SCALE = 0.55;

let mmCtx;
export let actionPrompt;

// Cached DOM refs
let healthFill, staminaFill, spdVal, moneyEl, sprintTag, timeStr, objSub, wantedBadge;

export function initUI() {
  const mmCanvas = document.getElementById('minimapCanvas');
  mmCtx = mmCanvas.getContext('2d');

  healthFill  = document.getElementById('healthFill');
  staminaFill = document.getElementById('staminaFill');
  spdVal      = document.getElementById('spdVal');
  moneyEl     = document.getElementById('moneyVal');
  sprintTag   = document.getElementById('sprintTag');
  timeStr     = document.getElementById('timeStr');
  objSub      = document.getElementById('objSub');
  wantedBadge = document.getElementById('wantedBadge');

  actionPrompt = document.createElement('div');
  actionPrompt.style.cssText = [
    'position:fixed', 'bottom:18%', 'width:100%', 'text-align:center',
    'color:#f5f0e8', 'font-size:1.1rem', 'font-family:monospace', 'font-weight:700',
    'text-shadow:0 2px 8px rgba(0,0,0,0.9)', 'pointer-events:none',
    'display:none', 'z-index:50', 'letter-spacing:.06em',
  ].join(';');
  document.body.appendChild(actionPrompt);

  updateWantedUI();
}

export function updateWantedUI() {
  wantedBadge.innerHTML = Array.from({ length: 5 }, (_, i) =>
    i < state.wantedLevel ? '<span class="wanted-active">★</span>' : '★'
  ).join('');
}

export function drawMinimap(px, pz) {
  const half = MM_SIZE / 2;
  mmCtx.clearRect(0, 0, MM_SIZE, MM_SIZE);
  mmCtx.save();

  // Circular clip
  mmCtx.beginPath();
  mmCtx.arc(half, half, half, 0, Math.PI * 2);
  mmCtx.clip();

  // Background
  mmCtx.fillStyle = '#0a0702';
  mmCtx.fillRect(0, 0, MM_SIZE, MM_SIZE);

  // Grid roads
  const originX = half - px / MM_SCALE;
  const originZ = half - pz / MM_SCALE;
  const gridStep = 42 / MM_SCALE;
  const roadPx   = 10 / MM_SCALE;
  mmCtx.fillStyle = '#1c1a14';
  for (let gi = -8; gi <= 8; gi++) {
    const ex = originX + gi * gridStep;
    const ez = originZ + gi * gridStep;
    mmCtx.fillRect(ex - roadPx/2, 0, roadPx, MM_SIZE);
    mmCtx.fillRect(0, ez - roadPx/2, MM_SIZE, roadPx);
  }

  // Building footprints
  state.buildingFootprints.forEach(fp => {
    const bx = half + (fp.x - px) / MM_SCALE;
    const bz = half + (fp.z - pz) / MM_SCALE;
    const bw = fp.w / MM_SCALE;
    const bd = fp.d / MM_SCALE;
    mmCtx.fillStyle = fp.isParl ? '#c8a020' : '#2a2418';
    mmCtx.fillRect(bx - bw/2, bz - bd/2, bw, bd);
  });

  // FIX: use state.goal position if set, else fall back to a default
  const gx = state.goal ? state.goal.x : 80;
  const gz = state.goal ? state.goal.z : -80;
  const gxMm = half + (gx - px) / MM_SCALE;
  const gzMm = half + (gz - pz) / MM_SCALE;
  mmCtx.beginPath();
  mmCtx.arc(gxMm, gzMm, 5, 0, Math.PI * 2);
  mmCtx.fillStyle = '#f5c842';
  mmCtx.fill();

  // Range rings
  mmCtx.strokeStyle = 'rgba(245,200,66,0.08)';
  mmCtx.lineWidth   = 1;
  [52, 78].forEach(r => {
    mmCtx.beginPath();
    mmCtx.arc(half, half, r, 0, Math.PI * 2);
    mmCtx.stroke();
  });

  mmCtx.restore();
}

export function fmtTime(t) {
  const h = Math.floor(t);
  const m = Math.floor((t - h) * 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
