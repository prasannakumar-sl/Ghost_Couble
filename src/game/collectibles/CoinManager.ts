import * as THREE from 'three';

import { ChunkManager } from '../ChunkManager';
import { RoadChunk } from '../RoadChunk';
import { GameRuntime, GameState } from '../GameRuntime';
import { GAME_CONFIG } from '../config/gameConfig';
import { Coin, CoinPlacement } from './Coin';
import { CollectiblePool } from './CollectiblePool';
import { DEFAULT_PLAYER_CONFIG, LANES, PlayerConfig } from '../PlayerTypes';

export class CoinManager {
  readonly pool: CollectiblePool;
  private readonly worldPosition = new THREE.Vector3();
  private readonly chunkManager: ChunkManager;
  private readonly runtime: GameRuntime;
  private readonly playerConfig: PlayerConfig;
  private readonly configuredPositions = new Map<RoadChunk, number>();
  private readonly chunkCoins = new Map<RoadChunk, Coin[]>();
  private patternIndex = 0;
  private jumpDiagnosticsLogged = false;

  constructor(chunkManager: ChunkManager, runtime: GameRuntime, playerConfig: PlayerConfig = DEFAULT_PLAYER_CONFIG) {
    this.chunkManager = chunkManager;
    this.runtime = runtime;
    this.playerConfig = playerConfig;
    this.pool = new CollectiblePool(GAME_CONFIG.coinPoolSize);
  }

  update(deltaTime: number, elapsed: number) {
    const chunks = this.chunkManager.getActiveChunks();
    for (const chunk of chunks) {
      if (this.configuredPositions.get(chunk) !== chunk.position.z) this.configureChunk(chunk);
    }

    for (const coin of this.pool.coins) coin.update(deltaTime, elapsed);
  }

  attract(playerX: number, playerY: number, playerZ: number, deltaTime: number) {
    if (!this.runtime.getSnapshot().magnetActive) return;
    const rangeSquared = 5.5 ** 2;
    const targetY = playerY + 1.2;
    for (const coin of this.pool.coins) {
      if (!coin.isActive()) continue;
      coin.getWorldPosition(this.worldPosition);
      const dx = playerX - this.worldPosition.x;
      const dy = targetY - this.worldPosition.y;
      const dz = playerZ - this.worldPosition.z;
      if (dx * dx + dy * dy + dz * dz <= rangeSquared) coin.attractTo(playerX, targetY, playerZ, deltaTime);
    }
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
    this.jumpDiagnosticsLogged = false;
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
    if (pattern === 7) return this.jumpTrail();
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
    return this.jumpTrail();
  }

  private jumpTrail(): CoinPlacement[] {
    const jumpDuration = (2 * this.playerConfig.jumpForce) / this.playerConfig.gravity;
    const maxJumpHeight = 1.2 + this.playerConfig.jumpForce ** 2 / (2 * this.playerConfig.gravity);
    const maxCoinHeight = maxJumpHeight - 0.08;
    const forwardDistance = this.playerConfig.speed * jumpDuration;
    const collectionStartY = 1.2;
    const startLocalZ = -1.25;
    const sampleTimes = [0.08, 0.18, 0.3, 0.52, 0.62, 0.72];
    const placements = sampleTimes.map((time) => ({
      lane: LANES.CENTER,
      localZ: startLocalZ - this.playerConfig.speed * time,
      height: collectionStartY + this.playerConfig.jumpForce * time - 0.5 * this.playerConfig.gravity * time ** 2,
    }));

    if (!this.isValidJumpTrail(placements, jumpDuration, maxCoinHeight, forwardDistance)) {
      return this.trail([LANES.CENTER], 4);
    }

    if (!this.jumpDiagnosticsLogged) {
      this.jumpDiagnosticsLogged = true;
      console.log('[JUMP] Start Y:', 1.2);
      console.log('[JUMP] Velocity Y:', this.playerConfig.jumpForce);
      console.log('[JUMP] Gravity:', this.playerConfig.gravity);
      console.log('[JUMP] Max Y:', maxJumpHeight);
      console.log('[JUMP] Jump Duration:', jumpDuration);
      console.log('[JUMP] Forward Distance:', forwardDistance);
      placements.forEach((placement, index) => {
        console.log('[JUMP COIN]', index, 'X:', placement.lane * this.playerConfig.laneWidth, 'Y:', placement.height, 'Z:', placement.localZ);
      });
    }

    return placements;
  }

  private isValidJumpTrail(
    placements: readonly CoinPlacement[],
    jumpDuration: number,
    maxJumpHeight: number,
    forwardDistance: number,
  ) {
    const spacingLimit = forwardDistance / (placements.length - 1) + GAME_CONFIG.coinCollectionRadius;
    const firstZ = placements[0]?.localZ ?? 0;
    return placements.every((placement, index) => {
      const heightIsReachable = placement.height >= 1.2 && placement.height <= maxJumpHeight;
      const forwardDistanceIsReachable = Math.abs(placement.localZ - firstZ) <= forwardDistance + GAME_CONFIG.coinCollectionRadius;
      const previous = placements[index - 1];
      const spacingIsReachable = !previous || Math.abs(placement.localZ - previous.localZ) <= spacingLimit;
      return heightIsReachable && forwardDistanceIsReachable && spacingIsReachable && jumpDuration > 0 && placement.lane === LANES.CENTER;
    });
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
