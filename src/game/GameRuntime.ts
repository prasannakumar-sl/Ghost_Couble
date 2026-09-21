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
  shieldActive: boolean;
  shieldRemaining: number;
}

export class GameRuntime {
  private readonly maxHearts: number;
  private currentRunScore = 0;
  private currentRunDistance = 0;
  private currentRunCoins = 0;
  private currentRunHearts: number;
  private gameState = GameState.RUNNING;
  private gameOverReason: GameOverReason | null = null;
  private damageCooldownRemaining = 0;
  private hitRemaining = 0;
  private ghostAttacking = false;
  private shieldRemaining = 0;

  constructor(maxHearts = GAME_CONFIG.maxHearts) {
    this.maxHearts = maxHearts;
    this.currentRunHearts = maxHearts;
    console.log('[GAME] Health initialized:', this.currentRunHearts);
  }

  update(deltaTime: number, forwardSpeed: number) {
    const delta = Math.min(deltaTime, 0.05);
    if (this.damageCooldownRemaining > 0) {
      this.damageCooldownRemaining = Math.max(0, this.damageCooldownRemaining - delta);
    }
    if (this.shieldRemaining > 0) {
      this.shieldRemaining = Math.max(0, this.shieldRemaining - delta);
      if (this.shieldRemaining === 0) console.log('[SHIELD] Expired');
    }
    if (this.hitRemaining > 0) {
      this.hitRemaining = Math.max(0, this.hitRemaining - delta);
      if (this.hitRemaining === 0 && this.gameState === GameState.HIT && !this.ghostAttacking) {
        this.gameState = GameState.RUNNING;
      }
    }
    if (this.gameState !== GameState.RUNNING) return;

    this.currentRunDistance += Math.max(0, forwardSpeed) * delta;
    this.currentRunScore =
      Math.floor(this.currentRunDistance * GAME_CONFIG.scorePerMeter) + this.currentRunCoins * GAME_CONFIG.scorePerCoin;
  }

  collectCoin() {
    if (this.gameState !== GameState.RUNNING) return;
    this.currentRunCoins += 1;
    this.currentRunScore += GAME_CONFIG.scorePerCoin;
    console.log('[COIN] Run Coins:', this.currentRunCoins);
  }

  takeDamage(amount = 1) {
    if (this.gameState === GameState.DEAD || this.damageCooldownRemaining > 0) return false;
    return this.applyDamage(amount);
  }

  reset() {
    this.currentRunScore = 0;
    this.currentRunDistance = 0;
    this.currentRunCoins = 0;
    this.currentRunHearts = this.maxHearts;
    console.log('[GAME] Health initialized:', this.currentRunHearts);
    this.gameState = GameState.RUNNING;
    this.gameOverReason = null;
    this.damageCooldownRemaining = 0;
    this.hitRemaining = 0;
    this.ghostAttacking = false;
    this.shieldRemaining = 0;
  }

  activateShield(duration: number) {
    if (this.gameState !== GameState.RUNNING) return false;
    this.shieldRemaining = duration;
    console.log('[SHIELD] Activated');
    return true;
  }

  consumeShield() {
    if (this.shieldRemaining <= 0) return false;
    this.shieldRemaining = 0;
    console.log('[SHIELD] Obstacle blocked');
    console.log('[SHIELD] Consumed');
    return true;
  }

  beginGhostAttack() {
    if (this.currentRunHearts !== 0 || this.gameState === GameState.DEAD) return false;
    this.ghostAttacking = true;
    this.gameState = GameState.HIT;
    this.gameOverReason = null;
    return true;
  }

  finishGhostAttack() {
    if (!this.ghostAttacking) return false;
    this.ghostAttacking = false;
    this.gameState = GameState.DEAD;
    this.gameOverReason = GameOverReason.GHOST_CAUGHT;
    console.log('[GAME] GAME OVER');
    return true;
  }

  private applyDamage(amount: number) {
    const previousHealth = this.currentRunHearts;
    this.currentRunHearts = Math.max(0, this.currentRunHearts - amount);
    console.log('[HEALTH] Previous:', previousHealth);
    console.log('[HEALTH] New:', this.currentRunHearts);
    this.damageCooldownRemaining = GAME_CONFIG.damageCooldown;
    this.hitRemaining = GAME_CONFIG.hitDuration;
    this.gameState = GameState.HIT;
    this.gameOverReason = null;
    if (this.currentRunHearts === 0) console.log('[HEALTH] ZERO HEARTS - PLAYER DEAD');
    return true;
  }

  getSnapshot(): GameRuntimeSnapshot {
    return {
      score: this.currentRunScore,
      distance: this.currentRunDistance,
      coins: this.currentRunCoins,
      hearts: this.currentRunHearts,
      maxHearts: this.maxHearts,
      gameState: this.gameState,
      gameOverReason: this.gameOverReason,
      shieldActive: this.shieldRemaining > 0,
      shieldRemaining: this.shieldRemaining,
    };
  }
}
