export const GAME_CONFIG = {
  maxHearts: 3,
  scorePerMeter: 1,
  scorePerCoin: 10,
  coinCollectionRadius: 0.8,
  damageCooldown: 1,
  hitDuration: 0.28,
  hudUpdateInterval: 0.12,
  coinPoolSize: 96,
  coinFrequency: 0.85,
  shieldDuration: 9,
} as const;

export type GameConfig = typeof GAME_CONFIG;
