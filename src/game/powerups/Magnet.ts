import * as THREE from 'three';

export class Magnet extends THREE.Group {
  private readonly mesh: THREE.Group;
  private active = false;
  private baseY = 1.35;
  private phase = 0;

  constructor() {
    super();
    this.mesh = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: 0xff557d,
      emissive: 0x6b102f,
      emissiveIntensity: 0.65,
      metalness: 0.2,
      roughness: 0.4,
    });
    const left = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 8, 16, Math.PI), material);
    const right = left.clone();
    right.position.x = 0.36;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.11), material);
    bar.position.set(0.18, -0.18, 0);
    this.mesh.add(left, right, bar);
    this.mesh.rotation.z = Math.PI / 2;
    this.mesh.scale.setScalar(0.7);
    this.add(this.mesh);
    this.visible = false;
  }

  activate(x: number, y: number, z: number, phase: number) {
    this.position.set(x, y, z);
    this.baseY = y;
    this.phase = phase;
    this.active = true;
    this.visible = true;
  }

  update(deltaTime: number, elapsed: number) {
    if (!this.active) return;
    this.mesh.rotation.y += deltaTime * 0.9;
    this.mesh.rotation.z = Math.sin(elapsed * 2 + this.phase) * 0.06;
    this.position.y = this.baseY + Math.sin(elapsed * 2.5 + this.phase) * 0.08;
  }

  collect() {
    if (!this.active) return false;
    this.active = false;
    this.visible = false;
    return true;
  }

  deactivate() {
    this.active = false;
    this.visible = false;
  }

  isActive() {
    return this.active;
  }
}
