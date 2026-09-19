interface AudioPlayerLike {
  loop: boolean;
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
}

export class GhostAudio {
  private ambientStarted = false;
  private chasePlaying = false;

  constructor(
    private readonly ambient: AudioPlayerLike,
    private readonly chase: AudioPlayerLike,
    private readonly attack: AudioPlayerLike,
  ) {}

  startAmbient() {
    this.ambient.loop = true;
    if (this.ambientStarted) return;
    this.ambientStarted = true;
    this.ambient.play();
  }

  startChase() {
    this.startAmbient();
    this.chase.loop = true;
    this.chase.seekTo(0);
    this.chase.play();
    this.chasePlaying = true;
  }

  endChase() {
    if (!this.chasePlaying) return;
    this.chase.loop = false;
    this.chase.pause();
    this.chase.seekTo(0);
    this.chasePlaying = false;
  }

  playAttack() {
    this.stopAmbient();
    this.endChase();
    this.attack.loop = false;
    this.attack.seekTo(0);
    this.attack.play();
  }

  reset() {
    this.endChase();
    this.attack.pause();
    this.attack.seekTo(0);
    this.startAmbient();
  }

  stopAmbient() {
    this.ambient.loop = false;
    this.ambient.pause();
    this.ambient.seekTo(0);
    this.ambientStarted = false;
  }

  dispose() {
    this.endChase();
    this.stopAmbient();
    this.attack.pause();
    this.attack.seekTo(0);
  }
}
