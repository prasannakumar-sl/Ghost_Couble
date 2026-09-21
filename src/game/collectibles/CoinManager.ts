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
    const pattern = this.patternIndex % 20;
    this.patternIndex += 1;

    if ([0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18].includes(pattern)) {
      return this.trail([LANES.CENTER], 4);
    }
    if (pattern === 3) return this.trail([LANES.LEFT], 4);
    if (pattern === 9) return this.trail([LANES.RIGHT], 4);
    if (pattern === 15) return this.trail([LANES.LEFT], 5);
    if (pattern === 5 || pattern === 13) return this.zigzag();
    if (pattern === 7) return this.obstacleTop();
    if (pattern === 17) return this.obstacleSide();
    if (pattern === 11) return this.jumpSmall();
    return [];
  }

  private trail(lanes: readonly number[], count: number, height = 1.15) {
    return Array.from({ length: count }, (_, index) => ({
      lane: lanes[index % lanes.length] as CoinPlacement['lane'],
      localZ: 10 - index * 1.8,
      height,
    }));
  }

  private zigzag() {
    return this.trail([LANES.LEFT, LANES.CENTER, LANES.RIGHT, LANES.CENTER], 5);
  }

  private jumpSmall() {
    return [1.55, 1.9, 2.2, 1.9, 1.55].map((height, index) => ({
      lane: LANES.CENTER,
      localZ: 9 - index * 1.8,
      height,
    }));
  }

  private obstacleTop() {
    return [1.95, 2.15, 2.15, 1.95].map((height, index) => ({
      lane: LANES.CENTER,
      localZ: 9 - index * 1.8,
      height,
    }));
  }

  private obstacleSide() {
    return [LANES.LEFT, LANES.RIGHT].flatMap((lane) =>
      Array.from({ length: 3 }, (_, index) => ({
        lane,
        localZ: 8.5 - index * 1.8,
        height: 1.15,
      })),
    );
  }
}
