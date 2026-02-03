# Spike Rivals — Code Changes Plan (Paste into Codex / Claude)

> **Context:** This repo is a Phaser 3 + Vite client for a retro arcade volleyball game (Arcade Volleyball / Pixel Volley inspiration) with a cyberpunk / Blade Runner vibe. 
>
> **Main goal:** make gameplay feel *smooth and consistent* (less jitter, fewer “random” collisions), enable *fighter-like* hit timing (SF2-inspired), and improve online smoothness (prediction tick decoupled from render FPS).

---

## 0) Ground rules

- **Keep pixel feel:** do not re-enable anti-aliasing; keep integer zoom + `roundPixels`.
- **Prefer small, testable commits:** fix physics alignment + hit jitter first, then add new action-based hit system.
- **Don’t break existing scenes:** `BootScene → MenuScene → CharacterSelectScene → GameScene` flow must remain.

---

## 1) Fix collision alignment bugs (ground + net)

### Why
`Arcade.Body#setSize()` without the `center` flag keeps old offsets, which can make collisions “feel random” (hitboxes shifted).

### Change
Edit **`src/scenes/game-scene.ts`**:

#### `createGround()`
Replace:
```ts
this.ground.body.setSize(GAME_WIDTH, 10);
```
With:
```ts
(this.ground.body as Phaser.Physics.Arcade.Body).setSize(GAME_WIDTH, 10, true);
```

#### `createNet()`
Replace:
```ts
this.net.body.setSize(PHYSICS.NET_COLLISION_WIDTH, PHYSICS.NET_HEIGHT);
```
With:
```ts
(this.net.body as Phaser.Physics.Arcade.Body).setSize(PHYSICS.NET_COLLISION_WIDTH, PHYSICS.NET_HEIGHT, true);
```

### Acceptance
- Ball and players collide with the net exactly where it is visually drawn.
- No “phantom” net hits or ball passing through the net edges.

---

## 2) Make scoring + ground contact feel correct (ball should not clip through ground)

### Why
Right now the ball is not colliding with the ground body; scoring is done via a Y threshold. This can look buggy (ball visually sinks into the floor).

### Change
Edit **`src/scenes/game-scene.ts`**:

1) Add a collider between **ball** and **ground** in `setupCollisions()`.
2) Replace `checkScoring()` logic to score **on actual ground collision**.

#### Implementation details

- In `setupCollisions()` add:
```ts
this.physics.add.collider(this.ball, this.ground, () => {
  if (this.gameState !== 'PLAYING') return;
  if (this.ballBody.velocity.y < 0) return; // only when falling

  const courtMiddle = GAME_WIDTH / 2;
  const scorer: 'left' | 'right' = this.ball.x < courtMiddle ? 'right' : 'left';

  // Snap to ground top so it never visually clips
  this.ball.y = PHYSICS.GROUND_Y - PHYSICS.BALL_RADIUS;

  // Prevent double-score while ball rests on ground
  this.ballBody.setVelocity(0, 0);
  this.ballBody.checkCollision.none = true;

  this.scorePoint(scorer);
});
```
Re-enable ball collisions when resetting for the next rally.

- Remove (or stop calling) the existing `checkScoring()` Y-threshold method.

### Acceptance
- When the ball hits the ground, it *touches* the floor (no sinking), then the point is awarded.
- No double-scoring.

---

## 3) Remove “ball jitter” caused by overlap re-hitting every frame

### Why
`physics.add.overlap(ball, player, callback)` fires every step while overlapping. Your callback sets velocity every time → jitter and “machine-gun” direction changes.

### Minimal fix (keep auto-hit mechanic for now)
Edit **`src/scenes/game-scene.ts`**:

1) Add per-side hit cooldown fields:
```ts
private lastHitTick: { left: number; right: number } = { left: -9999, right: -9999 };
private readonly HIT_COOLDOWN_TICKS = 7; // ~120ms @ 60Hz
```

2) In `handlePlayerBallCollision(player)` add a cooldown early-return (use fixed-step tick counter):
```ts
if (this.simTick - this.lastHitTick[player.side] < this.HIT_COOLDOWN_TICKS) return;
this.lastHitTick[player.side] = this.simTick;
```

3) After applying ball velocity, **nudge the ball out of overlap**:
```ts
const push = PHYSICS.BALL_RADIUS + PHYSICS.PLAYER_WIDTH / 2 + 2;
const targetX = player.sprite.x + (player.side === 'left' ? push : -push);
// Clamp to court bounds and avoid pushing into the net
const netX = PHYSICS.NET_X ?? PHYSICS.NET_POSITION_X ?? this.net.x; // use existing constant or net sprite
const netHalf = PHYSICS.NET_COLLISION_WIDTH / 2;
const minX = player.side === 'left'
  ? PHYSICS.COURT_MIN_X + PHYSICS.BALL_RADIUS
  : netX + netHalf + PHYSICS.BALL_RADIUS;
const maxX = player.side === 'left'
  ? netX - netHalf - PHYSICS.BALL_RADIUS
  : PHYSICS.COURT_MAX_X - PHYSICS.BALL_RADIUS;
this.ball.x = Phaser.Math.Clamp(targetX, minX, maxX);
```

4) Make the hit direction more volleyball-like (biased upward instead of pure reflection):
- Replace the `angle = atan2(dy, dx)` approach with a base up-left/up-right angle.
- **Determinism note (online):** use a seeded RNG (e.g., `mulberry32(seed)` or `seedrandom`) and a tick-based seed (`matchSeed + simTick`) instead of `Math.random()`.

Example:
```ts
const base = Phaser.Math.DegToRad(player.side === 'left' ? 300 : 240);
const random = (rng() - 0.5) * (1 - controlFactor) * 0.6;
const finalAngle = base + random;

this.ballBody.setVelocity(
  Math.cos(finalAngle) * hitPower,
  Math.sin(finalAngle) * hitPower
);
```
5) **Tick source:** increment `simTick` inside the same fixed-step loop used for physics/prediction so cooldowns and hit randomness are deterministic.

### Acceptance
- Ball no longer jitters when it touches a player.
- Hits feel consistent (generally upward toward the opponent).

---

## 4) Upgrade to action-based hitting (Street Fighter timing feel)

> This is the biggest “feel” upgrade. Do this after sections 1–3 are stable.

### Design
- Add an **Action button** (keyboard: `X` by default) that triggers a hit animation.
- Only during the animation’s **active frames** can the ball be hit.
- Add a **Perfect window** (1–2 frames) for better control + stronger hit + special VFX.

### Implementation steps

#### 4.1 Add InputManager to GameScene (recommended)
The repo already has a unified input system: **`src/managers/input-manager.ts`**.

- In **`src/scenes/game-scene.ts`**:
  - Remove the manual input fields (`cursors`, `wasd`, `spaceKey`, `touchControls`, etc.).
  - Add:
    ```ts
    import { InputManager } from '../managers/input-manager';
    private inputManager!: InputManager;
    ```
  - In `create()`:
    ```ts
    this.inputManager = new InputManager(this);
    this.inputManager.create();
    ```

- Replace input reads in offline and online with:
  ```ts
  const input = this.inputManager.getInputState(); // render-only
  // For fixed-tick simulation use buffered snapshots, e.g.:
  // const input = this.inputManager.consumeInputTick();
  ```

#### 4.2 Add player combat state
Extend `PlayerObject` in `GameScene`:
```ts
actionState: 'none' | 'bump' | 'spike';
actionTimerTicks: number; // counts down (fixed-step)
justHitBall: boolean;  // to avoid multi-hit in same action
```

Define timings (tweak later):
- Bump total: 11 ticks, active window: ticks 4–6
- Spike total: 12 ticks, active window: ticks 5–7

#### 4.3 Replace always-on overlap hits
Keep overlap checks, but only apply hits when:
- player is in action state
- ball is in a small hitbox in front of the player
- active window is currently active
- `justHitBall` is false

Pseudo:
```ts
if (player.actionState !== 'none' && withinActiveWindow && !player.justHitBall && ballInHitbox) {
  applyHitVelocity(...);
  player.justHitBall = true;
}
```

#### 4.4 Hook animations
Update `updatePlayerAnimation()` to choose:
- bump anim when `actionState === 'bump'`
- spike anim when `actionState === 'spike'`

(See Section 6 for the new sprite sheet mapping.)

### Acceptance
- Pressing **X** triggers a bump (ground) or spike (air).
- Ball only changes velocity when the player is in active frames.
- “Perfect” window triggers stronger hit + special VFX.

---

## 5) Online smoothness: fixed-timestep input ticks (decouple from render FPS)

### Problem
Current online prediction tick rate depends on render FPS because `PredictionManager.onLocalInput()` is called once per frame.

### Fix (client-only)
Edit **`src/scenes/game-scene.ts`**:

1) Import fixed timestep constant (if available). If `@spike-rivals/shared` exports something like `FIXED_TIMESTEP`, use it. Otherwise define `const FIXED_MS = 1000 / 60`.

2) Add accumulator fields:
```ts
private onlineAccMs = 0;
private readonly ONLINE_FIXED_MS = 1000 / 60;
```

3) Replace the online section of `update()`:

Current:
```ts
this.predictionManager?.update(delta);
this.handleOnlineInput();
this.renderOnlineState();
```

New:
```ts
this.onlineAccMs += delta;

while (this.onlineAccMs >= this.ONLINE_FIXED_MS) {
  this.handleOnlineInputTick(); // reads buffered input snapshot for this tick
  this.onlineAccMs -= this.ONLINE_FIXED_MS;
}

this.predictionManager?.update(delta); // (optional, correction smoothing)
this.renderOnlineState();
```

4) Rename `handleOnlineInput()` → `handleOnlineInputTick()` and ensure it reads **current input** and calls `onLocalInput` **exactly once per tick**.
5) **Input buffering (required):** `InputManager` should capture edge inputs per render frame and enqueue snapshots for fixed ticks (e.g., `inputQueue.push(snapshot)`), so a single key press is not missed or duplicated when multiple ticks process in one frame.
   - When the queue is empty, reuse the last held-state but **clear edge flags** (`pressedThisTick = false`) so it doesn't repeat.
6) **Determinism guard:** any sim-affecting logic (cooldowns, action windows, randomness) should use `simTick` and seeded RNG, not `delta` or `this.time.now`.

### If you can change server/shared (recommended)
- Add a real `tick` / `lastProcessedInputSequence` to server state and send it to clients.
- Use that for `PredictionManager.onServerState({ tick })` instead of the client’s `this.serverTick++`.

### Acceptance
- Online movement remains consistent even if FPS changes (e.g., tab switching or laptop performance dips).
- Less snapping/correction.

---

## 6) Unify spritesheet layout + animation indices

### Target spritesheet format
Each character: **240×128** = **10 columns × 4 rows** of **24×32** frames.

### Canonical frame mapping (NEW)
This mapping is designed to support fighter-like action states:

- **Row 0 (frames 0–9):**
  - Idle: **0–3** (4 frames)
  - Run: **4–9** (6 frames)

- **Row 1 (frames 10–19):**
  - Jump: **10–12** (3 frames)
  - Fall/Land: **13–15** (3 frames)
  - Bump: **16–19** (4 frames)

- **Row 2 (frames 20–29):**
  - Spike: **20–23** (4 frames)
  - Dive: **24–26** (3 frames)
  - Recover: **27–29** (3 frames)

- **Row 3 (frames 30–39):**
  - Serve: **30–33** (4 frames)
  - Victory: **34–37** (4 frames)
  - Defeat: **38–39** (2 frames)

### Update BootScene animation creation
Edit **`src/scenes/boot-scene.ts`** in `createCharacterAnimations()`:

Create these animations if the texture exists **and frame count >= 40**:
- `${id}-idle` frames 0–3
- `${id}-run` frames 4–9
- `${id}-jump` frames 10–12
- `${id}-fall` frames 13–15
- `${id}-bump` frames 16–19
- `${id}-spike` frames 20–23
- `${id}-dive` frames 24–26
- `${id}-recover` frames 27–29
- `${id}-serve` frames 30–33
- `${id}-victory` frames 34–37
- `${id}-defeat` frames 38–39

Frame rates (starting point):
- idle 6
- run 12
- jump 10
- fall 10
- bump 12
- spike 12
- dive 12
- recover 10
- serve 10
- victory 8
- defeat 6

### Acceptance
- All animations play correctly once new spritesheets are generated.
- `GameScene.updatePlayerAnimation()` selects correct anim keys.

---

## 7) Audio + music wiring (menu + match + character stingers)

### Why
Audio is currently TODO (see `src/managers/audio-manager.ts`). Music will help the game feel polished.

### Tasks

1) Create audio folder:
- `client/public/assets/audio/`
  - `music/` (menu, select, match loops)
  - `stingers/` (victory/defeat, character stings)
  - `sfx/` (jump/hit/perfect/score/ui)

2) Update **`src/managers/audio-manager.ts`**:
- Implement `preload()` to load all known audio keys.
- Add `playMusic(key, { loop, fadeMs })` with crossfade.
- Add `playStinger(key)` that plays over music.
- Persist volume/mute in `localStorage`.

3) Wire scenes:
- **MenuScene**: play `music-menu`
- **CharacterSelectScene**: play `music-select` + play short character preview stinger on selection
- **GameScene**: play stage music OR character theme; on score play `sfx-score`; on perfect hit play `sfx-perfect`

### Acceptance
- Music starts after first user gesture (browser autoplay restrictions).
- Scene transitions change music cleanly (no overlapping tracks).

---

## 8) Quick manual test checklist

- Offline CPU match:
  - Player movement feels stable
  - Jump landing is reliable
  - Ball never jitters while overlapping player
  - Net collision matches visuals
  - Ball-ground contact looks correct

- Online match (if available):
  - Movement tick remains stable when FPS changes
  - Opponent interpolation still works
  - Single-frame action press registers exactly once at low FPS
  - Same input stream at different FPS yields identical ball/player state after N ticks

- Animation sanity:
  - New mapping animations play for any loaded character

---

---

## 9) Cosmetics + economy scaffold (monetization-ready, still fair)

> Goal: you can earn money with **skins / balls / nets / FX / UI themes** without affecting gameplay stats.

### Current state
- `src/managers/skin-manager.ts` exists and persists owned/equipped items to `localStorage`.
- `src/scenes/shop-scene.ts` is placeholder.

### Implement (client-only MVP)
1) **Add a CurrencyManager** (or `EconomyService`)
   - Stores `coins` and `gems` in `localStorage`
   - API: `getCoins()`, `addCoins(n)`, `spendCoins(n): boolean`, `getGems()`, `spendGems(n): boolean`
   - Validate on load: `parseInt`, clamp to `>= 0`, treat `NaN` as `0`

2) **Create a static catalog** `src/data/shop-catalog.ts`
   - Arrays for: character skins, ball skins, net skins, FX packs, UI themes
   - Each item: `{ id, name, type, rarity, price, spriteKey, characterId? }`

3) **ShopScene UI**
   - Tabs: Skins / Balls / Nets / Effects / UI
   - Grid cards: preview icon, name, rarity color, price, owned/locked state
   - Buttons: Buy (if affordable), Equip (if owned)

4) **Match rewards (soft currency)**
   - On match end, award coins: e.g. `+30` for win, `+15` for loss
   - Add a small results panel showing earned coins

5) **Gems monetization hook (future)**
   - Keep gems earnable in tiny amounts (tutorial/daily), but design a hook: `purchaseGems(packId)`
   - Do **not** implement payments in this pass — just keep the interface ready.

### Acceptance
- Player can buy & equip cosmetics in ShopScene.
- Cosmetics apply in `GameScene` by selecting the right sprite key (skin overrides base character sprite).
- No gameplay advantage from cosmetics.

## Notes / Non-goals (for now)

- Do not implement complex combos or multi-hit moves yet.
- Keep ranked mode fair: cosmetics only, no gameplay stats from skins.
