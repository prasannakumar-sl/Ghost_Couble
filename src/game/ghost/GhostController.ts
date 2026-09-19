import { GhostState } from './GhostState';

export interface GhostConfig {
  normalDistance: number;
  chaseDistance: number;
  killDistance: number;
  normalSpeedMultiplier: number;
  chaseSpeedMultiplier: number;
  followSmoothing: number;
  chaseSmoothing: number;
  chaseDuration: number;
  attackDuration: number;
}

export interface GhostSnapshot {
  state: GhostState;
  chaseRemaining: number;
  distanceBehind: number;
}

export type GhostEvent = 'CHASE_STARTED' | 'CHASE_ENDED' | 'CAUGHT';

const DEFAULT_GHOST_CONFIG: GhostConfig = {
  normalDistance: 4.8,
  chaseDistance: 1.7,
  killDistance: 1.15,
  normalSpeedMultiplier: 0.92,
  chaseSpeedMultiplier: 1.15,
  followSmoothing: 4.5,
  chaseSmoothing: 7,
  chaseDuration: 10,
  attackDuration: 0.35,
};

export class GhostController {
  readonly config: GhostConfig;
  readonly position = { x: 0, y: 0.9, z: 4.8 };

  private state = GhostState.FOLLOW;
  private chaseRemaining = 0;
  private attackElapsed = 0;

  constructor(config: Partial<GhostConfig> = {}) {
    this.config = { ...DEFAULT_GHOST_CONFIG, ...config };
  }

  update(deltaTime: number, player: { x: number; y: number; z: number }, playerSpeed: number): GhostEvent | null {
    const delta = Math.min(deltaTime, 0.05);
    if (this.state === GhostState.DEAD) return null;

    if (this.state === GhostState.ATTACK) {
      this.attackElapsed += delta;
      const attackBlend = 1 - Math.exp(-18 * delta);
      this.position.x += (player.x - this.position.x) * attackBlend;
      this.position.y += (player.y + 0.8 - this.position.y) * attackBlend;
      this.position.z += (player.z - this.position.z) * attackBlend;
      if (this.attackElapsed >= this.config.attackDuration) this.state = GhostState.DEAD;
      return null;
    }

    const wasChasing = this.state === GhostState.CHASE;
    let chaseEnded = false;
    if (wasChasing && this.chaseRemaining > 0) {
      this.chaseRemaining = Math.max(0, this.chaseRemaining - delta);
      chaseEnded = this.chaseRemaining === 0;
    }

    const speedMultiplier = wasChasing
      ? this.config.chaseSpeedMultiplier
      : this.config.normalSpeedMultiplier;
    const smoothing = wasChasing ? this.config.chaseSmoothing : this.config.followSmoothing;
    const chaseProgress = 1 - this.chaseRemaining / this.config.chaseDuration;
    const chaseTarget = this.config.normalDistance
      - Math.min(1, chaseProgress / 0.7) * (this.config.normalDistance - this.config.chaseDistance);
    const attackTarget = Math.max(0, (chaseProgress - 0.7) / 0.3);
    const desiredDistance = wasChasing
      ? chaseTarget - attackTarget * (this.config.chaseDistance - this.config.killDistance)
      : this.config.normalDistance;
    const blend = 1 - Math.exp(-smoothing * delta);
    const desiredX = player.x;
    const desiredY = player.y + 0.9;
    const desiredZ = player.z + desiredDistance;
    const forwardStep = Math.max(0, playerSpeed) * speedMultiplier * delta;
    const predictedZ = this.position.z - forwardStep;

    this.position.x += (desiredX - this.position.x) * blend;
    this.position.y += (desiredY - this.position.y) * blend;
    this.position.z = predictedZ + (desiredZ - predictedZ) * blend;

    const distanceBehind = this.position.z - player.z;
    if (distanceBehind <= this.config.killDistance) {
      this.state = GhostState.ATTACK;
      this.chaseRemaining = 0;
      this.attackElapsed = 0;
      return 'CAUGHT';
    }

    if (chaseEnded) {
      this.state = GhostState.FOLLOW;
      return 'CHASE_ENDED';
    }
    return null;
  }

  startChase() {
    if (this.state === GhostState.ATTACK || this.state === GhostState.DEAD) return null;
    const wasChasing = this.state === GhostState.CHASE;
    this.state = GhostState.CHASE;
    this.chaseRemaining = this.config.chaseDuration;
    return wasChasing ? null : 'CHASE_STARTED';
  }

  reset(player: { x: number; y: number; z: number }) {
    this.position.x = player.x;
    this.position.y = player.y + 0.9;
    this.position.z = player.z + this.config.normalDistance;
    this.state = GhostState.FOLLOW;
    this.chaseRemaining = 0;
    this.attackElapsed = 0;
  }

  kill() {
    this.state = GhostState.DEAD;
    this.chaseRemaining = 0;
  }

  getSnapshot(playerZ = 0): GhostSnapshot {
    return {
      state: this.state,
      chaseRemaining: this.chaseRemaining,
      distanceBehind: this.position.z - playerZ,
    };
  }
}
