import * as THREE from 'three';

export class ExtraHeart extends THREE.Group {
  private readonly mesh: THREE.Mesh;
  private active = false;
  private baseY = 1.3;
  private phase = 0;

  constructor() {
    super();
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.2);
    shape.bezierCurveTo(-0.55, 0.2, -0.4, 0.65, 0, 0.38);
    shape.bezierCurveTo(0.4, 0.65, 0.55, 0.2, 0, -0.2);
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.center();
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0xff6c9b,
        emissive: 0x75163d,
        emissiveIntensity: 0.55,
        roughness: 0.45,
        metalness: 0.15,
      }),
    );
    this.mesh.scale.setScalar(0.65);
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
    this.mesh.rotation.y += deltaTime * 0.8;
    this.position.y = this.baseY + Math.sin(elapsed * 2.2 + this.phase) * 0.07;
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
