import * as THREE from 'three';

import { ChunkManager } from '../ChunkManager';
import { GameRuntime, GameState } from '../GameRuntime';
import { LANES } from '../PlayerTypes';
import { RoadChunk } from '../RoadChunk';
import { ExtraHeart } from './ExtraHeart';
import { Magnet } from './Magnet';

const MAGNET_SPAWN_GAP = 180;
const HEART_SPAWN_GAP = 420;
const POWER_UP_REACTION_DISTANCE = 35;
const POWER_UP_CLEANUP_DISTANCE = 24;
const PICKUP_RADIUS = 1.05;

export class PowerUpManager {
  readonly magnet = new Magnet();
  readonly extraHeart = new ExtraHeart();
  private readonly chunkManager: ChunkManager;
  private readonly runtime: GameRuntime;
  private readonly worldPosition = new THREE.Vector3();
  private readonly configuredPositions = new Map<RoadChunk, number>();
  private patternIndex = 0;
  private lastMagnetDistance = -Infinity;
  private lastHeartDistance = -Infinity;
  private lastSpawnDistance = -Infinity;

  constructor(chunkManager: ChunkManager, runtime: GameRuntime) {
    this.chunkManager = chunkManager;
    this.runtime = runtime;
  }

  update(
    deltaTime: number,
    elapsed: number,
    playerZ: number,
    distance: number,
    gameState: GameState,
    otherPickupActive = false,
  ) {
    this.magnet.update(deltaTime, elapsed);
    this.extraHeart.update(deltaTime, elapsed);
    this.cleanup(this.magnet, playerZ);
    this.cleanup(this.extraHeart, playerZ);
    if (gameState !== GameState.RUNNING || this.magnet.isActive() || this.extraHeart.isActive() || otherPickupActive) return;

    for (const chunk of this.chunkManager.getActiveChunks()) {
      if (this.configuredPositions.get(chunk) === chunk.position.z) continue;
      this.configuredPositions.set(chunk, chunk.position.z);
      if (chunk.endZ > playerZ - POWER_UP_REACTION_DISTANCE) continue;
      if (distance < this.lastSpawnDistance + 70) continue;
      const spawned = this.trySpawn(chunk, elapsed, distance);
      if (spawned) {
        this.lastSpawnDistance = distance;
        break;
      }
    }
  }

  collect(playerX: number, playerY: number, playerZ: number) {
    if (this.runtime.getSnapshot().gameState !== GameState.RUNNING) return;
    if (this.collectPickup(this.magnet, playerX, playerY, playerZ)) {
      this.runtime.activateMagnet(9);
      console.log('[MAGNET] Collected');
    }
    if (this.collectPickup(this.extraHeart, playerX, playerY, playerZ)) {
      if (this.runtime.heal()) console.log('[HEART] Extra heart collected');
    }
  }

  reset() {
    this.magnet.deactivate();
    this.extraHeart.deactivate();
    this.magnet.removeFromParent();
    this.extraHeart.removeFromParent();
    this.configuredPositions.clear();
    this.patternIndex = 0;
    this.lastMagnetDistance = -Infinity;
    this.lastHeartDistance = -Infinity;
    this.lastSpawnDistance = -Infinity;
  }

  dispose() {
    this.reset();
    for (const pickup of [this.magnet, this.extraHeart]) {
      pickup.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
        else mesh.material?.dispose();
      });
    }
  }

  private trySpawn(chunk: RoadChunk, elapsed: number, distance: number) {
    this.patternIndex += 1;
    const lane = [LANES.LEFT, LANES.CENTER, LANES.RIGHT][this.patternIndex % 3];
    const x = lane * chunk.config.laneWidth;
    if (this.patternIndex % 11 === 0 && distance >= this.lastHeartDistance + HEART_SPAWN_GAP) {
      this.extraHeart.activate(x, 1.3, 4, elapsed);
      chunk.collectibleRoot.add(this.extraHeart);
      this.lastHeartDistance = distance;
      console.log('[HEART] Spawned');
      return true;
    }
    if (this.patternIndex % 5 === 0 && distance >= this.lastMagnetDistance + MAGNET_SPAWN_GAP) {
      this.magnet.activate(x, 1.35, 4, elapsed);
      chunk.collectibleRoot.add(this.magnet);
      this.lastMagnetDistance = distance;
      console.log('[MAGNET] Spawned');
      return true;
    }
    return false;
  }

  private collectPickup(pickup: Magnet | ExtraHeart, playerX: number, playerY: number, playerZ: number) {
    if (!pickup.isActive()) return false;
    pickup.getWorldPosition(this.worldPosition);
    const dx = playerX - this.worldPosition.x;
    const dy = playerY + 1.2 - this.worldPosition.y;
    const dz = playerZ - this.worldPosition.z;
    if (dx * dx + dy * dy + dz * dz > PICKUP_RADIUS ** 2) return false;
    const collected = pickup.collect();
    if (collected) pickup.removeFromParent();
    return collected;
  }

  private cleanup(pickup: Magnet | ExtraHeart, playerZ: number) {
    if (!pickup.isActive()) return;
    pickup.getWorldPosition(this.worldPosition);
    if (this.worldPosition.z > playerZ + POWER_UP_CLEANUP_DISTANCE) {
      pickup.deactivate();
      pickup.removeFromParent();
    }
  }
}
