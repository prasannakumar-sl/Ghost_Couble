import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GameHUD from '@/components/GameHUD';
import GameOverScreen from '@/components/GameOverScreen';
import { BestStats, loadBestStats, saveBestStats } from './BestStatsStore';
import { GameState } from './GameRuntime';
import { GameSnapshot } from './GameSnapshot';
import { GhostState } from './ghost/GhostState';
import { GAME_CONFIG } from './config/gameConfig';
import ThreeGameView from './ThreeGameView';

const INITIAL_SNAPSHOT: GameSnapshot = {
  score: 0,
  distance: 0,
  coins: 0,
  hearts: GAME_CONFIG.maxHearts,
  maxHearts: GAME_CONFIG.maxHearts,
  gameState: GameState.RUNNING,
  gameOverReason: null,
  ghostState: GhostState.FOLLOW,
  ghostChaseRemaining: 0,
  ghostDistanceBehind: 4.8,
  jetpackActive: false,
  jetpackRemaining: 0,
  shieldActive: false,
  shieldRemaining: 0,
  magnetActive: false,
  magnetRemaining: 0,
};

const INITIAL_BEST: BestStats = { bestScore: 0, bestDistance: 0, bestCoins: 0, totalCoins: 0 };

export default function GameScene() {
  const insets = useSafeAreaInsets();
  const maxHealth: number = GAME_CONFIG.maxHearts;
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT);
  const [currentHealth, setCurrentHealth] = useState(maxHealth);
  const [best, setBest] = useState(INITIAL_BEST);
  const [bestStatsLoaded, setBestStatsLoaded] = useState(false);
  const [restartToken, setRestartToken] = useState(0);
  const savedGameOverRef = useRef(false);

  useEffect(() => {
    void loadBestStats().then((nextBest) => {
      setBest(nextBest);
      setBestStatsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (snapshot.gameState !== GameState.DEAD || savedGameOverRef.current) return;
    savedGameOverRef.current = true;
    const nextBest = {
      bestScore: Math.max(best.bestScore, snapshot.score),
      bestDistance: Math.max(best.bestDistance, Math.floor(snapshot.distance)),
      bestCoins: Math.max(best.bestCoins, snapshot.coins),
      totalCoins: best.totalCoins,
    };
    setBest(nextBest);
    console.log('[GAME] Final Score:', snapshot.score);
    console.log('[GAME] High Score:', nextBest.bestScore);
    console.log('[COIN] Final Run Coins:', snapshot.coins);
    console.log('[COIN] Total Coins:', best.totalCoins);
    void saveBestStats(nextBest);
  }, [best, snapshot]);

  const handleHealthChanged = (health: number) => {
    setCurrentHealth(health);
  };

  const handleCoinsCollected = (amount: number) => {
    setBest((previousBest) => {
      const nextTotal = previousBest.totalCoins + amount;
      console.log('[COIN] Run Coins:', snapshot.coins, '[COIN] Total Coins:', nextTotal);
      const nextBest = { ...previousBest, totalCoins: nextTotal };
      void saveBestStats(nextBest);
      return nextBest;
    });
  };

  const handleRestart = () => {
    savedGameOverRef.current = false;
    setCurrentHealth(maxHealth);
    console.log('[COIN] New run');
    console.log('[COIN] Run Coins reset to 0');
    setSnapshot(INITIAL_SNAPSHOT);
    setRestartToken((token) => token + 1);
  };

  return (
    <View style={styles.container}>
      <ThreeGameView
        restartToken={restartToken}
        previousBestDistance={best.bestDistance}
        bestStatsLoaded={bestStatsLoaded}
        onSnapshot={setSnapshot}
        onHealthChanged={handleHealthChanged}
        onCoinsCollected={handleCoinsCollected}
      />
      <View pointerEvents="none" style={[styles.titleHud, { paddingTop: Math.max(18, insets.top + 4) }]}>
        <Text style={styles.title}>GHOST COUPLE</Text>
        <Text style={styles.subtitle}>SWIPE TO RUN THE NIGHT</Text>
      </View>
      <GameHUD snapshot={snapshot} currentHealth={currentHealth} maxHealth={maxHealth} />
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
