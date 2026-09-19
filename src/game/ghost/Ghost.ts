import * as THREE from 'three';

import { GhostState } from './GhostState';

export function createGhost() {
  const ghost = new THREE.Group();
  const bodyMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9f7ff,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 8), bodyMaterial);
  body.scale.y = 1.25;
  body.position.y = 0.82;
  ghost.add(body);

  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.78, 1.15, 12), bodyMaterial);
  skirt.position.y = 0.28;
  skirt.rotation.z = Math.PI;
  ghost.add(skirt);

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff4d87 });
  for (const x of [-0.2, 0.2]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 6), eyeMaterial);
    eye.position.set(x, 1.05, 0.64);
    ghost.add(eye);
  }

  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x170c32 }),
  );
  mouth.scale.set(0.7, 1.45, 0.4);
  mouth.position.set(0, 0.72, 0.66);
  ghost.add(mouth);

  return ghost;
}

export function updateGhostVisual(ghost: THREE.Group, state: GhostState, elapsed: number) {
  const isChasing = state === GhostState.CHASE;
  const isAttacking = state === GhostState.ATTACK;
  const pulse = isChasing ? 1 + Math.sin(elapsed * 9) * 0.04 : 1;
  const attackScale = isAttacking ? 1.45 : 1;
  ghost.scale.setScalar(pulse * attackScale);
  ghost.rotation.y = Math.sin(elapsed * 1.5) * (isAttacking ? 0.18 : 0.08);
  ghost.rotation.z = Math.sin(elapsed * 3.2) * 0.035;
}
