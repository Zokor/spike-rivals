# 🏐 Spike Rivals - VS Code Development Prompts

> A complete guide with prompts to build an Arcade Volleyball-inspired competitive game with Bun, Phaser, and pixel art.

---

## 📋 Table of Contents

1. [Game Design Document](#1-game-design-document)
2. [Project Setup Prompts](#2-project-setup-prompts)
3. [Character System & Attributes](#3-character-system--attributes)
4. [Scenery/Background Designs](#4-scenerybackground-designs)
5. [Client Development Prompts](#5-client-development-prompts)
6. [Server Development Prompts](#6-server-development-prompts)
7. [Database & API Prompts](#7-database--api-prompts)
8. [Multiplayer & Ranking Prompts](#8-multiplayer--ranking-prompts)
9. [Monetization & Shop Prompts](#9-monetization--shop-prompts)
10. [Pixel Art Asset Prompts](#10-pixel-art-asset-prompts)

---

## 1. Game Design Document

### Game Overview

- **Name:** Spike Rivals
- **Genre:** Competitive 2D Volleyball
- **Inspiration:** Arcade Volleyball (1987)
- **Platforms:** Browser (PWA), Mobile (iOS/Android)
- **Monetization:** Cosmetic skins, Battle Pass

### Core Mechanics

- 2 players (1v1)
- First to 15 points wins (or 21 for ranked)
- Jump, move, and hit the ball over the net
- Ball physics with gravity and bounce
- Character attributes affect gameplay

---

## 2. Project Setup Prompts

### Prompt 2.1: Initialize Project Structure

```
Create a monorepo project structure for a real-time multiplayer volleyball game called "Spike Rivals" with:

1. /client - Phaser 3 game with TypeScript
2. /server - Bun + Elysia API + Colyseus game server
3. /shared - Shared types, constants, and physics code

Include:
- package.json for each workspace
- tsconfig.json configurations
- .gitignore
- docker-compose.yml for PostgreSQL and Redis
- README.md with setup instructions

Use Bun as the package manager and runtime for the server.
```

### Prompt 2.2: Client Setup (Phaser)

```
Set up a Phaser 3 project in the /client folder with:

- Vite as bundler
- TypeScript configuration
- Phaser 3.70+
- Folder structure:
  - /src/scenes (Boot, Menu, Game, Online, Shop)
  - /src/entities (Player, Ball, Net, CPU)
  - /src/ui (HUD, Menus, Dialogs)
  - /src/network (WebSocket client for Colyseus)
  - /src/managers (AudioManager, SkinManager, InputManager)
  - /src/config (game settings, physics constants)
  - /assets (sprites, audio, fonts)

Configure for pixel art rendering (no antialiasing, crisp pixels).
Game resolution: 480x270 scaled up (16:9 pixel art friendly).
```

### Prompt 2.3: Server Setup (Bun + Elysia + Colyseus)

```
Set up a Bun server in the /server folder with:

- Elysia framework for REST API
- Colyseus for real-time game rooms
- Drizzle ORM for PostgreSQL
- Redis client for caching/sessions

Structure:
- /src/api/routes (auth, user, shop, ranking, matches)
- /src/api/middleware (auth, validation, rateLimit)
- /src/game/rooms (GameRoom, MatchmakingRoom)
- /src/game/schema (GameState, Player, Ball)
- /src/services (RankingService, MatchmakingService, InventoryService)
- /src/db (schema, migrations, queries)
- /src/config (environment, constants)

Include JWT authentication with @elysiajs/jwt.
```

---

## 3. Character System & Attributes

### Character Attributes Design

Each character has 4 main attributes (total of 20 points distributed):

| Attribute   | Description       | Effect                                         |
| ----------- | ----------------- | ---------------------------------------------- |
| **Speed**   | Movement velocity | 1-8 scale, affects horizontal movement         |
| **Jump**    | Jump height       | 1-8 scale, affects max jump height             |
| **Power**   | Hit strength      | 1-8 scale, affects ball velocity on hit        |
| **Control** | Ball handling     | 1-8 scale, affects hit precision/angle control |

### Default Characters (8 characters)

| Character   | Speed | Jump | Power | Control | Playstyle                                  |
| ----------- | ----- | ---- | ----- | ------- | ------------------------------------------ |
| **Blitz**   | 7     | 5    | 4     | 4       | Speedster - fast movement, balanced        |
| **Crusher** | 3     | 4    | 8     | 5       | Power hitter - slow but devastating spikes |
| **Sky**     | 4     | 8    | 4     | 4       | High flyer - dominates the net             |
| **Zen**     | 5     | 4    | 3     | 8       | Precision - perfect ball placement         |
| **Tank**    | 4     | 3    | 6     | 7       | All-rounder defensive                      |
| **Flash**   | 8     | 4    | 3     | 5       | Ultra speed - can reach any ball           |
| **Nova**    | 5     | 6    | 5     | 4       | Balanced - good at everything              |
| **Ghost**   | 6     | 5    | 4     | 5       | Tricky - unpredictable movements           |

### Prompt 3.1: Character Attributes System

```
Create a character attributes system for a volleyball game with:

1. Base Character class with attributes:
   - speed (1-8): affects movement velocity (base 100 + speed * 20)
   - jump (1-8): affects jump force (base 200 + jump * 40)
   - power (1-8): affects ball hit velocity (base 300 + power * 50)
   - control (1-8): affects hit angle precision (reduces random spread)

2. Character definitions for 8 default characters (see table above)

3. Methods:
   - getMovementSpeed(): number
   - getJumpForce(): number
   - getHitPower(): number
   - getControlFactor(): number (0.5 to 1.0, higher = more precise)

4. TypeScript interfaces in /shared/types/character.ts

Make attributes balanced so no character is objectively better.
```

### Prompt 3.2: Character Selection UI

```
Create a character selection screen in Phaser with:

1. Grid of 8 character portraits (pixel art placeholders)
2. Selected character preview (larger, animated)
3. Attribute bars showing Speed, Jump, Power, Control
4. Character name and short description
5. "Select" button to confirm
6. Skin variants for each character (locked/unlocked state)
7. Navigation with keyboard (arrows) and mouse/touch

Include animations:
- Hover effect on portraits
- Selection animation
- Attribute bars fill animation

Save selected character to localStorage and sync with server when online.
```

---

## 4. Scenery/Background Designs

### The 8 Court Backgrounds

| #   | Name               | Theme     | Description                                                    |
| --- | ------------------ | --------- | -------------------------------------------------------------- |
| 1   | **Neon District**  | Cyberpunk | Rooftop court with neon signs, rain, flying cars in background |
| 2   | **Cyber Arena**    | Cyberpunk | Indoor holographic stadium, digital crowd, glitch effects      |
| 3   | **Night Market**   | Cyberpunk | Street court surrounded by food stalls, neon Chinese signs     |
| 4   | **Sunset Beach**   | Classic   | Beach volleyball at golden hour, palm trees, ocean waves       |
| 5   | **Retro Arcade**   | Nostalgic | Inside an 80s arcade, CRT monitors, pixel decorations          |
| 6   | **Space Station**  | Sci-Fi    | Zero-G court in space, Earth visible through windows           |
| 7   | **Ancient Temple** | Fantasy   | Mystical ruins, floating stones, magical particles             |
| 8   | **Urban Rooftop**  | Modern    | City rooftop at night, skyline, water tower, graffiti          |

### Cyberpunk Scenery Details

#### Neon District (Background 1)

```
Elements:
- Dark purple/blue night sky with light pollution glow
- Massive holographic advertisements (Japanese/Chinese text)
- Flying cars with red taillights in parallax layers
- Rain particles with neon reflections
- Distant skyscrapers with lit windows
- Pink/cyan/yellow neon signs
- Steam vents from the ground
- Wet floor reflections

Color palette: #0d0221, #0f084b, #26408b, #a6cee3, #ff006e, #00f5d4
```

#### Cyber Arena (Background 2)

```
Elements:
- Indoor stadium with hexagonal architecture
- Holographic crowd (low-fi pixel people)
- Giant screens showing match stats
- Glitch/scan line effects (subtle)
- Floating camera drones
- Digital banners with sponsor logos
- RGB light strips on walls
- Central holographic scoreboard

Color palette: #000000, #1a1a2e, #16213e, #0f3460, #e94560, #00ff9f
```

#### Night Market (Background 3)

```
Elements:
- Narrow street with food stalls on sides
- Hanging red lanterns (animated glow)
- Neon signs: ramen, dumplings, cyber-parts
- Smoke from food vendors
- NPCs walking in background (silhouettes)
- Puddles with reflections
- Cables and wires overhead
- Small holographic menus floating

Color palette: #1a0a0a, #2d132c, #801336, #c72c41, #ee4540, #ffd369
```

#### Sunset Beach (Background 4)

```
Elements:
- Golden hour sky with orange/pink gradient
- Calm ocean with gentle waves
- Palm trees swaying on sides
- Distant sailboat silhouette
- Beach umbrellas and chairs
- Lifeguard tower
- Seagulls flying
- Sun reflecting on water (sparkles)
- Sand texture with footprints
- Professional volleyball net

Animated elements:
- Palm trees sway (2-3 frame loop)
- Ocean waves (3-4 frame animation)
- Sun sparkles on water (twinkle effect)
- Seagulls fly across (occasional)
- Sand particles when players move

Color palette: #ff7e5f, #feb47b, #ffcb77, #ffe5b4, #457b9d, #f4e4ba, #e8d5a3
```

#### Retro Arcade (Background 5)

```
Elements:
- Rows of arcade cabinet silhouettes
- CRT monitors with game screens glowing
- Neon signs: "HIGH SCORE", "INSERT COIN", "GAME OVER"
- Checkered/geometric carpet pattern
- Prize counter with stuffed toys
- Pinball machine with flashing lights
- Claw machine
- 80s posters on walls
- Kids playing in background (silhouettes)
- Taped court lines on carpet
- Portable net setup

Animated elements:
- Arcade screens show game animations (looping)
- Neon signs flicker randomly
- Pinball lights cycle
- CRT scan line effect overlay (subtle)
- Occasional "INSERT COIN" text flash

Color palette: #1a1a2e, #2d2d44, #ff006e, #00f5d4, #ffd700, #00ff00, #0066ff
```

#### Space Station (Background 6)

```
Elements:
- Black void of space with star field
- Large Earth visible through window (partial)
- Space station window frame (hexagonal)
- Other station modules in distance
- Solar panels
- Floating objects (pen, paper, drink bubble)
- Control panels with blinking lights
- Astronaut in background (through glass)
- Metal grid floor
- Holographic/energy net
- Magnetic court lines (blue glow)
- Zero-G indicators on walls

Animated elements:
- Stars twinkle subtly
- Earth slowly rotates
- Floating objects drift gently
- Control panel lights blink
- Energy net pulses
- Occasional satellite passes by

Color palette: #000000, #0a0a1a, #1d3557, #457b9d, #2ecc71, #00f5d4, #ffffff
```

#### Ancient Temple (Background 7)

```
Elements:
- Twilight/dusk sky with two moons
- Aurora-like magical streams in sky
- Crumbling stone towers and ruins
- Overgrown vines on structures
- Glowing ancient glyphs on walls
- Floating stones (defying gravity)
- Stone columns framing court
- Carved stone faces/statues
- Magical fire in torch holders (green/purple)
- Stone tile floor with moss in cracks
- Energy net made of magic
- Fireflies floating around

Animated elements:
- Floating stones bob gently up/down
- Magical fire flickers (3-4 frames)
- Glyphs pulse with glow
- Magical particles float upward
- Aurora waves slowly in sky
- Fireflies drift randomly

Color palette: #2c3e50, #8e44ad, #9b59b6, #7f8c8d, #95a5a6, #00ff9f, #f39c12, #27ae60
```

#### Urban Rooftop (Background 8)

```
Elements:
- Night sky with city light pollution glow
- Skyline of skyscrapers with lit windows
- Billboard/digital screen with ads
- Water tower on adjacent building
- Rooftop elements: AC units, vents, pipes
- Graffiti art on wall (colorful)
- Old couch and chairs (hangout spot)
- Boombox/speaker
- String lights overhead
- Concrete floor with cracks
- Spray-painted court lines
- Chain-link net
- Potted plants (urban garden attempt)
- City birds (pigeons)

Animated elements:
- String lights sway gently
- Billboard changes images (slow cycle)
- Smoke/steam rises from vents
- City lights twinkle in distance
- Occasional bird flies past
- Graffiti has subtle glow effect

Color palette: #1a1a2e, #16213e, #0f3460, #ffd700, #ff6b35, #e94560, #00ff9f, #ffffff
```

### Prompt 4.1: Background Parallax System

```
Create a parallax background system in Phaser for a volleyball game:

1. 4-5 parallax layers per background:
   - Far background (sky/buildings) - slowest
   - Mid background (structures)
   - Near background (decorations)
   - Ground layer (court surface)
   - Foreground elements (particles, effects)

2. Each layer scrolls at different speeds based on camera/player movement
3. Support for animated elements (rain, flying cars, flickering lights)
4. Particle systems for atmosphere (rain, dust, sparkles)
5. Dynamic lighting option (flickering neons, pulsing glows)

Create a BackgroundManager class that:
- Loads background by ID
- Handles parallax scrolling
- Manages animated elements
- Supports day/night variants
```

### Prompt 4.2: All Background Assets Description

```
Create detailed pixel art specifications for 8 volleyball court backgrounds:

Resolution: 480x270 pixels (or 960x540 for 2x)
Each background has 5-6 parallax layers.

**1. Neon District (Cyberpunk Rooftop)**
Layers:
- Layer 1 (far): Night sky gradient, distant skyscrapers with tiny window lights
- Layer 2: Medium buildings with large neon signs, holographic ads
- Layer 3: Rooftop elements - AC units, antennas, railings
- Layer 4: Court surface (metal/concrete with painted lines)
- Layer 5 (foreground): Rain particles, steam vents, neon reflections

Animated elements:
- Neon signs flicker (3-4 frame animation)
- Flying cars move left to right (parallax)
- Rain drops fall continuously
- Holographic ads glitch occasionally

**2. Cyber Arena (Cyberpunk Stadium)**
Layers:
- Layer 1: Back wall with hexagonal panels, giant screens
- Layer 2: Holographic crowd silhouettes
- Layer 3: Stadium structure, ceiling beams, spotlights, drones
- Layer 4: Glossy black court floor with cyan lines, center logo
- Layer 5: Floating AR displays, subtle scan lines, lens flares

Animated elements:
- Holographic crowd waves
- Screens cycle stats/replays
- Drones hover slowly
- Scan lines scroll down
- Spotlights rotate

**3. Night Market (Cyberpunk Street)**
Layers:
- Layer 1: Dark sky, apartment buildings with lit windows
- Layer 2: Far food stalls, vertical neon signs, hanging lanterns
- Layer 3: Detailed stalls with steam, customer silhouettes, holographic menus
- Layer 4: Cracked concrete court, spray-painted lines, makeshift net
- Layer 5: Steam/smoke particles, occasional flyer blowing past

Animated elements:
- Lanterns sway gently
- Steam rises from food stalls
- Neon signs flicker
- Holographic menus rotate
- NPCs subtle idle animation

**4. Sunset Beach (Classic)**
Layers:
- Layer 1: Gradient sunset sky (orange to yellow), wispy clouds
- Layer 2: Calm ocean, distant sailboat, sun reflection sparkles
- Layer 3: Palm trees, beach umbrellas, lifeguard tower
- Layer 4: Sand texture court with white boundary lines, professional net
- Layer 5: Wave foam at edges, sand particles, seagull flying

Animated elements:
- Palm trees sway (2 frames)
- Ocean waves (3 frames)
- Sun sparkles twinkle
- Seagulls fly across occasionally

**5. Retro Arcade (Nostalgic)**
Layers:
- Layer 1: Back wall with arcade cabinets, neon signs, 80s posters
- Layer 2: More cabinets, prize counter, kids playing (silhouettes)
- Layer 3: Detailed arcade cabinet, pinball machine, claw machine
- Layer 4: Geometric carpet pattern, taped court lines, portable net
- Layer 5: CRT scan line overlay, pixel particles, "INSERT COIN" flash

Animated elements:
- Arcade screens show games
- Neon signs flicker
- Pinball lights cycle
- CRT scan lines scroll

**6. Space Station (Sci-Fi)**
Layers:
- Layer 1: Black space void, star field, distant nebula
- Layer 2: Large Earth through window, atmosphere glow
- Layer 3: Window frame, other station modules, solar panels
- Layer 4: Metal grid floor, magnetic blue court lines, energy net
- Layer 5: Floating dust particles, HUD elements, passing satellite

Animated elements:
- Stars twinkle subtly
- Earth slowly rotates
- Floating objects drift
- Energy net pulses

**7. Ancient Temple (Fantasy)**
Layers:
- Layer 1: Twilight sky, two moons, aurora-like magical streams
- Layer 2: Crumbling towers, overgrown vines, glowing glyphs
- Layer 3: Stone columns, carved faces, floating stones, magical torches
- Layer 4: Stone tile floor, glowing magical court lines, energy net
- Layer 5: Magical particles floating up, fireflies, falling leaves

Animated elements:
- Floating stones bob up/down
- Magical fire flickers
- Glyphs pulse glow
- Aurora waves slowly
- Particles float upward

**8. Urban Rooftop (Modern)**
Layers:
- Layer 1: Night sky, city glow, stars barely visible
- Layer 2: Skyline silhouettes, lit windows, billboard/screen
- Layer 3: Water tower, rooftop garden, person watching (silhouette)
- Layer 4: Concrete floor, spray-painted lines, chain-link net, cracks
- Layer 5: Steam wisps, string lights, occasional bird

Animated elements:
- String lights sway
- Billboard changes images
- Steam rises
- City lights twinkle

Provide this as a spec document for pixel artists or AI image generation.
```

---

## 5. Client Development Prompts

### Prompt 5.1: Main Game Scene

```
Create the main GameScene in Phaser 3 TypeScript for a volleyball game:

1. Court setup:
   - 480x270 game resolution
   - Net in the center (x: 240)
   - Ground at y: 230
   - Court boundaries (20px padding on sides)

2. Entities:
   - Player 1 (left side, human controlled)
   - Player 2 (right side, CPU or human)
   - Ball with physics
   - Net with collision

3. Physics:
   - Arcade physics
   - Ball gravity: 800
   - Ball bounce: 0.8
   - Player collision with ball
   - Net collision

4. Scoring:
   - Ball touches ground = point for opposite side
   - First to 15 points wins
   - Display score HUD

5. Controls:
   - Arrow keys or WASD for movement
   - Spacebar or W/Up for jump
   - Touch controls for mobile

Include game states: READY, PLAYING, POINT_SCORED, GAME_OVER
```

### Prompt 5.2: Ball Physics

```
Create a Ball class for a volleyball game with realistic physics:

Properties:
- position (x, y)
- velocity (vx, vy)
- gravity: 800
- bounce: 0.8
- maxSpeed: 600
- spin: number (affects curve)

Methods:
- update(delta): apply gravity, update position
- hitByPlayer(player, angle, power): calculate new velocity based on hit
- checkBounds(): handle wall bounces and scoring
- reset(): return to server position

Physics calculations:
- When hit, velocity = power * direction + (player.velocity * 0.3)
- Add slight randomness based on player's control attribute
- Spin affects horizontal velocity over time

Include trail effect (last 5 positions for visual).
```

### Prompt 5.3: Player Controller

```
Create a Player class for a volleyball game:

Properties:
- position (x, y)
- velocity (vx, vy)
- character: CharacterData (attributes)
- side: 'left' | 'right'
- isGrounded: boolean
- canHit: boolean (cooldown after hitting)
- sprite: Phaser.GameObjects.Sprite

Methods:
- update(delta): handle movement, gravity, bounds
- handleInput(input: InputState): process movement commands
- jump(): if grounded, apply jump force based on character.jump
- hitBall(ball: Ball): calculate hit based on position, velocity, character stats
- playAnimation(name): idle, run, jump, hit

Input handling:
- Left/Right: horizontal movement (speed based on character.speed)
- Jump: vertical impulse (force based on character.jump)
- Auto-hit when ball is in range

Bounds:
- Cannot cross the net (center line)
- Cannot leave court sides
- Ground collision at y: 230
```

### Prompt 5.4: CPU/AI Opponent

```
Create a CPU opponent AI for a volleyball game with difficulty levels:

Difficulty levels:
1. Easy: Slow reactions, misses often, weak hits
2. Medium: Average reactions, sometimes misses, decent hits
3. Hard: Fast reactions, rarely misses, strategic hits
4. Impossible: Perfect reactions, never misses, optimal plays

AI behavior:
1. Track ball position and predict landing
2. Move towards predicted position
3. Jump timing based on ball trajectory
4. Hit angle selection (aim for corners on higher difficulties)

Parameters by difficulty:
- reactionDelay: 500ms (easy) to 50ms (impossible)
- predictionAccuracy: 0.5 (easy) to 1.0 (impossible)
- missChance: 0.3 (easy) to 0.0 (impossible)
- hitPower: 0.6 (easy) to 1.0 (impossible)
- strategicAim: false (easy) to true (hard+)

Include randomness to feel more human-like.
```

### Prompt 5.5: Input Manager

```
Create an InputManager class for cross-platform input in Phaser:

Support:
1. Keyboard (WASD, Arrow keys, Spacebar)
2. Gamepad (analog stick, buttons)
3. Touch (virtual joystick, jump button)

Output unified InputState:
{
  moveX: number (-1 to 1),
  moveY: number (-1 to 1),
  jump: boolean,
  jumpPressed: boolean (just pressed this frame),
  action: boolean
}

For mobile:
- Create virtual joystick (left side of screen)
- Jump button (right side)
- Show/hide based on device detection

Include:
- Key rebinding support
- Sensitivity settings
- Dead zone for analog/touch
```

---

## 6. Server Development Prompts

### Prompt 6.1: Colyseus Game Room

```
Create a Colyseus GameRoom for real-time volleyball matches with Bun:

Room configuration:
- maxClients: 2
- tickRate: 60 (server simulation rate)
- patchRate: 20 (state sync rate)

State schema (@colyseus/schema):
- players: MapSchema<PlayerState>
- ball: BallState
- score: { player1: number, player2: number }
- status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished'
- timer: number
- winner: string | null

Lifecycle:
- onCreate: initialize state, set simulation interval
- onJoin: add player, start when 2 players
- onLeave: handle disconnect (forfeit or pause)
- onMessage('input'): receive and validate player input
- onDispose: cleanup

Server-authoritative:
- All physics runs on server
- Client sends inputs only
- Server broadcasts state
- Validate all inputs (anti-cheat)

Include reconnection handling (30 second window).
```

### Prompt 6.2: Matchmaking Service

```
Create a matchmaking service for ranked volleyball matches:

Features:
1. Queue system with ELO-based matching
2. Expand search range over time
3. Priority for similar rank tiers
4. Handle queue cancellation

Algorithm:
- Initial search: ±100 ELO
- After 10s: ±200 ELO
- After 30s: ±400 ELO
- After 60s: match anyone in queue

Data structures:
- Redis sorted set for queue (score = timestamp)
- Redis hash for player data in queue

Functions:
- joinQueue(playerId, elo, preferences)
- leaveQueue(playerId)
- findMatch(): polls queue, returns matched pair
- getQueueStatus(playerId): position, estimated wait

Run matching loop every 2 seconds.
Include region preference if applicable.
```

### Prompt 6.3: Server-Side Physics

```
Create server-side physics simulation for volleyball in TypeScript:

Physics constants (in /shared):
- GRAVITY: 800
- BALL_BOUNCE: 0.8
- BALL_RADIUS: 8
- MAX_BALL_SPEED: 600
- PLAYER_WIDTH: 24
- PLAYER_HEIGHT: 32
- NET_HEIGHT: 80
- NET_WIDTH: 6 (visual), NET_COLLISION_WIDTH: 8 (collision)
- COURT_WIDTH: 480
- COURT_HEIGHT: 270
- GROUND_Y: 230

Simulation:
- Fixed timestep: 1/60 second
- Update ball position and velocity
- Check collisions (ball-player, ball-net, ball-ground, ball-walls)
- Apply player inputs
- Detect scoring conditions

Collision response:
- Ball-Player: reflect with power based on player stats, add player velocity
- Ball-Net: reflect horizontally, reduce velocity
- Ball-Ground: trigger score for opposite player
- Ball-Walls: reflect horizontally

Make physics deterministic (same inputs = same outputs).
Share physics code between client and server for prediction.
```

---

## 7. Database & API Prompts

### Prompt 7.1: Database Schema (Drizzle)

```
Create a Drizzle ORM schema for a competitive volleyball game:

Tables:
1. users
   - id (uuid, primary)
   - email (unique)
   - username (unique, 3-20 chars)
   - passwordHash
   - elo (default 1000)
   - rankTier (bronze/silver/gold/platinum/diamond/champion)
   - wins, losses, winStreak, bestWinStreak
   - coins, premiumCoins
   - selectedCharacter, selectedBall, selectedCourt
   - createdAt, lastLoginAt, lastMatchAt

2. characters
   - id, name, speed, jump, power, control
   - rarity, unlockCost, description

3. skins
   - id, name, type (character/ball/court)
   - characterId (nullable, for character skins)
   - rarity (common/rare/epic/legendary)
   - priceCoins, pricePremium
   - spriteSheet, previewImage
   - isDefault

4. user_inventory
   - id, odUserId, skinId, acquiredAt, equippedAs

5. matches
   - id, player1Id, player2Id, winnerId
   - player1Score, player2Score
   - player1Elo, player2Elo, eloChange
   - isRanked, duration
   - replayData (JSON)
   - playedAt

6. transactions
   - id, userId, type (purchase/reward/refund)
   - itemType, itemId, amount
   - currencyType (coins/premium/real)
   - createdAt

7. battle_pass
   - id, odSeason, userId, currentTier, xp
   - isPremium, purchasedAt

8. battle_pass_rewards
   - id, odSeason, tier, rewardType, rewardId, isPremium

Include indexes for common queries (ranking, matchmaking).
```

### Prompt 7.2: Auth API Routes

```
Create authentication API routes with Elysia + JWT:

POST /auth/register
- Body: { email, username, password }
- Validate email format, username (3-20 chars, alphanumeric)
- Hash password with Bun.password.hash()
- Create user with default character unlocked
- Return JWT token + user data

POST /auth/login
- Body: { email, password }
- Verify password with Bun.password.verify()
- Update lastLoginAt
- Return JWT token + user data

POST /auth/logout
- Invalidate token (add to Redis blacklist)

GET /auth/me
- Requires auth header
- Return current user data

POST /auth/refresh
- Refresh JWT token before expiry

POST /auth/forgot-password
- Send reset email (integrate with email service)

POST /auth/reset-password
- Body: { token, newPassword }

Include:
- Rate limiting (5 attempts per minute)
- Input validation with Elysia's t schema
- Error handling with proper HTTP codes
```

### Prompt 7.3: Shop & Inventory API

```
Create shop and inventory API routes:

GET /shop/items
- Query: { type?, rarity?, page, limit }
- Return available items with prices
- Include user's ownership status if authenticated

GET /shop/featured
- Return featured/sale items
- Time-limited offers

POST /shop/purchase
- Body: { itemId, currencyType }
- Validate user has enough currency
- Create transaction record
- Add to inventory
- Deduct currency
- Return updated inventory

GET /inventory
- Return user's owned items
- Group by type (characters, skins, courts)

POST /inventory/equip
- Body: { skinId, slot }
- Validate ownership
- Update equipped status
- Return updated loadout

GET /inventory/loadout
- Return currently equipped items

Include:
- Transaction atomicity (use database transactions)
- Price verification (prevent client manipulation)
- Duplicate purchase prevention
```

### Prompt 7.4: Ranking & Leaderboard API

```
Create ranking and leaderboard API routes:

GET /ranking/leaderboard
- Query: { limit (max 100), offset, region?, season? }
- Return top players with rank, username, elo, wins, losses
- Cache in Redis (refresh every 5 minutes)

GET /ranking/player/:id
- Return player's rank position, stats, recent matches
- Include rank tier and progress to next tier

GET /ranking/me
- Return authenticated user's ranking info
- Include nearby players (±5 positions)

POST /ranking/update (internal)
- Called after match ends
- Calculate ELO change:
  - K-factor: 32 (adjusts based on games played)
  - Expected score: 1 / (1 + 10^((opponentElo - playerElo) / 400))
  - New ELO: oldElo + K * (actualScore - expectedScore)
- Update rank tiers
- Record match in history

GET /ranking/seasons
- Return season history and rewards

Rank tiers:
- Rookie: 0-399
- Bronze: 400-799
- Silver: 800-1199
- Gold: 1200-1599
- Platinum: 1600-1999
- Diamond: 2000-2399
- Champion: 2400+
```

---

## 8. Multiplayer & Ranking Prompts

### Prompt 8.1: Client-Side Prediction

````
Implement client-side prediction for smooth multiplayer gameplay:

Concept:
- Client simulates locally without waiting for server
- Server is authoritative - client corrects if wrong
- Hides latency from player

Implementation:
1. Input buffer: store last N inputs with timestamps
2. On input: apply locally AND send to server
3. On server state:
   - Compare server position with predicted position
   - If error > threshold: snap or interpolate to server state
   - Re-simulate from last confirmed state with buffered inputs

Code structure:
```typescript
class PredictionManager {
  private inputBuffer: InputSnapshot[] = [];
  private lastConfirmedState: GameState;
  private lastConfirmedTick: number;

  onLocalInput(input: Input) {
    // Apply immediately
    this.applyInput(input);
    // Store for reconciliation
    this.inputBuffer.push({ tick: this.currentTick, input });
    // Send to server
    this.sendInput(input);
  }

  onServerState(state: GameState, tick: number) {
    this.lastConfirmedState = state;
    // Remove old inputs
    this.inputBuffer = this.inputBuffer.filter(i => i.tick > tick);
    // Re-simulate
    let predicted = clone(state);
    for (const snapshot of this.inputBuffer) {
      this.simulate(predicted, snapshot.input);
    }
    // Reconcile
    this.reconcile(predicted);
  }
}
````

Tune error threshold and interpolation speed for best feel.

```

### Prompt 8.2: Entity Interpolation
```

Implement entity interpolation for opponent player in multiplayer:

Problem: Server updates at 20Hz, game runs at 60Hz
Solution: Interpolate between known states

Implementation:

```typescript
class Interpolator {
  private stateBuffer: { state: EntityState; timestamp: number }[] = [];
  private interpolationDelay = 100; // ms behind real-time

  addState(state: EntityState, timestamp: number) {
    this.stateBuffer.push({ state, timestamp });
    // Keep last 1 second of states
    this.stateBuffer = this.stateBuffer.filter(
      (s) => s.timestamp > timestamp - 1000
    );
  }

  getInterpolatedState(currentTime: number): EntityState {
    const renderTime = currentTime - this.interpolationDelay;

    // Find states to interpolate between
    let before: StateSnapshot | null = null;
    let after: StateSnapshot | null = null;

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (
        this.stateBuffer[i].timestamp <= renderTime &&
        this.stateBuffer[i + 1].timestamp >= renderTime
      ) {
        before = this.stateBuffer[i];
        after = this.stateBuffer[i + 1];
        break;
      }
    }

    if (!before || !after)
      return this.stateBuffer[this.stateBuffer.length - 1]?.state;

    const t =
      (renderTime - before.timestamp) / (after.timestamp - before.timestamp);
    return this.lerp(before.state, after.state, t);
  }

  private lerp(a: EntityState, b: EntityState, t: number): EntityState {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      // ... other properties
    };
  }
}
```

Apply to opponent player and ball (with adjustments for ball prediction).

```

### Prompt 8.3: ELO Rating System
```

Implement an ELO rating system for ranked matches:

Configuration:

- Starting ELO: 1000
- K-factor: 32 (higher for new players, lower for established)
- Floor: 0 (can't go below)
- Provisional period: first 10 games (K=64)

```typescript
class EloService {
  calculateNewRatings(
    player1Elo: number,
    player2Elo: number,
    player1Won: boolean,
    player1Games: number,
    player2Games: number
  ): { player1NewElo: number; player2NewElo: number; change: number } {
    // Expected scores
    const exp1 = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
    const exp2 = 1 - exp1;

    // Actual scores
    const score1 = player1Won ? 1 : 0;
    const score2 = player1Won ? 0 : 1;

    // K-factors (higher for provisional players)
    const k1 = player1Games < 10 ? 64 : 32;
    const k2 = player2Games < 10 ? 64 : 32;

    // New ratings
    const change1 = Math.round(k1 * (score1 - exp1));
    const change2 = Math.round(k2 * (score2 - exp2));

    return {
      player1NewElo: Math.max(0, player1Elo + change1),
      player2NewElo: Math.max(0, player2Elo + change2),
      change: Math.abs(change1),
    };
  }

  getRankTier(elo: number): RankTier {
    if (elo >= 2400) return 'champion';
    if (elo >= 2000) return 'diamond';
    if (elo >= 1600) return 'platinum';
    if (elo >= 1200) return 'gold';
    if (elo >= 800) return 'silver';
    if (elo >= 400) return 'bronze';
    return 'rookie';
  }
}
```

Include win streak bonuses and loss protection at tier floors.

```

---

## 9. Monetization & Shop Prompts

### Prompt 9.1: Battle Pass System
```

Create a Battle Pass system with free and premium tracks:

Configuration:

- Season duration: 8 weeks
- Total tiers: 50
- XP per tier: 1000 (increases slightly each tier)
- Premium price: 500 premium coins

XP sources:

- Win match: 50 XP
- Lose match: 20 XP
- Daily login: 25 XP
- Daily challenge: 100 XP each
- Weekly challenge: 500 XP each

Rewards structure:

- Every tier has a free reward
- Premium unlocks additional reward per tier
- Every 5 tiers: guaranteed rare+ item
- Tier 50: exclusive legendary skin

```typescript
interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeReward: Reward | null;
  premiumReward: Reward | null;
}

class BattlePassService {
  addXP(userId: string, amount: number): Promise<TierUpResult>;
  claimReward(
    userId: string,
    tier: number,
    isPremium: boolean
  ): Promise<Reward>;
  purchasePremium(userId: string): Promise<void>;
  getTiers(season: number): BattlePassTier[];
  getUserProgress(userId: string): UserBattlePassProgress;
}
```

Include catch-up mechanics (buy tiers, XP boosts).

```

### Prompt 9.2: Virtual Currency System
```

Create a dual-currency economy system:

Currencies:

1. Coins (soft currency)
   - Earned through gameplay
   - Win: 30 coins
   - Lose: 10 coins
   - Daily bonus: 50 coins
   - Challenges: 100-500 coins
2. Gems (premium currency)
   - Purchased with real money
   - Occasionally earned (battle pass, achievements)

Pricing tiers (Gems):

- $0.99: 100 gems
- $4.99: 550 gems (10% bonus)
- $9.99: 1200 gems (20% bonus)
- $19.99: 2600 gems (30% bonus)
- $49.99: 7000 gems (40% bonus)

Item pricing:

- Common skin: 500 coins OR 50 gems
- Rare skin: 1500 coins OR 150 gems
- Epic skin: 5000 coins OR 400 gems
- Legendary skin: 800 gems only
- Battle Pass: 500 gems

```typescript
class CurrencyService {
  addCoins(userId: string, amount: number, reason: string): Promise<void>;
  addGems(userId: string, amount: number, transactionId: string): Promise<void>;
  spend(
    userId: string,
    currency: 'coins' | 'gems',
    amount: number
  ): Promise<boolean>;
  getBalance(userId: string): Promise<{ coins: number; gems: number }>;
}
```

Include anti-fraud measures and purchase verification.

```

### Prompt 9.3: Gacha/Loot Box System (Optional)
```

Create a gacha system for random skin drops:

Box types:

1. Standard Box (300 coins)

   - Common: 70%
   - Rare: 25%
   - Epic: 4.5%
   - Legendary: 0.5%

2. Premium Box (100 gems)

   - Common: 40%
   - Rare: 40%
   - Epic: 17%
   - Legendary: 3%

3. Legendary Box (300 gems)
   - Epic: 80%
   - Legendary: 20%

Pity system:

- Guarantee rare+ every 10 pulls
- Guarantee legendary every 100 pulls
- Pity counter persists across sessions

Duplicate handling:

- Duplicates convert to coins
- Common: 50 coins
- Rare: 150 coins
- Epic: 500 coins
- Legendary: 1000 coins

```typescript
class GachaService {
  pull(userId: string, boxType: BoxType, count: number): Promise<PullResult[]>;
  getPityCounter(userId: string, boxType: BoxType): Promise<number>;
}
```

IMPORTANT: Check legal requirements for your target regions (Belgium, Netherlands ban loot boxes).

```

---

## 10. Pixel Art Asset Prompts

### Prompt 10.1: Character Sprite Sheet
```

Create pixel art sprite sheet specifications for a volleyball player character:

Dimensions:

- Character size: 24x32 pixels
- Sprite sheet: 240x128 pixels (10 columns, 4 rows)

Animations:

1. Idle (4 frames, loop): standing, slight breathing motion
2. Run (6 frames, loop): running cycle
3. Jump (3 frames): crouch, rise, peak
4. Fall (2 frames): falling, land
5. Hit (4 frames): wind up, swing, follow through, recover
6. Victory (4 frames): celebration pose
7. Defeat (2 frames): sad pose

Color palette (limit to 8-16 colors per character):

- Skin tones: 3 shades
- Outfit: 3-4 colors
- Hair: 2-3 shades
- Outline: dark color (not pure black)

Style guidelines:

- No anti-aliasing (crisp pixels)
- Consistent light source (top-left)
- Exaggerated proportions (big head, small body) for readability
- Clear silhouette for each animation

Export as PNG with transparency.

```

### Prompt 10.2: Ball and Effects
```

Create pixel art for volleyball and effects:

Ball:

- Size: 12x12 pixels
- Rotation animation: 8 frames
- Variants: default, fire, ice, rainbow, pixel, neon

Effects:

1. Hit effect (5 frames): starburst when ball is hit
2. Trail effect: 4-5 afterimages, decreasing opacity
3. Score effect: pixel explosion
4. Dust cloud: when player lands
5. Neon glow: for cyberpunk courts

Particle types:

- Spark (2x2 pixels)
- Star (3x3 pixels)
- Circle (4x4 pixels)

Color variations for each court theme.

```

### Prompt 10.3: Court and Net
```

Create pixel art specifications for volleyball court:

Court dimensions (in pixels):

- Total width: 480
- Total height: 270
- Ground: y = 230
- Net position: x = 240
- Net height: 80 pixels
- Net width: 6 pixels

Elements:

1. Ground surface (with court lines)
2. Net (with pole)
3. Court boundaries (subtle lines)
4. Shadow under net

Variants per theme:

- Cyberpunk: metal floor, neon lines, holographic net
- Beach: sand texture, rope net
- Arcade: carpet floor, pixelated net
- Space: transparent floor, energy net

Include:

- Tile-able ground texture (32x32 tile)
- Net animation (2 frames, slight sway)
- Goal line highlight effect

```

### Prompt 10.4: UI Elements
```

Create pixel art UI kit for the game:

Elements:

1. Buttons (3 states: normal, hover, pressed)

   - Primary button: 64x24
   - Secondary button: 48x20
   - Icon button: 24x24

2. Panels/Windows

   - 9-slice panel (16x16 corners)
   - Dark theme with neon accents

3. Icons (16x16)

   - Coin, Gem, XP
   - Settings, Sound, Music
   - Play, Pause, Restart
   - Character attributes (speed, jump, power, control)
   - Rank tier icons (7 tiers)

4. Bars

   - Health/Score bar
   - XP progress bar
   - Attribute bar (for character stats)

5. Text styling
   - Use pixel font (recommend: "Press Start 2P" or "Pixelify Sans")
   - Sizes: 8px, 16px, 24px

Color palette for UI:

- Background: #1a1a2e
- Primary: #e94560
- Secondary: #0f3460
- Accent: #00ff9f
- Text: #ffffff

```

### Prompt 10.5: AI Image Generation Prompts for Pixel Art
```

Use these prompts with AI image generators (Midjourney, DALL-E, Stable Diffusion) then downscale/clean up:

**Character - Blitz (Speedster):**
"pixel art sprite, 32-bit style video game character, athletic runner pose, blue and white sports outfit, spiky hair, determined expression, side view, transparent background, no antialiasing, limited color palette"

**Background - Neon District:**
"pixel art cyberpunk rooftop at night, volleyball court, neon signs in Japanese, flying cars in distance, rain, purple and cyan color scheme, 16-bit style, wide shot, game background"

**Background - Cyber Arena:**
"pixel art futuristic indoor stadium, holographic crowd, hexagonal architecture, RGB lighting, esports arena, volleyball court center, 32-bit video game style"

**Background - Night Market:**
"pixel art asian night market street, food stalls, red lanterns, neon signs, cyberpunk atmosphere, narrow alley, puddles reflecting lights, 16-bit game background"

**Ball - Fire variant:**
"pixel art flaming volleyball, fire trail effect, orange and red colors, game item sprite, transparent background, 32x32 pixels style"

Post-processing:

1. Resize to target resolution
2. Reduce colors to palette
3. Clean up anti-aliased edges
4. Add/adjust outlines

````

---

## 📦 Quick Reference Commands

```bash
# Initialize project
bun create vite client --template vanilla-ts
cd server && bun init

# Install client dependencies
cd client && bun add phaser colyseus.js

# Install server dependencies
cd server && bun add elysia @elysiajs/cors @elysiajs/jwt colyseus drizzle-orm postgres redis

# Run development
bun run dev  # (in both client and server)

# Database
bun run db:generate
bun run db:push

# Build for production
bun run build
````

---

## 🎮 Development Order Recommendation

1. **Week 1-2:** Project setup, basic Phaser game with local 2P
2. **Week 3-4:** Character system, physics, CPU opponent
3. **Week 5-6:** Server setup, database, auth
4. **Week 7-8:** Online multiplayer with Colyseus
5. **Week 9-10:** Matchmaking, ranking system
6. **Week 11-12:** Shop, inventory, basic skins
7. **Week 13-14:** Battle pass, polish, testing
8. **Week 15-16:** Mobile port, launch prep

---

Good luck building Spike Rivals! 🏐🎮
