import * as THREE from 'three';

import { ChunkManager } from '../ChunkManager';
import { GameState } from '../GameRuntime';
import { LANES } from '../PlayerTypes';
import { RoadChunk } from '../RoadChunk';
import { Shield } from './Shield';

const SHIELD_SPAWN_GAP = 300;
const SHIELD_REACTION_DISTANCE = 35;
const SHIELD_CLEANUP_DISTANCE = 24;

export class ShieldManager {
  readonly shield = new Shield();
  private readonly chunkManager: ChunkManager;
  private readonly worldPosition = new THREE.Vector3();
  private readonly configuredPositions = new Map<RoadChunk, number>();
  private patternIndex = 0;
  private lastSpawnDistance = -Infinity;

  constructor(chunkManager: ChunkManager) {
    this.chunkManager = chunkManager;
  }

  update(
    deltaTime: number,
    elapsed: number,
    playerZ: number,
    distance: number,
    gameState: GameState,
  ) {
    this.shield.update(deltaTime, elapsed);
    if (this.shield.isActive()) {
      this.shield.getWorldPosition(this.worldPosition);
      if (this.worldPosition.z > playerZ + SHIELD_CLEANUP_DISTANCE) {
        this.shield.deactivate();
        this.shield.removeFromParent();
      }
    }
    if (gameState !== GameState.RUNNING || this.shield.isActive()) return;

    const chunks = this.getChunks();
    for (const chunk of chunks) {
      if (this.configuredPositions.get(chunk) === chunk.position.z) continue;
      this.configuredPositions.set(chunk, chunk.position.z);
      if (distance < this.lastSpawnDistance + SHIELD_SPAWN_GAP) continue;
      if (chunk.endZ > playerZ - SHIELD_REACTION_DISTANCE) continue;
      this.spawn(chunk, elapsed);
      this.lastSpawnDistance = distance;
      break;
    }
  }

  collect(playerX: number, playerY: number, playerZ: number) {
    if (!this.shield.isActive()) return false;
    this.shield.getWorldPosition(this.worldPosition);
    const dx = playerX - this.worldPosition.x;
    const dy = playerY + 1.2 - this.worldPosition.y;
    const dz = playerZ - this.worldPosition.z;
    if (dx * dx + dy * dy + dz * dz > 1.05 ** 2) return false;
    if (!this.shield.collect()) return false;
    this.shield.removeFromParent();
    console.log('[SHIELD] Collected');
    return true;
  }

  reset() {
    this.shield.deactivate();
    this.shield.removeFromParent();
    this.configuredPositions.clear();
    this.patternIndex = 0;
    this.lastSpawnDistance = -Infinity;
  }

  dispose() {
    this.reset();
    this.shield.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
      else mesh.material?.dispose();
    });
  }

  private getChunks() {
    return this.chunkManager.getActiveChunks();
  }

  private spawn(chunk: RoadChunk, elapsed: number) {
    const lanes = [LANES.LEFT, LANES.CENTER, LANES.RIGHT];
    const lane = lanes[this.patternIndex % lanes.length];
    this.patternIndex += 1;
    this.shield.activate(lane * chunk.config.laneWidth, 1.35, 4, elapsed);
    chunk.collectibleRoot.add(this.shield);
    console.log('[SHIELD] Spawned');
  }
}
