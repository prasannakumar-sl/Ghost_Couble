import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';

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
  private readonly sfxPlayers = new Map<SfxName, AudioPlayer>();
  private ghostState: GhostAudioState = null;
  private musicVolume = 0.4;
  private sfxVolume = 0.7;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
  }

  playMusic(track: MusicTrack) {
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
    this.musicPlayer?.play();
  }

  playSFX(name: SfxName, options: SfxOptions = {}) {
    let player = this.sfxPlayers.get(name);
    if (!player) {
      player = createAudioPlayer(SFX_SOURCES[name]);
      this.sfxPlayers.set(name, player);
    }

    player.loop = options.loop ?? false;
    player.volume = options.volume ?? this.sfxVolume;
    player.seekTo(0);
    player.play();
  }

  stopSFX(name: SfxName) {
    const player = this.sfxPlayers.get(name);
    if (!player) return;
    player.pause();
    player.seekTo(0);
  }

  stopAll() {
    this.stopMusic();
    for (const player of this.sfxPlayers.values()) {
      player.pause();
      player.seekTo(0);
    }
    this.ghostState = null;
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicPlayer) this.musicPlayer.volume = this.musicVolume;
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    for (const player of this.sfxPlayers.values()) player.volume = this.sfxVolume;
  }

  startGhostFollow() {
    if (this.ghostState === 'FOLLOW') return;
    this.stopSFX('ghost_chase');
    this.playSFX('ghost_follow', { loop: true, volume: 0.3 });
    this.ghostState = 'FOLLOW';
  }

  startGhostChase() {
    if (this.ghostState === 'CHASE') return;
    this.stopSFX('ghost_follow');
    this.playSFX('ghost_chase', { loop: true, volume: 0.5 });
    this.ghostState = 'CHASE';
  }

  playGhostAttack() {
    this.stopSFX('ghost_follow');
    this.stopSFX('ghost_chase');
    this.playSFX('ghost_attack', { volume: 0.7 });
    this.ghostState = 'ATTACK';
  }

  cleanup() {
    this.stopAll();
    for (const player of this.sfxPlayers.values()) player.remove();
    this.sfxPlayers.clear();
    this.initialized = false;
  }
}

export const audioManager = new AudioManager();
