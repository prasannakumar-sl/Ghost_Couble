import * as THREE from 'three';

import { ChunkManager } from '../ChunkManager';
import { GameRuntime, GameState } from '../GameRuntime';
import { LANES } from '../PlayerTypes';
import { RoadChunk } from '../RoadChunk';
import { Jetpack } from './Jetpack';

const JETPACK_DURATION = 20;
const JETPACK_SPAWN_GAP = 120;
const JETPACK_GROUND_GAP = 120;
const JETPACK_REACTION_DISTANCE = 35;
const JETPACK_CLEANUP_DISTANCE = 24;
const PICKUP_RADIUS = 1.05;

export class JetpackManager {
  readonly jetpack = new Jetpack();
  private readonly chunkManager: ChunkManager;
  private readonly runtime: GameRuntime;
  private readonly worldPosition = new THREE.Vector3();
  private readonly configuredPositions = new Map<RoadChunk, number>();
  private patternIndex = 0;
  private lastSpawnDistance = -Infinity;
  private nextSpawnDistance = 0;
  private remaining = 0;

  constructor(chunkManager: ChunkManager, runtime: GameRuntime) {
    this.chunkManager = chunkManager;
    this.runtime = runtime;
  }

  update(deltaTime: number, elapsed: number, playerZ: number, distance: number, gameState: GameState, otherPickupActive = false) {
    this.jetpack.update(deltaTime, elapsed);
    this.cleanup(playerZ);
    if (gameState !== GameState.RUNNING || this.isActive || this.jetpack.isActive() || otherPickupActive) return;

    for (const chunk of this.chunkManager.getActiveChunks()) {
      if (this.configuredPositions.get(chunk) === chunk.position.z) continue;
      this.configuredPositions.set(chunk, chunk.position.z);
      if (chunk.endZ > playerZ - JETPACK_REACTION_DISTANCE) continue;
      if (distance < this.lastSpawnDistance + JETPACK_SPAWN_GAP || distance < this.nextSpawnDistance) continue;
      if (this.patternIndex % 4 !== 0) {
        this.patternIndex += 1;
        continue;
      }

      this.patternIndex += 1;
      const lane = [LANES.LEFT, LANES.CENTER, LANES.RIGHT][this.patternIndex % 3];
      this.jetpack.activate(lane * chunk.config.laneWidth, 1.35, 4, elapsed);
      chunk.collectibleRoot.add(this.jetpack);
      this.lastSpawnDistance = distance;
      console.log('[JETPACK] Spawned');
      break;
    }
  }

  collect(playerX: number, playerY: number, playerZ: number, distance: number) {
    if (this.isActive || !this.jetpack.isActive() || this.runtime.getSnapshot().gameState !== GameState.RUNNING) return false;
    this.jetpack.getWorldPosition(this.worldPosition);
    const dx = playerX - this.worldPosition.x;
    const dy = playerY + 1.2 - this.worldPosition.y;
    const dz = playerZ - this.worldPosition.z;
    if (dx * dx + dy * dy + dz * dz > PICKUP_RADIUS ** 2) return false;
    if (!this.jetpack.collect()) return false;
    this.jetpack.removeFromParent();
    this.remaining = JETPACK_DURATION;
    this.nextSpawnDistance = Number.POSITIVE_INFINITY;
    console.log('[JETPACK] Collected');
    return true;
  }

  tick(deltaTime: number, distance: number) {
    if (this.remaining <= 0) return;
    this.remaining = Math.max(0, this.remaining - deltaTime);
    if (this.remaining === 0) this.nextSpawnDistance = distance + JETPACK_GROUND_GAP;
  }

  reset() {
    this.remaining = 0;
    this.jetpack.deactivate();
    this.jetpack.removeFromParent();
    this.configuredPositions.clear();
    this.patternIndex = 0;
    this.lastSpawnDistance = -Infinity;
    this.nextSpawnDistance = 0;
  }

  dispose() {
    this.reset();
    this.jetpack.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
      else mesh.material?.dispose();
    });
  }

  get isActive() {
    return this.remaining > 0;
  }

  get remainingSeconds() {
    return Math.ceil(this.remaining);
  }

  private cleanup(playerZ: number) {
    if (!this.jetpack.isActive()) return;
    this.jetpack.getWorldPosition(this.worldPosition);
    if (this.worldPosition.z > playerZ + JETPACK_CLEANUP_DISTANCE) {
      this.jetpack.deactivate();
      this.jetpack.removeFromParent();
    }
  }
}
