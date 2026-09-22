import React, { useState } from 'react';

import GhostCoupleHome from '@/components/GhostCoupleHome';
import GameScene from '@/game/GameScene';

export default function HomeScreen() {
  const [gameStarted, setGameStarted] = useState(false);

  if (gameStarted) return <GameScene />;

  return <GhostCoupleHome onStartGame={() => setGameStarted(true)} />;
}
