import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameRuntimeSnapshot } from '@/game/GameRuntime';

interface GameHUDProps {
  snapshot: GameRuntimeSnapshot;
}

export default function GameHUD({ snapshot }: GameHUDProps) {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.statBlock}>
          <Text style={styles.label}>HEARTS</Text>
          <Text style={styles.hearts}>
            {'♥'.repeat(snapshot.hearts)}
            <Text style={styles.emptyHearts}>{'♥'.repeat(snapshot.maxHearts - snapshot.hearts)}</Text>
          </Text>
        </View>
        <View style={[styles.statBlock, styles.centerBlock]}>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.value}>{snapshot.score}</Text>
        </View>
        <View style={[styles.statBlock, styles.rightBlock]}>
          <Text style={styles.label}>DISTANCE</Text>
          <Text style={styles.value}>{Math.floor(snapshot.distance)} m</Text>
        </View>
      </View>
      <View style={styles.coinBadge}>
        <Text style={styles.coinValue}>● {snapshot.coins}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, paddingHorizontal: 16, paddingTop: 12 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statBlock: { minWidth: 82 },
  centerBlock: { alignItems: 'center' },
  rightBlock: { alignItems: 'flex-end' },
  label: { color: '#8aa6c9', fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  value: { color: '#e8fbff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  hearts: { color: '#ff6c9b', fontSize: 20, letterSpacing: 2, marginTop: 1 },
  emptyHearts: { color: '#32334d' },
  coinBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 17, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 212, 92, 0.4)',
  },
  coinValue: { color: '#ffd45c', fontSize: 13, fontWeight: '800' },
});
