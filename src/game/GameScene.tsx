import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GameHUD from '@/components/GameHUD';
import GameOverScreen from '@/components/GameOverScreen';
import { BestStats, loadBestStats, saveBestStats } from './BestStatsStore';
import { GameState } from './GameRuntime';
import { GameSnapshot } from './GameSnapshot';
import { GhostState } from './ghost/GhostState';
import ThreeGameView from './ThreeGameView';

const INITIAL_SNAPSHOT: GameSnapshot = {
  score: 0,
  distance: 0,
  coins: 0,
  hearts: 3,
  maxHearts: 3,
  gameState: GameState.RUNNING,
  gameOverReason: null,
  ghostState: GhostState.FOLLOW,
  ghostChaseRemaining: 0,
  ghostDistanceBehind: 4.8,
};

const INITIAL_BEST: BestStats = { bestScore: 0, bestDistance: 0, bestCoins: 0 };

export default function GameScene() {
  const insets = useSafeAreaInsets();
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [best, setBest] = useState(INITIAL_BEST);
  const [restartToken, setRestartToken] = useState(0);
  const savedGameOverRef = useRef(false);

  useEffect(() => {
    void loadBestStats().then(setBest);
  }, []);

  useEffect(() => {
    if (snapshot.gameState !== GameState.DEAD || savedGameOverRef.current) return;
    savedGameOverRef.current = true;
    const nextBest = {
      bestScore: Math.max(best.bestScore, snapshot.score),
      bestDistance: Math.max(best.bestDistance, Math.floor(snapshot.distance)),
      bestCoins: Math.max(best.bestCoins, snapshot.coins),
    };
    setBest(nextBest);
    void saveBestStats(nextBest);
  }, [best, snapshot]);

  const handleRestart = () => {
    savedGameOverRef.current = false;
    setSnapshot(INITIAL_SNAPSHOT);
    setRestartToken((token) => token + 1);
  };

  return (
    <View style={styles.container}>
      <ThreeGameView restartToken={restartToken} onSnapshot={setSnapshot} />
      <View pointerEvents="none" style={[styles.titleHud, { paddingTop: Math.max(18, insets.top + 4) }]}>
        <Text style={styles.title}>GHOST COUPLE</Text>
        <Text style={styles.subtitle}>SWIPE TO RUN THE NIGHT</Text>
      </View>
      <GameHUD snapshot={snapshot} />
      {snapshot.gameState === GameState.DEAD ? (
        <GameOverScreen snapshot={snapshot} best={best} onRestart={handleRestart} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08091a' },
  titleHud: { ...StyleSheet.absoluteFill, paddingHorizontal: 20 },
  title: { color: '#e8fbff', fontSize: 22, fontWeight: '800', letterSpacing: 3 },
  subtitle: { color: '#8aa6c9', fontSize: 10, letterSpacing: 2, marginTop: 4 },
});
