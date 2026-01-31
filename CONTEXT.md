# Spike Rivals - Claude Context

> Competitive volleyball game inspired by Arcade Volleyball (1987)

## 🎯 Project Overview

**Name:** Spike Rivals  
**Genre:** Competitive 2D Volleyball  
**Platforms:** Browser (PWA) → Mobile (iOS/Android)  
**Monetization:** Cosmetic skins, Battle Pass  
**Art Style:** Pixel art (480x270 resolution, scaled up)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Client** | Phaser 3 + TypeScript + Vite |
| **Server** | Bun + Elysia (REST API) + Colyseus (WebSocket) |
| **Database** | PostgreSQL + Drizzle ORM |
| **Cache** | Redis |
| **Auth** | JWT (@elysiajs/jwt) |
| **Mobile** | Capacitor (wrap PWA) |

---

## 📁 Project Structure

```
spike-rivals/
├── client/                    # Phaser game
│   ├── src/
│   │   ├── scenes/           # Boot, Menu, Game, Online, Shop
│   │   ├── entities/         # Player, Ball, Net, CPU
│   │   ├── ui/               # HUD, Menus, Dialogs
│   │   ├── network/          # Colyseus client
│   │   ├── managers/         # Audio, Skin, Input managers
│   │   └── config/           # Game settings
│   └── assets/               # Sprites, audio, fonts
│
├── server/                    # Bun backend
│   ├── src/
│   │   ├── api/              # Elysia REST routes
│   │   │   └── routes/       # auth, user, shop, ranking
│   │   ├── game/             # Colyseus game server
│   │   │   ├── rooms/        # GameRoom, MatchmakingRoom
│   │   │   └── schema/       # GameState, Player, Ball
│   │   ├── services/         # Business logic
│   │   └── db/               # Drizzle schema
│   └── package.json
│
├── shared/                    # Shared code
│   ├── physics/              # Volleyball physics (used by both)
│   ├── types/                # TypeScript interfaces
│   └── constants.ts          # Game constants
│
└── docs/                      # Documentation
    └── PROMPTS.md            # Detailed implementation prompts
```

---

## 🎮 Game Mechanics

### Core Gameplay
- 2 players (1v1)
- First to 15 points (casual) or 21 points (ranked)
- Ball physics: gravity, bounce, spin
- Server-authoritative multiplayer

### Game Modes
1. **vs CPU** - Offline, 4 difficulty levels
2. **Quick Match** - Unranked online
3. **Ranked** - ELO-based matchmaking
4. **Private** - Room codes for friends

---

## 👤 Character System

8 characters with 4 attributes (20 points total distributed):

| Character | Speed | Jump | Power | Control | Playstyle |
|-----------|-------|------|-------|---------|-----------|
| Blitz | 7 | 5 | 4 | 4 | Speedster |
| Crusher | 3 | 4 | 8 | 5 | Power hitter |
| Sky | 4 | 8 | 4 | 4 | High flyer |
| Zen | 5 | 4 | 3 | 8 | Precision |
| Tank | 4 | 3 | 6 | 7 | Defensive |
| Flash | 8 | 4 | 3 | 5 | Ultra fast |
| Nova | 5 | 6 | 5 | 4 | Balanced |
| Ghost | 6 | 5 | 4 | 5 | Tricky |

### Attribute Effects
- **Speed:** Movement velocity = `100 + speed * 20`
- **Jump:** Jump force = `200 + jump * 40`
- **Power:** Hit velocity = `300 + power * 50`
- **Control:** Precision factor = `0.5 + control * 0.0625` (reduces random spread)

---

## 🏟️ Court Backgrounds (8 Total)

| # | Name | Theme |
|---|------|-------|
| 1 | Neon District | Cyberpunk rooftop, rain, neon signs |
| 2 | Cyber Arena | Holographic stadium, digital crowd |
| 3 | Night Market | Street food stalls, lanterns |
| 4 | Sunset Beach | Classic beach volleyball |
| 5 | Retro Arcade | 80s arcade machines |
| 6 | Space Station | Zero-G, Earth view |
| 7 | Ancient Temple | Mystical ruins, floating stones |
| 8 | Urban Rooftop | City skyline at night |

---

## ⚙️ Physics Constants

```typescript
// shared/constants.ts
export const PHYSICS = {
  GRAVITY: 800,
  BALL_BOUNCE: 0.8,
  BALL_RADIUS: 8,
  MAX_BALL_SPEED: 600,
  PLAYER_WIDTH: 24,
  PLAYER_HEIGHT: 32,
  NET_HEIGHT: 80,
  NET_WIDTH: 6,              // Visual width (art asset)
  NET_COLLISION_WIDTH: 8,    // Collision width (slightly wider for fair gameplay)
  COURT_WIDTH: 480,
  COURT_HEIGHT: 270,
  GROUND_Y: 230,
} as const;
```

---

## 🏆 Ranking System

**ELO-based with tiers:**

| Tier | ELO Range |
|------|-----------|
| Rookie | 0-399 |
| Bronze | 400-799 |
| Silver | 800-1199 |
| Gold | 1200-1599 |
| Platinum | 1600-1999 |
| Diamond | 2000-2399 |
| Champion | 2400+ |

**Starting ELO:** 1000  
**K-factor:** 32 (64 for first 10 games)

---

## 💰 Monetization

### Currencies
- **Coins** (soft) - Earned through gameplay
- **Gems** (premium) - Purchased with real money

### Items
- Character skins
- Ball skins
- Court themes
- Victory animations
- Battle Pass (seasonal)

### Rarity Tiers
- Common: 500 coins / 50 gems
- Rare: 1500 coins / 150 gems
- Epic: 5000 coins / 400 gems
- Legendary: 800 gems only

---

## 📐 Code Conventions

### TypeScript
- Strict mode enabled
- Interfaces for all data structures
- Enums for fixed values

### Naming
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

### Phaser Scenes
- Extend `Phaser.Scene`
- Use `preload()`, `create()`, `update()` lifecycle

### Colyseus
- State classes extend `Schema`
- Use `@type()` decorators for sync
- Server-authoritative physics

---

## 🔗 Key Dependencies

**Client:**
```json
{
  "phaser": "^3.70.0",
  "colyseus.js": "^0.15.0"
}
```

**Server:**
```json
{
  "elysia": "^1.0.0",
  "@elysiajs/cors": "^1.0.0",
  "@elysiajs/jwt": "^1.0.0",
  "colyseus": "^0.15.0",
  "drizzle-orm": "^0.30.0",
  "postgres": "^3.4.0",
  "redis": "^4.6.0"
}
```

---

## 📚 Reference Documents

- `docs/PROMPTS.md` - Detailed implementation prompts for each feature
- `docs/ASSETS.md` - Pixel art specifications
- `docs/API.md` - API documentation (generate with implementation)

---

## 🚀 Development Phases

1. **MVP:** Local game with CPU opponent
2. **Online:** Multiplayer with Colyseus
3. **Ranking:** ELO system, leaderboards
4. **Monetization:** Shop, skins, Battle Pass
5. **Mobile:** Capacitor port
6. **Polish:** Effects, sounds, balancing
