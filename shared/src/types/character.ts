import { CHARACTERS, ATTRIBUTE_FORMULAS } from '../constants.js';

export type CharacterId = 'blitz' | 'crusher' | 'sky' | 'zen' | 'tank' | 'flash' | 'nova' | 'ghost';

export interface CharacterStats {
  id: CharacterId;
  speed: number;  // 1-8
  jump: number;   // 1-8
  power: number;  // 1-8
  control: number; // 1-8
}

export interface CharacterInfo extends CharacterStats {
  name: string;
  description: string;
  playstyle: string;
}

/**
 * Character class for volleyball game
 * Each character has 20 total attribute points distributed across 4 stats
 */
export class Character {
  readonly id: CharacterId;
  readonly speed: number;
  readonly jump: number;
  readonly power: number;
  readonly control: number;

  constructor(stats: CharacterStats) {
    this.id = stats.id;
    this.speed = stats.speed;
    this.jump = stats.jump;
    this.power = stats.power;
    this.control = stats.control;
  }

  /**
   * Get movement speed in pixels per second
   * Formula: base 100 + speed * 20
   * Range: 120 (speed 1) to 260 (speed 8)
   */
  getMovementSpeed(): number {
    return ATTRIBUTE_FORMULAS.speed(this.speed);
  }

  /**
   * Get jump force (initial upward velocity)
   * Formula: base 200 + jump * 40
   * Range: 240 (jump 1) to 520 (jump 8)
   */
  getJumpForce(): number {
    return ATTRIBUTE_FORMULAS.jump(this.jump);
  }

  /**
   * Get hit power (ball velocity after hit)
   * Formula: base 300 + power * 50
   * Range: 350 (power 1) to 700 (power 8)
   */
  getHitPower(): number {
    return ATTRIBUTE_FORMULAS.power(this.power);
  }

  /**
   * Get control factor (hit precision)
   * Formula: base 0.5 + control * 0.0625
   * Range: 0.5625 (control 1) to 1.0 (control 8)
   * Higher = more precise, less random angle deviation
   */
  getControlFactor(): number {
    return ATTRIBUTE_FORMULAS.control(this.control);
  }

  /**
   * Get total attribute points (should be 20 for all characters)
   */
  getTotalPoints(): number {
    return this.speed + this.jump + this.power + this.control;
  }

  /**
   * Get stats as object
   */
  getStats(): CharacterStats {
    return {
      id: this.id,
      speed: this.speed,
      jump: this.jump,
      power: this.power,
      control: this.control,
    };
  }

  /**
   * Get all calculated values
   */
  getCalculatedStats() {
    return {
      movementSpeed: this.getMovementSpeed(),
      jumpForce: this.getJumpForce(),
      hitPower: this.getHitPower(),
      controlFactor: this.getControlFactor(),
    };
  }

  /**
   * Create Character instance from CharacterId
   */
  static fromId(id: CharacterId): Character {
    const key = id.toUpperCase() as keyof typeof CHARACTERS;
    const stats = CHARACTERS[key];
    if (!stats) {
      throw new Error(`Unknown character: ${id}`);
    }
    return new Character(stats as CharacterStats);
  }

  /**
   * Get all available characters
   */
  static getAllCharacters(): Character[] {
    return Object.values(CHARACTERS).map(
      (stats) => new Character(stats as CharacterStats)
    );
  }

  /**
   * Get character by ID, returns undefined if not found
   */
  static getById(id: CharacterId): Character | undefined {
    try {
      return Character.fromId(id);
    } catch {
      return undefined;
    }
  }
}

/**
 * Character descriptions for UI
 */
export const CHARACTER_INFO: Record<CharacterId, Omit<CharacterInfo, keyof CharacterStats> & { id: CharacterId }> = {
  blitz: {
    id: 'blitz',
    name: 'Blitz',
    description: 'A speedy player who can cover the court quickly.',
    playstyle: 'Speedster - fast movement, balanced offense',
  },
  crusher: {
    id: 'crusher',
    name: 'Crusher',
    description: 'Slow but hits like a truck. Master of power spikes.',
    playstyle: 'Power hitter - slow but devastating spikes',
  },
  sky: {
    id: 'sky',
    name: 'Sky',
    description: 'Soars above the competition with incredible jump height.',
    playstyle: 'High flyer - dominates the net',
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    description: 'Calm and precise, places the ball exactly where intended.',
    playstyle: 'Precision - perfect ball placement',
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    description: 'A reliable defender with solid all-around stats.',
    playstyle: 'Defensive - all-rounder with great control',
  },
  flash: {
    id: 'flash',
    name: 'Flash',
    description: 'The fastest player on the court. Can reach any ball.',
    playstyle: 'Ultra speed - reaches every corner',
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    description: 'The balanced choice. Good at everything, master of none.',
    playstyle: 'Balanced - jack of all trades',
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    description: 'Unpredictable and tricky. Hard to read movements.',
    playstyle: 'Tricky - deceptive plays',
  },
};

/**
 * Get full character info including stats and description
 */
export function getCharacterInfo(id: CharacterId): CharacterInfo {
  const character = Character.fromId(id);
  const info = CHARACTER_INFO[id];
  return {
    ...character.getStats(),
    ...info,
  };
}

/**
 * Validate that all characters have exactly 20 total points
 */
export function validateCharacterBalance(): boolean {
  const characters = Character.getAllCharacters();
  return characters.every((char) => char.getTotalPoints() === 20);
}
