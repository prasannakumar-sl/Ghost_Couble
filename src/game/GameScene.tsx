import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ThreeGameView from './ThreeGameView';

export default function GameScene() {
  return (
    <View style={styles.container}>
      <ThreeGameView />
      <View pointerEvents="none" style={styles.hud}>
        <Text style={styles.title}>GHOST COUPLE</Text>
        <Text style={styles.subtitle}>SWIPE TO RUN THE NIGHT</Text>
        <View style={styles.instructions}>
          <Text style={styles.instruction}>← →  LANE</Text>
          <Text style={styles.instruction}>↑  JUMP   ↓  SLIDE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08091a' },
  hud: { ...StyleSheet.absoluteFill, paddingTop: 18, paddingHorizontal: 20 },
  title: { color: '#e8fbff', fontSize: 22, fontWeight: '800', letterSpacing: 3 },
  subtitle: { color: '#8aa6c9', fontSize: 10, letterSpacing: 2, marginTop: 4 },
  instructions: { alignSelf: 'center', marginTop: 'auto', marginBottom: 24, alignItems: 'center', opacity: 0.8 },
  instruction: { color: '#c7d5ff', fontSize: 12, letterSpacing: 1, marginTop: 5 },
});
