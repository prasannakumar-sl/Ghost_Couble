import React, { useEffect, useState } from 'react';

import CharacterSelectionScreen from '@/components/CharacterSelectionScreen';
import GhostCoupleHome from '@/components/GhostCoupleHome';
import { CharacterId } from '@/game/CharacterTypes';
import { loadSelectedCharacterId } from '@/game/CharacterStore';
import GameScene from '@/game/GameScene';

export default function HomeScreen() {
  const [characterSelectionOpen, setCharacterSelectionOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('alex');

  useEffect(() => {
    void loadSelectedCharacterId().then(setSelectedCharacterId);
  }, []);

  const handlePlay = async () => {
    const savedCharacterId = await loadSelectedCharacterId();
    setSelectedCharacterId(savedCharacterId);
    setGameStarted(true);
  };

  if (gameStarted) {
    return <GameScene characterId={selectedCharacterId} onHome={() => setGameStarted(false)} />;
  }

  if (characterSelectionOpen) {
    return (
      <CharacterSelectionScreen
        onBack={() => setCharacterSelectionOpen(false)}
        onSelect={(characterId) => {
          setSelectedCharacterId(characterId);
          setCharacterSelectionOpen(false);
        }}
      />
    );
  }

  return (
    <GhostCoupleHome
      selectedCharacterId={selectedCharacterId}
      onPlay={handlePlay}
      onCharacter={() => setCharacterSelectionOpen(true)}
    />
  );
}
