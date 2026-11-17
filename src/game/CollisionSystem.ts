import * as THREE from 'three';

import { PlayerSnapshot, PlayerState } from './PlayerTypes';
import { Obstacle } from './Obstacle';


export interface CollisionConfig {
  playerWidth: number;
  playerDepth: number;
  standingHeight: number;
  slideHeight: number;
}

const DEFAULT_CONFIG: CollisionConfig = {
  playerWidth: 0.9,
  playerDepth: 0.85,
  standingHeight: 2.45,
  slideHeight: 1.4,
};

export class CollisionSystem {
  readonly config: CollisionConfig;
  private readonly reportedObstaclePositions = new Map<Obstacle, number>();
  private readonly obstacleWorldPosition = new THREE.Vector3();
  private readonly playerBounds = new THREE.Box3();
  private readonly obstacleBounds = new THREE.Box3();
  private readonly playerCenter = new THREE.Vector3();
  private readonly playerSize = new THREE.Vector3();

  constructor(config: Partial<CollisionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  update(
    player: THREE.Object3D,
    snapshot: PlayerSnapshot,
    obstacles: readonly Obstacle[],
    onHit: (obstacle: Obstacle) => boolean,
  ) {
    if (snapshot.state === PlayerState.HIT || snapshot.state === PlayerState.DEAD) return;

    const playerHeight = snapshot.state === PlayerState.SLIDE ? this.config.slideHeight : this.config.standingHeight;
    this.playerCenter.set(player.position.x, player.position.y + playerHeight / 2, player.position.z);
    this.playerSize.set(this.config.playerWidth, playerHeight, this.config.playerDepth);
    this.playerBounds.setFromCenterAndSize(this.playerCenter, this.playerSize);

    for (const obstacle of obstacles) {
      if (!obstacle.isActive()) continue;
      obstacle.updateWorldMatrix(true, false);
      obstacle.getWorldPosition(this.obstacleWorldPosition);
      const obstacleWorldZ = this.obstacleWorldPosition.z;
      this.obstacleBounds.setFromObject(obstacle);

      if (this.playerBounds.intersectsBox(this.obstacleBounds)) {
        if (this.reportedObstaclePositions.get(obstacle) === obstacleWorldZ) return;
        if (onHit(obstacle)) this.reportedObstaclePositions.set(obstacle, obstacleWorldZ);
        return;
      }
    }
  }

  reset() {
    this.reportedObstaclePositions.clear();
  }
}
