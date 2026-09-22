import * as THREE from 'three';

import { CHARACTER_APPEARANCES, CharacterId } from './CharacterTypes';
import { JetpackPhase, PlayerSnapshot, PlayerState } from './PlayerTypes';

export interface PlayerModel {
  root: THREE.Group;
  visual: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
}

const EYE_COLOR = 0x211337;

function standardMaterial(color: number, roughness = 0.78, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.08,
    emissive,
    emissiveIntensity: emissive === 0x000000 ? 0 : 0.24,
  });
}

function addMesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, position?: THREE.Vector3) {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.copy(position);
  parent.add(mesh);
  return mesh;
}

export function createPlayer(characterId: CharacterId = 'alex'): PlayerModel {
  const appearance = CHARACTER_APPEARANCES[characterId];
  const root = new THREE.Group();
  root.name = 'Player';
  const visual = new THREE.Group();
  visual.name = 'PlayerVisual';
  root.add(visual);

  const bodyMaterial = standardMaterial(appearance.body, 0.82, 0x090817);
  const cloakMaterial = standardMaterial(appearance.cloak, 0.86, 0x110724);
  const accentMaterial = standardMaterial(appearance.accent, 0.48, 0x1b8d9a);
  const skinMaterial = standardMaterial(appearance.skin, 0.7, 0x2c6774);
  const hairMaterial = standardMaterial(appearance.hair, 0.7, 0x090711);
  const shoeMaterial = standardMaterial(appearance.shoes, 0.5, 0x080912);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: EYE_COLOR });

  const body = new THREE.Group();
  body.name = 'PlayerBody';
  visual.add(body);

  addMesh(body, new THREE.CylinderGeometry(0.42, 0.5, 0.72, 8), bodyMaterial, new THREE.Vector3(0, 1.08, 0));
  addMesh(body, new THREE.ConeGeometry(0.7, 1.4, 8), cloakMaterial, new THREE.Vector3(0, 0.77, 0.04));
  addMesh(body, new THREE.TorusGeometry(0.38, 0.055, 6, 12), accentMaterial, new THREE.Vector3(0, 1.28, -0.02)).rotation.x = Math.PI / 2;
  addMesh(body, new THREE.SphereGeometry(0.11, 8, 6), accentMaterial, new THREE.Vector3(0, 1.48, -0.03));

  const head = new THREE.Group();
  head.name = 'PlayerHead';
  head.position.set(0, 2.05, 0);
  visual.add(head);
  addMesh(head, new THREE.SphereGeometry(0.42, 12, 8), skinMaterial);
  const hair = addMesh(head, new THREE.SphereGeometry(0.43, 12, 8), hairMaterial, new THREE.Vector3(0, 0.17, 0.12));
  hair.scale.set(1.05, 0.62, 0.78);
  addMesh(head, new THREE.SphereGeometry(0.085, 8, 6), eyeMaterial, new THREE.Vector3(-0.14, 0.01, -0.38));
  addMesh(head, new THREE.SphereGeometry(0.085, 8, 6), eyeMaterial, new THREE.Vector3(0.14, 0.01, -0.38));
  const mouth = addMesh(head, new THREE.SphereGeometry(0.095, 8, 6), eyeMaterial, new THREE.Vector3(0, -0.16, -0.38));
  mouth.scale.set(0.8, 0.45, 0.28);
  const hairAccent = addMesh(head, new THREE.ConeGeometry(0.1, 0.3, 6), accentMaterial, new THREE.Vector3(0, 0.43, -0.02));
  hairAccent.rotation.x = -0.2;

  const leftArm = createLimb(-1, cloakMaterial, accentMaterial, visual);
  const rightArm = createLimb(1, cloakMaterial, accentMaterial, visual);
  const leftLeg = createLeg(-1, bodyMaterial, shoeMaterial, visual);
  const rightLeg = createLeg(1, bodyMaterial, shoeMaterial, visual);

  return { root, visual, body, head, leftArm, rightArm, leftLeg, rightLeg };
}

function createLimb(side: -1 | 1, clothMaterial: THREE.Material, accentMaterial: THREE.Material, parent: THREE.Object3D) {
  const limb = new THREE.Group();
  limb.name = side < 0 ? 'PlayerLeftArm' : 'PlayerRightArm';
  limb.position.set(side * 0.45, 1.36, 0);
  addMesh(limb, new THREE.CylinderGeometry(0.09, 0.11, 0.52, 6), clothMaterial, new THREE.Vector3(0, -0.25, 0));
  addMesh(limb, new THREE.SphereGeometry(0.11, 7, 5), accentMaterial, new THREE.Vector3(0, -0.54, -0.01));
  parent.add(limb);
  return limb;
}

function createLeg(side: -1 | 1, clothMaterial: THREE.Material, shoeMaterial: THREE.Material, parent: THREE.Object3D) {
  const leg = new THREE.Group();
  leg.name = side < 0 ? 'PlayerLeftLeg' : 'PlayerRightLeg';
  leg.position.set(side * 0.22, 0.78, 0);
  addMesh(leg, new THREE.BoxGeometry(0.18, 0.58, 0.2), clothMaterial, new THREE.Vector3(0, -0.28, 0));
  addMesh(leg, new THREE.BoxGeometry(0.24, 0.14, 0.42), shoeMaterial, new THREE.Vector3(0, -0.61, -0.1));
  parent.add(leg);
  return leg;
}

export function updatePlayerVisual(
  model: PlayerModel,
  snapshot: PlayerSnapshot,
  elapsed: number,
  delta: number,
  laneVelocity: number,
  deathProgress: number,
) {
  const transition = 1 - Math.exp(-14 * Math.min(delta, 0.05));
  const runCycle = elapsed * 11;
  const running = snapshot.state === PlayerState.RUN && snapshot.jetpackPhase === JetpackPhase.NONE;
  const sliding = snapshot.state === PlayerState.SLIDE;
  const jumping = snapshot.state === PlayerState.JUMP;
  const falling = snapshot.state === PlayerState.FALL;
  const jetpacking = snapshot.jetpackPhase !== JetpackPhase.NONE;
  const runSwing = running ? Math.sin(runCycle) * 0.62 : 0;
  const runBounce = running ? Math.abs(Math.sin(runCycle)) * 0.06 : 0;
  const airProgress = Math.min(1, Math.abs(snapshot.verticalPosition) / 4.2);

  const armAngle = sliding ? 0.9 : jetpacking ? 0.2 : jumping ? -0.42 : falling ? -0.78 : runSwing;
  const oppositeArmAngle = sliding ? 0.9 : jetpacking ? -0.2 : jumping ? -0.42 : falling ? -0.78 : -runSwing;
  const legAngle = sliding ? -0.7 : jetpacking ? 0.08 : jumping ? -0.22 : falling ? 0.3 : -runSwing * 0.72;
  const oppositeLegAngle = sliding ? 0.7 : jetpacking ? -0.08 : jumping ? 0.22 : falling ? -0.3 : runSwing * 0.72;

  model.leftArm.rotation.z = approach(model.leftArm.rotation.z, armAngle, transition);
  model.rightArm.rotation.z = approach(model.rightArm.rotation.z, oppositeArmAngle, transition);
  model.leftLeg.rotation.x = approach(model.leftLeg.rotation.x, legAngle, transition);
  model.rightLeg.rotation.x = approach(model.rightLeg.rotation.x, oppositeLegAngle, transition);
  model.body.rotation.x = approach(model.body.rotation.x, sliding ? -0.22 : falling ? 0.1 : jumping ? -0.08 : 0, transition);
  model.body.position.y = approach(model.body.position.y, (sliding ? -0.1 : 0) + runBounce, transition);
  model.head.rotation.z = approach(model.head.rotation.z, running ? Math.sin(runCycle * 0.5) * 0.035 : falling ? -0.08 : 0, transition);
  model.head.rotation.x = approach(model.head.rotation.x, jumping ? -0.08 : falling ? 0.1 : 0, transition);
  model.visual.position.y = approach(model.visual.position.y, sliding ? -0.08 : jetpacking ? 0.03 : runBounce, transition);
  model.visual.rotation.x = approach(model.visual.rotation.x, jetpacking ? -0.08 : falling ? 0.12 : sliding ? 0.08 : 0, transition);
  model.visual.scale.y = approach(model.visual.scale.y, sliding ? 0.92 : 1 - airProgress * 0.015, transition);

  const laneLean = THREE.MathUtils.clamp(-laneVelocity * 0.08, -0.16, 0.16);
  model.root.rotation.z = approach(model.root.rotation.z, laneLean + deathProgress * Math.PI * 0.5, transition);
  model.root.rotation.y = approach(model.root.rotation.y, THREE.MathUtils.clamp(laneVelocity * 0.035, -0.07, 0.07), transition);
}

function approach(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}
