import { Client, Room } from 'colyseus.js';
import type { GameState } from '@spike-rivals/shared';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:2567';

export class ColyseusClient {
  private client: Client;
  private room: Room<GameState> | null = null;

  constructor() {
    this.client = new Client(WS_URL);
  }

  async joinOrCreate(roomName: string, options?: Record<string, unknown>): Promise<Room<GameState>> {
    this.room = await this.client.joinOrCreate<GameState>(roomName, options);
    return this.room;
  }

  async join(roomId: string, options?: Record<string, unknown>): Promise<Room<GameState>> {
    this.room = await this.client.joinById<GameState>(roomId, options);
    return this.room;
  }

  async create(roomName: string, options?: Record<string, unknown>): Promise<Room<GameState>> {
    this.room = await this.client.create<GameState>(roomName, options);
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

  sendInput(input: { left: boolean; right: boolean; up: boolean; action: boolean }): void {
    this.room?.send('input', input);
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

  onLeave(callback: (code: number) => void): void {
    this.room?.onLeave(callback);
  }

  onError(callback: (code: number, message?: string) => void): void {
    this.room?.onError(callback);
  }
}

// Singleton instance
export const colyseusClient = new ColyseusClient();
