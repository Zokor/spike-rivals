import Phaser from 'phaser';

const STORAGE_KEY = 'spike-rivals-audio';

interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

interface PlayMusicOptions {
  loop?: boolean;
  fadeMs?: number;
}

export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private isMuted = false;
  private currentMusicKey: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.loadSettings();
  }

  /**
   * Load audio files in preload phase
   * Call this from BootScene.preload()
   */
  static preloadAudio(scene: Phaser.Scene): void {
    // Music
    // scene.load.audio('music-menu', 'assets/audio/music/menu.mp3');
    // scene.load.audio('music-select', 'assets/audio/music/select.mp3');
    // scene.load.audio('music-match', 'assets/audio/music/match.mp3');

    // Stingers (short clips that play over music)
    // scene.load.audio('stinger-victory', 'assets/audio/stingers/victory.mp3');
    // scene.load.audio('stinger-defeat', 'assets/audio/stingers/defeat.mp3');
    // scene.load.audio('stinger-blitz', 'assets/audio/stingers/blitz.mp3');
    // scene.load.audio('stinger-nova', 'assets/audio/stingers/nova.mp3');
    // ... other character stingers

    // SFX
    // scene.load.audio('sfx-hit', 'assets/audio/sfx/hit.wav');
    // scene.load.audio('sfx-perfect', 'assets/audio/sfx/perfect.wav');
    // scene.load.audio('sfx-score', 'assets/audio/sfx/score.wav');
    // scene.load.audio('sfx-jump', 'assets/audio/sfx/jump.wav');
    // scene.load.audio('sfx-land', 'assets/audio/sfx/land.wav');
    // scene.load.audio('sfx-ui-select', 'assets/audio/sfx/ui-select.wav');
    // scene.load.audio('sfx-ui-confirm', 'assets/audio/sfx/ui-confirm.wav');
    // scene.load.audio('sfx-ui-back', 'assets/audio/sfx/ui-back.wav');
  }

  /**
   * Initialize after scene create
   */
  create(): void {
    // Apply mute state
    this.scene.sound.mute = this.isMuted;
  }

  /**
   * Play a sound effect
   */
  playSfx(key: string): void {
    if (this.isMuted) return;
    if (!this.scene.cache.audio.exists(key)) return;

    const sound = this.scene.sound.add(key, { volume: this.sfxVolume });
    sound.play();
    sound.once('complete', () => sound.destroy());
  }

  /**
   * Play music with optional crossfade
   */
  playMusic(key: string, options: PlayMusicOptions = {}): void {
    const { loop = true, fadeMs = 0 } = options;

    // Skip if same music is already playing
    if (this.currentMusicKey === key) return;

    // Check if audio exists
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`Audio "${key}" not found`);
      return;
    }

    // Stop current music with fade
    if (fadeMs > 0 && this.sounds.has('currentMusic')) {
      const oldMusic = this.sounds.get('currentMusic');
      if (oldMusic && 'setVolume' in oldMusic) {
        this.scene.tweens.add({
          targets: oldMusic,
          volume: 0,
          duration: fadeMs,
          onComplete: () => {
            oldMusic.stop();
            oldMusic.destroy();
          },
        });
      }
    } else {
      this.stopMusic();
    }

    if (this.isMuted) {
      this.currentMusicKey = key;
      return;
    }

    // Start new music
    const music = this.scene.sound.add(key, {
      volume: fadeMs > 0 ? 0 : this.musicVolume,
      loop,
    });
    music.play();
    this.sounds.set('currentMusic', music);
    this.currentMusicKey = key;

    // Fade in if needed
    if (fadeMs > 0) {
      this.scene.tweens.add({
        targets: music,
        volume: this.musicVolume,
        duration: fadeMs,
      });
    }
  }

  /**
   * Play a stinger (short audio clip over music, doesn't stop music)
   */
  playStinger(key: string): void {
    if (this.isMuted) return;
    if (!this.scene.cache.audio.exists(key)) return;

    // Duck the music temporarily
    const currentMusic = this.sounds.get('currentMusic');
    const originalVolume = this.musicVolume;

    if (currentMusic && 'setVolume' in currentMusic) {
      (currentMusic as Phaser.Sound.WebAudioSound).setVolume(originalVolume * 0.3);
    }

    // Play stinger
    const stinger = this.scene.sound.add(key, { volume: this.sfxVolume });
    stinger.play();

    // Restore music volume when stinger ends
    stinger.once('complete', () => {
      if (currentMusic && 'setVolume' in currentMusic) {
        this.scene.tweens.add({
          targets: currentMusic,
          volume: originalVolume,
          duration: 200,
        });
      }
      stinger.destroy();
    });
  }

  /**
   * Stop current music
   */
  stopMusic(): void {
    const currentMusic = this.sounds.get('currentMusic');
    if (currentMusic) {
      currentMusic.stop();
      currentMusic.destroy();
      this.sounds.delete('currentMusic');
    }
    this.currentMusicKey = null;
  }

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    const currentMusic = this.sounds.get('currentMusic');
    if (currentMusic && 'setVolume' in currentMusic) {
      (currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
    this.saveSettings();
  }

  /**
   * Set SFX volume (0-1)
   */
  setSfxVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.saveSettings();
  }

  /**
   * Get current music volume
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Get current SFX volume
   */
  getSfxVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.scene.sound.mute = this.isMuted;
    this.saveSettings();
    return this.isMuted;
  }

  /**
   * Get mute state
   */
  getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings: AudioSettings = JSON.parse(stored);
        this.musicVolume = settings.musicVolume ?? 0.5;
        this.sfxVolume = settings.sfxVolume ?? 0.7;
        this.isMuted = settings.isMuted ?? false;
      }
    } catch {
      // Use defaults if localStorage fails
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      const settings: AudioSettings = {
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        isMuted: this.isMuted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.sounds.forEach((sound) => sound.destroy());
    this.sounds.clear();
    this.currentMusicKey = null;
  }
}
