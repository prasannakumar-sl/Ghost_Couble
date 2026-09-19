import * as THREE from 'three';

export interface RoadChunkConfig {
  chunkLength: number;
  roadWidth: number;
  laneWidth: number;
  numberOfLanes: number;
}

export interface RoadChunkLayout {
  obstacles?: readonly unknown[];
  coins?: readonly unknown[];
  hearts?: readonly unknown[];
  decorations?: readonly unknown[];
}

export const CHUNK_LENGTH = 30;
export const ROAD_WIDTH = 12;
export const LANE_WIDTH = 2.35;
export const NUMBER_OF_LANES = 3;

export const ROAD_CONFIG: RoadChunkConfig = {
  chunkLength: CHUNK_LENGTH,
  roadWidth: ROAD_WIDTH,
  laneWidth: LANE_WIDTH,
  numberOfLanes: NUMBER_OF_LANES,
};

export class RoadChunk extends THREE.Group {
  readonly config: RoadChunkConfig;
  private readonly road: THREE.Mesh;
  private readonly ground: THREE.Mesh;
  private readonly laneGuides: THREE.Mesh[] = [];
  private readonly edgeLights: THREE.Mesh[] = [];
  private layout: RoadChunkLayout = {};

  constructor(config: Partial<RoadChunkConfig> = {}) {
    super();
    this.config = { ...ROAD_CONFIG, ...config };

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x17172c,
      roughness: 0.94,
      metalness: 0.05,
    });
    this.road = new THREE.Mesh(
      new THREE.PlaneGeometry(this.config.roadWidth, this.config.chunkLength),
      roadMaterial,
    );
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.y = -0.03;
    this.add(this.road);

    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x0b0b1c, roughness: 1 });
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.config.roadWidth + 22, this.config.chunkLength),
      groundMaterial,
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.065;
    this.add(this.ground);

    const guideMaterial = new THREE.MeshStandardMaterial({
      color: 0x6755a8,
      emissive: 0x20184b,
      emissiveIntensity: 0.7,
    });
    for (let lane = 1; lane < this.config.numberOfLanes; lane += 1) {
      const x = (lane - this.config.numberOfLanes / 2) * this.config.laneWidth;
      const guide = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.02, 3.3),
        guideMaterial,
      );
      guide.position.set(x, 0.02, 0);
      this.laneGuides.push(guide);
      this.add(guide);
    }

    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x42d8e8,
      emissive: 0x0c5868,
      emissiveIntensity: 0.5,
    });
    for (const x of [-this.config.roadWidth / 2 + 0.47, this.config.roadWidth / 2 - 0.47]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, this.config.chunkLength), edgeMaterial);
      edge.position.set(x, 0.01, 0);
      this.edgeLights.push(edge);
      this.add(edge);
    }
  }

  configure(positionZ: number, layout: RoadChunkLayout = {}) {
    this.position.set(0, 0, positionZ);
    this.layout = layout;
    this.visible = true;
  }

  reset() {
    this.visible = false;
    this.layout = {};
  }

  get startZ() {
    return this.position.z - this.config.chunkLength / 2;
  }

  get endZ() {
    return this.position.z + this.config.chunkLength / 2;
  }

  dispose() {
    this.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
      else mesh.material?.dispose();
    });
  }
}
