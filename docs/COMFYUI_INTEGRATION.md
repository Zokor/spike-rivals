# ComfyUI Integration for Spike Rivals

> Generate pixel art images and audio using ComfyUI at http://127.0.0.1:8188/

## Configuration

| Setting | Value |
|---------|-------|
| ComfyUI URL | `http://127.0.0.1:8188/` |
| ComfyUI Path | `/Users/brunogomes/Documents/www/ComfyUI` |
| Output Path | `/Users/brunogomes/Documents/www/spike-rivals/client/public/assets/` |

> **Note:** Use absolute paths or set `COMFYUI_OUTPUT_PATH` env var to avoid path resolution issues.

---

## Assets to Generate

### Character Sprites
| Dimensions | Target Location |
|------------|-----------------|
| 24×32 per frame, 240×128 sheet | `sprites/characters/{id}.png` |

IDs: `blitz`, `crusher`, `sky`, `zen`, `tank`, `flash`, `nova`, `ghost`

### Portraits
| Dimensions | Target Location |
|------------|-----------------|
| 80×80 | `sprites/portraits/{id}.png` |

### Ball Sprites
| Dimensions | Target Location |
|------------|-----------------|
| 16×16 per frame, 128×16 sheet (8 frames) | `sprites/balls/{spriteKey}-spin.png` |

spriteKeys: `ball-default`, `ball-plasma`, `ball-fire`, `ball-ice`, `ball-void`, `ball-rainbow`, `ball-neon`, `ball-pixel`, `ball-glitch`

### Background Layers (per court)

Each court has 4-5 parallax layers at **480×270** each:

**neon-district/**
- `sky.png` - Night sky with neon haze
- `buildings-far.png` - Distant skyscraper silhouettes
- `buildings-mid.png` - Mid-distance rooftops and billboards
- `rooftop.png` - Foreground props (vents, pipes, railings)
- `ground.png` - Wet metal court floor with neon reflections

**sunset-beach/**
- `sky.png`, `ocean.png`, `palms.png`, `sand.png`

**cyber-arena/**
- `back.png`, `crowd.png`, `structure.png`, `ground.png`

**night-market/**
- `sky.png`, `buildings.png`, `stalls.png`, `ground.png`

**retro-arcade/**
- `back.png`, `cabinets.png`, `near.png`, `ground.png`

**space-station/**
- `stars.png`, `earth.png`, `station.png`, `ground.png`

**ancient-temple/**
- `sky.png`, `ruins.png`, `columns.png`, `ground.png`

**urban-rooftop/**
- `sky.png`, `skyline.png`, `rooftop.png`, `ground.png`

### Audio Files

| Type | Format | Target Location |
|------|--------|-----------------|
| Music | `.mp3` | `audio/music/{name}.mp3` |
| Stingers | `.mp3` | `audio/stingers/{name}.mp3` |
| SFX | `.wav` | `audio/sfx/{name}.wav` |

---

## Setup Steps

### 1. Install Pixel Art LoRA

```bash
# Create loras directory if needed
mkdir -p /Users/brunogomes/Documents/www/ComfyUI/models/loras

# Download Pixel Art XL LoRA (~200MB)
curl -L "https://civitai.com/api/download/models/135931" \
  -o /Users/brunogomes/Documents/www/ComfyUI/models/loras/pixel_art_xl.safetensors
```

### 2. Install System Tools

```bash
# ImageMagick (for image post-processing)
brew install imagemagick

# FFmpeg (for audio processing)
brew install ffmpeg

# Verify installation
magick --version
ffmpeg -version
```

### 3. Install Audio Extension (Optional)

```bash
cd /Users/brunogomes/Documents/www/ComfyUI/custom_nodes
git clone https://github.com/eigenpunk/ComfyUI-AudioCraft
pip install -r ComfyUI-AudioCraft/requirements.txt

# Restart ComfyUI after installation
```

### 4. Create Integration Tools

```
spike-rivals/tools/comfyui/
├── package.json
├── tsconfig.json
├── src/
│   ├── api/
│   │   └── comfyui-client.ts
│   ├── generators/
│   │   ├── character-generator.ts
│   │   ├── background-generator.ts
│   │   └── audio-generator.ts
│   ├── postprocess/
│   │   └── image-processor.ts
│   └── index.ts
├── workflows/
│   ├── pixel-art-character.json
│   ├── pixel-art-background.json
│   └── audio-sfx.json
└── output/
```

---

## ComfyUI API Usage

### Queue a Generation

```typescript
const response = await fetch('http://127.0.0.1:8188/prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'spike-rivals',
    prompt: workflowJson,
  }),
});
const { prompt_id } = await response.json();
```

### Poll for Completion

```typescript
async function waitForCompletion(promptId: string): Promise<void> {
  while (true) {
    const res = await fetch(`http://127.0.0.1:8188/history/${promptId}`);
    const data = await res.json();
    if (data[promptId]?.status?.completed) break;
    await new Promise(r => setTimeout(r, 1000));
  }
}
```

### Download Result

```typescript
const imageUrl = `http://127.0.0.1:8188/view?filename=${filename}&type=output`;
const buffer = await fetch(imageUrl).then(r => r.arrayBuffer());
```

---

## Post-Processing by Asset Type

### Character Sprites (24×32)

Strict pixel art treatment with limited palette:

```bash
# 1. Downscale with nearest-neighbor
magick input.png -filter Point -resize 24x32! temp.png

# 2. Reduce to 16 colors (no dithering)
magick temp.png -colors 16 -dither None temp.png

# 3. Remove anti-aliasing from alpha channel
magick temp.png -channel A -threshold 50% +channel temp.png

# 4. Add 1px dark outline
magick temp.png \
  \( +clone -alpha extract -morphology Dilate Square:1 \) \
  -compose DstOver -composite \
  \( +clone -alpha extract -fill "#1a1a1a" -colorize 100% \) \
  -compose DstOver -composite \
  output.png

# 5. Assemble into 240×128 spritesheet (10 cols × 4 rows)
magick montage frame_*.png -tile 10x4 -geometry 24x32+0+0 -background transparent sheet.png
```

### Ball Sprites (16×16)

Similar to characters, strict pixel art:

```bash
# Downscale to 16×16, reduce colors, add outline
magick input.png -filter Point -resize 16x16! -colors 16 -dither None output.png

# Assemble 8-frame rotation (128×16)
magick montage frame_*.png -tile 8x1 -geometry 16x16+0+0 -background transparent ball-spin.png
```

### Portraits (80×80)

More colors allowed, no outline needed:

```bash
# Downscale to 80×80 with nearest-neighbor (preserve pixel crispness)
magick input.png -filter Point -resize 80x80! output.png

# Optional: reduce to 32 colors if needed
magick input.png -colors 32 -dither None output.png
```

### Background Layers (480×270)

NO color reduction, NO outline - preserve detail:

```bash
# Downscale only (no palette reduction)
magick input.png -filter Point -resize 480x270! output.png

# Ensure proper alpha for transparency layers
magick input.png -channel A -threshold 50% +channel output.png
```

---

## Prompts

### Global Style Header (Characters/Balls)

```
retro arcade pixel art, early 90s arcade/SNES sprite style,
cyberpunk neo-noir vibe (rainy neon, purple/cyan/magenta),
clean readable silhouette, 1px dark outline + selective neon rim light,
high contrast, minimal dithering, no gradients, no anti-aliasing,
crisp pixels, limited 16-color palette, consistent light direction (top-left),
side view orthographic camera
```

### Background Style Header

```
pixel art parallax background layer, early 90s arcade style,
cyberpunk neo-noir atmosphere (rainy neon, purple/cyan/magenta),
high contrast, no anti-aliasing, crisp pixels,
480x270 resolution
```

### Negative Prompt

```
blurry, antialiasing, smooth shading, gradients, painterly,
high detail textures, photorealistic, 3d render, soft edges,
bloom haze, lens flare, compression artifacts, watermark, text, logo
```

---

## Audio Generation

### Using ComfyUI-AudioCraft

After installing the extension:
- **MusicGen** for music loops and stingers
- **AudioGen** for sound effects

### Audio Prompts

**Music (MP3):**
```
Instrumental, retro arcade, cyberpunk neo-noir,
synthwave with warm pads, simple arpeggio, 707 drums,
80-100 BPM, seamless loop, 60 seconds
```

**SFX (WAV):**
```
8-bit retro game sound effect, volleyball bump,
hollow pop sound, 0.3 seconds
```

### Post-Processing

```bash
# Normalize music to -14 LUFS, convert to MP3
ffmpeg -i input.wav -af "loudnorm=I=-14:TP=-1:LRA=11" -c:a libmp3lame -b:a 192k output.mp3

# SFX: Keep as WAV, normalize only
ffmpeg -i input.wav -af "loudnorm=I=-14:TP=-1:LRA=11" output.wav

# Create seamless loop
ffmpeg -i input.wav -af "acrossfade=d=0.5" output.wav
```

---

## CLI Commands (After Implementation)

```bash
# Test connection
curl http://127.0.0.1:8188/system_stats

# Generate character
bun run generate:image --type character --id blitz

# Generate portrait
bun run generate:image --type portrait --id blitz

# Generate ball
bun run generate:image --type ball --id ball-plasma

# Generate background (all layers)
bun run generate:image --type background --court neon-district

# Generate audio
bun run generate:audio --type music --id menu
bun run generate:audio --type sfx --id hit
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `tools/comfyui/package.json` | Dependencies |
| `tools/comfyui/src/api/comfyui-client.ts` | ComfyUI REST API client |
| `tools/comfyui/src/postprocess/image-processor.ts` | ImageMagick wrapper by asset type |
| `tools/comfyui/src/generators/character-generator.ts` | Character sprite generation |
| `tools/comfyui/src/generators/background-generator.ts` | Background layer generation |
| `tools/comfyui/src/index.ts` | CLI entry point |
| `tools/comfyui/workflows/pixel-art-character.json` | Character workflow template |
| `tools/comfyui/workflows/pixel-art-background.json` | Background workflow template |

---

## Verification Checklist

- [ ] ComfyUI running at http://127.0.0.1:8188/
- [ ] Pixel Art LoRA installed in `ComfyUI/models/loras/`
- [ ] ImageMagick installed (`magick --version`)
- [ ] FFmpeg installed (`ffmpeg -version`)
- [ ] Character sprite: 24×32, ≤16 colors, 1px outline
- [ ] Ball sprite: 16×16, ≤16 colors, 128×16 sheet
- [ ] Portrait: 80×80, higher color depth allowed
- [ ] Background: 480×270, full color (no reduction)
- [ ] Music: MP3, -14 LUFS normalized
- [ ] SFX: WAV, -14 LUFS normalized
