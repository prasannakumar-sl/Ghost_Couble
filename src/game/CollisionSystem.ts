import { PlayerController } from './PlayerController';
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

  constructor(config: Partial<CollisionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  update(
    player: PlayerController,
    snapshot: PlayerSnapshot,
    obstacles: readonly Obstacle[],
    onHit: () => boolean,
  ) {
    if (snapshot.state === PlayerState.HIT || snapshot.state === PlayerState.DEAD) return;

    const playerHalfWidth = this.config.playerWidth / 2;
    const playerHalfDepth = this.config.playerDepth / 2;
    const playerHeight = snapshot.state === PlayerState.SLIDE ? this.config.slideHeight : this.config.standingHeight;
    const playerMinY = player.position.y;
    const playerMaxY = playerMinY + playerHeight;
    const playerMinX = player.position.x - playerHalfWidth;
    const playerMaxX = player.position.x + playerHalfWidth;
    const playerMinZ = player.position.z - playerHalfDepth;
    const playerMaxZ = player.position.z + playerHalfDepth;

    for (const obstacle of obstacles) {
      if (!obstacle.isActive()) continue;
      const definition = obstacle.definition;
      obstacle.getWorldPosition(this.obstacleWorldPosition);
      const obstacleMinX = this.obstacleWorldPosition.x - definition.width / 2;
      const obstacleMaxX = this.obstacleWorldPosition.x + definition.width / 2;
      const obstacleMinY = this.obstacleWorldPosition.y + definition.bottom;
      const obstacleMaxY = obstacleMinY + definition.height;
      const obstacleWorldZ = this.obstacleWorldPosition.z;
      const obstacleMinZ = obstacleWorldZ - definition.depth / 2;
      const obstacleMaxZ = obstacleWorldZ + definition.depth / 2;

      if (
        playerMinX < obstacleMaxX &&
        playerMaxX > obstacleMinX &&
        playerMinY < obstacleMaxY &&
        playerMaxY > obstacleMinY &&
        playerMinZ < obstacleMaxZ &&
        playerMaxZ > obstacleMinZ
      ) {
        if (this.reportedObstaclePositions.get(obstacle) === obstacleWorldZ) return;
        if (onHit()) this.reportedObstaclePositions.set(obstacle, obstacleWorldZ);
        return;
      }
    }
  }

  reset() {
    this.reportedObstaclePositions.clear();
  }
}
