# Spike Rivals — GPT Asset Generation Guide (Sprites, Backgrounds, UI)

> **Use this file as your “prompt pack + art bible”** when generating assets with GPT Image (or any AI image tool).
>
> The goal: **Arcade Volleyball / Pixel Volley gameplay + Cyberpunk / Blade Runner vibe**, with **Street Fighter 2 era sprite clarity** (strong silhouettes, clean outlines, readable at 24×32).

---

## 1) Non-negotiable art constraints

### Target look
- **Era:** early 90s arcade / SNES pixel art (SF2 adjacent)
- **Mood:** cyberpunk neo-noir (rainy neon, purple/cyan/magenta), but *readable*.
- **Readability beats detail:** anything not readable at **24×32** must be simplified.

### Technical constraints
- **No anti-aliasing. No soft gradients. No painterly shading.**
- **Palette:** max **16 colors per character** (including outline + highlight).
- **Lighting:** consistent top-left key light, subtle rim light.
- **Outlines:** 1px dark outline + selective rim outline (cyan/magenta) to pop on dark backgrounds.
- **Camera:** side view, orthographic (no perspective), consistent zoom.

---

## 2) Canonical sprite sheet mapping (MUST MATCH CODE)

Each character sheet is **240×128** (10×4 frames of 24×32).

### Frame index mapping (NEW CANON)
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

**Important:** Generate frames individually (single-pose images) then assemble the sheet in Aseprite.

---

## 3) File paths (as used by the client)

Characters:
- `client/public/assets/sprites/characters/{id}.png`  (240×128)
Portraits:
- `client/public/assets/sprites/portraits/{id}.png`   (80×80)

Backgrounds (480×270 each, must match BootScene keys):
Neon District:
- `client/public/assets/sprites/backgrounds/neon-district/sky.png`
- `client/public/assets/sprites/backgrounds/neon-district/buildings-far.png`
- `client/public/assets/sprites/backgrounds/neon-district/buildings-mid.png`
- `client/public/assets/sprites/backgrounds/neon-district/rooftop.png`
- `client/public/assets/sprites/backgrounds/neon-district/ground.png`
Sunset Beach:
- `client/public/assets/sprites/backgrounds/sunset-beach/sky.png`
- `client/public/assets/sprites/backgrounds/sunset-beach/ocean.png`
- `client/public/assets/sprites/backgrounds/sunset-beach/palms.png`
- `client/public/assets/sprites/backgrounds/sunset-beach/sand.png`
Cyber Arena:
- `client/public/assets/sprites/backgrounds/cyber-arena/back.png`
- `client/public/assets/sprites/backgrounds/cyber-arena/crowd.png`
- `client/public/assets/sprites/backgrounds/cyber-arena/structure.png`
- `client/public/assets/sprites/backgrounds/cyber-arena/ground.png`
Night Market:
- `client/public/assets/sprites/backgrounds/night-market/sky.png`
- `client/public/assets/sprites/backgrounds/night-market/buildings.png`
- `client/public/assets/sprites/backgrounds/night-market/stalls.png`
- `client/public/assets/sprites/backgrounds/night-market/ground.png`
Retro Arcade:
- `client/public/assets/sprites/backgrounds/retro-arcade/back.png`
- `client/public/assets/sprites/backgrounds/retro-arcade/cabinets.png`
- `client/public/assets/sprites/backgrounds/retro-arcade/near.png`
- `client/public/assets/sprites/backgrounds/retro-arcade/ground.png`
Space Station:
- `client/public/assets/sprites/backgrounds/space-station/stars.png`
- `client/public/assets/sprites/backgrounds/space-station/earth.png`
- `client/public/assets/sprites/backgrounds/space-station/station.png`
- `client/public/assets/sprites/backgrounds/space-station/ground.png`
Ancient Temple:
- `client/public/assets/sprites/backgrounds/ancient-temple/sky.png`
- `client/public/assets/sprites/backgrounds/ancient-temple/ruins.png`
- `client/public/assets/sprites/backgrounds/ancient-temple/columns.png`
- `client/public/assets/sprites/backgrounds/ancient-temple/ground.png`
Urban Rooftop:
- `client/public/assets/sprites/backgrounds/urban-rooftop/sky.png`
- `client/public/assets/sprites/backgrounds/urban-rooftop/skyline.png`
- `client/public/assets/sprites/backgrounds/urban-rooftop/rooftop.png`
- `client/public/assets/sprites/backgrounds/urban-rooftop/ground.png`

Balls:
- `client/public/assets/sprites/balls/{spriteKey}-spin.png` (96×12, 8 frames)
- Sprite keys: `ball-default`, `ball-plasma`, `ball-fire`, `ball-ice`, `ball-void`, `ball-rainbow`

UI:
- `client/public/assets/sprites/ui/...`

---

## 4) The “GLOBAL STYLE HEADER” (paste into every prompt)

Use this at the top of every prompt:

```text
retro arcade pixel art, early 90s arcade/SNES sprite style, cyberpunk neo-noir vibe (rainy neon, purple/cyan/magenta), clean readable silhouette, 1px dark outline + selective neon rim light, high contrast, minimal dithering, no gradients, no anti-aliasing, crisp pixels, limited 16-color palette, consistent light direction (top-left), side view orthographic camera
```

### Negative prompt (for tools that support it)
```text
blurry, antialiasing, smooth shading, gradients, painterly, high detail textures, photorealistic, 3d render, soft edges, bloom haze, lens flare, compression artifacts, watermark, text, logo
```

---

## 5) Workflow (recommended)

### Step A — Generate a **model sheet** first (per character)
Make one high-res reference image to lock silhouette + palette.

**Model sheet prompt template:**
```text
[GLOBAL STYLE HEADER]
character model sheet for {CHARACTER NAME}, cyberpunk street-volleyball athlete, 3 views (front, side, 3/4), neutral standing pose, clear silhouette for 24x32 sprite readability, bold color blocks, minimal accessories, includes 16-color palette swatches, includes 3 facial expressions (neutral, determined, victory grin), plain dark backdrop, no text
```

### Step B — Generate single frames using the model sheet as reference
- If your tool supports it: **use image-to-image / reference image** with the model sheet.
- Keep camera angle, proportions, and baseline consistent.

### Step C — Downscale + cleanup
Recommended pipeline:
1. Generate at **384×512** (or 512×512) per pose
2. Downscale to **24×32** with **Nearest Neighbor**
3. Reduce palette to **≤16 colors**
4. Clean edges, add 1px outline, ensure consistent silhouette
5. Assemble into **240×128** sheet

---

## 6) Character designs (base prompts)

Use these to define the base look before you start animation frames.

### Blitz
**Palette:** Hair #00d4ff | Skin #e8b89d, #c9956c, #a67853 | Outfit #ffffff, #00d4ff, #0099cc
```text
[GLOBAL STYLE HEADER]
Blitz, lean athletic cyberpunk speedster, spiky electric-blue hair, blue/white sports jacket with neon piping, lightning bolt shoulder patch, fingerless gloves, knee pads, determined face, minimal cyber visor, side view facing right, feet aligned to baseline, no background
```

### Crusher
**Palette:** Hair #4a3728 | Skin #d4a574, #b8875a, #8b6040 | Outfit #e63946, #1d1d1d, #ffffff
```text
[GLOBAL STYLE HEADER]
Crusher, muscular cyberpunk power hitter, red/black armored sports top, cybernetic forearms with subtle glow seams, buzz cut, heavy knee braces, intimidating stance, side view facing right, feet aligned to baseline, no background
```

### Sky
**Palette:** Hair #f4e9cd | Skin #ffe4d4, #f0c9b0, #d4a88a | Outfit #87ceeb, #ffffff, #5fa8d3
```text
[GLOBAL STYLE HEADER]
Sky, tall agile cyberpunk high flyer, purple/cyan suit with lightweight anti-grav belt, flowing white hair tied back, small readable wing-like jacket tails, serene focus, side view facing right, feet aligned to baseline, no background
```

### Zen
**Palette:** Hair #1a1a1a, #888888 | Skin #f5deb3, #dcc59a, #c4a87a | Outfit #ffffff, #9b59b6, #7d3c98
```text
[GLOBAL STYLE HEADER]
Zen, calm cyberpunk precision player, green/white minimalist outfit, small targeting monocle visor, wrist tape, balanced stance, subtle zen-circle emblem, side view facing right, feet aligned to baseline, no background
```

### Tank
**Palette:** Hair #ff6b35 | Skin #ffd5b5, #e8b89d, #c9956c (freckled) | Outfit #2ecc71, #f1c40f, #27ae60
```text
[GLOBAL STYLE HEADER]
Tank, stocky cyberpunk defender, gray/orange exo-vest, padded shoulders, grounded stance, shield emblem, side view facing right, feet aligned to baseline, no background
```

### Flash
**Palette:** Hair #ff69b4 | Skin #8b5a3c, #704832, #5a3825 | Outfit #ffeb3b, #ff69b4, #fff176
```text
[GLOBAL STYLE HEADER]
Flash, hyper energetic cyberpunk sprinter, yellow/orange suit, flame-like hair spikes, tiny heel thrusters, excited grin, side view facing right, feet aligned to baseline, no background
```

### Nova
**Palette:** Hair #4a0080 | Skin #d4a574, #b8875a, #8b6040 | Outfit #1a1a4e, #ffd700, #2a2a6e
```text
[GLOBAL STYLE HEADER]
Nova, confident cyberpunk captain, pink/gold suit with starburst chest emblem, stylish undercut hair, leader stance, side view facing right, feet aligned to baseline, no background
```

### Ghost
**Palette:** Hair #e0e0e0 | Skin #f0e6e6, #d9cece, #c2b6b6 | Outfit #333333, #00ffff, #1a1a1a
```text
[GLOBAL STYLE HEADER]
Ghost, mysterious cyberpunk trickster, teal/purple cloak jacket, subtle hologram shimmer outline, flowing gray hair, enigmatic expression, side view facing right, feet aligned to baseline, no background
```

---

## 7) Animation frame prompt templates

Use this template for *every single frame you generate*:

```text
[GLOBAL STYLE HEADER]
single sprite frame for a 24x32 character animation, {CHARACTER TRAITS}, {ANIMATION NAME} frame {N}/{TOTAL}, side view facing right, consistent proportions from model sheet, feet locked to baseline, exaggerated readable pose, no background
```

### Idle (4 frames)
- Frame 1: neutral
- Frame 2: inhale (shoulders up)
- Frame 3: neutral
- Frame 4: exhale (shoulders down)

### Run (6 frames)
- Keep big readable leg shapes, no tiny motion blur.

### Jump (3 frames)
- Frame 1: crouch anticipation
- Frame 2: lift-off
- Frame 3: apex hold

### Fall/Land (3 frames)
- Frame 1: descending
- Frame 2: land squash (+ optional dust in separate FX)
- Frame 3: recover

### Bump (4 frames)
- Frame 1: ready
- Frame 2: arms down/back anticipation
- Frame 3: contact (platform)
- Frame 4: follow-through

### Spike (4 frames)
- Frame 1: approach step
- Frame 2: jump
- Frame 3: arm cock
- Frame 4: smash (contact)

### Dive (3 frames)
- Frame 1: launch
- Frame 2: extend
- Frame 3: slide

### Recover (3 frames)
- Frame 1: push up from floor
- Frame 2: kneel
- Frame 3: stand

### Serve (4 frames)
- Frame 1: toss
- Frame 2: reach
- Frame 3: contact
- Frame 4: follow

### Victory (4 frames)
- Loopable fist pump / small hop

### Defeat (2 frames)
- Frame 1: disappointed
- Frame 2: slump

### Animation Timing Reference

| Animation | Frames | Duration | Frame Rate | Loop |
|-----------|--------|----------|------------|------|
| Idle | 4 | 667ms | 6 fps | Yes |
| Run | 6 | 500ms | 12 fps | Yes |
| Jump | 3 | 300ms | 10 fps | No |
| Fall | 3 | 300ms | 10 fps | No |
| Bump | 4 | 333ms | 12 fps | No |
| Spike | 4 | 333ms | 12 fps | No |
| Dive | 3 | 250ms | 12 fps | No |
| Recover | 3 | 300ms | 10 fps | No |
| Serve | 4 | 400ms | 10 fps | No |
| Victory | 4 | 500ms | 8 fps | Yes |
| Defeat | 2 | 333ms | 6 fps | Yes |

---

## 8) Portraits (80×80)

Generate at 512×512 then downscale to 80×80.

Portrait template:
```text
[GLOBAL STYLE HEADER]
pixel art character portrait, bust shot, {CHARACTER TRAITS}, square composition, strong facial readability, limited 16-color palette, crisp pixels, transparent background
```

---

## 9) Backgrounds (parallax layers)

Rule: **generate each layer separately**. Each prompt must explicitly forbid elements that belong to other layers.

### Cyberpunk Neon District (example layer prompts)
**Sky layer**
```text
pixel art parallax background layer, cyberpunk night sky only, rainy neon haze, faint city glow, no buildings, no props, 480x270, limited palette, crisp pixels
```

**Far buildings**
```text
pixel art parallax background layer, distant skyscraper silhouettes with a few neon signs, low contrast, no midground props, no ground, 480x270, crisp pixels
```

**Mid buildings**
```text
pixel art parallax background layer, mid-distance rooftops and billboards, a few tiny flying car lights, no ground, no near props, 480x270, crisp pixels
```

**Rooftop props**
```text
pixel art parallax foreground layer, rooftop props only: vents, pipes, railings, steam puffs, transparent background, 480x270, crisp pixels
```

**Ground**
```text
pixel art ground layer, wet metal volleyball court floor with neon reflections, simple readable court lines, no props above ankle height, 480x270, crisp pixels
```

Repeat this layer discipline for every stage.

---

## 10) Balls (96×12, 8 rotation frames)

Naming rule:
- File name must be `{spriteKey}-spin.png` (example: `ball-plasma-spin.png`)

Ball prompt template:
```text
[GLOBAL STYLE HEADER]
pixel art volleyball cosmetic ball, 12x12 readable silhouette, {THEME}, includes 8 rotation frames in a 96x12 horizontal spritesheet, crisp pixels, transparent background
```

Themes:
- **default:** classic white/red/blue volleyball panels
- **plasma:** crackling energy core, cyan/purple glow
- **fire:** blazing flames, orange/red/yellow
- **ice:** crystalline facets, light blue/white/cyan sparkle
- **void:** dark matter orb, black/purple swirl, white stars inside
- **rainbow:** prismatic gradient bands, full spectrum cycling
- **neon:** glowing wireframe, hot pink/cyan/purple, color cycling glow
- **pixel:** 8-bit chunky pixels, green/black, retro frame skip effect
- **glitch:** corrupted texture, cyan/magenta/random, glitch artifacts

---

## 11) Net variants (6×80 visual, 2-frame sway)

Net template:
```text
[GLOBAL STYLE HEADER]
pixel art volleyball net cosmetic, 6px wide x 80px tall, {THEME}, includes 2-frame sway animation, transparent background, crisp pixels
```

---

## 12) Effects (hit sparks, dust, score pop)

Keep effects readable and high-contrast.

Hit spark template:
```text
[GLOBAL STYLE HEADER]
pixel art hit impact effect, starburst impact animation, 5 frames, each frame 24x24, arranged horizontally (120x24), crisp pixels, transparent background
```

Perfect hit variant: add gold + extra sparkles.

---

## 13) Cosmetic packs to monetize early (recommended)
### Skin variant prompt template (use for any character skin)

**Rules for skins:**
- Preserve silhouette + proportions exactly (hitbox readability).
- Change **materials, palette accents, small accessories** only (e.g., jacket trim, visor, gloves).
- Max **16 colors total**; reuse base palette + 2 accent colors.

Prompt template:
```text
[GLOBAL STYLE HEADER]
{CHARACTER TRAITS}, same silhouette as the base character, cyberpunk volleyball athlete skin variant, theme: {SKIN THEME}, materials: {MATERIALS}, accent colors: {ACCENT COLORS}, keep face readable, keep outfit readable at 24x32, side view facing right, no background, no text
```

### Recommended skin themes (sell as cosmetic drops)
Pick a theme and apply to 1–3 characters per drop:
- **Neon Ronin:** dark fabric + cyan katana‑stripe trim, tiny shoulder emblem
- **Chrome Corporate:** glossy black + chrome plates, teal LED seams
- **Street Racer:** bright decals, sponsor patches, checker accents
- **Rain Runner:** translucent raincoat layer, reflective tape, blue LEDs
- **Retro Arcade:** 80s pastel palette, geometric patterns, CRT glow accents
- **Void Ritual:** black/purple, subtle rune glow, particle edge
- **Gold Champion:** gold trim, trophy badge, premium sparkle outline (subtle)
- **Holo Idol:** holographic gradient rim outline, magenta/cyan shimmer

### Ball / Net / UI theme prompt templates
Ball skin template:
```text
[GLOBAL STYLE HEADER]
pixel art volleyball cosmetic ball, 12x12 readable silhouette, theme {THEME}, {MATERIALS}, strong outline, no gradients, includes 8 rotation frames in a 96x12 horizontal spritesheet, transparent background
```

Net skin template:
```text
[GLOBAL STYLE HEADER]
pixel art volleyball net cosmetic, 6px wide x 80px tall, theme {THEME}, includes 2-frame sway animation, transparent background
```

UI theme pack template (panels/buttons/icons):
```text
[GLOBAL STYLE HEADER]
pixel art UI theme pack, {THEME}, includes: button primary (3 states), button secondary (3 states), modal panel 9-slice, tooltip panel 9-slice, consistent 1px outline, readable at small sizes, transparent background, no text
```


Create content in bundles:

### Pack 1: “Neon Ronin”
- 2 character skins
- 1 ball skin
- 1 net skin
- 1 UI theme (panels/buttons)

### Pack 2: “Chrome Corporate”
- 2 character skins
- 1 ball skin
- 1 court ground texture

### Pack 3: “Ghost Protocol”
- 1 legendary Ghost skin with hologram shimmer
- 1 void ball
- 1 perfect-hit FX pack

---

## 14) Quality checklist (before exporting)

- [ ] Sprite silhouette reads at 1× scale
- [ ] All frames share the same head/body proportions
- [ ] Feet stay on baseline across frames
- [ ] Palette is ≤16 colors
- [ ] No accidental anti-aliasing pixels
- [ ] Outlines are consistent
- [ ] Background layers separate cleanly (no mixed elements)

---

## 15) Audio Assets

### Sound Effects (SFX)

**Gameplay:**
| File | Description |
|------|-------------|
| `sfx/ball_hit_soft.wav` | Receive/bump sound |
| `sfx/ball_hit_hard.wav` | Spike/smash sound |
| `sfx/ball_bounce.wav` | Ball bouncing off ground/wall |
| `sfx/player_jump.wav` | Jump sound |
| `sfx/player_land.wav` | Landing sound |
| `sfx/net_touch.wav` | Ball touching net |
| `sfx/score_point.wav` | Scoring a point |
| `sfx/score_against.wav` | Opponent scores |
| `sfx/match_start.wav` | Whistle/match begin |
| `sfx/match_end.wav` | Match conclusion |

**UI:**
| File | Description |
|------|-------------|
| `sfx/button_hover.wav` | Button hover feedback |
| `sfx/button_click.wav` | Button press |
| `sfx/menu_open.wav` | Menu/panel open |
| `sfx/menu_close.wav` | Menu/panel close |
| `sfx/purchase_success.wav` | Successful purchase |
| `sfx/unlock_item.wav` | Item unlocked |
| `sfx/coin_collect.wav` | Coins earned |
| `sfx/error.wav` | Error/denied action |

### Music Tracks

| File | Description | Loop |
|------|-------------|------|
| `music/menu_theme.ogg` | Main menu, upbeat chiptune | Yes |
| `music/gameplay_track_1.ogg` | Energetic match music | Yes |
| `music/gameplay_track_2.ogg` | Intense match music | Yes |
| `music/shop_theme.ogg` | Chill shop browsing | Yes |

### Stingers (One-shot Music)

| File | Description |
|------|-------------|
| `stingers/victory_fanfare.ogg` | Match win celebration |
| `stingers/defeat_sound.ogg` | Match loss |
| `stingers/level_up.ogg` | Level up jingle |

### Ambience (Per Court)

| Court | File | Description |
|-------|------|-------------|
| Neon District | `ambience/neon_district.ogg` | Rain, distant traffic |
| Cyber Arena | `ambience/cyber_arena.ogg` | Crowd cheering |
| Night Market | `ambience/night_market.ogg` | Chatter, food sizzling |
| Sunset Beach | `ambience/sunset_beach.ogg` | Waves, seagulls |
| Retro Arcade | `ambience/retro_arcade.ogg` | Game sounds, beeps |
| Space Station | `ambience/space_station.ogg` | Low hum, machinery |
| Ancient Temple | `ambience/ancient_temple.ogg` | Wind, magic chimes |
| Urban Rooftop | `ambience/urban_rooftop.ogg` | City noise, distant sirens |

### Audio File Structure
```
client/public/assets/audio/
├── sfx/
│   ├── ball_hit_soft.wav
│   ├── ball_hit_hard.wav
│   └── ...
├── music/
│   ├── menu_theme.ogg
│   └── ...
├── stingers/
│   ├── victory_fanfare.ogg
│   └── ...
└── ambience/
    ├── neon_district.ogg
    └── ...
```

---

## 16) UI Specifications

### Button Specifications

| Property | Value |
|----------|-------|
| Size | 80 × 28 pixels |
| Corner radius | 2px (pixel art) |
| Border | 2px |
| States | Normal, Hover, Pressed, Disabled |

**Button Colors:**
```
Normal:   Fill #e94560, Border #c73e54
Hover:    Fill #ff5a75, Border #e94560
Pressed:  Fill #c73e54, Border #a3354a
Disabled: Fill #666666, Border #444444
Text:     #ffffff
```

### Panel/Window (9-Slice)

| Property | Value |
|----------|-------|
| Corner size | 8 × 8 pixels |
| Minimum size | 48 × 48 pixels |
| Background | #1a1a2e |
| Border | #0f3460 |
| Header | #16213e |
| Accent | #e94560 |

### Required Icons (16×16 pixels)

**Currency & Progression:**
- Coin (gold circle)
- Gem (purple diamond)
- XP star
- Trophy

**Navigation:**
- Settings gear
- Sound on/off toggle
- Music on/off toggle
- Play button
- Pause button
- Restart arrow
- Home
- Back arrow
- Close (X)
- Plus (+)
- Minus (-)
- Lock (locked item)
- Checkmark

**Character Attributes:**
- Speed (lightning bolt)
- Jump (arrow up)
- Power (fist)
- Control (target)

### Rank Icons (24×24 pixels)

| Rank | Icon |
|------|------|
| Rookie | Sprout |
| Bronze | Bronze medal |
| Silver | Silver medal |
| Gold | Gold medal |
| Platinum | Diamond outline |
| Diamond | Solid diamond |
| Champion | Crown |

### Fonts

| Type | Font | Sizes |
|------|------|-------|
| Primary | "Press Start 2P" | 24px (title), 16px (header), 8px (body) |
| Secondary | "Pixelify Sans" | 6px (small) |

**Text Colors:**
```
Primary:   #ffffff
Secondary: #a6cee3
Highlight: #ffd700
Error:     #e94560
Success:   #00ff9f
```

---

## 17) Effects & Particles Specifications

### Hit Effect (Impact Spark)
| Property | Value |
|----------|-------|
| Size | 32 × 32 pixels |
| Frames | 5 |
| Duration | 200ms |
| Arrangement | 160×32 horizontal strip |
| Colors | White (#ffffff), Yellow (#ffd700) |
| Pattern | Starburst expanding |

**Perfect Hit Variant:** Add gold tint + extra sparkle particles

### Dust Cloud
| Property | Value |
|----------|-------|
| Size | 24 × 16 pixels |
| Frames | 4 |
| Duration | 300ms |
| Arrangement | 96×16 horizontal strip |
| Colors | Court-dependent (sand, concrete, etc.) |
| Pattern | Puff expanding and fading |

### Score Pop Effect
| Property | Value |
|----------|-------|
| Size | 48 × 48 pixels |
| Frames | 6 |
| Duration | 400ms |
| Arrangement | 288×48 horizontal strip |
| Colors | Gold (#ffd700), White (#ffffff) |
| Pattern | Number flying up with sparkles |

### Ball Trail Particles
| Property | Value |
|----------|-------|
| Particle size | 4 × 4 pixels |
| Count | 5-8 particles |
| Duration | 150ms fade out |
| Colors | Based on ball skin |
| Pattern | Follow ball path, shrinking |

---

## 18) Background Layer Parallax Speeds

When implementing parallax scrolling, use these scroll multipliers:

| Layer | Scroll Speed | Content |
|-------|--------------|---------|
| 0 (Far) | 0.1x | Sky, distant elements |
| 1 | 0.3x | Far buildings/objects |
| 2 | 0.5x | Mid-ground elements |
| 3 | 0.8x | Near elements, props |
| 4 (Court) | 1.0x | Ground/playing surface |
| 5 (FG) | 1.2x | Foreground particles |

**Note:** Generate layers separately. Each layer prompt must explicitly forbid elements belonging to other layers.
