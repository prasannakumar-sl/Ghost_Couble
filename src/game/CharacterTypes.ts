export const CHARACTER_IDS = ['alex', 'luna', 'rex', 'mia', 'kaito', 'zara'] as const;

export type CharacterId = (typeof CHARACTER_IDS)[number];

export type CharacterAnimation = 'idle' | 'run' | 'jump' | 'slide' | 'fall';

export interface CharacterAssetConfig {
  idle: number;
  run: number;
  jump: number;
  slide: number;
  fall: number;
}

export const CHARACTER_CONFIGS: Record<CharacterId, CharacterAssetConfig> = {
  alex: {
    idle: require('@/assets/images/characters/alex/Alex_Idle.png'),
    run: require('@/assets/images/characters/alex/Alex_Run.png'),
    jump: require('@/assets/images/characters/alex/Alex_Jump.png'),
    slide: require('@/assets/images/characters/alex/Alex_Slide.png'),
    fall: require('@/assets/images/characters/alex/Alex_Fall.png'),
  },
  luna: {
    idle: require('@/assets/images/characters/luna/Luna_Idle.png'),
    run: require('@/assets/images/characters/luna/Luna_Run.png'),
    jump: require('@/assets/images/characters/luna/Luna_Jump.png'),
    slide: require('@/assets/images/characters/luna/Luna_Slide.png'),
    fall: require('@/assets/images/characters/luna/Luna_Fall.png'),
  },
  rex: {
    idle: require('@/assets/images/characters/rex/Rex_Idle.png'),
    run: require('@/assets/images/characters/rex/Rex_Run.png'),
    jump: require('@/assets/images/characters/rex/Rex_Jump.png'),
    slide: require('@/assets/images/characters/rex/Rex_Slide.png'),
    fall: require('@/assets/images/characters/rex/Rex_Fall.png'),
  },
  mia: {
    idle: require('@/assets/images/characters/mia/Mia_Idle.png'),
    run: require('@/assets/images/characters/mia/Mia_Run.png'),
    jump: require('@/assets/images/characters/mia/Mia_Jump.png'),
    slide: require('@/assets/images/characters/mia/Mia_Slide.png'),
    fall: require('@/assets/images/characters/mia/Mia_Fall.png'),
  },
  kaito: {
    idle: require('@/assets/images/characters/kaito/Kaito_Idle.png'),
    run: require('@/assets/images/characters/kaito/Kaito_Run.png'),
    jump: require('@/assets/images/characters/kaito/Kaito_Jump.png'),
    slide: require('@/assets/images/characters/kaito/Kaito_Slide.png'),
    fall: require('@/assets/images/characters/kaito/Kaito_Fall.png'),
  },
  zara: {
    idle: require('@/assets/images/characters/zara/Zara_Idle.png'),
    run: require('@/assets/images/characters/zara/Zara_Run.png'),
    jump: require('@/assets/images/characters/zara/Zara_Jump.png'),
    slide: require('@/assets/images/characters/zara/Zara_Slide.png'),
    fall: require('@/assets/images/characters/zara/Zara_Fall.png'),
  },
};

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && CHARACTER_IDS.includes(value as CharacterId);
}
