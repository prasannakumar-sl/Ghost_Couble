import * as THREE from 'three';

export interface CameraConfig {
  distance: number;
  height: number;
  lookAhead: number;
  smoothing: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  distance: 8.5,
  height: 5.2,
  lookAhead: 7,
  smoothing: 5.5,
};

export class CameraController {
  private readonly desiredPosition = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();
  private readonly config: CameraConfig;

  constructor(config: Partial<CameraConfig> = {}) {
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
  }

  update(camera: THREE.PerspectiveCamera, player: THREE.Vector3, deltaTime: number) {
    const blend = 1 - Math.exp(-this.config.smoothing * Math.min(deltaTime, 0.05));
    this.desiredPosition.set(player.x, player.y + this.config.height, player.z + this.config.distance);
    camera.position.lerp(this.desiredPosition, blend);
    this.lookTarget.set(player.x, player.y + 1.15, player.z - this.config.lookAhead);
    camera.lookAt(this.lookTarget);
  }
}
