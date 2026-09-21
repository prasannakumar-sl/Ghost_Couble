import * as THREE from 'three';

import { Lane } from '../PlayerTypes';

export interface CoinPlacement {
  lane: Lane;
  localZ: number;
  height: number;
}

export class Coin extends THREE.Group {
  private readonly mesh: THREE.Mesh;
  private active = false;
  private collecting = false;
  private collectionElapsed = 0;
  private baseY = 0;
  private bobPhase = 0;

  constructor() {
    super();
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffd45c,
        transparent: true,
        emissive: 0x6d3b08,
        emissiveIntensity: 0.7,
        roughness: 0.55,
        metalness: 0.35,
      }),
    );
    this.mesh.rotation.x = Math.PI / 2;
    this.add(this.mesh);
    this.visible = false;
  }

  activate(placement: CoinPlacement, laneWidth: number, phase: number) {
    this.position.set(placement.lane * laneWidth, placement.height, placement.localZ);
    this.baseY = placement.height;
    this.bobPhase = phase;
    this.mesh.scale.setScalar(1);
    (this.mesh.material as THREE.MeshStandardMaterial).opacity = 1;
    this.collecting = false;
    this.collectionElapsed = 0;
    this.active = true;
    this.visible = true;
  }

  update(deltaTime: number, elapsed: number) {
    if (this.collecting) {
      this.collectionElapsed += deltaTime;
      const progress = Math.min(1, this.collectionElapsed / 0.2);
      this.mesh.rotation.y += deltaTime * 8;
      this.position.y = this.baseY + progress * 0.45;
      this.mesh.scale.setScalar(1 - progress);
      (this.mesh.material as THREE.MeshStandardMaterial).opacity = 1 - progress;
      if (progress === 1) {
        this.collecting = false;
        this.visible = false;
      }
      return;
    }
    if (!this.active) return;
    this.mesh.rotation.y += deltaTime * 4.2;
    this.position.y = this.baseY + Math.sin(elapsed * 4 + this.bobPhase) * 0.08;
  }

  collect() {
    if (!this.active) return false;
    this.active = false;
    this.collecting = true;
    this.collectionElapsed = 0;
    return true;
  }

  deactivate() {
    this.active = false;
    this.collecting = false;
    this.collectionElapsed = 0;
    this.visible = false;
  }

  isActive() {
    return this.active;
  }

  isAvailable() {
    return !this.active && !this.collecting;
  }
}
