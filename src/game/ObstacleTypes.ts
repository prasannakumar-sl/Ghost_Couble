import { Lane } from './PlayerTypes';

export enum ObstacleType {
  BLOCK = 'BLOCK',
  LOW = 'LOW',
  OVERHEAD = 'OVERHEAD',
}

export interface ObstacleDefinition {
  width: number;
  height: number;
  depth: number;
  bottom: number;
}

export const OBSTACLE_DEFINITIONS: Record<ObstacleType, ObstacleDefinition> = {
  [ObstacleType.BLOCK]: { width: 1.7, height: 1.45, depth: 1.2, bottom: 0 },
  [ObstacleType.LOW]: { width: 1.8, height: 0.55, depth: 1.2, bottom: 0 },
  [ObstacleType.OVERHEAD]: { width: 1.9, height: 0.8, depth: 1.2, bottom: 1.55 },
};

export interface ObstaclePlacement {
  type: ObstacleType;
  lane: Lane;
  localZ: number;
}
