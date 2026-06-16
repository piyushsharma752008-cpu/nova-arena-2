import * as BABYLON from '@babylonjs/core';
import { state } from './state.js';
import { initMaterials } from './materials.js';
import { initWorld, updateDayNight } from './world.js';
import { buildArena, buildSpawnPoints } from './map.js';
import { initPlayer, updatePlayerAnim, sprintParticles } from './player.js';
import { network } from './multiplayer.js';

// Movement constants
const BASE_SPEED   = 14;
const SPRINT_SPEED = 24;
const SPRINT_DRAIN = 28;
const SPRINT_REGEN = 18;
const JUMP_FORCE   = 20;

// ── engine bootstrap ──────────────────────────────────────────────────────────

async function createEngine(canvas) {
  const webGpuOk = await BABYLON.WebGPUEngine.IsSupportedAsync;
  if (webGpuOk) {
    const eng = new BABYLON.WebGPUEngine(canvas, { antialias: true });
    await eng.initAsync();
    return eng;
  }
  return new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true, stencil: true, antialias: true,
  });
}

async function loadPhysics(scene, bootMsg) {
  if (bootMsg) bootMsg.textContent = 'Loading Havok Physics…';
  try {
    const hk = await window.HavokPhysics({ locateFile: () => 'https://cdn.babylonjs.com/havok/HavokPhysics.wasm' });
    scene.enablePhysics(new BABYLON.Vector3(0, -22, 0), new BABYLON.HavokPlugin(true, hk));
    state.physicsOk = true;
    if (bootMsg) bootMsg.textContent = 'Physics loaded! Generating arena…';
  } catch (e) {
    console.warn('Havok failed, falling back to Cannon', e);
    try {
      scene.enablePhysics(new BABYLON.Vector3(0, -22, 0), new BABYLON.CannonJSPlugin());
      state.physicsOk = true;
    } catch (e2) {
      state.physicsOk = false;
    }
  }
}

// ── input helpers ─────────────────────────────────────────────────────────────

function attachKeyboard(scene) {
  scene.onKeyboardObservable.add(kbInfo => {
    const k    = kbInfo.event.key.toLowerCase();
    const down = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN;
    state.keys[k] = down;
  });
}

function buildCamera(canvas, scene) {
  const cam = new BABYLON.ArcRotateCamera('cam', -Math.PI/2, Math.PI/3.2, 16, BABYLON.Vector3.Zero(), scene);
  cam.attachControl(canvas, true);
  cam.lowerRadiusLimit = 2;  cam.upperRadiusLimit = 20;
  cam.lowerBetaLimit   = 0.15; cam.upperBetaLimit = Math.PI / 2.05;
  cam.lockedTarget = state.physicsOk && state.collider ? state.collider : state.playerNode;
  return cam;
}

// ── per-frame physics / movement ──────────────────────────────────────────────

function computeMovement(camera, dt) {
  if (!state.physicsOk || !state.collider || !state.colliderAgg) {
    return { speed: 0, isSprinting: false };
  }

  const body = state.colliderAgg.body;
  const vel  = body.getLinearVelocity();

  // Recover from NaN velocity (can happen on edge collisions)
  if (isNaN(vel.x)) {
    body.setLinearVelocity(BABYLON.Vector3.Zero());
    body.setAngularVelocity(BABYLON.Vector3.Zero());
    return { speed: 0, isSprinting: false };
  }

  // Keep capsule upright
  body.setAngularVelocity(BABYLON.Vector3.Zero());

  const moving    = state.keys['w'] || state.keys['a'] || state.keys['s'] || state.keys['d'];
  const isSprinting = !!(state.keys['shift'] && state.stamina > 0 && moving);
  const spd       = isSprinting ? SPRINT_SPEED : BASE_SPEED;

  // Stamina
  if (isSprinting) state.stamina = Math.max(0,   state.stamina - SPRINT_DRAIN * dt);
  else             state.stamina = Math.min(100,  state.stamina + SPRINT_REGEN * dt);

  // Direction vector from camera forward + WASD
  const fwd   = camera.getForwardRay().direction;
  fwd.y = 0;
  if (fwd.lengthSquared() > 0.001) fwd.normalize();
  const right = BABYLON.Vector3.Cross(new BABYLON.Vector3(0, 1, 0), fwd).normalize();

  let mx = 0, mz = 0;
  if (state.keys['w']) mz += 1;
  if (state.keys['s']) mz -= 1;
  if (state.keys['a']) mx -= 1;
  if (state.keys['d']) mx += 1;

  const dir = fwd.scale(mz).add(right.scale(mx));

  if (dir.length() > 0.01) {
    dir.normalize();
    body.setLinearVelocity(new BABYLON.Vector3(dir.x * spd, vel.y, dir.z * spd));

    // Rotate character mesh toward movement
    const angle   = Math.atan2(dir.x, dir.z);
    const targRot = BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.Up(), angle);
    state.playerNode.rotationQuaternion = BABYLON.Quaternion.Slerp(
      state.playerNode.rotationQuaternion, targRot, 0.18
    );
  } else {
    // Friction deceleration when no input
    body.setLinearVelocity(new BABYLON.Vector3(vel.x * 0.68, vel.y, vel.z * 0.68));
  }

  // Jump (only when grounded)
  const isGrounded = Math.abs(vel.y) < 0.35;
  if (state.keys[' '] && isGrounded) {
    body.applyImpulse(new BABYLON.Vector3(0, JUMP_FORCE, 0), state.collider.getAbsolutePosition());
    state.keys[' '] = false;  // consume so it doesn't repeat
  }

  // Sync visual node with physics capsule
  state.playerNode.position.copyFrom(state.collider.position);
  state.playerNode.position.y -= 1.1;

  const speed = Math.hypot(vel.x, vel.z);
  return { speed, isSprinting };
}

// ── main entry point ──────────────────────────────────────────────────────────

export async function bootstrap(canvas, bootMsg) {
  if (typeof BABYLON === 'undefined') {
    if (bootMsg) bootMsg.textContent = 'ERROR: Babylon.js failed to load.';
    return;
  }

  if (bootMsg) bootMsg.textContent = 'Initialising WebGPU / WebGL Engine…';
  const engine = await createEngine(canvas);
  state.engine  = engine;

  const scene   = new BABYLON.Scene(engine);
  state.scene   = scene;

  // Post-process pipeline
  const pipeline = new BABYLON.DefaultRenderingPipeline('pp', true, scene, [scene.activeCamera]);
  pipeline.samples                   = 4;
  pipeline.fxaaEnabled               = true;
  pipeline.bloomEnabled              = false;
  pipeline.depthOfFieldEnabled       = false;
  pipeline.chromaticAberrationEnabled= false;
  pipeline.grainEnabled              = false;
  state.pipeline = pipeline;

  await loadPhysics(scene, bootMsg);

  // FIX: initWorld() was never called — lights, shadows, and sky were never created
  initMaterials();
  initWorld();
  updateDayNight(12);  // noon for competitive play

  buildArena(scene);
  initPlayer();

  if (bootMsg) bootMsg.textContent = 'Arena Ready!';

  const camera = buildCamera(canvas, scene);
  attachKeyboard(scene);

  // Spawn at random team spawn point
  const spawns     = buildSpawnPoints();
  const teamSpawns = spawns[state.team] ?? spawns.alpha;
  const startPos   = teamSpawns[Math.floor(Math.random() * teamSpawns.length)];
  if (state.collider) {
    state.collider.position.copyFrom(startPos);
    state.colliderAgg?.body?.setLinearVelocity(BABYLON.Vector3.Zero());
  }

  let prevTime = performance.now();

  scene.onBeforeRenderObservable.add(() => {
    const now = performance.now();
    const dt  = Math.min((now - prevTime) / 1000, 0.05);
    prevTime  = now;

    let speed = 0, isSprinting = false;

    if (!state.isDead) {
      ({ speed, isSprinting } = computeMovement(camera, dt));
    } else if (state.colliderAgg) {
      state.colliderAgg.body.setLinearVelocity(BABYLON.Vector3.Zero());
    }

    // Dust particles only while actively sprinting fast
    if (sprintParticles) {
      sprintParticles.emitRate = (isSprinting && speed > 5) ? 80 : 0;
    }

    updatePlayerAnim(dt, speed);

    // Broadcast position to server
    if (network.socket) {
      const animState = state.isDead ? 'dead' : speed > 2 ? 'moving' : 'idle';
      network.updatePosition(
        state.playerNode.position,
        state.playerNode.rotationQuaternion.toEulerAngles().y,
        animState
      );
    }
  });

  window.addEventListener('resize', () => engine.resize());
  engine.runRenderLoop(() => scene.render());

  return engine;
}
