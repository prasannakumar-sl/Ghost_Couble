export const CHARACTER_IDS = ['alex', 'luna', 'rex', 'mia', 'kaito', 'zara'] as const;

export type CharacterId = (typeof CHARACTER_IDS)[number];

export interface CharacterAppearance {
  body: number;
  cloak: number;
  accent: number;
  skin: number;
  hair: number;
  shoes: number;
}

export const CHARACTER_APPEARANCES: Record<CharacterId, CharacterAppearance> = {
  alex: {
    body: 0x24224b,
    cloak: 0x4d367a,
    accent: 0x63e5ed,
    skin: 0xd7f5f6,
    hair: 0x17152f,
    shoes: 0x0e1024,
  },
  luna: {
    body: 0x352550,
    cloak: 0x702b78,
    accent: 0xff7eb6,
    skin: 0xf5d9ee,
    hair: 0x24142f,
    shoes: 0x160d22,
  },
  rex: {
    body: 0x263b55,
    cloak: 0x2f6680,
    accent: 0x7ee8ff,
    skin: 0xd7e9ed,
    hair: 0x101c2e,
    shoes: 0x0b1424,
  },
  mia: {
    body: 0x4b263f,
    cloak: 0x8b3e5b,
    accent: 0xffb15f,
    skin: 0xf0d6d2,
    hair: 0x2a1323,
    shoes: 0x1b0d18,
  },
  kaito: {
    body: 0x26375a,
    cloak: 0x38569b,
    accent: 0x9d8cff,
    skin: 0xd4e8f4,
    hair: 0x111934,
    shoes: 0x0b1025,
  },
  zara: {
    body: 0x334d3d,
    cloak: 0x467c67,
    accent: 0xb6f37d,
    skin: 0xe4f0d5,
    hair: 0x14281e,
    shoes: 0x0b1711,
  },
};

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && CHARACTER_IDS.includes(value as CharacterId);
}
