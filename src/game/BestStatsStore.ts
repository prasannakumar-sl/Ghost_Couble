import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export interface BestStats {
  bestScore: number;
  bestDistance: number;
  bestCoins: number;
}

const DEFAULT_STATS: BestStats = {
  bestScore: 0,
  bestDistance: 0,
  bestCoins: 0,
};

const STORAGE_KEY = 'ghost-couple-best-stats';
const statsUri = `${FileSystem.documentDirectory ?? ''}ghost-couple-best-stats.json`;

export async function loadBestStats(): Promise<BestStats> {
  if (Platform.OS === 'web') {
    const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATS };
    const value = JSON.parse(stored) as Partial<BestStats>;
    return {
      bestScore: value.bestScore ?? 0,
      bestDistance: value.bestDistance ?? 0,
      bestCoins: value.bestCoins ?? 0,
    };
  }

  if (!statsUri || !(await FileSystem.getInfoAsync(statsUri)).exists) return { ...DEFAULT_STATS };
  const value = JSON.parse(await FileSystem.readAsStringAsync(statsUri)) as Partial<BestStats>;
  return {
    bestScore: value.bestScore ?? 0,
    bestDistance: value.bestDistance ?? 0,
    bestCoins: value.bestCoins ?? 0,
  };
}

export async function saveBestStats(stats: BestStats) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    return;
  }
  if (!statsUri) return;
  await FileSystem.writeAsStringAsync(statsUri, JSON.stringify(stats));
}
