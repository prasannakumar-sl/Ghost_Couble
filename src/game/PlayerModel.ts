import { Asset } from 'expo-asset';
import { Image, Platform } from 'react-native';
import * as THREE from 'three';

import { CHARACTER_CONFIGS, CharacterAnimation, CharacterId } from './CharacterTypes';
import { cloneAlexModel, loadAlexGLTF, mapAlexAnimations } from './AlexModelAssets';
import { JetpackPhase, PlayerSnapshot, PlayerState } from './PlayerTypes';

export interface PlayerModel {
  root: THREE.Group;
  visual: THREE.Group;
  sprite: THREE.Sprite;
  model3D: THREE.Object3D | null;
  mixer: THREE.AnimationMixer | null;
  actions: Partial<Record<CharacterAnimation | 'fly', THREE.AnimationAction>>;
  currentAnimation: CharacterAnimation | 'fly' | null;
  currentSpriteAnimation: CharacterAnimation | null;
  textures: THREE.Texture[];
}

const ANIMATION_BY_STATE: Record<PlayerState, CharacterAnimation> = {
  [PlayerState.IDLE]: 'idle',
  [PlayerState.RUN]: 'run',
  [PlayerState.JUMP]: 'jump',
  [PlayerState.FALL]: 'fall',
  [PlayerState.SLIDE]: 'slide',
  [PlayerState.HIT]: 'idle',
  [PlayerState.DEAD]: 'fall',
};

export function createSelectedCharacter(characterId: CharacterId): PlayerModel {
  const root = new THREE.Group();
  root.name = `Player-${characterId}`;
  const visual = new THREE.Group();
  visual.name = 'PlayerVisual';
  root.add(visual);

  const material = new THREE.SpriteMaterial({
    color: 0xffffff,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = `${characterId}-PlayerSprite`;
  sprite.position.y = 1.35;
  sprite.scale.set(1.8, 2.7, 1);
  visual.add(sprite);

  return {
    root,
    visual,
    sprite,
    model3D: null,
    mixer: null,
    actions: {},
    currentAnimation: null,
    currentSpriteAnimation: null,
    textures: [],
  };
}

export async function loadPlayerTextures(model: PlayerModel, characterId: CharacterId, shouldCancel = () => false) {
  const texturesPromise = loadCharacterTextures(model, characterId);
  if (characterId === 'alex') {
    try {
      const [gltf, textures] = await Promise.all([loadAlexGLTF(), texturesPromise]);
      if (shouldCancel()) return textures;
      const character = cloneAlexModel(gltf, 2.45);
      model.visual.add(character);
      model.model3D = character;
      model.mixer = new THREE.AnimationMixer(character);
      const clips = mapAlexAnimations(gltf.animations);
      for (const [name, clip] of Object.entries(clips)) {
        if (!clip) continue;
        const loops = name === 'run' || name === 'fly' || name === 'idle';
        const action = model.mixer.clipAction(clip);
        action.setLoop(loops ? THREE.LoopRepeat : THREE.LoopOnce, loops ? Infinity : 1);
        action.clampWhenFinished = !loops;
        model.actions[name as CharacterAnimation | 'fly'] = action;
      }
      return textures;
    } catch (error) {
      console.error('[Alex GLB] Unable to load model; using existing character textures', error);
    }
  }
  return texturesPromise;
}

async function loadCharacterTextures(model: PlayerModel, characterId: CharacterId) {
  const config = CHARACTER_CONFIGS[characterId];
  const entries = await Promise.all(
    (Object.keys(config) as CharacterAnimation[]).map(async (animation) => [
      animation,
      await loadTexture(config[animation]),
    ] as const),
  );
  const textures = Object.fromEntries(entries) as Record<CharacterAnimation, THREE.Texture>;
  model.textures = Object.values(textures);
  setPlayerTexture(model, textures, 'idle');
  return textures;
}

export function updatePlayerVisual(
  model: PlayerModel,
  textures: Record<CharacterAnimation, THREE.Texture>,
  snapshot: PlayerSnapshot,
  elapsed: number,
  delta: number,
  laneVelocity: number,
  deathProgress: number,
) {
  const transition = 1 - Math.exp(-14 * Math.min(delta, 0.05));
  let animation: CharacterAnimation | 'fly' = snapshot.jetpackPhase !== JetpackPhase.NONE
    ? 'fly'
    : ANIMATION_BY_STATE[snapshot.state];
  if (animation === 'fall' && model.model3D && !model.actions.fall && model.actions.jump) {
    animation = 'jump';
  }
  const action = model.actions[animation];

  if (action) {
    if (model.currentAnimation !== animation) {
      const previousAction = model.currentAnimation ? model.actions[model.currentAnimation] : undefined;
      action.reset().fadeIn(0.16).play();
      previousAction?.fadeOut(0.16);
      model.currentAnimation = animation;
    }
    model.model3D!.visible = true;
    model.sprite.visible = false;
    model.mixer?.update(delta);
  } else {
    if (model.currentAnimation) {
      model.mixer?.stopAllAction();
      model.currentAnimation = null;
    }
    if (model.model3D) model.model3D.visible = false;
    model.sprite.visible = true;
    setPlayerTexture(model, textures, animation === 'fly' ? 'fall' : animation);
  }

  const running = snapshot.state === PlayerState.RUN && snapshot.jetpackPhase === JetpackPhase.NONE;
  const sliding = snapshot.state === PlayerState.SLIDE;
  const falling = snapshot.state === PlayerState.FALL;
  const runBounce = running ? Math.abs(Math.sin(elapsed * 11)) * 0.06 : 0;
  const targetTilt = THREE.MathUtils.clamp(-laneVelocity * 0.08, -0.16, 0.16) + deathProgress * Math.PI * 0.5;
  const targetYaw = THREE.MathUtils.clamp(laneVelocity * 0.035, -0.07, 0.07);

  model.visual.position.y = approach(
    model.visual.position.y,
    (sliding ? -0.08 : snapshot.jetpackPhase !== JetpackPhase.NONE ? 0.03 : runBounce),
    transition,
  );
  model.visual.rotation.x = approach(
    model.visual.rotation.x,
    snapshot.jetpackPhase !== JetpackPhase.NONE ? -0.08 : falling ? 0.12 : sliding ? 0.08 : 0,
    transition,
  );
  model.visual.scale.y = approach(model.visual.scale.y, sliding && !action ? 0.92 : 1, transition);
  model.root.rotation.z = approach(model.root.rotation.z, targetTilt, transition);
  model.root.rotation.y = approach(model.root.rotation.y, targetYaw, transition);

  const material = model.sprite.material as THREE.SpriteMaterial;
  material.opacity = 1 - deathProgress * 0.15;
  model.sprite.position.y = approach(model.sprite.position.y, sliding ? 1.04 : 1.35, transition);
}

export function disposePlayerModel(model: PlayerModel) {
  model.mixer?.stopAllAction();
  if (!model.model3D) return;
  model.mixer?.uncacheRoot(model.model3D);
  model.model3D.traverse((object) => {
    if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
  });
}


function setPlayerTexture(
  model: PlayerModel,
  textures: Record<CharacterAnimation, THREE.Texture>,
  animation: CharacterAnimation,
) {
  if (model.currentSpriteAnimation === animation) return;
  const texture = textures[animation];
  const material = model.sprite.material as THREE.SpriteMaterial;
  material.map = texture;
  material.needsUpdate = true;
  model.currentSpriteAnimation = animation;

  const image = texture.image as { width?: number; height?: number } | undefined;
  if (image?.width && image.height) {
    const height = animation === 'slide' ? 1.65 : 2.7;
    model.sprite.scale.set(height * (image.width / image.height), height, 1);
  }
}

async function loadTexture(moduleId: number) {
  const [asset] = await Asset.loadAsync(moduleId);

  if (Platform.OS === 'web') {
    return new Promise<THREE.Texture>((resolve, reject) => {
      new THREE.TextureLoader().load(asset.uri, resolve, undefined, reject);
    });
  }

  if (!asset.localUri) throw new Error(`Unable to load character asset: ${asset.name}`);

  let width = asset.width;
  let height = asset.height;
  if (!width || !height) {
    ({ width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(asset.localUri as string, (imageWidth, imageHeight) => {
        resolve({ width: imageWidth, height: imageHeight });
      }, reject);
    }));
  }

  const texture = new THREE.Texture();
  (texture as THREE.Texture & { isDataTexture: boolean }).isDataTexture = true;
  texture.image = { data: asset, width, height };
  texture.needsUpdate = true;
  return texture;
}

function approach(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}
