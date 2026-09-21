import { ChunkManager } from '../ChunkManager';
import * as THREE from 'three';

import { RoadChunk } from '../RoadChunk';
import { GameRuntime, GameState } from '../GameRuntime';
import { GAME_CONFIG } from '../config/gameConfig';
import { Coin, CoinPlacement } from './Coin';
import { CollectiblePool } from './CollectiblePool';
import { LANES } from '../PlayerTypes';

export class CoinManager {
  readonly pool: CollectiblePool;
  private readonly worldPosition = new THREE.Vector3();
  private readonly chunkManager: ChunkManager;
  private readonly runtime: GameRuntime;
  private readonly configuredPositions = new Map<RoadChunk, number>();
  private readonly chunkCoins = new Map<RoadChunk, Coin[]>();
  private patternIndex = 0;

  constructor(chunkManager: ChunkManager, runtime: GameRuntime) {
    this.chunkManager = chunkManager;
    this.runtime = runtime;
    this.pool = new CollectiblePool(GAME_CONFIG.coinPoolSize);
  }

  update(deltaTime: number, elapsed: number) {
    const chunks = this.chunkManager.getActiveChunks();
    for (const chunk of chunks) {
      if (this.configuredPositions.get(chunk) !== chunk.position.z) this.configureChunk(chunk);
    }

    for (const coin of this.pool.coins) coin.update(deltaTime, elapsed);
  }

  collect(playerX: number, playerY: number, playerZ: number) {
    if (this.runtime.getSnapshot().gameState !== GameState.RUNNING) return 0;
    let collected = 0;
    const radiusSquared = GAME_CONFIG.coinCollectionRadius ** 2;
    for (const coin of this.pool.coins) {
      if (!coin.isActive()) continue;
      coin.getWorldPosition(this.worldPosition);
      const dx = playerX - this.worldPosition.x;
      const dy = playerY + 1.2 - this.worldPosition.y;
      const dz = playerZ - this.worldPosition.z;
      if (dx * dx + dy * dy + dz * dz > radiusSquared) continue;
      if (!coin.collect()) continue;
      this.runtime.collectCoin();
      console.log('[COIN] Collected');
      collected += 1;
    }
    return collected;
  }

  reset() {
    this.chunkManager.getActiveChunks().forEach((chunk) => chunk.collectibleRoot.clear());
    this.pool.reset();
    this.configuredPositions.clear();
    this.chunkCoins.clear();
    this.patternIndex = 0;
  }

  dispose() {
    this.pool.dispose();
    this.configuredPositions.clear();
    this.chunkCoins.clear();
  }

  private configureChunk(chunk: RoadChunk) {
    this.chunkCoins.get(chunk)?.forEach((coin) => this.pool.release(coin));
    const placements = this.createPattern();
    const configured: Coin[] = [];
    placements.forEach((placement, index) => {
      const coin = this.pool.acquire();
      coin.activate(placement, chunk.config.laneWidth, index * 0.75);
      chunk.collectibleRoot.add(coin);
      configured.push(coin);
    });
    this.chunkCoins.set(chunk, configured);
    console.log('[COIN] Spawned coin pattern:', placements.length);
    chunk.setLayout({ coins: placements });
    this.configuredPositions.set(chunk, chunk.position.z);
  }

  private createPattern(): CoinPlacement[] {
    const sequence = this.patternIndex;
    this.patternIndex += 1;
    const pattern = sequence < 4 ? sequence % 4 : sequence % 10;

    if (pattern === 0) return this.trail([LANES.CENTER], 14);
    if (pattern === 1) return this.trail([LANES.LEFT], 12);
    if (pattern === 2) return this.trail([LANES.RIGHT], 12);
    if (pattern === 3) return this.trail([LANES.CENTER, LANES.LEFT, LANES.CENTER, LANES.RIGHT], 14);
    if (pattern === 4) return this.trail([LANES.LEFT, LANES.CENTER, LANES.RIGHT, LANES.CENTER], 16);
    if (pattern === 5) return this.wall(5);
    if (pattern === 6) return this.jumpTrail();
    if (pattern === 7) return this.jumpArc();
    if (pattern === 8) return this.decisionTrail();
    return this.aroundObstacleTrail();
  }

  private trail(lanes: readonly number[], count: number, height = 1.15) {
    return Array.from({ length: count }, (_, index) => ({
      lane: lanes[index % lanes.length] as CoinPlacement['lane'],
      localZ: 13.5 - index * 2,
      height,
    }));
  }

  private wall(rows: number) {
    return Array.from({ length: rows }, (_, row) =>
      [LANES.LEFT, LANES.CENTER, LANES.RIGHT].map((lane) => ({
        lane,
        localZ: 11.5 - row * 2.2,
        height: 1.15,
      })),
    ).flat();
  }

  private jumpTrail() {
    return this.trail([LANES.CENTER], 9, 2.25);
  }

  private jumpArc() {
    const heights = [1.45, 1.75, 2.1, 2.35, 2.1, 1.75, 1.45];
    return heights.map((height, index) => ({
      lane: LANES.CENTER,
      localZ: 11.5 - index * 2,
      height,
    }));
  }

  private decisionTrail() {
    return [
      ...this.trail([LANES.LEFT], 7),
      ...this.trail([LANES.RIGHT], 7),
    ];
  }

  private aroundObstacleTrail() {
    return [
      ...this.trail([LANES.LEFT], 5),
      ...this.trail([LANES.RIGHT], 5),
    ];
  }
}
