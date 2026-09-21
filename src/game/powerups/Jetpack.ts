import * as THREE from 'three';

export class Jetpack extends THREE.Group {
  private readonly body: THREE.Mesh;
  private readonly flame: THREE.Mesh;
  private active = false;
  private baseY = 1.55;
  private phase = 0;

  constructor() {
    super();
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c72ff,
      emissive: 0x291b72,
      emissiveIntensity: 0.75,
      metalness: 0.35,
      roughness: 0.38,
    });
    this.body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.78, 12), bodyMaterial);
    this.body.rotation.z = Math.PI / 2;

    const nozzleMaterial = new THREE.MeshStandardMaterial({
      color: 0x4bd8ff,
      emissive: 0x0a7d9f,
      emissiveIntensity: 0.9,
      metalness: 0.25,
      roughness: 0.3,
    });
    const leftNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.45, 10), nozzleMaterial);
    leftNozzle.position.set(-0.2, -0.48, 0);
    const rightNozzle = leftNozzle.clone();
    rightNozzle.position.x = 0.2;

    this.flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.4, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd45c, transparent: true, opacity: 0.85 }),
    );
    this.flame.position.y = -0.78;
    this.add(this.body, leftNozzle, rightNozzle, this.flame);
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
    this.body.rotation.y += deltaTime * 2.4;
    this.position.y = this.baseY + Math.sin(elapsed * 3 + this.phase) * 0.1;
    this.flame.scale.setScalar(0.85 + Math.sin(elapsed * 12 + this.phase) * 0.15);
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
