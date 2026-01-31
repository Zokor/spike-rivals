import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private isMuted = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preload(): void {
    // TODO: Load audio files
    // this.scene.load.audio('hit', 'assets/audio/hit.wav');
    // this.scene.load.audio('score', 'assets/audio/score.wav');
    // this.scene.load.audio('jump', 'assets/audio/jump.wav');
    // this.scene.load.audio('music-menu', 'assets/audio/music-menu.mp3');
    // this.scene.load.audio('music-game', 'assets/audio/music-game.mp3');
  }

  create(): void {
    // Initialize sounds after loading
  }

  playSfx(key: string): void {
    if (this.isMuted) return;

    const sound = this.scene.sound.add(key, { volume: this.sfxVolume });
    sound.play();
  }

  playMusic(key: string, loop = true): void {
    this.stopMusic();
    if (this.isMuted) return;

    const music = this.scene.sound.add(key, {
      volume: this.musicVolume,
      loop,
    });
    music.play();
    this.sounds.set('currentMusic', music);
  }

  stopMusic(): void {
    const currentMusic = this.sounds.get('currentMusic');
    if (currentMusic) {
      currentMusic.stop();
      currentMusic.destroy();
      this.sounds.delete('currentMusic');
    }
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    const currentMusic = this.sounds.get('currentMusic');
    if (currentMusic && 'setVolume' in currentMusic) {
      (currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.scene.sound.mute = true;
    } else {
      this.scene.sound.mute = false;
    }
    return this.isMuted;
  }

  destroy(): void {
    this.sounds.forEach((sound) => sound.destroy());
    this.sounds.clear();
  }
}
