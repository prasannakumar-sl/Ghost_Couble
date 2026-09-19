import * as THREE from 'three';

import { Lane } from './PlayerTypes';
import { OBSTACLE_DEFINITIONS, ObstacleDefinition, ObstaclePlacement, ObstacleType } from './ObstacleTypes';

export class Obstacle extends THREE.Group {
  private readonly mesh: THREE.Mesh;
  private readonly baseDefinition: ObstacleDefinition;
  private active = false;
  private lane: Lane = 0;
  private obstacleTypeValue: ObstacleType = ObstacleType.BLOCK;

  constructor() {
    super();
    this.baseDefinition = OBSTACLE_DEFINITIONS[ObstacleType.BLOCK];
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(this.baseDefinition.width, this.baseDefinition.height, this.baseDefinition.depth),
      new THREE.MeshStandardMaterial({
        color: 0x4a285f,
        emissive: 0x170b2e,
        emissiveIntensity: 0.8,
        roughness: 0.85,
      }),
    );
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.position.y = this.definition.bottom + this.definition.height / 2;
    this.add(this.mesh);
    this.visible = false;
  }

  activate(placement: ObstaclePlacement, laneWidth: number) {
    const definition = OBSTACLE_DEFINITIONS[placement.type];
    this.obstacleTypeValue = placement.type;
    this.lane = placement.lane;
    this.mesh.scale.set(
      definition.width / this.baseDefinition.width,
      definition.height / this.baseDefinition.height,
      definition.depth / this.baseDefinition.depth,
    );
    this.mesh.position.y = definition.bottom + definition.height / 2;
    this.position.set(placement.lane * laneWidth, 0, placement.localZ);
    this.active = true;
    this.visible = true;
  }

  deactivate() {
    this.active = false;
    this.visible = false;
  }

  isActive() {
    return this.active;
  }

  get obstacleType() {
    return this.obstacleTypeValue;
  }

  get obstacleLane() {
    return this.lane;
  }

  get definition() {
    return OBSTACLE_DEFINITIONS[this.obstacleTypeValue];
  }
}
