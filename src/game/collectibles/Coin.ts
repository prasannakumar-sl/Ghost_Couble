import * as THREE from 'three';

import { Lane } from '../PlayerTypes';

const worldPosition = new THREE.Vector3();

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
      new THREE.CylinderGeometry(0.2, 0.2, 0.07, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffd45c,
        transparent: true,
        emissive: 0x6d3b08,
        emissiveIntensity: 0.55,
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
    const pulse = 1 + Math.sin(elapsed * 3 + this.bobPhase) * 0.025;
    this.mesh.scale.setScalar(pulse);
    this.position.y = this.baseY + Math.sin(elapsed * 4 + this.bobPhase) * 0.08;
  }

  attractTo(x: number, y: number, z: number, deltaTime: number) {
    if (!this.active) return;
    this.getWorldPosition(worldPosition);
    const blend = 1 - Math.exp(-deltaTime * 8);
    this.position.x += (x - worldPosition.x) * blend;
    this.position.y += (y - worldPosition.y) * blend;
    this.position.z += (z - worldPosition.z) * blend;
    this.baseY = this.position.y;
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
