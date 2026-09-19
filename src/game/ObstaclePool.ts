import * as THREE from 'three';

import { Obstacle } from './Obstacle';

export class ObstaclePool {
  readonly obstacles: Obstacle[];
  private nextIndex = 0;

  constructor(size: number) {
    this.obstacles = Array.from({ length: size }, () => new Obstacle());
  }

  acquire() {
    const obstacle = this.obstacles[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.obstacles.length;
    return obstacle;
  }

  reset() {
    this.nextIndex = 0;
    this.obstacles.forEach((obstacle) => obstacle.deactivate());
  }

  dispose() {
    this.obstacles.forEach((obstacle) => {
      obstacle.parent?.remove(obstacle);
      obstacle.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
        else mesh.material?.dispose();
      });
    });
  }
}
