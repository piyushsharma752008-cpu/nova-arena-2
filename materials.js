import * as BABYLON from '@babylonjs/core';
import { state } from './state.js';
import { mats } from './materials.js';

export let skyMat;
export let sun;
export let hemi;

export function initWorld() {
  const scene = state.scene;

  scene.fogMode    = BABYLON.Scene.FOGMODE_NONE;
  scene.fogDensity = 0.003;
  scene.fogColor   = new BABYLON.Color3(0.65, 0.75, 0.88);

  // Ambient light
  hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity   = 0.55;
  hemi.diffuse     = new BABYLON.Color3(0.92, 0.84, 0.72);
  hemi.groundColor = new BABYLON.Color3(0.25, 0.20, 0.15);

  // Sun (key light + shadow caster)
  sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1.0, -0.5), scene);
  sun.intensity = 2.8;
  sun.position  = new BABYLON.Vector3(80, 120, 80);
  sun.diffuse   = new BABYLON.Color3(1.0, 0.88, 0.65);
  sun.specular  = new BABYLON.Color3(1.0, 0.92, 0.75);

  // Blue fill light
  const fill = new BABYLON.DirectionalLight('fill', new BABYLON.Vector3(0.6, -0.3, 0.8), scene);
  fill.intensity = 0.35;
  fill.diffuse   = new BABYLON.Color3(0.45, 0.55, 0.85);
  fill.specular  = new BABYLON.Color3(0, 0, 0);

  // Cascaded shadows
  state.shadowGen = new BABYLON.CascadedShadowGenerator(2048, sun);
  Object.assign(state.shadowGen, {
    numCascades:              4,
    lambda:                   0.85,
    cascadeBlendPercentage:   0.08,
    shadowMaxZ:               200,
    usePercentageCloserFiltering: true,
    filteringQuality: BABYLON.ShadowGenerator.QUALITY_HIGH,
  });
  state.shadowGen.setDarkness(0.25);

  // Skybox
  const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 2000 }, scene);
  skybox.infiniteDistance = true;

  if (typeof BABYLON.SkyMaterial !== 'undefined') {
    skyMat = new BABYLON.SkyMaterial('sky', scene);
    Object.assign(skyMat, {
      backFaceCulling:   false,
      azimuth:           0.25,
      luminance:         0.85,
      turbidity:         6,
      rayleigh:          2.5,
      mieCoefficient:    0.005,
      mieDirectionalG:   0.98,
      inclination:       0.28,
    });
    skybox.material = skyMat;
  } else {
    // Fallback gradient sky
    const gradMat = new BABYLON.GradientMaterial('skyGrad', scene);
    Object.assign(gradMat, {
      topColor:       new BABYLON.Color3(0.4, 0.65, 0.95),
      bottomColor:    new BABYLON.Color3(0.85, 0.75, 0.60),
      offset:         0.5,
      backFaceCulling: false,
    });
    skybox.material = gradMat;
  }

  // Base ground plane
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 600, height: 600, subdivisions: 2 }, scene);
  ground.material       = mats.matGround;
  ground.receiveShadows = true;
  if (state.physicsOk) {
    new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
  }
}

// Map hour (0-24) → sky colours and light intensities
export function updateDayNight(t) {
  const scene = state.scene;

  // Sky colour by time of day
  let skyR, skyG, skyB;
  if      (t < 6)  { skyR = 0.04; skyG = 0.05; skyB = 0.12; }
  else if (t < 8)  { const p = (t-6)/2;  skyR = 0.04+p*0.55; skyG = 0.05+p*0.65; skyB = 0.12+p*0.78; }
  else if (t < 17) { skyR = 0.45; skyG = 0.70; skyB = 0.92; }
  else if (t < 20) { const p = (t-17)/3; skyR = 0.45+p*0.15; skyG = 0.70-p*0.35; skyB = 0.92-p*0.65; }
  else             { skyR = 0.04; skyG = 0.05; skyB = 0.12; }

  if (!skyMat) scene.clearColor = new BABYLON.Color4(skyR, skyG, skyB, 1);
  scene.fogColor = new BABYLON.Color3(skyR*0.85, skyG*0.85, skyB*0.9);

  // FIX: sun / hemi are only valid after initWorld() — guard before use
  if (!sun || !hemi) return;

  const sunInt   = Math.max(0.05, -Math.cos((t/24)*Math.PI*2));
  sun.intensity  = sunInt * 2.8;
  hemi.intensity = 0.35 + sunInt * 0.45;

  const sunAngle = ((t-6)/24)*Math.PI*2;
  sun.direction  = new BABYLON.Vector3(
    Math.cos(sunAngle),
    -Math.abs(Math.sin(sunAngle))*0.85 - 0.15,
    0.4
  ).normalize();

  // Sun colour: warm at dawn/dusk, white at noon, blue at night
  if      (t > 5  && t < 9)  { const p=(t-5)/4;  sun.diffuse = new BABYLON.Color3(1.0, 0.55+p*0.35, 0.25+p*0.4); }
  else if (t > 16 && t < 20) { const p=(t-16)/4; sun.diffuse = new BABYLON.Color3(1.0, 0.88-p*0.4,  0.65-p*0.5); }
  else if (t >= 9 && t <= 16){ sun.diffuse = new BABYLON.Color3(1.0, 0.90, 0.70); }
  else                        { sun.diffuse = new BABYLON.Color3(0.25, 0.38, 0.72); }

  if (skyMat) {
    skyMat.inclination = 0.05 + (1 - Math.abs(Math.sin((t/24)*Math.PI))) * 0.45;
  }

  const isNight = (t < 7 || t > 19);
  if (mats.matBulb) {
    const glow = isNight ? 1.0 : 0.12;
    mats.matBulb.emissiveColor = new BABYLON.Color3(glow, glow*0.85, glow*0.45);
  }

  if (state.pipeline) {
    state.pipeline.imageProcessing.exposure = (t >= 9 && t <= 18) ? 1.05 : 0.95;
  }
}
