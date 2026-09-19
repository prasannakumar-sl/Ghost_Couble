import { GAME_CONFIG } from './config/gameConfig';

export enum GameState {
  RUNNING = 'RUNNING',
  HIT = 'HIT',
  DEAD = 'DEAD',
}

export enum GameOverReason {
  OBSTACLE = 'OBSTACLE',
  GHOST_CAUGHT = 'GHOST_CAUGHT',
}

export interface GameRuntimeSnapshot {
  score: number;
  distance: number;
  coins: number;
  hearts: number;
  maxHearts: number;
  gameState: GameState;
  gameOverReason: GameOverReason | null;
}

export class GameRuntime {
  private readonly maxHearts: number;
  private score = 0;
  private distance = 0;
  private coins = 0;
  private hearts: number;
  private gameState = GameState.RUNNING;
  private gameOverReason: GameOverReason | null = null;
  private damageCooldownRemaining = 0;
  private hitRemaining = 0;

  constructor(maxHearts = GAME_CONFIG.maxHearts) {
    this.maxHearts = maxHearts;
    this.hearts = maxHearts;
  }

  update(deltaTime: number, forwardSpeed: number) {
    const delta = Math.min(deltaTime, 0.05);
    if (this.damageCooldownRemaining > 0) {
      this.damageCooldownRemaining = Math.max(0, this.damageCooldownRemaining - delta);
    }
    if (this.hitRemaining > 0) {
      this.hitRemaining = Math.max(0, this.hitRemaining - delta);
      if (this.hitRemaining === 0 && this.gameState === GameState.HIT) {
        this.gameState = GameState.RUNNING;
      }
    }
    if (this.gameState !== GameState.RUNNING) return;

    this.distance += Math.max(0, forwardSpeed) * delta;
    this.score = Math.floor(this.distance * GAME_CONFIG.scorePerMeter) + this.coins * GAME_CONFIG.scorePerCoin;
  }

  collectCoin() {
    if (this.gameState === GameState.DEAD) return;
    this.coins += 1;
    this.score += GAME_CONFIG.scorePerCoin;
  }

  takeDamage() {
    if (this.gameState === GameState.DEAD || this.damageCooldownRemaining > 0) return false;
    return this.applyDamage(GameOverReason.OBSTACLE);
  }

  takeGhostDamage() {
    if (this.gameState === GameState.DEAD) return false;
    return this.applyDamage(GameOverReason.GHOST_CAUGHT);
  }

  reset() {
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.hearts = this.maxHearts;
    this.gameState = GameState.RUNNING;
    this.gameOverReason = null;
    this.damageCooldownRemaining = 0;
    this.hitRemaining = 0;
  }

  private applyDamage(reason: GameOverReason) {
    this.hearts = Math.max(0, this.hearts - 1);
    this.damageCooldownRemaining = GAME_CONFIG.damageCooldown;
    this.hitRemaining = GAME_CONFIG.hitDuration;
    this.gameState = this.hearts === 0 ? GameState.DEAD : GameState.HIT;
    this.gameOverReason = this.hearts === 0 ? reason : null;
    return true;
  }

  getSnapshot(): GameRuntimeSnapshot {
    return {
      score: this.score,
      distance: this.distance,
      coins: this.coins,
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      gameState: this.gameState,
      gameOverReason: this.gameOverReason,
    };
  }
}
