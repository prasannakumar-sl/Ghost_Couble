import * as THREE from 'three';

import { ChunkPool } from './ChunkPool';
import { ROAD_CONFIG, RoadChunk, RoadChunkConfig } from './RoadChunk';

export interface ChunkManagerConfig extends RoadChunkConfig {
  activeChunkCount: number;
  recycleDistance: number;
}

const DEFAULT_CHUNK_MANAGER_CONFIG: ChunkManagerConfig = {
  ...ROAD_CONFIG,
  activeChunkCount: 6,
  recycleDistance: 45,
};

export class ChunkManager {
  readonly config: ChunkManagerConfig;
  private readonly pool: ChunkPool;
  private readonly activeChunks: RoadChunk[] = [];
  private furthestAheadZ = 0;

  constructor(scene: THREE.Scene, config: Partial<ChunkManagerConfig> = {}) {
    this.config = { ...DEFAULT_CHUNK_MANAGER_CONFIG, ...config };
    this.pool = new ChunkPool(scene, this.config.activeChunkCount, this.config);
    this.reset();
  }

  reset() {
    this.activeChunks.length = 0;
    this.furthestAheadZ = 0;
    this.pool.chunks.forEach((chunk, index) => {
      const positionZ = -index * this.config.chunkLength;
      chunk.configure(positionZ);
      this.activeChunks.push(chunk);
      this.furthestAheadZ = Math.min(this.furthestAheadZ, positionZ);
    });
  }

  getActiveChunks() {
    return this.activeChunks;
  }

  update(playerZ: number) {
    while (this.activeChunks[0] && playerZ < this.activeChunks[0].startZ - this.config.recycleDistance) {
      const recycled = this.activeChunks.shift();
      if (!recycled) return;

      this.furthestAheadZ -= this.config.chunkLength;
      recycled.configure(this.furthestAheadZ);
      this.activeChunks.push(recycled);
    }
  }

  dispose() {
    this.pool.dispose();
    this.activeChunks.length = 0;
  }
}
