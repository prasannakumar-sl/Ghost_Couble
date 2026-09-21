import { GameRuntimeSnapshot } from './GameRuntime';
import { GhostState } from './ghost/GhostState';

export interface GameSnapshot extends GameRuntimeSnapshot {
  ghostState: GhostState;
  ghostChaseRemaining: number;
  ghostDistanceBehind: number;
  jetpackActive: boolean;
  jetpackRemaining: number;
}
