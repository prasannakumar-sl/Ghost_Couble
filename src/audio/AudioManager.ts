import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';

import { loadAudioSettings, saveAudioSettings, type AudioSettings } from './SoundSettingsStore';

export type MusicTrack = 'HOME' | 'GAMEPLAY' | 'GAME_OVER';
export type SfxName =
  | 'button'
  | 'jump'
  | 'slide'
  | 'coin'
  | 'obstacle_hit'
  | 'heart'
  | 'shield'
  | 'jetpack'
  | 'ghost_follow'
  | 'ghost_chase'
  | 'ghost_attack';
type GameplaySfxName = Exclude<SfxName, 'button'>;

type SfxOptions = {
  loop?: boolean;
  volume?: number;
};

type GhostAudioState = 'FOLLOW' | 'CHASE' | 'ATTACK' | null;

const MUSIC_SOURCES: Record<MusicTrack, AudioSource> = {
  HOME: require('../../assets/audio/music/home.wav'),
  GAMEPLAY: require('../../assets/audio/music/gameplay.wav'),
  GAME_OVER: require('../../assets/audio/music/gameover.wav'),
};

const SFX_SOURCES: Record<SfxName, AudioSource> = {
  button: require('../../assets/audio/sfx/button.wav'),
  jump: require('../../assets/audio/sfx/jump.wav'),
  slide: require('../../assets/audio/sfx/slide.wav'),
  coin: require('../../assets/audio/sfx/coin.wav'),
  obstacle_hit: require('../../assets/audio/sfx/obstacle_hit.wav'),
  heart: require('../../assets/audio/sfx/heart.wav'),
  shield: require('../../assets/audio/sfx/shield.wav'),
  jetpack: require('../../assets/audio/sfx/jetpack.wav'),
  ghost_follow: require('../../assets/audio/sfx/ghost_follow.wav'),
  ghost_chase: require('../../assets/audio/sfx/ghost_chase.wav'),
  ghost_attack: require('../../assets/audio/sfx/ghost_attack.wav'),
};

class AudioManager {
  private musicPlayer: AudioPlayer | null = null;
  private currentMusic: MusicTrack | null = null;
  private requestedMusic: MusicTrack | null = null;
  private readonly gameplaySfxPlayers = new Map<GameplaySfxName, AudioPlayer>();
  private readonly uiSfxPlayers = new Map<'button', AudioPlayer>();
  private ghostState: GhostAudioState = null;
  private musicVolume = 0.4;
  private sfxVolume = 0.7;
  private initialized = false;
  private audioSettingsLoaded = false;
  private readonly pendingAudioSettings = new Set<keyof AudioSettings>();
  private audioSettingsSave = Promise.resolve();
  private musicEnabled = true;
  private sfxEnabled = true;
  private uiSoundsEnabled = true;

  async initialize() {
    if (this.initialized) return;
    const storedSettings = await loadAudioSettings();
    if (!this.pendingAudioSettings.has('musicEnabled')) this.musicEnabled = storedSettings.musicEnabled;
    if (!this.pendingAudioSettings.has('sfxEnabled')) this.sfxEnabled = storedSettings.sfxEnabled;
    if (!this.pendingAudioSettings.has('uiSoundsEnabled')) this.uiSoundsEnabled = storedSettings.uiSoundsEnabled;
    this.pendingAudioSettings.clear();
    this.audioSettingsLoaded = true;
    this.initialized = true;
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
  }

  getAudioSettings(): AudioSettings {
    return {
      musicEnabled: this.musicEnabled,
      sfxEnabled: this.sfxEnabled,
      uiSoundsEnabled: this.uiSoundsEnabled,
    };
  }

  setMusicEnabled(enabled: boolean) {
    this.pendingAudioSettings.add('musicEnabled');
    this.musicEnabled = enabled;
    void this.persistAudioSettings();
    if (enabled) {
      if (this.requestedMusic) this.playMusic(this.requestedMusic);
    } else {
      this.stopMusic();
    }
  }

  setSFXEnabled(enabled: boolean) {
    this.pendingAudioSettings.add('sfxEnabled');
    this.sfxEnabled = enabled;
    void this.persistAudioSettings();
    if (!enabled) this.stopGameplaySFX();
  }

  setUISoundsEnabled(enabled: boolean) {
    this.pendingAudioSettings.add('uiSoundsEnabled');
    this.uiSoundsEnabled = enabled;
    void this.persistAudioSettings();
    if (!enabled) this.stopUISFX();
  }

  playMusic(track: MusicTrack) {
    this.requestedMusic = track;
    if (!this.audioSettingsLoaded || !this.musicEnabled) return;
    if (this.currentMusic === track && this.musicPlayer) {
      this.musicPlayer.play();
      return;
    }

    this.stopMusic();
    const player = createAudioPlayer(MUSIC_SOURCES[track]);
    player.loop = true;
    player.volume = this.musicVolume;
    player.play();
    this.musicPlayer = player;
    this.currentMusic = track;
  }

  stopMusic() {
    if (!this.musicPlayer) return;
    this.musicPlayer.pause();
    this.musicPlayer.seekTo(0);
    this.musicPlayer.remove();
    this.musicPlayer = null;
    this.currentMusic = null;
  }

  pauseMusic() {
    this.musicPlayer?.pause();
  }

  resumeMusic() {
    if (!this.audioSettingsLoaded || !this.musicEnabled) return;
    this.musicPlayer?.play();
  }

  playSFX(name: SfxName, options: SfxOptions = {}) {
    if (name === 'button') {
      if (!this.audioSettingsLoaded || !this.uiSoundsEnabled) return;
      let player = this.uiSfxPlayers.get(name);
      if (!player) {
        player = createAudioPlayer(SFX_SOURCES[name]);
        this.uiSfxPlayers.set(name, player);
      }
      player.loop = options.loop ?? false;
      player.volume = options.volume ?? this.sfxVolume;
      player.seekTo(0);
      player.play();
      return;
    }

    if (!this.audioSettingsLoaded || !this.sfxEnabled) return;
    let player = this.gameplaySfxPlayers.get(name);
    if (!player) {
      player = createAudioPlayer(SFX_SOURCES[name]);
      this.gameplaySfxPlayers.set(name, player);
    }

    player.loop = options.loop ?? false;
    player.volume = options.volume ?? this.sfxVolume;
    player.seekTo(0);
    player.play();
  }

  stopSFX(name: SfxName) {
    const player = name === 'button' ? this.uiSfxPlayers.get(name) : this.gameplaySfxPlayers.get(name);
    if (!player) return;
    player.pause();
    player.seekTo(0);
  }

  stopGameplaySFX() {
    for (const player of this.gameplaySfxPlayers.values()) {
      player.pause();
      player.seekTo(0);
    }
    this.ghostState = null;
  }

  stopUISFX() {
    for (const player of this.uiSfxPlayers.values()) {
      player.pause();
      player.seekTo(0);
    }
  }

  stopAll() {
    this.stopMusic();
    this.stopGameplaySFX();
    this.stopUISFX();
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicPlayer) this.musicPlayer.volume = this.musicVolume;
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    for (const player of this.gameplaySfxPlayers.values()) player.volume = this.sfxVolume;
    for (const player of this.uiSfxPlayers.values()) player.volume = this.sfxVolume;
  }

  startGhostFollow() {
    if (!this.audioSettingsLoaded || !this.sfxEnabled || this.ghostState === 'FOLLOW') return;
    this.stopSFX('ghost_chase');
    this.playSFX('ghost_follow', { loop: true, volume: 0.3 });
    this.ghostState = 'FOLLOW';
  }

  startGhostChase() {
    if (!this.audioSettingsLoaded || !this.sfxEnabled || this.ghostState === 'CHASE') return;
    this.stopSFX('ghost_follow');
    this.playSFX('ghost_chase', { loop: true, volume: 0.5 });
    this.ghostState = 'CHASE';
  }

  playGhostAttack() {
    if (!this.audioSettingsLoaded || !this.sfxEnabled) return;
    this.stopSFX('ghost_follow');
    this.stopSFX('ghost_chase');
    this.playSFX('ghost_attack', { volume: 0.7 });
    this.ghostState = 'ATTACK';
  }

  cleanup() {
    this.stopAll();
    for (const player of this.gameplaySfxPlayers.values()) player.remove();
    for (const player of this.uiSfxPlayers.values()) player.remove();
    this.gameplaySfxPlayers.clear();
    this.uiSfxPlayers.clear();
    this.audioSettingsLoaded = false;
    this.initialized = false;
  }

  private persistAudioSettings() {
    const settings = this.getAudioSettings();
    this.audioSettingsSave = this.audioSettingsSave.then(() => saveAudioSettings(settings));
    return this.audioSettingsSave;
  }
}

export const audioManager = new AudioManager();
