import * as BABYLON from '@babylonjs/core';
import { state } from './state.js';

export const mats = {};

// Cached PBR factory — call initMaterials() once at scene start
export function initMaterials() {
  const scene = state.scene;
  const cache = {};

  function pbr(name, albedo, metallic = 0.0, roughness = 0.7, emissive) {
    if (cache[name]) return cache[name];
    const m = new BABYLON.PBRMaterial(name, scene);
    m.albedoColor = Array.isArray(albedo)
      ? new BABYLON.Color3(...albedo)
      : albedo;
    m.metallic  = metallic;
    m.roughness = roughness;
    m.useRadianceOcclusion = true;
    m.useHorizonOcclusion  = true;
    if (emissive) {
      m.emissiveColor = Array.isArray(emissive)
        ? new BABYLON.Color3(...emissive)
        : emissive;
    }
    return (cache[name] = m);
  }

  // Environment
  mats.matGround   = pbr('ground',    [0.32, 0.42, 0.22], 0.0, 0.95);
  mats.matRoad     = pbr('road',      [0.16, 0.17, 0.19], 0.0, 0.92);
  mats.matSidewalk = pbr('sidewalk',  [0.52, 0.50, 0.48], 0.0, 0.88);
  mats.matRoadLine = pbr('roadline',  [0.95, 0.90, 0.55], 0.0, 0.70);
  mats.matRoofDark = pbr('roofDark',  [0.08, 0.09, 0.11], 0.15, 0.75);
  mats.matConcrete = pbr('concrete',  [0.72, 0.70, 0.65], 0.0,  0.85);
  mats.matMetal    = pbr('metal',     [0.65, 0.65, 0.68], 0.85, 0.35);
  mats.matTrunk    = pbr('trunk',     [0.30, 0.18, 0.10], 0.0,  0.90);
  mats.matLeaf     = pbr('leaf',      [0.14, 0.52, 0.22], 0.0,  0.85);
  mats.matLamp     = pbr('lamp',      [0.60, 0.60, 0.62], 0.80, 0.40);
  mats.matBulb     = pbr('bulb',      [1.0,  0.95, 0.75], 0.0,  0.30, [1.0, 0.82, 0.40]);
  mats.matDoor     = pbr('door',      [0.12, 0.09, 0.07], 0.25, 0.70);
  mats.matWheelR   = pbr('wheel',     [0.05, 0.05, 0.06], 0.0,  0.95);
  mats.matChrome   = pbr('chrome',    [0.85, 0.85, 0.88], 0.95, 0.15);
  mats.matWood     = pbr('wood',      [0.42, 0.28, 0.14], 0.0,  0.85);
  mats.matGoal     = pbr('goal',      [1.0,  0.85, 0.15], 0.0,  0.40, [0.8, 0.55, 0.0]);

  // Player character
  mats.matPlayer   = pbr('player',    [0.12, 0.68, 0.48], 0.0, 0.60);
  mats.matSkin     = pbr('skin',      [0.88, 0.72, 0.60], 0.0, 0.75);
  mats.matPants    = pbr('pants',     [0.12, 0.13, 0.18], 0.0, 0.80);
  mats.matShoe     = pbr('shoe',      [0.95, 0.94, 0.92], 0.0, 0.60);
  mats.matHair     = pbr('hair',      [0.06, 0.06, 0.07], 0.02, 0.65);

  // Transparency materials
  const setAlpha = (m, a) => {
    m.alpha = a;
    m.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
  };
  mats.matGlass     = pbr('glass',     [0.60, 0.72, 0.82], 0.05, 0.05);
  setAlpha(mats.matGlass, 0.55);
  mats.matGlassDark = pbr('glassDark', [0.10, 0.12, 0.15], 0.05, 0.04);
  setAlpha(mats.matGlassDark, 0.75);
  mats.matWinWarm   = pbr('winWarm',   [1.0,  0.82, 0.40], 0.0,  0.60, [0.85, 0.60, 0.15]);
  setAlpha(mats.matGoal, 0.80);

  // Building palette (8 variants)
  const BLDG_COLORS = [
    [0.88, 0.84, 0.78], [0.72, 0.68, 0.65], [0.55, 0.62, 0.72],
    [0.78, 0.72, 0.60], [0.62, 0.56, 0.52], [0.80, 0.80, 0.76],
    [0.60, 0.65, 0.70], [0.42, 0.38, 0.34],
  ];
  mats.bldgMats = BLDG_COLORS.map((c, i) =>
    pbr(`bldg_${i}`, c, 0.0, 0.72 + Math.random() * 0.2)
  );

  // Glass tower variants
  mats.glassTowerMats = [
    pbr('gtower0', [0.52, 0.68, 0.80], 0.05, 0.05),
    pbr('gtower1', [0.35, 0.52, 0.65], 0.05, 0.04),
    pbr('gtower2', [0.42, 0.55, 0.50], 0.05, 0.06),
  ];
  mats.glassTowerMats.forEach(m => setAlpha(m, 0.62));

  // Expose factory for ad-hoc use in other modules
  mats.pbr = pbr;
}
