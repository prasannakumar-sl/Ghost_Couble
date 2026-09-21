import * as THREE from 'three';

import { Coin } from './Coin';

export class CollectiblePool {
  readonly coins: Coin[];
  private nextIndex = 0;

  constructor(size: number) {
    this.coins = Array.from({ length: size }, () => new Coin());
  }

  acquire() {
    for (let offset = 0; offset < this.coins.length; offset += 1) {
      const index = (this.nextIndex + offset) % this.coins.length;
      const coin = this.coins[index];
      if (!coin.isAvailable()) continue;
      this.nextIndex = (index + 1) % this.coins.length;
      return coin;
    }
    const coin = this.coins[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.coins.length;
    coin.deactivate();
    return coin;
  }

  release(coin: Coin) {
    coin.deactivate();
  }

  releaseAll() {
    this.coins.forEach((coin) => coin.deactivate());
  }

  reset() {
    this.nextIndex = 0;
    this.releaseAll();
  }

  dispose() {
    this.coins.forEach((coin) => {
      coin.parent?.remove(coin);
      coin.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
        else mesh.material?.dispose();
      });
    });
  }
}
