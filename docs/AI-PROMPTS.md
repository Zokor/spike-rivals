# AI Image Generation Prompts for Spike Rivals

Use these prompts with AI image generators (Midjourney, DALL-E, Stable Diffusion) then downscale and clean up for pixel art consistency.

## File Storage Structure

All assets go in `client/public/assets/sprites/` (Vite serves files from `public/` as static assets):

```
client/public/assets/sprites/
├── characters/          # Character spritesheets (240×128 px)
│   ├── blitz.png
│   ├── crusher.png
│   ├── sky.png
│   ├── zen.png
│   ├── tank.png
│   ├── flash.png
│   ├── nova.png
│   └── ghost.png
├── portraits/           # Character portraits (80×80 px)
│   ├── blitz.png
│   ├── crusher.png
│   ├── sky.png
│   ├── zen.png
│   ├── tank.png
│   ├── flash.png
│   ├── nova.png
│   └── ghost.png
├── balls/               # Ball variants (96×12 px spritesheets)
│   ├── default.png
│   ├── fire.png
│   ├── ice.png
│   ├── rainbow.png
│   ├── pixel.png
│   ├── neon.png
│   ├── golden.png
│   └── void.png
├── backgrounds/         # Background layers (480×270 px each)
│   ├── neon-district/
│   │   ├── sky.png
│   │   ├── buildings-far.png
│   │   ├── buildings-mid.png
│   │   ├── rooftop.png
│   │   └── ground.png
│   ├── cyber-arena/
│   │   ├── back.png
│   │   ├── crowd.png
│   │   ├── structure.png
│   │   └── ground.png
│   ├── night-market/
│   │   ├── sky.png
│   │   ├── buildings.png
│   │   ├── stalls.png
│   │   └── ground.png
│   ├── sunset-beach/
│   │   ├── sky.png
│   │   ├── ocean.png
│   │   ├── palms.png
│   │   └── sand.png
│   ├── retro-arcade/
│   │   ├── back.png
│   │   ├── cabinets.png
│   │   ├── near.png
│   │   └── ground.png
│   ├── space-station/
│   │   ├── stars.png
│   │   ├── earth.png
│   │   ├── station.png
│   │   └── ground.png
│   ├── ancient-temple/
│   │   ├── sky.png
│   │   ├── ruins.png
│   │   ├── columns.png
│   │   └── ground.png
│   └── urban-rooftop/
│       ├── sky.png
│       ├── skyline.png
│       ├── rooftop.png
│       └── ground.png
├── effects/             # Effect animations
│   ├── hit.png          # 120×24 px (5 frames)
│   ├── hit-power.png    # 120×24 px (5 frames)
│   ├── hit-perfect.png  # 120×24 px (5 frames)
│   ├── score.png        # 384×48 px (8 frames)
│   ├── dust-sand.png    # 64×8 px (4 frames)
│   ├── dust-concrete.png
│   ├── dust-metal.png
│   ├── jump.png         # 60×12 px (3 frames)
│   └── spark.png        # 24×8 px (3 frames)
├── icons/               # UI icons (16×16 px unless noted)
│   ├── coin.png
│   ├── gem.png
│   ├── xp.png
│   ├── settings.png
│   ├── sound-on.png
│   ├── sound-off.png
│   ├── music-on.png
│   ├── music-off.png
│   ├── fullscreen.png
│   ├── exit.png
│   ├── play.png
│   ├── pause.png
│   ├── restart.png
│   ├── home.png
│   ├── versus.png
│   ├── speed.png
│   ├── jump.png
│   ├── power.png
│   ├── control.png
│   ├── rank-rookie.png     # 24×24 px
│   ├── rank-bronze.png     # 24×24 px
│   ├── rank-silver.png     # 24×24 px
│   ├── rank-gold.png       # 24×24 px
│   ├── rank-platinum.png   # 24×24 px
│   ├── rank-diamond.png    # 24×24 px
│   ├── rank-champion.png   # 24×24 px
│   ├── cart.png
│   ├── owned.png
│   ├── locked.png
│   ├── new.png
│   └── sale.png
├── ui/                  # UI elements
│   ├── logo.png             # 240×48 px (main game logo)
│   ├── logo-small.png       # 32×32 px (HUD/corner badge)
│   ├── title-screen.png     # 480×270 px (title background)
│   ├── press-start.png      # 96×32 px (2 frames for blink)
│   ├── button-primary.png   # 64×72 px (3 states)
│   ├── button-secondary.png # 48×60 px (3 states)
│   ├── button-icon.png      # 24×72 px (3 states)
│   ├── panel-default.png    # 48×48 px (9-slice)
│   ├── panel-modal.png
│   ├── panel-tooltip.png
│   └── panel-notification.png
├── nets/                # Net variants (12×80 px)
│   ├── professional.png
│   ├── holographic.png
│   ├── energy.png
│   ├── rope.png
│   ├── plastic.png
│   ├── magical.png
│   └── chain-link.png
├── grounds/             # Ground textures (32×32 px, tileable)
│   ├── sand.png
│   ├── wet-metal.png
│   ├── glossy-black.png
│   ├── cracked-concrete.png
│   ├── carpet-geometric.png
│   ├── metal-grid.png
│   └── stone-tiles.png
└── misc/
    └── loading-spinner.png  # 256×32 px (8 frames)
```

---

## Post-Processing Workflow

1. Generate at higher resolution (512x512 or 1024x1024)
2. Resize to target pixel art resolution
3. Reduce colors to match palette (8-16 colors)
4. Clean up anti-aliased edges manually
5. Add/adjust 1px outlines
6. Export as PNG with transparency

---

## Asset Size Reference

| Asset Type | Final Pixel Size | Sprite Sheet Size | Notes |
|------------|------------------|-------------------|-------|
| **Game Logo** | 240×48 px | — | Main title logo |
| **Logo Small** | 32×32 px | — | HUD/corner badge |
| **Title Screen** | 480×270 px | — | Boot/menu background |
| **Press Start** | 96×16 px | 96×32 px | 2 frames (blink animation) |
| **Characters** | 24×32 px | 240×128 px | 10 columns × 4 rows |
| **Backgrounds** | 480×270 px | — | Single image per layer (5 layers each) |
| **Backgrounds (2x)** | 960×540 px | — | High-DPI version |
| **Ball** | 12×12 px | 96×12 px | 8 rotation frames |
| **Ball Variants** | 12×12 px | 96×12 px | 8 rotation frames each |
| **Hit Effect** | 24×24 px | 120×24 px | 5 frames |
| **Score Effect** | 48×48 px | 384×48 px | 8 frames |
| **Dust Cloud** | 16×8 px | 64×8 px | 4 frames |
| **Jump Effect** | 20×12 px | 60×12 px | 3 frames |
| **Icons (small)** | 16×16 px | — | Currency, attributes, system |
| **Icons (rank)** | 24×24 px | — | 7 rank tiers |
| **Buttons (primary)** | 64×24 px | 64×72 px | 3 states (normal, hover, pressed) |
| **Buttons (secondary)** | 48×20 px | 48×60 px | 3 states |
| **Buttons (icon)** | 24×24 px | 24×72 px | 3 states |
| **Panel 9-slice** | 48×48 px | — | 16px corners |
| **Net** | 6×80 px | 12×80 px | 2 frames (sway) |
| **Ground Tiles** | 32×32 px | — | Tileable texture |

### Visual vs. Collision Alignment

The art dimensions differ slightly from physics collision bodies (common game dev practice):

| Asset | Visual Size | Collision Size | Notes |
|-------|-------------|----------------|-------|
| **Ball** | 12×12 px (radius 6) | radius 8 | Larger hitbox feels fairer for players |
| **Net** | 6 px wide | 8 px wide | Thin visual, slightly wider collision |
| **Player** | 24×32 px | 24×32 px | 1:1 match |

**Why the difference?**
- Ball: A slightly larger collision radius makes hits feel more responsive and forgiving
- Net: Thin net looks better visually, but wider collision prevents "unfair" passes

**For artists:** Create assets at the **visual size**. The game code handles collision separately.

### AI Generation Sizes

When generating with AI, use these **input sizes** then downscale:

| Asset Type | Generate At | Downscale To | Scale Factor |
|------------|-------------|--------------|--------------|
| Game Logo | 960×192 px | 240×48 px | 4× |
| Title Screen | 1920×1080 px | 480×270 px | 4× |
| Characters | 384×512 px | 24×32 px | 16× |
| Backgrounds | 1920×1080 px | 480×270 px | 4× |
| Balls | 192×192 px | 12×12 px | 16× |
| Icons | 256×256 px | 16×16 px | 16× |
| Effects | 384×384 px | 24×24 px | 16× |

---

## Game Logo / Title

Assets for the boot screen and title/menu screens.

### Main Logo
```
pixel art game logo, "SPIKE RIVALS" text, bold athletic blocky lettering, electric blue and white colors with cyan highlights, volleyball integrated into letter design, neon glow outline effect, retro arcade game title style, 32-bit aesthetic, dynamic angle, transparent background, no antialiasing, limited color palette
```
**Save as:** `sprites/ui/logo.png` (240×48 px)

### Main Logo (Alternate - Horizontal Banner)
```
pixel art game logo banner, "SPIKE RIVALS" horizontal text, chunky pixel font, electric blue gradient to cyan, volleyball replacing the "O" in RIVALS, subtle scanline effect, arcade marquee style, 32-bit aesthetic, transparent background, no antialiasing, limited 16 color palette
```
**Save as:** `sprites/ui/logo-banner.png` (200×32 px)

### Logo Small (for HUD/corners)
```
pixel art game logo small, "SR" monogram, spike rivals initials, electric blue and white, volleyball icon integrated, compact badge design, 32-bit style, transparent background, no antialiasing
```
**Save as:** `sprites/ui/logo-small.png` (32×32 px)

### Title Screen Background
```
pixel art title screen, volleyball arena at night, dramatic neon lighting from above, silhouette of player mid-spike jump, volleyball with motion trail, cyberpunk city skyline backdrop, purple and cyan color scheme, empty space at top for logo, 480×270 pixels, retro game aesthetic, 16-bit style
```
**Save as:** `sprites/ui/title-screen.png` (480×270 px)

### "Press Start" Text
```
pixel art game text, "PRESS START" blinking text effect, white with cyan glow, arcade game style, 2 frame animation for blink, retro 8-bit font style, transparent background, no antialiasing
```
**Save as:** `sprites/ui/press-start.png` (96×16 px - 2 frames for blink: 96×32 total)

---

## Character Prompts

### Blitz (Speedster)
```
pixel art sprite, 32-bit style video game character, athletic runner pose, blue and white sports outfit, spiky electric blue hair, determined expression, lightning bolt motif, side view, transparent background, no antialiasing, limited color palette, retro game style
```
**Save as:** `sprites/characters/blitz.png` (240×128 px spritesheet)

### Crusher (Power Hitter)
```
pixel art sprite, 32-bit video game character, muscular powerful build, red and black sports outfit, short dark hair, intimidating stance, fist power motif, boxing gloves aesthetic, transparent background, no antialiasing, limited 16 color palette
```
**Save as:** `sprites/characters/crusher.png` (240×128 px spritesheet)

### Sky (High Flyer)
```
pixel art sprite, 32-bit video game character, tall slender athletic build, purple and cyan sports outfit, flowing white ethereal hair, graceful jumping pose, wing and cloud motifs, transparent background, no antialiasing, limited color palette
```
**Save as:** `sprites/characters/sky.png` (240×128 px spritesheet)

### Zen (Precision)
```
pixel art sprite, 32-bit video game character, calm focused expression, green and white minimalist outfit, neat black hair, balanced stance, zen circle and target motifs, meditation pose influence, transparent background, no antialiasing
```
**Save as:** `sprites/characters/zen.png` (240×128 px spritesheet)

### Tank (Defensive)
```
pixel art sprite, 32-bit video game character, stocky defensive build, gray and orange outfit, protective stance, shield motif, goalie aesthetic, sturdy pose, transparent background, no antialiasing, limited color palette
```
**Save as:** `sprites/characters/tank.png` (240×128 px spritesheet)

### Flash (Ultra Speed)
```
pixel art sprite, 32-bit video game character, lean athletic runner, yellow and orange outfit, flame-like spiky orange hair, speed lines effect, motion blur aesthetic, dynamic running pose, transparent background, no antialiasing
```
**Save as:** `sprites/characters/flash.png` (240×128 px spritesheet)

### Nova (Balanced)
```
pixel art sprite, 32-bit video game character, medium athletic build, pink and gold outfit, confident pose, star burst motif, balanced stance, leader aesthetic, transparent background, no antialiasing, limited color palette
```
**Save as:** `sprites/characters/nova.png` (240×128 px spritesheet)

### Ghost (Tricky)
```
pixel art sprite, 32-bit video game character, mysterious aura, teal and purple outfit, flowing gray hair, semi-transparent wispy effects, smoke and mist motifs, unpredictable stance, transparent background, no antialiasing
```
**Save as:** `sprites/characters/ghost.png` (240×128 px spritesheet)

---

## Character Animation Poses

Since AI generators can't create proper sprite sheets in one pass, generate each animation pose separately, then assemble them in Aseprite or similar tools.

### Sprite Sheet Layout (240×128 px = 10 cols × 4 rows)
```
Row 0 (frames 0-9):   Idle (4) + Run start (6)
Row 1 (frames 10-19): Jump (3) + Fall (2) + Hit (4) + empty
Row 2 (frames 20-29): Spike (4) + Dive (3) + empty
Row 3 (frames 30-39): Victory (4) + Defeat (2) + Serve (4)
```

### Workflow
1. Generate each pose at 384×512 px (high res)
2. Downscale to 24×32 px per frame
3. Arrange frames in sprite sheet using Aseprite/Piskel
4. Apply consistent color palette across all frames
5. Clean up and add 1px outlines

---

### Animation Pose Prompts

Use these base prompts, replacing `{CHARACTER}` with specific character traits.

#### Idle Pose (4 frames: standing, breathe in, standing, breathe out)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, standing idle pose, relaxed athletic stance, arms at sides, slight weight shift, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

#### Run Cycle (6 frames: contact, down, passing, contact, down, passing)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, running pose frame {1-6}, dynamic sprint cycle, arms pumping, legs in motion, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

**Run frame variations:**
- Frame 1: Right foot contact, left arm forward
- Frame 2: Right foot push-off, body low
- Frame 3: Right leg passing, mid-stride
- Frame 4: Left foot contact, right arm forward
- Frame 5: Left foot push-off, body low
- Frame 6: Left leg passing, mid-stride

#### Jump (3 frames: crouch, rise, peak)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, jumping pose {crouch/rising/peak}, athletic vertical jump, arms raised for momentum, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

**Jump frame variations:**
- Frame 1 (Crouch): Knees bent, arms back, preparing to jump
- Frame 2 (Rising): Legs extending, arms swinging up, leaving ground
- Frame 3 (Peak): Fully extended, arms up, at maximum height

#### Fall (2 frames: descending, landing)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, falling pose {descending/landing}, coming down from jump, arms adjusting for balance, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

**Fall frame variations:**
- Frame 1 (Descending): Legs tucking slightly, arms out for balance
- Frame 2 (Landing): Knees bending to absorb impact, arms forward

#### Hit/Bump (4 frames: ready, windup, contact, follow-through)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, volleyball bump pose {ready/windup/contact/follow}, underhand hit technique, arms together, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

**Hit frame variations:**
- Frame 1 (Ready): Stance ready, arms preparing
- Frame 2 (Windup): Arms pulling back/down
- Frame 3 (Contact): Arms making contact with ball, platform formed
- Frame 4 (Follow-through): Arms following ball trajectory upward

#### Spike (4 frames: approach, jump, arm back, smash)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, volleyball spike pose {approach/jump/arm-back/smash}, powerful overhead attack, athletic form, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

**Spike frame variations:**
- Frame 1 (Approach): Running approach, arms swinging back
- Frame 2 (Jump): Leaving ground, arms raised
- Frame 3 (Arm back): In air, hitting arm cocked back
- Frame 4 (Smash): Arm swinging down, powerful contact

#### Dive (3 frames: lunge, extend, slide)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, volleyball dive pose {lunge/extend/slide}, desperate save attempt, horizontal body, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

**Dive frame variations:**
- Frame 1 (Lunge): Pushing off, body tilting forward
- Frame 2 (Extend): Fully horizontal, arms outstretched
- Frame 3 (Slide): On ground, recovering

#### Victory (4 frames: celebration loop)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, victory celebration pose {1-4}, happy triumphant expression, fist pump or jump for joy, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

#### Defeat (2 frames: disappointed, slump)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, defeat pose {disappointed/slump}, sad expression, shoulders dropped, looking down, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

#### Serve (4 frames: toss, reach, contact, follow)
```
pixel art sprite, 32-bit video game character, {CHARACTER}, volleyball serve pose {toss/reach/contact/follow}, overhand serve technique, side view facing right, transparent background, no antialiasing, limited 16 color palette
```

**Serve frame variations:**
- Frame 1 (Toss): Ball toss, non-hitting hand releasing ball
- Frame 2 (Reach): Arm reaching up toward ball
- Frame 3 (Contact): Hand striking ball at peak
- Frame 4 (Follow): Arm following through after hit

---

### Character-Specific Traits for {CHARACTER}

Replace `{CHARACTER}` in the prompts above with these traits:

| Character | {CHARACTER} Replacement |
|-----------|------------------------|
| **Blitz** | athletic build, spiky electric blue hair, blue and white sports outfit, determined expression, lightning bolt motif |
| **Crusher** | muscular powerful build, short dark hair, red and black sports outfit, intimidating expression, fist motif |
| **Sky** | tall slender build, flowing white ethereal hair, purple and cyan sports outfit, graceful serene expression, wing motifs |
| **Zen** | medium balanced build, neat black hair, green and white minimalist outfit, calm focused expression, zen circle motif |
| **Tank** | stocky defensive build, short hair, gray and orange sports outfit, determined protective expression, shield motif |
| **Flash** | lean athletic build, flame-like spiky orange hair, yellow and orange sports outfit, energetic excited expression, speed lines |
| **Nova** | medium athletic build, styled hair, pink and gold sports outfit, confident smile, star burst motif |
| **Ghost** | slim mysterious build, flowing gray hair, teal and purple sports outfit, enigmatic expression, wispy aura effects |

---

## Character Portraits

Bust shot portraits showing head and shoulders. Generate at 512×512 px, then downscale to 80×80 px.

### Blitz - Portrait
```
pixel art character portrait, bust shot, athletic young man, spiky electric blue hair, determined confident expression, blue and white sports outfit visible at shoulders, lightning bolt motif on collar, game avatar style, square composition, transparent background, no antialiasing, limited color palette, 32-bit retro style
```
**Save as:** `sprites/portraits/blitz.png` (80×80 px)

### Crusher - Portrait
```
pixel art character portrait, bust shot, muscular intimidating man, short dark hair, fierce determined expression, red and black sports outfit visible at shoulders, powerful build, game avatar style, square composition, transparent background, no antialiasing, limited color palette, 32-bit retro style
```
**Save as:** `sprites/portraits/crusher.png` (80×80 px)

### Sky - Portrait
```
pixel art character portrait, bust shot, tall graceful woman, flowing white ethereal hair, serene elegant expression, purple and cyan sports outfit visible at shoulders, wing motif details, game avatar style, square composition, transparent background, no antialiasing, limited color palette, 32-bit retro style
```
**Save as:** `sprites/portraits/sky.png` (80×80 px)

### Zen - Portrait
```
pixel art character portrait, bust shot, calm focused man, neat black hair, peaceful concentrated expression, green and white minimalist outfit visible at shoulders, zen circle motif, game avatar style, square composition, transparent background, no antialiasing, limited color palette, 32-bit retro style
```
**Save as:** `sprites/portraits/zen.png` (80×80 px)

### Tank - Portrait
```
pixel art character portrait, bust shot, stocky defensive man, short hair, determined protective expression, gray and orange sports outfit visible at broad shoulders, shield motif details, game avatar style, square composition, transparent background, no antialiasing, limited color palette, 32-bit retro style
```
**Save as:** `sprites/portraits/tank.png` (80×80 px)

### Flash - Portrait
```
pixel art character portrait, bust shot, lean athletic man, flame-like spiky orange hair, excited energetic expression, yellow and orange sports outfit visible at shoulders, speed aesthetic, game avatar style, square composition, transparent background, no antialiasing, limited color palette, 32-bit retro style
```
**Save as:** `sprites/portraits/flash.png` (80×80 px)

### Nova - Portrait
```
pixel art character portrait, bust shot, confident athletic woman, stylish hair, self-assured smile, pink and gold sports outfit visible at shoulders, star burst motif details, game avatar style, square composition, transparent background, no antialiasing, limited color palette, 32-bit retro style
```
**Save as:** `sprites/portraits/nova.png` (80×80 px)

### Ghost - Portrait
```
pixel art character portrait, bust shot, mysterious figure, flowing gray hair, enigmatic subtle expression, teal and purple outfit visible at shoulders, semi-transparent wispy aura effects, game avatar style, square composition, transparent background, no antialiasing, limited color palette, 32-bit retro style
```
**Save as:** `sprites/portraits/ghost.png` (80×80 px)

---

## Background Prompts

Each background needs 4-5 separate layers for parallax scrolling. Generate each layer separately.

### Neon District (Cyberpunk Rooftop)
```
pixel art game background, cyberpunk rooftop at night, volleyball court on building roof, massive neon signs in Japanese and Chinese, holographic advertisements, flying cars with red taillights in distance, rain falling, purple and cyan color scheme, wet reflective metal floor, steam vents, 16-bit retro style, wide shot, dark atmosphere
```
**Save layers as:** (480×270 px each)
- `sprites/backgrounds/neon-district/sky.png` - Night sky with distant city glow
- `sprites/backgrounds/neon-district/buildings-far.png` - Far skyscrapers with neon signs
- `sprites/backgrounds/neon-district/buildings-mid.png` - Mid-distance buildings, flying cars
- `sprites/backgrounds/neon-district/rooftop.png` - Rooftop elements (vents, pipes, railings)
- `sprites/backgrounds/neon-district/ground.png` - Wet metal floor texture

### Cyber Arena (Futuristic Stadium)
```
pixel art game background, futuristic indoor esports stadium, hexagonal architecture, holographic crowd silhouettes waving, giant digital screens showing stats, RGB LED strips on walls, floating camera drones, glossy black floor with cyan court lines, volleyball net made of energy, 32-bit video game style, sci-fi atmosphere
```
**Save layers as:** (480×270 px each)
- `sprites/backgrounds/cyber-arena/back.png` - Back wall with screens and architecture
- `sprites/backgrounds/cyber-arena/crowd.png` - Holographic crowd silhouettes
- `sprites/backgrounds/cyber-arena/structure.png` - LED strips, drones, arena structure
- `sprites/backgrounds/cyber-arena/ground.png` - Glossy black floor with court lines

### Night Market (Asian Street)
```
pixel art game background, asian night market street scene, narrow alley with food stalls both sides, hanging red paper lanterns glowing, neon signs for ramen and dumplings, steam rising from vendors, puddles reflecting neon lights, cyberpunk atmosphere, makeshift volleyball court in center, cables and wires overhead, 16-bit retro style
```
**Save layers as:** (480×270 px each)
- `sprites/backgrounds/night-market/sky.png` - Night sky with cables/wires
- `sprites/backgrounds/night-market/buildings.png` - Buildings with neon signs
- `sprites/backgrounds/night-market/stalls.png` - Food stalls, lanterns, steam
- `sprites/backgrounds/night-market/ground.png` - Concrete with puddles

### Sunset Beach (Classic)
```
pixel art game background, beach volleyball at golden hour, beautiful sunset gradient sky orange to pink, calm ocean with gentle waves, palm trees swaying on sides, distant sailboat silhouette, lifeguard tower, sand texture court, white boundary lines, professional volleyball net, seagulls flying, 16-bit retro style, peaceful atmosphere
```
**Save layers as:** (480×270 px each)
- `sprites/backgrounds/sunset-beach/sky.png` - Sunset gradient sky, seagulls
- `sprites/backgrounds/sunset-beach/ocean.png` - Ocean with waves, sailboat
- `sprites/backgrounds/sunset-beach/palms.png` - Palm trees, lifeguard tower
- `sprites/backgrounds/sunset-beach/sand.png` - Sand court with boundary lines

### Retro Arcade (80s)
```
pixel art game background, inside 1980s arcade, rows of arcade cabinets with glowing CRT screens, neon signs saying HIGH SCORE and INSERT COIN, geometric carpet pattern, prize counter with plushies, pinball machine with flashing lights, taped volleyball court on carpet floor, 16-bit nostalgic style, warm neon glow
```
**Save layers as:** (480×270 px each)
- `sprites/backgrounds/retro-arcade/back.png` - Back wall with neon signs
- `sprites/backgrounds/retro-arcade/cabinets.png` - Arcade cabinets, prize counter
- `sprites/backgrounds/retro-arcade/near.png` - Foreground elements, pinball
- `sprites/backgrounds/retro-arcade/ground.png` - Geometric carpet with taped court

### Space Station (Sci-Fi)
```
pixel art game background, space station interior, large window showing Earth from orbit, black space void with stars, metal grid floor with blue glowing court lines, hexagonal window frames, solar panels visible outside, floating dust particles, energy net made of light, HUD displays on walls, 16-bit sci-fi style
```
**Save layers as:** (480×270 px each)
- `sprites/backgrounds/space-station/stars.png` - Star field, deep space
- `sprites/backgrounds/space-station/earth.png` - Earth view, solar panels
- `sprites/backgrounds/space-station/station.png` - Station interior, HUD displays
- `sprites/backgrounds/space-station/ground.png` - Metal grid floor with court lines

### Ancient Temple (Fantasy)
```
pixel art game background, mystical ancient temple ruins at twilight, two moons in sky, aurora-like magical streams, crumbling stone towers, overgrown vines, glowing ancient glyphs on walls, floating stones defying gravity, magical green and purple fire in torches, stone tile floor, energy net made of magic runes, 16-bit fantasy style
```
**Save layers as:** (480×270 px each)
- `sprites/backgrounds/ancient-temple/sky.png` - Twilight sky, moons, aurora
- `sprites/backgrounds/ancient-temple/ruins.png` - Distant crumbling towers
- `sprites/backgrounds/ancient-temple/columns.png` - Columns, floating stones, torches
- `sprites/backgrounds/ancient-temple/ground.png` - Stone tile floor with glyphs

### Urban Rooftop (Modern)
```
pixel art game background, city rooftop at night, skyline silhouettes with lit windows, billboard with changing ads, water tower, rooftop garden, string lights overhead, concrete floor with cracks, spray painted court lines, chain link fence net, graffiti on walls, steam rising from vents, 16-bit urban style
```
**Save layers as:** (480×270 px each)
- `sprites/backgrounds/urban-rooftop/sky.png` - Night sky with city glow
- `sprites/backgrounds/urban-rooftop/skyline.png` - Distant skyline, billboards
- `sprites/backgrounds/urban-rooftop/rooftop.png` - Water tower, garden, string lights
- `sprites/backgrounds/urban-rooftop/ground.png` - Cracked concrete with spray paint

---

## Ball Variants

All balls are 96×12 px spritesheets with 8 rotation frames (12×12 px each).

Visual: 12×12 px (radius 6). Collision body uses radius 8 for more forgiving hits.

### Default Ball
```
pixel art game item, classic white volleyball with colored stripes, clean design, game item style, transparent background, 32x32 pixels style, no antialiasing
```
**Save as:** `sprites/balls/default.png` (96×12 px)

### Fire Ball
```
pixel art game item, flaming volleyball on fire, orange and red flame trail, burning effect, game power-up style, transparent background, 32x32 pixels style, no antialiasing
```
**Save as:** `sprites/balls/fire.png` (96×12 px)

### Ice Ball
```
pixel art game item, frozen volleyball with ice crystals, frost and snowflake trail, blue and cyan colors, frozen effect, transparent background, 32x32 pixels style, no antialiasing
```
**Save as:** `sprites/balls/ice.png` (96×12 px)

### Rainbow Ball
```
pixel art game item, prismatic rainbow volleyball, color shifting effect, sparkle trail, magical aura, all rainbow colors cycling, transparent background, 32x32 pixels style, no antialiasing
```
**Save as:** `sprites/balls/rainbow.png` (96×12 px)

### Pixel Ball
```
pixel art game item, retro 8-bit style volleyball, chunky pixels, nostalgic game style, bright primary colors, transparent background, 32x32 pixels style, no antialiasing
```
**Save as:** `sprites/balls/pixel.png` (96×12 px)

### Neon Ball
```
pixel art game item, glowing cyberpunk volleyball, neon cyan and magenta outline, electric glow effect, futuristic style, transparent background, 32x32 pixels style, no antialiasing
```
**Save as:** `sprites/balls/neon.png` (96×12 px)

### Golden Ball
```
pixel art game item, shimmering golden volleyball, champion trophy style, sparkle and shine effects, gold and bronze colors, luxurious feel, transparent background, 32x32 pixels style
```
**Save as:** `sprites/balls/golden.png` (96×12 px)

### Void Ball
```
pixel art game item, dark matter volleyball, black and purple colors, void energy particles, mysterious aura, space nebula pattern, transparent background, 32x32 pixels style
```
**Save as:** `sprites/balls/void.png` (96×12 px)

---

## UI Elements

### Rank Icons
```
pixel art game icons set, competitive rank tier badges, shield shapes, bronze silver gold platinum diamond tiers, small 16x16 pixel size, clear silhouettes, limited colors, game achievement style, transparent background
```
**Save as:** (24×24 px each)
- `sprites/icons/rank-rookie.png` - Gray/white rookie badge
- `sprites/icons/rank-bronze.png` - Bronze colored badge
- `sprites/icons/rank-silver.png` - Silver colored badge
- `sprites/icons/rank-gold.png` - Gold colored badge
- `sprites/icons/rank-platinum.png` - Platinum/teal badge
- `sprites/icons/rank-diamond.png` - Diamond/cyan badge
- `sprites/icons/rank-champion.png` - Purple/legendary badge

### Currency Icons
```
pixel art game icons, golden coin spinning, blue gem crystal, purple XP orb, 16x16 pixels each, shiny reflective style, game currency aesthetic, transparent background, no antialiasing
```
**Save as:** (16×16 px each)
- `sprites/icons/coin.png` - Golden coin
- `sprites/icons/gem.png` - Blue gem crystal
- `sprites/icons/xp.png` - Purple XP orb

### Attribute Icons
```
pixel art game stat icons, lightning bolt for speed, spring for jump, fist for power, crosshair for control, 16x16 pixels, simple clear designs, blue purple red green colors, transparent background
```
**Save as:** (16×16 px each)
- `sprites/icons/speed.png` - Lightning bolt (blue)
- `sprites/icons/jump.png` - Spring/arrow up (purple)
- `sprites/icons/power.png` - Fist (red)
- `sprites/icons/control.png` - Crosshair/target (green)

### System Icons
```
pixel art game UI icons, settings gear, speaker on/off, music note on/off, fullscreen arrows, exit door, 16x16 pixels, clean simple design, transparent background
```
**Save as:** (16×16 px each)
- `sprites/icons/settings.png` - Gear icon
- `sprites/icons/sound-on.png` - Speaker with waves
- `sprites/icons/sound-off.png` - Speaker with X
- `sprites/icons/music-on.png` - Music note
- `sprites/icons/music-off.png` - Music note with X
- `sprites/icons/fullscreen.png` - Expand arrows
- `sprites/icons/exit.png` - Door/exit icon

### Gameplay Icons
```
pixel art game control icons, play triangle, pause bars, restart arrow, home house, versus VS symbol, 16x16 pixels, bold clear design, transparent background
```
**Save as:** (16×16 px each)
- `sprites/icons/play.png` - Play triangle
- `sprites/icons/pause.png` - Pause bars
- `sprites/icons/restart.png` - Circular arrow
- `sprites/icons/home.png` - House icon
- `sprites/icons/versus.png` - VS symbol

### Shop Icons
```
pixel art game shop icons, shopping cart, checkmark owned, padlock locked, NEW burst, SALE tag, 16x16 pixels, game store style, transparent background
```
**Save as:** (16×16 px each)
- `sprites/icons/cart.png` - Shopping cart
- `sprites/icons/owned.png` - Checkmark
- `sprites/icons/locked.png` - Padlock
- `sprites/icons/new.png` - NEW burst/badge
- `sprites/icons/sale.png` - SALE tag

---

## Effects

### Hit Effect (Normal)
```
pixel art game effect, starburst impact animation, white and yellow colors, radiating lines, comic book pow style, 5 frame animation sequence, transparent background, 24x24 pixels
```
**Save as:** `sprites/effects/hit.png` (120×24 px - 5 frames)

### Hit Effect (Power)
```
pixel art game effect, powerful starburst impact, orange and red colors, larger radiating lines, explosive comic style, 5 frame animation, transparent background, 24x24 pixels
```
**Save as:** `sprites/effects/hit-power.png` (120×24 px - 5 frames)

### Hit Effect (Perfect)
```
pixel art game effect, perfect hit starburst, golden and white colors, sparkles and stars, premium impact feel, 5 frame animation, transparent background, 24x24 pixels
```
**Save as:** `sprites/effects/hit-perfect.png` (120×24 px - 5 frames)

### Score Celebration
```
pixel art game effect, victory explosion particles, confetti burst, stars and circles, multiple colors, celebration animation, 8 frames, transparent background, retro game style
```
**Save as:** `sprites/effects/score.png` (384×48 px - 8 frames of 48×48)

### Dust Cloud (Sand)
```
pixel art game effect, landing dust puff, small particle cloud, 4 frame animation, tan and beige sand colors, beach impact effect, 16x8 pixels, transparent background
```
**Save as:** `sprites/effects/dust-sand.png` (64×8 px - 4 frames)

### Dust Cloud (Concrete)
```
pixel art game effect, landing dust puff, small particle cloud, 4 frame animation, gray concrete dust colors, urban impact effect, 16x8 pixels, transparent background
```
**Save as:** `sprites/effects/dust-concrete.png` (64×8 px - 4 frames)

### Dust Cloud (Metal)
```
pixel art game effect, landing spark effect, small particle cloud, 4 frame animation, gray with cyan sparks, metallic impact effect, 16x8 pixels, transparent background
```
**Save as:** `sprites/effects/dust-metal.png` (64×8 px - 4 frames)

### Jump Effect
```
pixel art game effect, jump launch burst, small lines radiating downward, white and blue colors, 3 frame animation, 20x12 pixels, transparent background
```
**Save as:** `sprites/effects/jump.png` (60×12 px - 3 frames)

### Electric Spark
```
pixel art game effect, small electric spark, cyan and white colors, zap effect, 3 frame animation, 8x8 pixels, transparent background
```
**Save as:** `sprites/effects/spark.png` (24×8 px - 3 frames)

---

## UI Buttons

### Primary Button
```
pixel art game button, rounded rectangle, cyan/teal gradient, game UI style, 3 states vertically stacked: normal, hover (brighter), pressed (darker), 64x24 pixels each state, transparent background
```
**Save as:** `sprites/ui/button-primary.png` (64×72 px - 3 states stacked)

### Secondary Button
```
pixel art game button, rounded rectangle, gray/dark gradient, secondary UI style, 3 states vertically stacked: normal, hover, pressed, 48x20 pixels each state, transparent background
```
**Save as:** `sprites/ui/button-secondary.png` (48×60 px - 3 states stacked)

### Icon Button
```
pixel art game button, small square button, dark with highlight border, 3 states vertically stacked: normal, hover, pressed, 24x24 pixels each state, transparent background
```
**Save as:** `sprites/ui/button-icon.png` (24×72 px - 3 states stacked)

---

## UI Panels (9-slice)

### Default Panel
```
pixel art game panel, dark semi-transparent background, cyan/teal border, rounded corners, 9-slice compatible with 16px corners, 48x48 pixels, game menu style
```
**Save as:** `sprites/ui/panel-default.png` (48×48 px - 9-slice)

### Modal Panel
```
pixel art game modal, darker background, thicker border, header area at top, 9-slice compatible, 48x48 pixels, game dialog style
```
**Save as:** `sprites/ui/panel-modal.png` (48×48 px - 9-slice)

### Tooltip Panel
```
pixel art game tooltip, small dark panel, thin bright border, 8px corners for 9-slice, 32x32 pixels, game hint style
```
**Save as:** `sprites/ui/panel-tooltip.png` (32×32 px - 9-slice)

---

## Net Variants

Visual: 6px wide × 80px tall. Collision body is 8px wide (see "Visual vs. Collision Alignment" section).

### Professional Net
```
pixel art game net, white professional volleyball net, clean woven pattern, 6 pixels wide, 80 pixels tall, sports equipment style, transparent background
```
**Save as:** `sprites/nets/professional.png` (12×80 px - 2 frames for sway)

### Holographic Net
```
pixel art game net, holographic energy barrier, cyan and magenta glowing lines, futuristic style, animated shimmer, transparent background
```
**Save as:** `sprites/nets/holographic.png` (18×80 px - 3 frames)

### Energy Barrier Net
```
pixel art game net, pure energy barrier, bright blue electric field, sci-fi force field style, crackling animation, transparent background
```
**Save as:** `sprites/nets/energy.png` (24×80 px - 4 frames)

### Rope Net
```
pixel art game net, makeshift rope net, brown hemp rope, tied knots, beach/casual style, slight sway, transparent background
```
**Save as:** `sprites/nets/rope.png` (12×80 px - 2 frames)

### Chain-Link Net
```
pixel art game net, metal chain link fence style, gray metallic, urban aesthetic, slight rattle animation, transparent background
```
**Save as:** `sprites/nets/chain-link.png` (12×80 px - 2 frames)

---

## Ground Textures (Tileable)

All ground textures are 32×32 px and must tile seamlessly.

### Sand Texture
```
pixel art tileable texture, beach sand, warm tan colors, subtle grain pattern, seamless tile, 32x32 pixels
```
**Save as:** `sprites/grounds/sand.png` (32×32 px)

### Wet Metal Texture
```
pixel art tileable texture, wet metal floor, dark gray with cyan reflections, industrial style, seamless tile, 32x32 pixels
```
**Save as:** `sprites/grounds/wet-metal.png` (32×32 px)

### Glossy Black Texture
```
pixel art tileable texture, glossy black floor, subtle reflections, esports arena style, seamless tile, 32x32 pixels
```
**Save as:** `sprites/grounds/glossy-black.png` (32×32 px)

### Cracked Concrete Texture
```
pixel art tileable texture, cracked urban concrete, gray with subtle cracks, street style, seamless tile, 32x32 pixels
```
**Save as:** `sprites/grounds/cracked-concrete.png` (32×32 px)

### Geometric Carpet Texture
```
pixel art tileable texture, 80s arcade carpet, colorful geometric pattern, retro style, seamless tile, 32x32 pixels
```
**Save as:** `sprites/grounds/carpet-geometric.png` (32×32 px)

### Metal Grid Texture
```
pixel art tileable texture, space station metal grid floor, dark gray with blue glow lines, sci-fi style, seamless tile, 32x32 pixels
```
**Save as:** `sprites/grounds/metal-grid.png` (32×32 px)

### Stone Tiles Texture
```
pixel art tileable texture, ancient stone tiles, weathered gray stone, temple floor style, seamless tile, 32x32 pixels
```
**Save as:** `sprites/grounds/stone-tiles.png` (32×32 px)

---

## Miscellaneous

### Loading Spinner
```
pixel art game loading animation, circular spinner, 8 frame rotation, cyan/teal color, game loading style, 32x32 pixels per frame, transparent background
```
**Save as:** `sprites/misc/loading-spinner.png` (256×32 px - 8 frames)

---

## Tips for Best Results

### Midjourney
- Add `--niji` for anime/game style
- Use `--ar 16:9` for backgrounds
- Add `--style raw` for less artistic interpretation
- Use `--stylize 100` for more literal results

### DALL-E
- Be very specific about "pixel art" and "no antialiasing"
- Mention specific pixel dimensions
- Request "limited color palette"
- Ask for "transparent background"

### Stable Diffusion
- Use pixel art specific models (e.g., Pixel Art XL)
- Negative prompts: "blurry, antialiased, smooth gradients, realistic"
- CFG scale 7-10 works well
- Use img2img for refinement

### Post-Processing Tools
- Aseprite (best for pixel art)
- GraphicsGale (free alternative)
- Piskel (web-based)
- Photoshop with nearest neighbor scaling
