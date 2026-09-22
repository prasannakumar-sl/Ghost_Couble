import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameSnapshot } from '@/game/GameSnapshot';

interface GameHUDProps {
  snapshot: GameSnapshot;
  currentHealth: number;
  maxHealth: number;
}

interface HeartProps {
  active: boolean;
}

function Heart({ active }: HeartProps) {
  return <Text style={[styles.heart, !active && styles.emptyHeart]}>♥</Text>;
}

export default function GameHUD({ snapshot, currentHealth, maxHealth }: GameHUDProps) {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.statBlock}>
          <Text style={styles.label}>HEARTS</Text>
          <View style={styles.hearts}>
            {Array.from({ length: maxHealth }).map((_, index) => (
              <Heart key={index} active={index < currentHealth} />
            ))}
          </View>
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
      {snapshot.shieldActive ? (
        <View style={styles.shieldBadge}>
          <Text style={styles.shieldValue}>SHIELD {Math.ceil(snapshot.shieldRemaining)}s</Text>
        </View>
      ) : null}
      {snapshot.magnetActive ? (
        <View style={styles.magnetBadge}>
          <Text style={styles.magnetValue}>MAGNET {Math.ceil(snapshot.magnetRemaining)}s</Text>
        </View>
      ) : null}
      {snapshot.jetpackActive ? (
        <View style={styles.jetpackBadge}>
          <Text style={styles.jetpackValue}>🚀 JETPACK {snapshot.jetpackRemaining}s</Text>
        </View>
      ) : null}
      {snapshot.ghostChaseRemaining > 0 ? (
        <View style={styles.chaseBadge}>
          <Text style={styles.chaseLabel}>GHOST CHASE</Text>
          <Text style={styles.chaseTimer}>{Math.ceil(snapshot.ghostChaseRemaining)}</Text>
        </View>
      ) : null}
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
  hearts: { flexDirection: 'row', marginTop: 1 },
  heart: { color: '#ff6c9b', fontSize: 20, marginRight: 5 },
  emptyHeart: { color: '#32334d' },
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
  shieldBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 69, 92, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(72, 231, 255, 0.72)',
  },
  shieldValue: { color: '#8ff3ff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  magnetBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(94, 19, 48, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255, 108, 155, 0.72)',
  },
  magnetValue: { color: '#ff9ebc', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  jetpackBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(42, 31, 102, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(169, 141, 255, 0.78)',
  },
  jetpackValue: { color: '#d7ccff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  chaseBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(85, 12, 48, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255, 108, 155, 0.72)',
  },
  chaseLabel: { color: '#ff9ebc', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  chaseTimer: { color: '#fff3f7', fontSize: 15, fontWeight: '900' },
});
