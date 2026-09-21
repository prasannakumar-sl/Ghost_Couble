import * as THREE from 'three';

export class Shield extends THREE.Group {
  private readonly mesh: THREE.Mesh;
  private active = false;
  private baseY = 1.25;
  private phase = 0;

  constructor() {
    super();
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.62);
    shape.lineTo(0.52, 0.34);
    shape.lineTo(0.43, -0.32);
    shape.lineTo(0, -0.62);
    shape.lineTo(-0.43, -0.32);
    shape.lineTo(-0.52, 0.34);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.03, bevelSegments: 2 });
    geometry.center();
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x48e7ff,
        emissive: 0x087dba,
        emissiveIntensity: 1.2,
        metalness: 0.4,
        roughness: 0.3,
        transparent: true,
        opacity: 0.95,
      }),
    );
    this.add(this.mesh);
    this.visible = false;
  }

  activate(x: number, y: number, z: number, phase: number) {
    this.position.set(x, y, z);
    this.baseY = y;
    this.phase = phase;
    this.mesh.scale.setScalar(1);
    this.active = true;
    this.visible = true;
  }

  update(deltaTime: number, elapsed: number) {
    if (!this.active) return;
    this.mesh.rotation.y += deltaTime * 1.8;
    this.mesh.rotation.z = Math.sin(elapsed * 2 + this.phase) * 0.08;
    this.position.y = this.baseY + Math.sin(elapsed * 2.5 + this.phase) * 0.1;
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
