import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { audioManager } from '@/audio/AudioManager';
import { CHARACTER_IDS, CharacterId } from '@/game/CharacterTypes';
import { loadSelectedCharacterId, saveSelectedCharacterId } from '@/game/CharacterStore';

const CHARACTER_NAMES: Record<CharacterId, string> = {
  alex: 'ALEX',
  luna: 'LUNA',
  rex: 'REX',
  mia: 'MIA',
  kaito: 'KAITO',
  zara: 'ZARA',
};

const CHARACTER_PREVIEWS = {
  alex: require('@/assets/images/characters/alex/Alex_Idle.png'),
  luna: require('@/assets/images/characters/luna/Luna_Idle.png'),
  rex: require('@/assets/images/characters/rex/Rex_Idle.png'),
  mia: require('@/assets/images/characters/mia/Mia_Idle.png'),
  kaito: require('@/assets/images/characters/kaito/Kaito_Idle.png'),
  zara: require('@/assets/images/characters/zara/Zara_Idle.png'),
} as const;

interface CharacterSelectionScreenProps {
  onBack: () => void;
  onPlay: (characterId: CharacterId) => void;
}

export default function CharacterSelectionScreen({ onBack, onPlay }: CharacterSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('alex');
  const selectionTouchedRef = useRef(false);
  const selectedCharacterLoadRef = useRef<Promise<CharacterId> | null>(null);
  const columns = width >= 700 ? 3 : 2;
  const contentWidth = Math.min(Math.max(width - 32, 280), 720);
  const cardGap = width >= 700 ? 16 : 10;
  const cardWidth = (contentWidth - cardGap * (columns - 1)) / columns;

  useEffect(() => {
    const selectedCharacterLoad = loadSelectedCharacterId();
    selectedCharacterLoadRef.current = selectedCharacterLoad;
    void selectedCharacterLoad.then((characterId) => {
      if (!selectionTouchedRef.current) setSelectedCharacterId(characterId);
    });
  }, []);

  const handleSelect = (characterId: CharacterId) => {
    selectionTouchedRef.current = true;
    setSelectedCharacterId(characterId);
    void saveSelectedCharacterId(characterId);
  };

  const handleBack = () => {
    audioManager.playSFX('button');
    onBack();
  };

  const handlePlay = async () => {
    const characterId = selectionTouchedRef.current
      ? selectedCharacterId
      : await (selectedCharacterLoadRef.current ?? Promise.resolve(selectedCharacterId));
    audioManager.playSFX('button');
    await saveSelectedCharacterId(characterId);
    onPlay(characterId);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 24) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>← BACK</Text>
        </Pressable>
        <Text style={styles.eyebrow}>GHOST COUPLE</Text>
        <Text style={styles.title}>SELECT YOUR CHARACTER</Text>
        <Text style={styles.subtitle}>CHOOSE YOUR RUNNER</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            width: contentWidth,
            paddingBottom: Math.max(insets.bottom + 118, 130),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.grid, { columnGap: cardGap, rowGap: cardGap }]}>
          {CHARACTER_IDS.map((characterId) => {
            const selected = characterId === selectedCharacterId;
            return (
              <Pressable
                key={characterId}
                accessibilityRole="button"
                accessibilityLabel={`Select ${CHARACTER_NAMES[characterId]}`}
                accessibilityState={{ selected }}
                onPress={() => handleSelect(characterId)}
                style={({ pressed }) => [
                  styles.card,
                  { width: cardWidth },
                  selected && styles.cardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.imageFrame}>
                  <Image source={CHARACTER_PREVIEWS[characterId]} style={styles.image} resizeMode="contain" />
                </View>
                <Text style={styles.name}>{CHARACTER_NAMES[characterId]}</Text>
                {selected ? (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓ SELECTED</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 26) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play with selected character"
          onPress={handlePlay}
          style={({ pressed }) => [styles.playButton, pressed && styles.playPressed]}
        >
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.playText}>PLAY</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#070817',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  backText: {
    color: '#b4c8e9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  eyebrow: {
    color: '#71e8ee',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.8,
    marginTop: 7,
  },
  title: {
    color: '#effaff',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 2.2,
    textAlign: 'center',
    marginTop: 7,
  },
  subtitle: {
    color: '#8d9fc6',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
  },
  scrollContent: {
    alignItems: 'center',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    minHeight: 176,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(14, 19, 47, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(123, 155, 205, 0.34)',
  },
  cardSelected: {
    backgroundColor: 'rgba(47, 35, 76, 0.98)',
    borderColor: '#ffd45c',
    borderWidth: 2,
    shadowColor: '#ffd45c',
    shadowRadius: 16,
    shadowOpacity: 0.82,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ scale: 1.025 }],
  },
  imageFrame: {
    width: '100%',
    height: 126,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '92%',
    height: '100%',
  },
  name: {
    color: '#e8f5ff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  selectedBadge: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: '#ffd45c',
  },
  selectedBadgeText: {
    color: '#21142a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.78,
  },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(7, 8, 23, 0.94)',
  },
  playButton: {
    width: '100%',
    maxWidth: 360,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#59e5eb',
    borderWidth: 1,
    borderColor: '#b4ffff',
    shadowColor: '#54e6f4',
    shadowRadius: 16,
    shadowOpacity: 0.72,
    shadowOffset: { width: 0, height: 0 },
  },
  playPressed: {
    opacity: 0.86,
  },
  playIcon: {
    color: '#071526',
    fontSize: 14,
    marginRight: 11,
  },
  playText: {
    color: '#071526',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
});
