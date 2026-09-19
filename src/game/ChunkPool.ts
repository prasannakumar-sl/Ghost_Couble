import * as THREE from 'three';

import { RoadChunk, RoadChunkConfig } from './RoadChunk';

export class ChunkPool {
  readonly chunks: RoadChunk[];

  constructor(scene: THREE.Scene, size: number, config: Partial<RoadChunkConfig> = {}) {
    this.chunks = Array.from({ length: size }, () => new RoadChunk(config));
    this.chunks.forEach((chunk) => {
      chunk.reset();
      scene.add(chunk);
    });
  }

  dispose() {
    this.chunks.forEach((chunk) => {
      chunk.parent?.remove(chunk);
      chunk.dispose();
    });
  }
}
