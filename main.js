import * as BABYLON from '@babylonjs/core';
import { state } from './state.js';
import { mats } from './materials.js';

const ARENA_HALF = 70;   // arena spans ±70 units; walls at ±72
const BLOCK_OFFSETS = [
  { x: -35, z: -35 },
  { x:  35, z: -35 },
  { x: -35, z:  35 },
  { x:  35, z:  35 },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function staticBox(name, dims, pos, mat, scene) {
  const mesh = BABYLON.MeshBuilder.CreateBox(name, dims, scene);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.material = mat;
  new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
  return mesh;
}

function buildWall(name, w, d, px, pz, scene) {
  staticBox(name, { width: w, height: 40, depth: d }, { x: px, y: 20, z: pz }, mats.matRoad, scene);
}

// ── public API ────────────────────────────────────────────────────────────────

export function buildArena(scene) {
  // Ground plane
  const ground = BABYLON.MeshBuilder.CreateGround('arenaGround', { width: 140, height: 140 }, scene);
  ground.material = mats.matRoad;
  new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, scene);

  // Four city blocks
  BLOCK_OFFSETS.forEach((bo, i) => buildCityBlock(scene, bo.x, bo.z, i));

  // Centre objective platform
  const mid = BABYLON.MeshBuilder.CreateCylinder('midCenter', { diameter: 10, height: 1 }, scene);
  mid.position.y = 0.5;
  mid.material   = mats.matConcrete;
  new BABYLON.PhysicsAggregate(mid, BABYLON.PhysicsShapeType.CYLINDER, { mass: 0 }, scene);

  // Arena boundary walls
  const r = ARENA_HALF + 2;
  buildWall('wallN', 140, 4,  0,  r, scene);
  buildWall('wallS', 140, 4,  0, -r, scene);
  buildWall('wallE',   4, 140, r,  0, scene);
  buildWall('wallW',   4, 140,-r,  0, scene);
}

function buildCityBlock(scene, cx, cz, index) {
  // Sidewalk base
  staticBox(`blockBase_${index}`, { width: 50, height: 1, depth: 50 }, { x: cx, y: 0.5, z: cz }, mats.matSidewalk, scene);

  const bMat = mats.bldgMats[index % mats.bldgMats.length];
  const W = 40, D = 40, H = 30, T = 1; // building dims / wall thickness
  const hH = H / 2, hW = W / 2, hD = D / 2;

  // Building shell walls
  const walls = [
    // [name,        dims,                  offset from (cx,H/2+1,cz)]
    [`w_L_${index}`, { width: T,   height: H, depth: D   }, { x: cx-hW,       y: hH+1, z: cz     }],
    [`w_R_${index}`, { width: T,   height: H, depth: D   }, { x: cx+hW,       y: hH+1, z: cz     }],
    [`w_B_${index}`, { width: W,   height: H, depth: T   }, { x: cx,          y: hH+1, z: cz-hD  }],
    // Front wall: two side panels + header above door
    [`w_FL_${index}`,{ width: hW-4,height: H, depth: T   }, { x: cx-hW/2-2,   y: hH+1, z: cz+hD  }],
    [`w_FR_${index}`,{ width: hW-4,height: H, depth: T   }, { x: cx+hW/2+2,   y: hH+1, z: cz+hD  }],
    [`w_FT_${index}`,{ width: 8,   height: H-8, depth: T }, { x: cx,          y: hH+5, z: cz+hD  }],
  ];
  walls.forEach(([name, dims, pos]) => {
    const m = BABYLON.MeshBuilder.CreateBox(name, dims, scene);
    m.position.set(pos.x, pos.y, pos.z);
    m.material = bMat;
    new BABYLON.PhysicsAggregate(m, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
  });

  // Interior floors (3 levels)
  for (let fl = 1; fl <= 3; fl++) {
    staticBox(
      `floor_${index}_${fl}`,
      { width: W, height: 0.5, depth: D },
      { x: cx, y: fl * 8 + 1, z: cz },
      mats.matConcrete, scene
    );
  }

  // Cover crates
  for (let i = 0; i < 4; i++) {
    staticBox(
      `crate_${index}_${i}`,
      { width: 2, height: 2, depth: 2 },
      { x: cx + (Math.random()*20-10), y: 2, z: cz + (Math.random()*20-10) },
      mats.matWood, scene
    );
  }
}

// FIX: spawn points moved inside arena bounds (was ±55-65, walls at ±72 so fine,
//      but kept safely inside the ground plane at ±70)
export function buildSpawnPoints() {
  return {
    alpha: [
      new BABYLON.Vector3(-50, 2, -50),
      new BABYLON.Vector3(-40, 2, -60),
      new BABYLON.Vector3(-60, 2, -40),
    ],
    omega: [
      new BABYLON.Vector3( 50, 2,  50),
      new BABYLON.Vector3( 40, 2,  60),
      new BABYLON.Vector3( 60, 2,  40),
    ],
  };
}
