import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export interface AudioSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  uiSoundsEnabled: boolean;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  uiSoundsEnabled: true,
};

const STORAGE_KEY = 'ghost-couple-audio-settings';
const settingsUri = `${FileSystem.documentDirectory ?? ''}ghost-couple-audio-settings.json`;

export async function loadAudioSettings(): Promise<AudioSettings> {
  const stored = Platform.OS === 'web'
    ? typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)
    : settingsUri && (await FileSystem.getInfoAsync(settingsUri)).exists
      ? await FileSystem.readAsStringAsync(settingsUri)
      : null;

  if (stored === null) return { ...DEFAULT_AUDIO_SETTINGS };

  const value = JSON.parse(stored) as Partial<AudioSettings>;
  return {
    musicEnabled: value.musicEnabled ?? true,
    sfxEnabled: value.sfxEnabled ?? true,
    uiSoundsEnabled: value.uiSoundsEnabled ?? true,
  };
}

export async function saveAudioSettings(settings: AudioSettings) {
  const value = JSON.stringify(settings);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value);
    return;
  }

  if (settingsUri) await FileSystem.writeAsStringAsync(settingsUri, value);
}
