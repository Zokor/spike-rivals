# Spike Rivals - Codex Instructions

## Project Type
Competitive 2D volleyball game (Arcade Volleyball clone) with online multiplayer.

## Tech Stack
- Client: Phaser 3 + TypeScript + Vite
- Server: Bun + Elysia + Colyseus
- Database: PostgreSQL + Drizzle ORM
- Cache: Redis
- Auth: JWT

## Project Structure
```
client/          → Phaser 3 game (TypeScript)
server/          → Bun backend (Elysia API + Colyseus rooms)
shared/          → Shared types, constants, physics
docs/            → Documentation and prompts
```

## Code Style
- TypeScript strict mode
- Functional where possible
- Files: kebab-case.ts
- Classes: PascalCase
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE

## Game Constants
```typescript
GRAVITY = 800
BALL_BOUNCE = 0.8
BALL_RADIUS = 8
PLAYER_WIDTH = 24
PLAYER_HEIGHT = 32
COURT_WIDTH = 480
COURT_HEIGHT = 270
GROUND_Y = 230
NET_HEIGHT = 80
```

## Character Attributes
Each character has: speed, jump, power, control (1-8 scale, 20 total points)
- Speed → movement velocity
- Jump → jump force
- Power → ball hit strength
- Control → hit precision

## 8 Characters
Blitz (7,5,4,4), Crusher (3,4,8,5), Sky (4,8,4,4), Zen (5,4,3,8)
Tank (4,3,6,7), Flash (8,4,3,5), Nova (5,6,5,4), Ghost (6,5,4,5)

## 8 Backgrounds
1. Neon District (cyberpunk)
2. Cyber Arena (cyberpunk)
3. Night Market (cyberpunk)
4. Sunset Beach
5. Retro Arcade
6. Space Station
7. Ancient Temple
8. Urban Rooftop

## Ranking Tiers
Rookie (0-399), Bronze (400-799), Silver (800-1199), Gold (1200-1599)
Platinum (1600-1999), Diamond (2000-2399), Champion (2400+)

## Key Patterns

### Phaser Scene
```typescript
export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }
  preload() { /* load assets */ }
  create() { /* setup game objects */ }
  update(time: number, delta: number) { /* game loop */ }
}
```

### Elysia Route
```typescript
import { Elysia, t } from 'elysia';
new Elysia()
  .post('/endpoint', async ({ body }) => { /* handler */ }, {
    body: t.Object({ field: t.String() })
  });
```

### Colyseus Room
```typescript
import { Room, Client } from 'colyseus';
export class GameRoom extends Room<GameState> {
  onCreate(options: any) { this.setState(new GameState()); }
  onJoin(client: Client, options: any) { /* add player */ }
  onLeave(client: Client) { /* remove player */ }
  onMessage(type: string, client: Client, message: any) { /* handle */ }
}
```

### Drizzle Schema
```typescript
import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).unique(),
  elo: integer('elo').default(1000),
});
```

## Server Dependencies
elysia, @elysiajs/cors, @elysiajs/jwt, colyseus, drizzle-orm, postgres, redis

## Client Dependencies
phaser, colyseus.js

## Important Notes
- Use Bun runtime for server (not Node.js)
- Server-authoritative multiplayer (physics runs on server)
- Pixel art: no antialiasing, crisp scaling
- Game resolution: 480x270 scaled up
- See docs/PROMPTS.md for detailed implementation guides
