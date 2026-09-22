import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameOverReason } from '@/game/GameRuntime';
import { GameSnapshot } from '@/game/GameSnapshot';
import { BestStats } from '@/game/BestStatsStore';

interface GameOverScreenProps {
  snapshot: GameSnapshot;
  best: BestStats;
  onRestart: () => void;
  onHome: () => void;
}

export default function GameOverScreen({ snapshot, best, onRestart, onHome }: GameOverScreenProps) {
  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>GAME OVER</Text>
        <Text style={styles.subtitle}>
          {snapshot.gameOverReason === GameOverReason.GHOST_CAUGHT ? 'THE GHOST CAUGHT YOU' : 'THE NIGHT CAUGHT UP'}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>SCORE  <Text style={styles.statValue}>{snapshot.score}</Text></Text>
          <Text style={styles.stat}>DISTANCE  <Text style={styles.statValue}>{Math.floor(snapshot.distance)} m</Text></Text>
          <Text style={styles.stat}>COINS  <Text style={styles.statValue}>{snapshot.coins}</Text></Text>
          <Text style={styles.best}>BEST SCORE {best.bestScore}</Text>
          <Text style={styles.best}>BEST DISTANCE {best.bestDistance} m</Text>
          <Text style={styles.best}>BEST COINS {best.bestCoins}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onRestart} style={styles.button}>
          <Text style={styles.buttonText}>RESTART</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onHome} style={styles.homeButton}>
          <Text style={styles.buttonText}>HOME</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(4, 5, 18, 0.72)' },
  card: { width: '82%', maxWidth: 360, padding: 24, borderRadius: 18, backgroundColor: '#11152c', borderWidth: 1, borderColor: '#39416f', alignItems: 'center' },
  title: { color: '#e8fbff', fontSize: 27, fontWeight: '900', letterSpacing: 3 },
  subtitle: { color: '#8aa6c9', fontSize: 10, letterSpacing: 1.5, marginTop: 6 },
  stats: { width: '100%', marginTop: 22, gap: 8 },
  stat: { color: '#aebce0', fontSize: 13, letterSpacing: 1 },
  statValue: { color: '#e8fbff', fontWeight: '800' },
  best: { color: '#ffd45c', fontSize: 12, letterSpacing: 1, marginTop: 5 },
  button: { marginTop: 24, minWidth: 150, alignItems: 'center', paddingVertical: 12, borderRadius: 22, backgroundColor: '#42d8e8' },
  homeButton: { minWidth: 150, marginTop: 10, alignItems: 'center', paddingVertical: 12, borderRadius: 22, backgroundColor: '#a98dff' },
  buttonText: { color: '#071322', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
});
