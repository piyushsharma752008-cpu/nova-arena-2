export const state = {
  // Engine / scene
  scene:    null,
  engine:   null,
  pipeline: null,
  shadowGen: null,
  physicsOk: false,

  // Player
  playerNode:   null,
  collider:     null,
  colliderAgg:  null,
  keys:         {},
  health:       100,
  stamina:      100,
  isDead:       false,  // FIX: was used but never declared
  team:         'alpha', // FIX: was used but never declared

  // World
  money:      4250,
  gameTime:   14.0,
  wantedLevel: 0,

  // Map data
  buildingFootprints: [],
  goal:         null,
  goalReached:  false,
};
