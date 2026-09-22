import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { CharacterId, isCharacterId } from './CharacterTypes';

const DEFAULT_CHARACTER_ID: CharacterId = 'alex';
const STORAGE_KEY = 'ghost-couple-selected-character';
const settingsUri = `${FileSystem.documentDirectory ?? ''}ghost-couple-selected-character.json`;

export async function loadSelectedCharacterId(): Promise<CharacterId> {
  const stored = Platform.OS === 'web'
    ? typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)
    : settingsUri && (await FileSystem.getInfoAsync(settingsUri)).exists
      ? await FileSystem.readAsStringAsync(settingsUri)
      : null;

  if (stored === null) return DEFAULT_CHARACTER_ID;
  const value = JSON.parse(stored) as unknown;
  return isCharacterId(value) ? value : DEFAULT_CHARACTER_ID;
}

export async function saveSelectedCharacterId(characterId: CharacterId) {
  const value = JSON.stringify(characterId);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value);
    return;
  }

  if (settingsUri) await FileSystem.writeAsStringAsync(settingsUri, value);
}
