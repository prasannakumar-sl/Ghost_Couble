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

export type HealthChangedHandler = (health: number) => void;

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
  magnetActive: boolean;
  magnetRemaining: number;
}

export class GameRuntime {
  private readonly maxHearts: number;
  private readonly onHealthChanged?: HealthChangedHandler;
  private currentRunScore = 0;
  private currentRunDistance = 0;
  private currentRunCoins = 0;
  private currentHealth: number;
  private gameState = GameState.RUNNING;
  private gameOverReason: GameOverReason | null = null;
  private damageCooldownRemaining = 0;
  private hitRemaining = 0;
  private ghostAttacking = false;
  private shieldRemaining = 0;
  private magnetRemaining = 0;

  constructor(maxHearts = GAME_CONFIG.maxHearts, onHealthChanged?: HealthChangedHandler) {
    this.maxHearts = maxHearts;
    this.onHealthChanged = onHealthChanged;
    this.currentHealth = maxHearts;
    console.log('[GAME] Health initialized:', this.currentHealth);
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
    if (this.magnetRemaining > 0) {
      this.magnetRemaining = Math.max(0, this.magnetRemaining - delta);
      if (this.magnetRemaining === 0) console.log('[MAGNET] Expired');
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

  activateMagnet(duration: number) {
    if (this.gameState !== GameState.RUNNING) return false;
    this.magnetRemaining = duration;
    return true;
  }

  heal() {
    if (this.gameState !== GameState.RUNNING || this.currentHealth >= this.maxHearts) return false;
    this.currentHealth += 1;
    this.notifyHealthChanged();
    return true;
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
    const previousHealth = this.currentHealth;
    this.currentRunScore = 0;
    this.currentRunDistance = 0;
    this.currentRunCoins = 0;
    this.currentHealth = this.maxHearts;
    console.log('[GAME] Health initialized:', this.currentHealth);
    if (this.currentHealth !== previousHealth) this.notifyHealthChanged();
    this.gameState = GameState.RUNNING;
    this.gameOverReason = null;
    this.damageCooldownRemaining = 0;
    this.hitRemaining = 0;
    this.ghostAttacking = false;
    this.shieldRemaining = 0;
    this.magnetRemaining = 0;
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
    if (this.currentHealth !== 0 || this.gameState === GameState.DEAD) return false;
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
    console.log('[GAME OVER] FINAL HEALTH:', this.currentHealth);
    console.log('[GAME] GAME OVER');
    return true;
  }

  private applyDamage(amount: number) {
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    if (this.currentHealth !== previousHealth) {
      console.log('[HEALTH] Previous:', previousHealth);
      console.log('[HEALTH] New:', this.currentHealth);
      this.notifyHealthChanged();
    }
    this.damageCooldownRemaining = GAME_CONFIG.damageCooldown;
    this.hitRemaining = GAME_CONFIG.hitDuration;
    this.gameState = GameState.HIT;
    this.gameOverReason = null;
    if (this.currentHealth === 0) console.log('[HEALTH] ZERO HEARTS - PLAYER DEAD');
    return true;
  }

  private notifyHealthChanged() {
    console.log('[HEALTH] GAME VALUE:', this.currentHealth);
    this.onHealthChanged?.(this.currentHealth);
  }

  getSnapshot(): GameRuntimeSnapshot {
    return {
      score: this.currentRunScore,
      distance: this.currentRunDistance,
      coins: this.currentRunCoins,
      hearts: this.currentHealth,
      maxHearts: this.maxHearts,
      gameState: this.gameState,
      gameOverReason: this.gameOverReason,
      shieldActive: this.shieldRemaining > 0,
      shieldRemaining: this.shieldRemaining,
      magnetActive: this.magnetRemaining > 0,
      magnetRemaining: this.magnetRemaining,
    };
  }
}
