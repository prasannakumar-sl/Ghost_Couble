import { ChunkManager } from '../ChunkManager';
import { RoadChunk } from '../RoadChunk';
import { GameRuntime } from '../GameRuntime';
import { GAME_CONFIG } from '../config/gameConfig';
import { Coin, CoinPlacement } from './Coin';
import { CollectiblePool } from './CollectiblePool';
import { LANES } from '../PlayerTypes';

export class CoinManager {
  readonly pool: CollectiblePool;
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
    let collected = 0;
    const radiusSquared = GAME_CONFIG.coinCollectionRadius ** 2;
    for (const coin of this.pool.coins) {
      if (!coin.isActive()) continue;
      const worldX = coin.position.x + (coin.parent?.position.x ?? 0);
      const worldY = coin.position.y + (coin.parent?.position.y ?? 0);
      const worldZ = coin.position.z + (coin.parent?.parent?.position.z ?? 0);
      const dx = playerX - worldX;
      const dy = playerY + 1.2 - worldY;
      const dz = playerZ - worldZ;
      if (dx * dx + dy * dy + dz * dz > radiusSquared) continue;
      if (!coin.collect()) continue;
      this.pool.release(coin);
      this.runtime.collectCoin();
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
    chunk.setLayout({ coins: placements });
    this.configuredPositions.set(chunk, chunk.position.z);
  }

  private createPattern(): CoinPlacement[] {
    const pattern = this.patternIndex % 5;
    this.patternIndex += 1;
    if (pattern === 0 && GAME_CONFIG.coinFrequency < 1) return [];
    if (pattern === 1) {
      return [
        { lane: LANES.LEFT, localZ: 6, height: 1.15 },
        { lane: LANES.CENTER, localZ: 2, height: 1.15 },
        { lane: LANES.RIGHT, localZ: -2, height: 1.15 },
      ];
    }
    if (pattern === 2) {
      return [
        { lane: LANES.CENTER, localZ: 5, height: 1.15 },
        { lane: LANES.CENTER, localZ: 1, height: 1.15 },
        { lane: LANES.CENTER, localZ: -3, height: 1.15 },
      ];
    }
    if (pattern === 3) {
      return [
        { lane: LANES.LEFT, localZ: 5, height: 1.15 },
        { lane: LANES.LEFT, localZ: 1, height: 1.15 },
        { lane: LANES.CENTER, localZ: -3, height: 1.15 },
        { lane: LANES.RIGHT, localZ: -6, height: 1.15 },
      ];
    }
    if (pattern === 4) {
      return [
        { lane: LANES.RIGHT, localZ: 5, height: 1.15 },
        { lane: LANES.CENTER, localZ: 1, height: 1.15 },
        { lane: LANES.LEFT, localZ: -3, height: 1.15 },
      ];
    }
    return [
      { lane: LANES.CENTER, localZ: 4, height: 1.9 },
      { lane: LANES.CENTER, localZ: 0, height: 1.9 },
      { lane: LANES.CENTER, localZ: -4, height: 1.9 },
    ];
  }
}
