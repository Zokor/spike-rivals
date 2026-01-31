# 🎨 Spike Rivals - Asset Specifications

> Complete pixel art specifications for all game assets.

---

## 📐 General Guidelines

### Resolution & Scaling
| Property | Value |
|----------|-------|
| Game Resolution | 480 × 270 pixels |
| Scaling | Integer scaling (2x, 3x, 4x) |
| Target Display | 1920 × 1080 (4x scale) |
| Pixel Perfect | Yes, no anti-aliasing |

### Art Style
- **Style:** 16-bit / 32-bit pixel art
- **Outline:** 1px dark outline (not pure black, use #1a1a2e)
- **Shading:** 2-3 shades per color, dithering allowed
- **Light Source:** Top-left (consistent across all assets)
- **Animation:** Limited frames (4-8 per animation)

### Color Limitations
- **Per Character:** 12-16 colors max
- **Per Background:** 32-48 colors max
- **UI Elements:** 8-12 colors (consistent palette)

---

## 👤 Characters

### Sprite Sheet Specifications

| Property | Value |
|----------|-------|
| Character Size | 24 × 32 pixels |
| Sprite Sheet Size | 240 × 256 pixels |
| Format | PNG with transparency |
| Columns | 10 |
| Rows | 8 |

### Animation Frames Layout

```
Row 0: Idle (4 frames) + Empty (6)
Row 1: Run (6 frames) + Empty (4)
Row 2: Jump Up (2) + Peak (1) + Fall (2) + Land (1) + Empty (4)
Row 3: Hit/Spike (5 frames) + Empty (5)
Row 4: Receive/Bump (4 frames) + Empty (6)
Row 5: Victory (4 frames) + Empty (6)
Row 6: Defeat (3 frames) + Empty (7)
Row 7: Special/Taunt (4 frames) + Empty (6)
```

### Animation Timing

| Animation | Frames | Duration | Loop |
|-----------|--------|----------|------|
| Idle | 4 | 800ms | Yes |
| Run | 6 | 400ms | Yes |
| Jump | 6 | 500ms | No |
| Hit | 5 | 300ms | No |
| Receive | 4 | 250ms | No |
| Victory | 4 | 1000ms | Yes |
| Defeat | 3 | 600ms | No |

---

### Character Designs

#### 1. Blitz (Speedster)
```
Personality: Energetic, competitive
Body Type: Lean, athletic
Visual Theme: Lightning/speed lines

Colors:
- Hair: Electric blue (#00d4ff)
- Skin: Medium (#e8b89d, #c9956c, #a67853)
- Outfit: White + blue accents (#ffffff, #00d4ff, #0099cc)
- Shoes: Running shoes, blue
- Accessories: Headband, wristbands

Distinctive Features:
- Spiky hair swept back
- Lightning bolt on shirt
- Speed lines in run animation
```

#### 2. Crusher (Power Hitter)
```
Personality: Strong, determined
Body Type: Muscular, broad shoulders
Visual Theme: Strength/impact

Colors:
- Hair: Dark brown (#4a3728)
- Skin: Tan (#d4a574, #b8875a, #8b6040)
- Outfit: Red + black (#e63946, #1d1d1d, #ffffff)
- Shoes: Heavy boots
- Accessories: Arm wraps

Distinctive Features:
- Short buzzcut
- Broad chest
- Impact stars on hit animation
- Slightly larger than other characters (26x34)
```

#### 3. Sky (High Flyer)
```
Personality: Graceful, calm
Body Type: Tall, light build
Visual Theme: Air/clouds

Colors:
- Hair: Light blonde (#f4e9cd)
- Skin: Fair (#ffe4d4, #f0c9b0, #d4a88a)
- Outfit: Sky blue + white (#87ceeb, #ffffff, #5fa8d3)
- Shoes: Light sneakers
- Accessories: Feather earring

Distinctive Features:
- Long ponytail
- Cloud particles when jumping
- Floaty feel in animations
- Tallest character (24x36)
```

#### 4. Zen (Precision)
```
Personality: Focused, methodical
Body Type: Average, balanced
Visual Theme: Meditation/focus

Colors:
- Hair: Black with gray streak (#1a1a1a, #888888)
- Skin: Light (#f5deb3, #dcc59a, #c4a87a)
- Outfit: White + purple (#ffffff, #9b59b6, #7d3c98)
- Shoes: Barefoot/tabi socks
- Accessories: Headband with symbol

Distinctive Features:
- Tied-back hair
- Calm expression
- Glowing eyes on perfect hit
- Focus lines particle effect
```

#### 5. Tank (Defensive)
```
Personality: Reliable, protective
Body Type: Stocky, solid
Visual Theme: Shield/wall

Colors:
- Hair: Orange (#ff6b35)
- Skin: Light freckled (#ffd5b5, #e8b89d, #c9956c)
- Outfit: Green + yellow (#2ecc71, #f1c40f, #27ae60)
- Shoes: Sturdy trainers
- Accessories: Knee pads, elbow pads

Distinctive Features:
- Short curly hair
- Freckles
- Wide stance
- Shield effect on good receives
```

#### 6. Flash (Ultra Speed)
```
Personality: Hyperactive, playful
Body Type: Small, compact
Visual Theme: Blur/afterimages

Colors:
- Hair: Pink (#ff69b4)
- Skin: Dark (#8b5a3c, #704832, #5a3825)
- Outfit: Yellow + pink (#ffeb3b, #ff69b4, #fff176)
- Shoes: Roller blade style
- Accessories: Goggles on head

Distinctive Features:
- Messy short hair
- Goggles
- Afterimage trail when running
- Smallest character (22x30)
```

#### 7. Nova (Balanced)
```
Personality: Confident, leader-like
Body Type: Average, athletic
Visual Theme: Star/cosmic

Colors:
- Hair: Dark purple (#4a0080)
- Skin: Medium (#d4a574, #b8875a, #8b6040)
- Outfit: Navy + gold (#1a1a4e, #ffd700, #2a2a6e)
- Shoes: High-tops
- Accessories: Star necklace

Distinctive Features:
- Medium-length styled hair
- Star motif on outfit
- Sparkle effects
- "Default" balanced proportions
```

#### 8. Ghost (Tricky)
```
Personality: Mysterious, unpredictable
Body Type: Slim, angular
Visual Theme: Phantom/shadow

Colors:
- Hair: White/silver (#e0e0e0)
- Skin: Pale (#f0e6e6, #d9cece, #c2b6b6)
- Outfit: Dark gray + cyan (#333333, #00ffff, #1a1a1a)
- Shoes: Silent sneakers
- Accessories: Hood (down during play)

Distinctive Features:
- Long hair covering one eye
- Semi-transparent effects
- Shadow trail
- Glitchy animation frames occasionally
```

---

## 🏐 Ball Variants

### Base Ball Specifications
| Property | Value |
|----------|-------|
| Size | 12 × 12 pixels |
| Rotation Frames | 8 |
| Spin Animation | 100ms per frame |

### Ball Designs

#### Default Ball
```
Colors: White (#ffffff), Red (#e63946), Blue (#457b9d)
Pattern: Classic volleyball panels
Animation: Simple rotation
```

#### Fire Ball (Rare)
```
Colors: Orange (#ff6b35), Red (#e63946), Yellow (#ffd700)
Pattern: Flame texture
Animation: Flickering flames, ember particles
Trail: Fire particles (orange/red)
```

#### Ice Ball (Rare)
```
Colors: Light blue (#a8dadc), White (#ffffff), Cyan (#00ffff)
Pattern: Crystalline facets
Animation: Sparkle shimmer
Trail: Snowflake particles, frost effect
```

#### Neon Ball (Epic)
```
Colors: Hot pink (#ff006e), Cyan (#00f5d4), Purple (#8338ec)
Pattern: Glowing wireframe
Animation: Color cycling glow
Trail: Neon streak, glow effect
```

#### Pixel Ball (Epic)
```
Colors: Green (#00ff00), Black (#000000)
Pattern: 8-bit chunky pixels
Animation: Retro frame skip effect
Trail: Pixelated afterimages
```

#### Rainbow Ball (Legendary)
```
Colors: Full spectrum cycling
Pattern: Gradient bands
Animation: Color rotation
Trail: Rainbow streak
```

#### Void Ball (Legendary)
```
Colors: Black (#0a0a0a), Purple (#4a0080), White (#ffffff)
Pattern: Starfield inside
Animation: Swirling void
Trail: Dark matter particles
```

#### Glitch Ball (Legendary)
```
Colors: Cyan (#00ffff), Magenta (#ff00ff), Random
Pattern: Corrupted texture
Animation: Random glitch frames
Trail: Glitch artifacts
```

---

## 🏟️ Court Backgrounds

### Background Layer Structure

Each background has 5 parallax layers:

```
Layer 0 (Far):    Sky/distant elements    - 0.1x scroll speed
Layer 1:          Far buildings/objects   - 0.3x scroll speed
Layer 2:          Mid-ground elements     - 0.5x scroll speed
Layer 3:          Near elements           - 0.8x scroll speed
Layer 4 (Court):  Ground/playing surface  - 1.0x scroll speed
Layer 5 (FG):     Foreground particles    - 1.2x scroll speed
```

### Background Specifications

| Property | Value |
|----------|-------|
| Total Size | 720 × 270 pixels (wider for parallax) |
| Visible Area | 480 × 270 pixels |
| Format | PNG (per layer) or layered file |
| Court Lines | White (#ffffff) with 50% opacity |

---

### 🌃 Background 1: Neon District (Cyberpunk)

```
Theme: Rainy rooftop in cyberpunk city
Time: Night
Weather: Rain
Mood: Moody, atmospheric, neon-lit

Color Palette:
- Sky: #0d0221, #1a0533
- Buildings: #0f084b, #26408b, #1e1e3f
- Neon Signs: #ff006e, #00f5d4, #ffd700, #ff6b35
- Rain: #a6cee3 (40% opacity)
- Wet Ground: #1a1a2e with reflections

Layer 0 - Sky:
- Dark purple gradient sky
- Faint clouds with pink edges
- Distant city glow on horizon

Layer 1 - Far Buildings:
- Silhouette skyscrapers
- Small lit windows (yellow dots)
- Giant holographic ad (Japanese text: バレー "VOLLEY")

Layer 2 - Mid Buildings:
- Neon signs: "SPIKE", "ネオン", restaurant signs
- AC units, water tanks
- Flying car lights (red dots moving)

Layer 3 - Rooftop Elements:
- Metal railings
- Antenna arrays
- Steam vents (animated)
- Puddles with neon reflections

Layer 4 - Court:
- Metal grating floor
- Painted court lines (cyan glow)
- Wet surface reflections
- Net posts with LED strips

Layer 5 - Foreground:
- Rain particles (diagonal streaks)
- Steam particles
- Occasional neon flicker

Animated Elements:
- Rain: Continuous diagonal particles
- Neon signs: 3-frame flicker (random timing)
- Flying cars: Move left to right (10 second cycle)
- Steam: Rising particles from vents
- Reflections: Subtle shimmer
```

---

### 🌃 Background 2: Cyber Arena (Cyberpunk)

```
Theme: Futuristic indoor stadium
Time: N/A (indoor)
Weather: None
Mood: High-tech, competitive, electric

Color Palette:
- Walls: #0a0a0a, #1a1a2e, #16213e
- Accents: #e94560, #00ff9f, #0f3460
- Holographics: #00f5d4, #ff006e (50% opacity)
- Lights: #ffffff, #e94560

Layer 0 - Back Wall:
- Hexagonal panel pattern
- Giant screens showing match stats
- Corporate sponsor logos (made up)

Layer 1 - Crowd:
- Holographic crowd silhouettes
- Waving animations (2 frames)
- Glow sticks (random colored dots)

Layer 2 - Stadium Structure:
- Curved ceiling beams
- Hanging spotlights
- Camera drones (small, floating)

Layer 3 - Arena Edge:
- VIP seating area
- LED barrier strips
- Commentary booth silhouette

Layer 4 - Court:
- Glossy black floor
- Bright white/cyan court lines
- Center logo (SR emblem)
- Reflection of overhead lights

Layer 5 - Foreground:
- Floating AR score display
- Scan line effect (subtle, 10% opacity)
- Lens flare from spotlights

Animated Elements:
- Holographic crowd: Wave animation
- Screens: Cycling stats/replays
- Drones: Slow hovering movement
- Scan lines: Scroll down continuously
- Spotlights: Slow rotation
```

---

### 🌃 Background 3: Night Market (Cyberpunk)

```
Theme: Street court in Asian night market
Time: Night
Weather: Humid/misty
Mood: Vibrant, crowded, street-level

Color Palette:
- Sky: #1a0a0a, #2d132c
- Buildings: #2d132c, #801336
- Neon/Lights: #c72c41, #ee4540, #ffd369, #00ff9f
- Steam: #ffffff (20% opacity)

Layer 0 - Sky:
- Dark reddish sky
- Apartment buildings with lit windows
- Distant neon glow

Layer 1 - Far Stalls:
- Food stall awnings
- Vertical neon signs (Chinese: 拉面, 饺子)
- Hanging lanterns (red, glowing)

Layer 2 - Mid Stalls:
- Detailed food stalls (steam rising)
- Customers silhouettes
- Holographic menus floating
- Cybernetic vendor (robot)

Layer 3 - Street Elements:
- Cables and wires overhead
- Motorcycle parked
- Trash cans, crates
- Cat silhouette on crate

Layer 4 - Court:
- Cracked concrete/asphalt
- Spray-painted court lines
- Puddles with food stall reflections
- Makeshift net (rope + poles)

Layer 5 - Foreground:
- Steam/smoke particles
- Floating food smells (stylized wisps)
- Occasional flyer blowing past

Animated Elements:
- Lanterns: Gentle sway (2 frames)
- Steam: Rising from food stalls
- Neon signs: Occasional flicker
- Holographic menus: Rotation
- NPCs: Subtle idle animation (background)
```

---

### 🏖️ Background 4: Sunset Beach (Classic)

```
Theme: Beach volleyball at golden hour
Time: Sunset
Weather: Clear
Mood: Relaxed, warm, classic

Color Palette:
- Sky: #ff7e5f, #feb47b, #ffcb77, #ffe5b4
- Ocean: #457b9d, #1d3557, #a8dadc
- Sand: #f4e4ba, #e8d5a3, #d4c089

Layer 0 - Sky:
- Gradient sunset (orange to yellow)
- Wispy clouds (pink/orange)
- Sun (half visible on horizon)

Layer 1 - Ocean/Horizon:
- Calm ocean
- Distant sailboat silhouette
- Sun reflection on water (sparkles)

Layer 2 - Beach Elements:
- Palm trees (2-3)
- Beach umbrellas
- Lifeguard tower

Layer 3 - Near Beach:
- Beach chairs
- Cooler
- Surfboard stuck in sand
- Seagull

Layer 4 - Court:
- Sand texture
- White court boundary lines
- Professional net with proper poles
- Footprint details

Layer 5 - Foreground:
- Occasional wave foam at edges
- Sand particles when players move
- Seagull flying across

Animated Elements:
- Palm trees: Gentle sway
- Ocean: Wave animation (3 frames)
- Sun sparkles: Twinkle effect
- Seagulls: Fly across occasionally
```

---

### 🕹️ Background 5: Retro Arcade (Nostalgic)

```
Theme: Inside an 80s arcade
Time: Night (indoor)
Weather: None
Mood: Nostalgic, fun, retro

Color Palette:
- Floor: #1a1a2e, #2d2d44
- Machines: #333333, #ff006e, #00f5d4
- Neon: #ff006e, #00f5d4, #ffd700
- CRT Glow: #00ff00, #0066ff

Layer 0 - Back Wall:
- Arcade cabinets row
- Neon signs: "HIGH SCORE", "INSERT COIN"
- Posters (retro game art)

Layer 1 - Mid Arcade:
- More cabinet silhouettes
- Prize counter
- Kids playing (silhouettes)

Layer 2 - Near Machines:
- Detailed arcade cabinet (screen glowing)
- Pinball machine
- Claw machine

Layer 3 - Play Area Edge:
- Rope barrier
- Arcade carpet pattern
- Trash can with soda cups

Layer 4 - Court:
- Arcade carpet (geometric pattern)
- Taped court lines
- Portable net

Layer 5 - Foreground:
- CRT scan line overlay (subtle)
- Occasional pixel particle
- "INSERT COIN" floating text

Animated Elements:
- Arcade screens: Game animations
- Neon signs: Flicker
- Pinball: Lights cycling
- CRT effect: Scan lines scrolling
```

---

### 🚀 Background 6: Space Station (Sci-Fi)

```
Theme: Zero-gravity court in space
Time: N/A (space)
Weather: None
Mood: Futuristic, serene, vast

Color Palette:
- Space: #000000, #0a0a1a
- Stars: #ffffff, #a8dadc
- Earth: #1d3557, #457b9d, #2ecc71
- Station: #333333, #666666, #00f5d4

Layer 0 - Space:
- Black void
- Star field (various sizes)
- Distant nebula (purple/pink glow)

Layer 1 - Earth:
- Large Earth visible
- Cloud patterns
- Atmosphere glow

Layer 2 - Station Exterior:
- Window frame (hexagonal)
- Other station modules
- Solar panels

Layer 3 - Station Interior:
- Control panels
- Floating objects (pen, paper)
- Astronaut in background

Layer 4 - Court:
- Metal grid floor
- Magnetic court lines (blue glow)
- Energy net (holographic)
- Zero-G indicators

Layer 5 - Foreground:
- Floating particles (dust)
- HUD overlay elements
- Occasional satellite passing

Animated Elements:
- Stars: Subtle twinkle
- Earth: Slow rotation
- Floating objects: Gentle drift
- Energy net: Pulse effect
```

---

### 🏛️ Background 7: Ancient Temple (Fantasy)

```
Theme: Mystical ruins with magic
Time: Dusk
Weather: Magical particles
Mood: Mysterious, ancient, magical

Color Palette:
- Sky: #2c3e50, #8e44ad, #9b59b6
- Stone: #7f8c8d, #95a5a6, #bdc3c7
- Magic: #00ff9f, #f39c12, #9b59b6
- Vines: #27ae60, #2ecc71

Layer 0 - Sky:
- Twilight gradient
- Two moons visible
- Aurora-like magical streams

Layer 1 - Far Ruins:
- Crumbling towers
- Overgrown with vines
- Mysterious glowing glyphs

Layer 2 - Temple Structure:
- Stone columns
- Carved faces
- Floating stones (magic)

Layer 3 - Courtyard Edge:
- Broken statues
- Torch holders (magical fire)
- Ancient scoreboard stones

Layer 4 - Court:
- Stone tile floor
- Glowing magical lines (court)
- Net made of energy
- Moss in cracks

Layer 5 - Foreground:
- Magical particles (floating up)
- Fireflies
- Leaves falling

Animated Elements:
- Floating stones: Gentle bob
- Magical fire: Flicker
- Glyphs: Pulse glow
- Particles: Float upward
- Aurora: Slow wave
```

---

### 🌃 Background 8: Urban Rooftop (Modern)

```
Theme: City rooftop at night
Time: Night
Weather: Clear
Mood: Urban, cool, underground

Color Palette:
- Sky: #1a1a2e, #16213e
- Buildings: #0f3460, #1a1a2e
- Lights: #ffd700, #ff6b35, #e94560
- Graffiti: Various bright colors

Layer 0 - Sky:
- Night sky gradient
- City light pollution glow
- Stars barely visible

Layer 1 - Skyline:
- Skyscraper silhouettes
- Lit office windows
- Billboard/screen (ads)

Layer 2 - Adjacent Building:
- Water tower
- Rooftop garden
- Person watching (silhouette)

Layer 3 - Rooftop Elements:
- Graffiti art on wall
- Old couch
- Boombox
- String lights

Layer 4 - Court:
- Concrete floor
- Spray-painted lines
- Chain-link net
- Cracks and patches

Layer 5 - Foreground:
- Smoke/steam wisps
- Fireflies/city lights
- Occasional bird

Animated Elements:
- String lights: Gentle sway
- Billboard: Image changes
- Smoke: Rising
- City lights: Twinkle
```

---

## 🎯 UI Elements

### Button Specifications

```
Standard Button:
- Size: 80 × 28 pixels
- States: Normal, Hover, Pressed, Disabled
- Corner radius: 2px (pixel art)
- Border: 2px

Colors:
- Normal: #e94560 fill, #c73e54 border
- Hover: #ff5a75 fill, #e94560 border
- Pressed: #c73e54 fill, #a3354a border
- Disabled: #666666 fill, #444444 border
- Text: #ffffff
```

### Panel/Window

```
9-Slice Panel:
- Corner size: 8 × 8 pixels
- Minimum size: 48 × 48 pixels

Colors:
- Background: #1a1a2e
- Border: #0f3460
- Header: #16213e
- Accent: #e94560
```

### Icons (16 × 16 pixels each)

```
Required Icons:
□ Coin (currency)
□ Gem (premium currency)
□ XP star
□ Settings gear
□ Sound on/off
□ Music on/off
□ Play button
□ Pause button
□ Restart arrow
□ Home
□ Back arrow
□ Trophy
□ Lock (locked item)
□ Checkmark
□ X (close)
□ Plus (add)
□ Minus (remove)

Attribute Icons:
□ Speed (lightning bolt)
□ Jump (arrow up)
□ Power (fist)
□ Control (target)

Rank Icons (24 × 24):
□ Rookie (sprout)
□ Bronze (bronze medal)
□ Silver (silver medal)
□ Gold (gold medal)
□ Platinum (diamond outline)
□ Diamond (diamond)
□ Champion (crown)
```

### Fonts

```
Primary Font: "Press Start 2P" (Google Fonts)
Secondary Font: "Pixelify Sans" (Google Fonts)

Sizes:
- Title: 24px
- Header: 16px
- Body: 8px
- Small: 6px

Colors:
- Primary text: #ffffff
- Secondary text: #a6cee3
- Highlight: #ffd700
- Error: #e94560
- Success: #00ff9f
```

---

## ✨ Effects & Particles

### Hit Effect
```
Size: 32 × 32 pixels
Frames: 5
Duration: 200ms
Colors: White (#ffffff), Yellow (#ffd700)
Pattern: Starburst expanding
```

### Dust Cloud
```
Size: 24 × 16 pixels
Frames: 4
Duration: 300ms
Colors: Based on court (sand, concrete, etc.)
Pattern: Puff expanding and fading
```

### Score Effect
```
Size: 48 × 48 pixels
Frames: 6
Duration: 400ms
Colors: Gold (#ffd700), White (#ffffff)
Pattern: Number flying up with sparkles
```

### Trail Particles
```
Size: 4 × 4 pixels (single particle)
Count: 5-8 particles
Duration: 150ms fade out
Colors: Based on ball type
Pattern: Follow ball path, shrinking
```

---

## 🎵 Audio Assets List

### Sound Effects

```
Gameplay:
□ ball_hit_soft.wav (receive/bump)
□ ball_hit_hard.wav (spike)
□ ball_bounce.wav (off ground/wall)
□ player_jump.wav
□ player_land.wav
□ net_touch.wav
□ score_point.wav
□ score_against.wav
□ match_start.wav (whistle)
□ match_end.wav
□ victory_fanfare.wav
□ defeat_sound.wav

UI:
□ button_hover.wav
□ button_click.wav
□ menu_open.wav
□ menu_close.wav
□ purchase_success.wav
□ error.wav
□ unlock_item.wav
□ level_up.wav
□ coin_collect.wav

Ambience (per court):
□ neon_district_amb.wav (rain, traffic)
□ cyber_arena_amb.wav (crowd)
□ night_market_amb.wav (chatter, sizzle)
□ beach_amb.wav (waves, birds)
□ arcade_amb.wav (game sounds)
□ space_amb.wav (hum)
□ temple_amb.wav (wind, magic)
□ rooftop_amb.wav (city)
```

### Music

```
□ menu_theme.ogg (looping, upbeat chiptune)
□ gameplay_track_1.ogg (energetic)
□ gameplay_track_2.ogg (intense)
□ victory_theme.ogg (triumphant)
□ shop_theme.ogg (chill)
□ ranking_theme.ogg (competitive)
```

---

## 📁 Asset File Structure

```
assets/
├── sprites/
│   ├── characters/
│   │   ├── blitz.png
│   │   ├── blitz.json (animation data)
│   │   ├── crusher.png
│   │   └── ...
│   ├── balls/
│   │   ├── default.png
│   │   ├── fire.png
│   │   └── ...
│   └── effects/
│       ├── hit_effect.png
│       ├── dust.png
│       └── ...
│
├── backgrounds/
│   ├── neon_district/
│   │   ├── layer_0_sky.png
│   │   ├── layer_1_buildings.png
│   │   ├── layer_2_mid.png
│   │   ├── layer_3_near.png
│   │   ├── layer_4_court.png
│   │   └── layer_5_foreground.png
│   └── ...
│
├── ui/
│   ├── buttons.png
│   ├── panels.png
│   ├── icons.png
│   └── fonts/
│
└── audio/
    ├── sfx/
    ├── music/
    └── ambience/
```

---

## 🤖 AI Image Generation Prompts

Use these with Midjourney, DALL-E, or Stable Diffusion:

### Characters

```
Blitz:
"pixel art video game character sprite, 32-bit style, athletic male runner with spiky electric blue hair, white and blue sports jersey, determined expression, side view, transparent background, clean pixel art, no antialiasing, 8 colors max"

Crusher:
"pixel art video game character sprite, 32-bit style, muscular male athlete with buzzcut brown hair, red and black jersey, powerful pose, side view, transparent background, clean pixel art, no antialiasing"
```

### Backgrounds

```
Neon District:
"pixel art cyberpunk rooftop scene, rainy night, neon signs in Japanese, purple and cyan color scheme, flying cars in distance, volleyball court, 16-bit video game background style, wide shot, detailed pixel art"

Cyber Arena:
"pixel art futuristic esports stadium interior, holographic crowd, hexagonal architecture, RGB LED lighting, volleyball court center, 32-bit video game style, cyberpunk aesthetic"

Night Market:
"pixel art asian night market street scene, red lanterns, neon food signs, steam rising, cyberpunk atmosphere, narrow alley with puddles, 16-bit game background"
```

### Post-Processing Steps

1. Generate at higher resolution (1024×1024)
2. Resize to target size (480×270 or appropriate)
3. Reduce color palette (indexed color)
4. Clean up antialiased edges manually
5. Add/adjust pixel-perfect outlines
6. Separate into layers if needed

---

## ✅ Asset Checklist

### Characters
- [ ] Blitz (sprite sheet + animations)
- [ ] Crusher (sprite sheet + animations)
- [ ] Sky (sprite sheet + animations)
- [ ] Zen (sprite sheet + animations)
- [ ] Tank (sprite sheet + animations)
- [ ] Flash (sprite sheet + animations)
- [ ] Nova (sprite sheet + animations)
- [ ] Ghost (sprite sheet + animations)

### Balls
- [ ] Default
- [ ] Fire (Rare)
- [ ] Ice (Rare)
- [ ] Neon (Epic)
- [ ] Pixel (Epic)
- [ ] Rainbow (Legendary)
- [ ] Void (Legendary)
- [ ] Glitch (Legendary)

### Backgrounds
- [ ] Neon District (all layers + animations)
- [ ] Cyber Arena (all layers + animations)
- [ ] Night Market (all layers + animations)
- [ ] Sunset Beach (all layers + animations)
- [ ] Retro Arcade (all layers + animations)
- [ ] Space Station (all layers + animations)
- [ ] Ancient Temple (all layers + animations)
- [ ] Urban Rooftop (all layers + animations)

### UI
- [ ] Buttons (all states)
- [ ] Panels
- [ ] Icons (all)
- [ ] Rank badges
- [ ] Fonts integrated

### Effects
- [ ] Hit effects
- [ ] Dust clouds
- [ ] Score effects
- [ ] Trail particles

### Audio
- [ ] All SFX
- [ ] All music tracks
- [ ] All ambience

---

## 📚 Resources & References

### Pixel Art Tools
- **Aseprite** ($20) - Best for animation
- **Piskel** (Free) - Browser-based
- **GraphicsGale** (Free) - Windows
- **Pyxel Edit** ($9) - Tileset friendly

### Color Palette Tools
- **Lospec** - Free palettes
- **Coolors** - Palette generator
- **Adobe Color** - Color wheel

### References
- Arcade Volleyball (1987) - Original inspiration
- Windjammers - Character designs
- Lethal League - Impact effects
- VA-11 Hall-A - Cyberpunk pixel art style

### Asset Marketplaces
- **itch.io** - Pixel art packs
- **OpenGameArt** - Free assets
- **Kenney.nl** - High quality free
