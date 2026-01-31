import { createClient, type RedisClientType } from 'redis';
import { env } from '../config';

let client: RedisClientType | null = null;

export class RedisClient {
  private static instance: RedisClientType;

  static async connect(): Promise<RedisClientType> {
    if (client) return client;

    client = createClient({
      url: env.REDIS_URL,
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('   Redis connected');
    });

    await client.connect();
    return client;
  }

  static getInstance(): RedisClientType {
    if (!client) {
      throw new Error('Redis client not connected. Call RedisClient.connect() first.');
    }
    return client;
  }

  static async disconnect(): Promise<void> {
    if (client) {
      await client.quit();
      client = null;
    }
  }

  // Helper methods for common operations
  static async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const redis = this.getInstance();
    if (ttlSeconds) {
      await redis.setEx(key, ttlSeconds, value);
    } else {
      await redis.set(key, value);
    }
  }

  static async get(key: string): Promise<string | null> {
    const redis = this.getInstance();
    return redis.get(key);
  }

  static async del(key: string): Promise<void> {
    const redis = this.getInstance();
    await redis.del(key);
  }

  static async incr(key: string): Promise<number> {
    const redis = this.getInstance();
    return redis.incr(key);
  }

  // Session management
  static async setSession(userId: string, sessionData: object, ttlSeconds = 86400): Promise<void> {
    await this.set(`session:${userId}`, JSON.stringify(sessionData), ttlSeconds);
  }

  static async getSession<T>(userId: string): Promise<T | null> {
    const data = await this.get(`session:${userId}`);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  static async deleteSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  // Online status
  static async setOnline(userId: string): Promise<void> {
    const redis = this.getInstance();
    await redis.sAdd('online_users', userId);
  }

  static async setOffline(userId: string): Promise<void> {
    const redis = this.getInstance();
    await redis.sRem('online_users', userId);
  }

  static async getOnlineCount(): Promise<number> {
    const redis = this.getInstance();
    return redis.sCard('online_users');
  }

  static async isOnline(userId: string): Promise<boolean> {
    const redis = this.getInstance();
    return redis.sIsMember('online_users', userId);
  }
}
