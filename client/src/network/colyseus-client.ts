import { Client, Room } from 'colyseus.js';
import type { GameState, PlayerInput } from '@spike-rivals/shared';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:2567';

export class ColyseusClient {
  private client: Client;
  private room: Room<GameState> | null = null;
  private seedHandler: ((seed: number) => void) | null = null;
  private seedListenerBound = false;
  private lastSeed: number | null = null;

  constructor() {
    this.client = new Client(WS_URL);
  }

  async joinOrCreate(roomName: string, options?: Record<string, unknown>): Promise<Room<GameState>> {
    this.room = await this.client.joinOrCreate<GameState>(roomName, options);
    this.resetSeedListener();
    this.bindSeedListener();
    return this.room;
  }

  async join(roomId: string, options?: Record<string, unknown>): Promise<Room<GameState>> {
    this.room = await this.client.joinById<GameState>(roomId, options);
    this.resetSeedListener();
    this.bindSeedListener();
    return this.room;
  }

  async create(roomName: string, options?: Record<string, unknown>): Promise<Room<GameState>> {
    this.room = await this.client.create<GameState>(roomName, options);
    this.resetSeedListener();
    this.bindSeedListener();
    return this.room;
  }

  async quickMatch(): Promise<Room<GameState>> {
    return this.joinOrCreate('game_room', { mode: 'quick' });
  }

  async rankedMatch(): Promise<Room<GameState>> {
    return this.joinOrCreate('ranked_room', { mode: 'ranked' });
  }

  async privateRoom(code?: string): Promise<Room<GameState>> {
    if (code) {
      // Join existing room
      const rooms = await this.client.getAvailableRooms('private_room');
      const room = rooms.find((r) => r.metadata?.code === code);
      if (room) {
        return this.join(room.roomId);
      }
      throw new Error('Room not found');
    }
    // Create new private room
    return this.create('private_room', { mode: 'private' });
  }

  getRoom(): Room<GameState> | null {
    return this.room;
  }

  sendInput(input: PlayerInput & { sequence: number }): void {
    this.room?.send('input', input);
  }

  sendReady(): void {
    this.room?.send('ready');
  }

  leave(): void {
    this.room?.leave();
    this.room = null;
  }

  onStateChange(callback: (state: GameState) => void): void {
    this.room?.onStateChange(callback);
  }

  onMessage<T = unknown>(type: string, callback: (message: T) => void): void {
    this.room?.onMessage(type, callback);
  }

  onSeed(callback: (seed: number) => void): void {
    this.seedHandler = callback;
    if (this.lastSeed !== null) {
      callback(this.lastSeed);
    }
    this.bindSeedListener();
  }

  onLeave(callback: (code: number) => void): void {
    this.room?.onLeave(callback);
  }

  onError(callback: (code: number, message?: string) => void): void {
    this.room?.onError(callback);
  }

  private resetSeedListener(): void {
    this.seedListenerBound = false;
    this.lastSeed = null;
  }

  private bindSeedListener(): void {
    if (!this.room || this.seedListenerBound) return;
    this.seedListenerBound = true;
    this.room.onMessage('seed', (message: { seed: number }) => {
      this.lastSeed = message.seed;
      this.seedHandler?.(message.seed);
    });
  }
}

// Singleton instance
export const colyseusClient = new ColyseusClient();
