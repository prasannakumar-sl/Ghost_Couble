export const LANES = {
  LEFT: -1,
  CENTER: 0,
  RIGHT: 1,
} as const;

export type Lane = (typeof LANES)[keyof typeof LANES];

export enum PlayerState {
  IDLE = 'IDLE',
  RUN = 'RUN',
  JUMP = 'JUMP',
  FALL = 'FALL',
  SLIDE = 'SLIDE',
}

export type AnimationState = PlayerState;

export interface PlayerSnapshot {
  lane: Lane;
  lanePosition: number;
  verticalPosition: number;
  velocityY: number;
  state: PlayerState;
  animation: AnimationState;
  isGrounded: boolean;
  slideProgress: number;
}

export interface PlayerConfig {
  laneWidth: number;
  speed: number;
  laneSmoothing: number;
  jumpForce: number;
  gravity: number;
  slideDuration: number;
}

export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  laneWidth: 2.35,
  speed: 8,
  laneSmoothing: 13,
  jumpForce: 8.6,
  gravity: 22,
  slideDuration: 0.72,
};
