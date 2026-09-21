import {
  DEFAULT_PLAYER_CONFIG,
  JetpackPhase,
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
  private currentJetpackPhase = JetpackPhase.NONE;
  private jetpackElapsed = 0;
  private jetpackStartY = 0;

  constructor(config: Partial<PlayerConfig> = {}) {
    this.config = { ...DEFAULT_PLAYER_CONFIG, ...config };
  }

  start() {
    this.started = true;
    this.state = PlayerState.RUN;
  }

  moveLane(direction: -1 | 1) {
    if (this.state === PlayerState.DEAD) return;
    const nextLane = Math.max(LANES.LEFT, Math.min(LANES.RIGHT, this.targetLane + direction)) as Lane;
    this.targetLane = nextLane;
  }

  jump() {
    if (!this.started || this.state === PlayerState.DEAD || this.currentJetpackPhase !== JetpackPhase.NONE || !this.isGrounded()) return;
    this.velocityY = this.config.jumpForce;
    this.state = PlayerState.JUMP;
  }

  slide() {
    if (!this.started || this.state === PlayerState.DEAD || this.currentJetpackPhase !== JetpackPhase.NONE || !this.isGrounded() || this.state === PlayerState.SLIDE) return;
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

  startJetpack() {
    if (!this.started || this.state === PlayerState.DEAD || this.currentJetpackPhase !== JetpackPhase.NONE) return false;
    this.currentJetpackPhase = JetpackPhase.TAKEOFF;
    this.jetpackElapsed = 0;
    this.jetpackStartY = this.position.y;
    this.velocityY = 0;
    this.state = PlayerState.RUN;
    return true;
  }

  finishJetpack() {
    if (this.currentJetpackPhase === JetpackPhase.NONE || this.currentJetpackPhase === JetpackPhase.LANDING) return false;
    this.currentJetpackPhase = JetpackPhase.LANDING;
    this.jetpackElapsed = 0;
    this.velocityY = 0;
    this.state = PlayerState.RUN;
    return true;
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
    this.currentJetpackPhase = JetpackPhase.NONE;
    this.jetpackElapsed = 0;
    this.jetpackStartY = 0;
  }

  update(deltaTime: number) {
    const delta = Math.min(deltaTime, 0.05);
    if (!this.started || this.state === PlayerState.HIT || this.state === PlayerState.DEAD) return;

    const targetX = this.targetLane * this.config.laneWidth;
    const laneBlend = 1 - Math.exp(-this.config.laneSmoothing * delta);
    this.position.x += (targetX - this.position.x) * laneBlend;
    this.position.z -= this.config.speed * delta;

    if (this.currentJetpackPhase !== JetpackPhase.NONE) {
      this.updateJetpackHeight(delta);
    } else if (!this.isGrounded() || this.state === PlayerState.JUMP || this.state === PlayerState.FALL) {
      this.velocityY -= this.config.gravity * delta;
      this.position.y += this.velocityY * delta;
      if (this.position.y > 0 && this.velocityY <= 0) this.state = PlayerState.FALL;
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.velocityY = 0;
        this.state = PlayerState.RUN;
      }
    }

    if (this.state === PlayerState.SLIDE && this.currentJetpackPhase === JetpackPhase.NONE) {
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

  get jetpackPhase() {
    return this.currentJetpackPhase;
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
      jetpackPhase: this.currentJetpackPhase,
    };
  }

  private isGrounded() {
    return this.currentJetpackPhase === JetpackPhase.NONE && this.position.y <= 0.001 && this.state !== PlayerState.JUMP && this.state !== PlayerState.FALL;
  }

  private updateJetpackHeight(delta: number) {
    this.jetpackElapsed += delta;
    if (this.currentJetpackPhase === JetpackPhase.TAKEOFF) {
      const progress = Math.min(1, this.jetpackElapsed / 0.9);
      this.position.y = this.jetpackStartY + (4.2 - this.jetpackStartY) * (1 - Math.pow(1 - progress, 3));
      if (progress === 1) {
        this.currentJetpackPhase = JetpackPhase.FLIGHT;
        this.jetpackElapsed = 0;
      }
      return;
    }
    if (this.currentJetpackPhase === JetpackPhase.FLIGHT) {
      this.position.y = 4.2;
      return;
    }

    const progress = Math.min(1, this.jetpackElapsed / 0.9);
    this.position.y = 4.2 * Math.pow(1 - progress, 3);
    if (progress === 1) {
      this.position.y = 0;
      this.currentJetpackPhase = JetpackPhase.NONE;
      this.jetpackElapsed = 0;
      this.jetpackStartY = 0;
      this.state = PlayerState.RUN;
    }
  }
}
