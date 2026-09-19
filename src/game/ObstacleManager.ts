import { ChunkManager } from './ChunkManager';
import { RoadChunk } from './RoadChunk';
import { LANES } from './PlayerTypes';
import { Obstacle } from './Obstacle';
import { ObstaclePlacement, ObstacleType } from './ObstacleTypes';
import { ObstaclePool } from './ObstaclePool';

export interface ObstacleManagerConfig {
  obstaclePoolSize: number;
  obstacleFrequency: number;
}

const DEFAULT_CONFIG: ObstacleManagerConfig = {
  obstaclePoolSize: 12,
  obstacleFrequency: 0.8,
};

export class ObstacleManager {
  readonly config: ObstacleManagerConfig;
  readonly pool: ObstaclePool;
  private readonly chunkManager: ChunkManager;
  private readonly configuredPositions = new Map<RoadChunk, number>();
  private readonly chunkObstacles = new Map<RoadChunk, Obstacle[]>();
  private patternIndex = 0;

  constructor(chunkManager: ChunkManager, config: Partial<ObstacleManagerConfig> = {}) {
    this.chunkManager = chunkManager;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pool = new ObstaclePool(this.config.obstaclePoolSize);
  }

  update() {
    const chunks = this.chunkManager.getActiveChunks();
    for (const chunk of chunks) {
      if (this.configuredPositions.get(chunk) === chunk.position.z) continue;
      this.configureChunk(chunk);
    }
  }

  get obstacles() {
    return this.pool.obstacles;
  }

  private configureChunk(chunk: RoadChunk) {
    const previous = this.chunkObstacles.get(chunk);
    previous?.forEach((obstacle) => obstacle.deactivate());

    const placements = this.createPattern();
    const configured: Obstacle[] = [];
    placements.forEach((placement) => {
      const obstacle = this.pool.acquire();
      obstacle.activate(placement, chunk.config.laneWidth);
      chunk.obstacleRoot.add(obstacle);
      configured.push(obstacle);
    });

    this.chunkObstacles.set(chunk, configured);
    chunk.setLayout({ obstacles: placements });
    this.configuredPositions.set(chunk, chunk.position.z);
  }

  private createPattern(): ObstaclePlacement[] {
    const pattern = this.patternIndex % 5;
    this.patternIndex += 1;
    if (pattern === 0 && this.config.obstacleFrequency < 1) return [];
    const localZ = -8;
    if (pattern === 1) return [{ type: ObstacleType.BLOCK, lane: LANES.CENTER, localZ }];
    if (pattern === 2) return [{ type: ObstacleType.LOW, lane: LANES.RIGHT, localZ }];
    if (pattern === 3) return [{ type: ObstacleType.OVERHEAD, lane: LANES.CENTER, localZ }];
    if (pattern === 4) {
      return [
        { type: ObstacleType.BLOCK, lane: LANES.LEFT, localZ },
        { type: ObstacleType.BLOCK, lane: LANES.RIGHT, localZ },
      ];
    }
    return [{ type: ObstacleType.BLOCK, lane: LANES.CENTER, localZ }];
  }

  reset() {
    this.chunkManager.getActiveChunks().forEach((chunk) => chunk.obstacleRoot.clear());
    this.pool.reset();
    this.configuredPositions.clear();
    this.chunkObstacles.clear();
    this.patternIndex = 0;
  }

  dispose() {
    this.pool.dispose();
    this.configuredPositions.clear();
    this.chunkObstacles.clear();
  }
}
