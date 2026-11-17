import { Asset } from 'expo-asset';
import { loadAsync } from 'expo-three';
import { Image, Platform } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

import { CHARACTER_CONFIGS, CharacterAnimation, CharacterId } from './CharacterTypes';
import { JetpackPhase, PlayerSnapshot, PlayerState } from './PlayerTypes';

export interface PlayerModel {
  root: THREE.Group;
  visual: THREE.Group;
  sprite: THREE.Sprite;
  model3D: THREE.Object3D | null;
  modelBasePosition: THREE.Vector3 | null;
  mixer: THREE.AnimationMixer | null;
  actions: Partial<Record<CharacterAnimation | 'fly', THREE.AnimationAction>>;
  currentAnimation: CharacterAnimation | 'fly' | null;
  currentSpriteAnimation: CharacterAnimation | null;
  textures: THREE.Texture[];
}

type AlexAnimation = CharacterAnimation | 'fly';

const ALEX_MODEL_ASSET = require('@/assets/models/characters/alex/alex.glb');

const ALEX_CLIP_NAMES: Partial<Record<AlexAnimation, string>> = {
  run: 'FastRun0',
  jump: 'JumpingUp0',
  slide: 'RunningSlide0',
  fly: 'Flying1',
};

const ANIMATION_BY_STATE: Record<PlayerState, CharacterAnimation> = {
  [PlayerState.IDLE]: 'run',
  [PlayerState.RUN]: 'run',
  [PlayerState.JUMP]: 'jump',
  [PlayerState.FALL]: 'run',
  [PlayerState.SLIDE]: 'slide',
  [PlayerState.HIT]: 'run',
  [PlayerState.DEAD]: 'run',
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
    modelBasePosition: null,
    mixer: null,
    actions: {},
    currentAnimation: null,
    currentSpriteAnimation: null,
    textures: [],
  };
}

export async function loadPlayerTextures(
  model: PlayerModel,
  characterId: CharacterId,
  shouldCancel = () => false,
) {
  if (characterId === 'alex') void loadAlexModel(model, shouldCancel);
  return loadCharacterTextures(model, characterId);
}

async function loadAlexModel(model: PlayerModel, shouldCancel: () => boolean) {
  try {
    const [asset] = await Asset.loadAsync(ALEX_MODEL_ASSET);
    const assetUri = asset.localUri ?? asset.uri;
    const gltf = Platform.OS === 'web'
      ? await new GLTFLoader().loadAsync(assetUri) as GLTF
      : await loadAsync(
          ALEX_MODEL_ASSET,
          undefined,
          assetUri.slice(0, assetUri.lastIndexOf('/') + 1),
        ) as GLTF;
    if (shouldCancel()) return;
    const character = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(character);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.45 / Math.max(size.y, 0.001);

    character.scale.setScalar(scale);
    character.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    character.rotation.y = Math.PI;
    character.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    model.visual.add(character);
    model.model3D = character;
    model.modelBasePosition = character.position.clone();
    model.mixer = new THREE.AnimationMixer(character);

    const clipNames = gltf.animations.map(({ name }) => name);
    gltf.animations.forEach(stripRootMotion);
    console.info('[Alex GLB] Available animation clips:', clipNames);
    for (const [animation, clipName] of Object.entries(ALEX_CLIP_NAMES) as [AlexAnimation, string][]) {
      const clip = gltf.animations.find(({ name }) => name === clipName);
      if (!clip) {
        console.warn(`[Alex GLB] Missing ${clipName} clip. Available clips: ${clipNames.join(', ') || 'none'}`);
        continue;
      }

      const loops = animation === 'run' || animation === 'fly';
      const action = model.mixer.clipAction(clip);
      action.setLoop(loops ? THREE.LoopRepeat : THREE.LoopOnce, loops ? Infinity : 1);
      action.clampWhenFinished = !loops;
      model.actions[animation] = action;
    }
  } catch (error) {
    console.error('[Alex GLB] Unable to load model; using existing character textures', error);
  }
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
  const isJumpClipActive = model.currentAnimation === 'jump' && model.actions.jump?.isRunning();
  const animation: AlexAnimation = snapshot.jetpackPhase !== JetpackPhase.NONE
    ? 'fly'
    : snapshot.state === PlayerState.FALL && isJumpClipActive
      ? 'jump'
      : ANIMATION_BY_STATE[snapshot.state];
  const action = model.actions[animation];

  if (model.model3D) {
    if (model.currentAnimation !== animation) {
      const previousAction = model.currentAnimation ? model.actions[model.currentAnimation] : undefined;
      if (action) action.reset().fadeIn(0.16).play();
      previousAction?.fadeOut(0.16);
      model.currentAnimation = action ? animation : null;
    }
    model.model3D.visible = true;
    model.sprite.visible = false;
    model.mixer?.update(delta);
    if (model.modelBasePosition) model.model3D.position.copy(model.modelBasePosition);
  } else {
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

function stripRootMotion(clip: THREE.AnimationClip) {
  clip.tracks = clip.tracks.filter((track) => {
    const target = track.name.split('.')[0]?.toLowerCase() ?? '';
    const isPositionTrack = /\.position(?:\[[xyz]\])?$/i.test(track.name);
    const isRootMotionTarget = !target || target.includes('root') || target.includes('hips') || target.includes('armature');
    return !(isPositionTrack && isRootMotionTarget);
  });
}

function approach(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}
