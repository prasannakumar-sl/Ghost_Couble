import React, { useState } from 'react';

import CharacterSelectionScreen from '@/components/CharacterSelectionScreen';
import GhostCoupleHome from '@/components/GhostCoupleHome';
import { CharacterId } from '@/game/CharacterTypes';
import GameScene from '@/game/GameScene';

export default function HomeScreen() {
  const [characterSelectionOpen, setCharacterSelectionOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('alex');

  if (gameStarted) {
    return <GameScene characterId={selectedCharacterId} onHome={() => setGameStarted(false)} />;
  }

  if (characterSelectionOpen) {
    return (
      <CharacterSelectionScreen
        onBack={() => setCharacterSelectionOpen(false)}
        onPlay={(characterId) => {
          setSelectedCharacterId(characterId);
          setCharacterSelectionOpen(false);
          setGameStarted(true);
        }}
      />
    );
  }

  return <GhostCoupleHome onPlay={() => setCharacterSelectionOpen(true)} />;
}
