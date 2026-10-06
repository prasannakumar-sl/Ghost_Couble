import { Asset } from 'expo-asset';
import { loadAsync } from 'expo-three';
import { Platform } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

export const ALEX_MODEL_ASSET = require('@/assets/models/characters/alex/alex.glb');
export const ALEX_HOME_MODEL_ASSET = require('@/assets/models/characters/alex/alex_home.glb');

type AlexAnimation = 'idle' | 'run' | 'jump' | 'slide' | 'fall' | 'fly';

let gltfPromise: Promise<GLTF> | null = null;
let homeGltfPromise: Promise<GLTF> | null = null;

export function loadAlexGLTF(): Promise<GLTF> {
  if (!gltfPromise) {
    gltfPromise = loadGLTF(ALEX_MODEL_ASSET).catch((error) => {
      gltfPromise = null;
      throw error;
    });
  }
  return gltfPromise;
}

export function loadAlexHomeGLTF(): Promise<GLTF> {
  if (!homeGltfPromise) {
    homeGltfPromise = loadGLTF(ALEX_HOME_MODEL_ASSET).catch((error) => {
      homeGltfPromise = null;
      throw error;
    });
  }
  return homeGltfPromise;
}

export function cloneAlexHomeModel(gltf: GLTF, targetHeight = 2.45, faceCamera = true) {
  const model = clone(gltf.scene);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = targetHeight / Math.max(size.y, 0.001);

  model.scale.setScalar(scale);
  // Center horizontally and depth-wise, position feet at ground y = 0
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  // The alex_home.glb model naturally faces +Z (towards the viewer)
  model.rotation.y = faceCamera ? 0 : Math.PI;

  model.traverse((object) => {
    object.userData.sharedCharacterAsset = true;
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.metalness !== undefined && mat.metalness > 0.35) {
          mat.metalness = 0.2;
        }
        if (mat.roughness !== undefined && mat.roughness < 0.45) {
          mat.roughness = 0.55;
        }
        mat.needsUpdate = true;
      }
    }
  });

  return model;
}

export function cloneAlexModel(gltf: GLTF, targetHeight: number, faceCamera = true) {
  const model = clone(gltf.scene);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = targetHeight / Math.max(size.y, 0.001);

  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  if (faceCamera) model.rotation.y = Math.PI;
  model.traverse((object) => {
    object.userData.sharedCharacterAsset = true;
  });
  return model;
}

export function mapAlexAnimations(clips: THREE.AnimationClip[] = []) {
  console.info('[Alex GLB] Available animation clips:', clips.map(({ name }) => name));
  const normalized = clips.map((clip) => [clip.name.trim().toLowerCase(), clip] as const);
  const aliases: Record<AlexAnimation, string[]> = {
    idle: ['idle', 'standing'],
    run: ['run', 'running'],
    jump: ['jump', 'jumping'],
    slide: ['slide', 'sliding'],
    fall: ['fall', 'falling'],
    fly: ['fly', 'flying', 'flight'],
  };

  const animations = Object.fromEntries(
    Object.entries(aliases).flatMap(([action, names]) => {
      const match = normalized.find(([name]) => names.some((alias) => name.includes(alias)));
      return match ? [[action, match[1]]] : [];
    }),
  ) as Partial<Record<AlexAnimation, THREE.AnimationClip>>;

  for (const action of ['run', 'jump', 'slide', 'fly'] as const) {
    if (!animations[action]) console.warn(`[Alex GLB] Missing ${action} animation clip`);
  }
  return animations;
}

async function loadGLTF(assetModule: any): Promise<GLTF> {
  if (Platform.OS !== 'web') {
    return (await loadAsync(assetModule)) as GLTF;
  }

  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync().catch(() => {});
  const uri = asset.localUri || asset.uri;

  const loader = new GLTFLoader();

  return new Promise<GLTF>((resolve, reject) => {
    loader.load(
      uri,
      (gltf) => resolve(gltf),
      undefined,
      async (err) => {
        try {
          const response = await fetch(uri);
          if (!response.ok) throw new Error(`Alex GLB request failed: ${response.status}`);
          const data = await response.arrayBuffer();
          loader.parse(data, '', resolve, reject);
        } catch (fallbackError) {
          reject(fallbackError || err);
        }
      }
    );
  });
}
