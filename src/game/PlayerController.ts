import {
  DEFAULT_PLAYER_CONFIG,
  LANES,
  Lane,
  PlayerConfig,
  PlayerSnapshot,
  PlayerState,
} from './PlayerTypes';

export class PlayerController {
  readonly position = { x: 0, y: 0, z: 0 };
  readonly config: PlayerConfig;

  private currentLane: Lane = LANES.CENTER;
  private targetLane: Lane = LANES.CENTER;
  private velocityY = 0;
  private state: PlayerState = PlayerState.IDLE;
  private slideElapsed = 0;
  private started = false;

  constructor(config: Partial<PlayerConfig> = {}) {
    this.config = { ...DEFAULT_PLAYER_CONFIG, ...config };
  }

  start() {
    this.started = true;
    this.state = PlayerState.RUN;
  }

  moveLane(direction: -1 | 1) {
    const nextLane = Math.max(LANES.LEFT, Math.min(LANES.RIGHT, this.targetLane + direction)) as Lane;
    this.targetLane = nextLane;
  }

  jump() {
    if (!this.started || !this.isGrounded()) return;
    this.velocityY = this.config.jumpForce;
    this.state = PlayerState.JUMP;
  }

  slide() {
    if (!this.started || !this.isGrounded() || this.state === PlayerState.SLIDE) return;
    this.slideElapsed = 0;
    this.state = PlayerState.SLIDE;
  }

  hit() {
    if (!this.started || this.state === PlayerState.HIT || this.state === PlayerState.DEAD) return false;
    this.state = PlayerState.HIT;
    this.velocityY = 0;
    return true;
  }

  recoverHit() {
    if (this.state === PlayerState.HIT) this.state = PlayerState.RUN;
  }

  die() {
    this.state = PlayerState.DEAD;
    this.velocityY = 0;
  }

  reset() {
    this.position.x = 0;
    this.position.y = 0;
    this.position.z = 0;
    this.currentLane = LANES.CENTER;
    this.targetLane = LANES.CENTER;
    this.velocityY = 0;
    this.slideElapsed = 0;
    this.state = PlayerState.RUN;
    this.started = true;
  }

  update(deltaTime: number) {
    const delta = Math.min(deltaTime, 0.05);
    if (!this.started || this.state === PlayerState.HIT || this.state === PlayerState.DEAD) return;

    const targetX = this.targetLane * this.config.laneWidth;
    const laneBlend = 1 - Math.exp(-this.config.laneSmoothing * delta);
    this.position.x += (targetX - this.position.x) * laneBlend;
    this.position.z -= this.config.speed * delta;

    if (!this.isGrounded() || this.state === PlayerState.JUMP || this.state === PlayerState.FALL) {
      this.velocityY -= this.config.gravity * delta;
      this.position.y += this.velocityY * delta;
      if (this.position.y > 0 && this.velocityY <= 0) this.state = PlayerState.FALL;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocityY = 0;
        this.state = PlayerState.RUN;
      }
    }

    if (this.state === PlayerState.SLIDE) {
      this.slideElapsed += delta;
      if (this.slideElapsed >= this.config.slideDuration) {
        this.slideElapsed = 0;
        this.state = PlayerState.RUN;
      }
    }

    if (Math.abs(targetX - this.position.x) < 0.01) {
      this.currentLane = this.targetLane;
    }
  }

  getSnapshot(): PlayerSnapshot {
    return {
      lane: this.currentLane,
      lanePosition: this.position.x,
      verticalPosition: this.position.y,
      velocityY: this.velocityY,
      state: this.state,
      animation: this.state,
      isGrounded: this.isGrounded(),
      slideProgress: this.state === PlayerState.SLIDE ? this.slideElapsed / this.config.slideDuration : 0,
    };
  }

  private isGrounded() {
    return this.position.y <= 0.001 && this.state !== PlayerState.JUMP && this.state !== PlayerState.FALL;
  }
}
