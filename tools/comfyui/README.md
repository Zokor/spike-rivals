# ComfyUI Asset Generator

Generate pixel art assets for Spike Rivals using ComfyUI and Z-Image-Turbo.

## Requirements

- ComfyUI running at `http://127.0.0.1:8188/`
- Z-Image-Turbo model installed:
  - `models/diffusion_models/z_image_turbo_bf16.safetensors`
  - `models/text_encoders/qwen_3_4b.safetensors`
  - `models/vae/ae.safetensors`
  - `models/loras/pixel_art_style_z_image_turbo.safetensors`
- ImageMagick (`brew install imagemagick`)
- FFmpeg (`brew install ffmpeg`) - for audio

## Installation

```bash
cd tools/comfyui
bun install
```

## Usage

### Test Connection

```bash
bun run src/index.ts --test
```

### Generate Characters

```bash
# Single frame
bun run src/index.ts -t character -i blitz -a idle -f 0

# Full spritesheet (240x128, all 40 frames)
bun run src/index.ts -t character -i blitz

# All characters
bun run src/index.ts -t character --all
```

**Available characters:** `blitz`, `crusher`, `sky`, `zen`, `tank`, `flash`, `nova`, `ghost`

**Available animations:** `idle`, `run`, `jump`, `fall`, `bump`, `spike`, `dive`, `recover`, `serve`, `victory`, `defeat`

### Generate Portraits

```bash
# Single portrait (80x80)
bun run src/index.ts -t portrait -i blitz

# All portraits
bun run src/index.ts -t portrait --all
```

### Generate Ball Skins

```bash
# Single ball (128x16 spritesheet, 8 rotation frames)
bun run src/index.ts -t ball -i ball-plasma

# All balls
bun run src/index.ts -t ball --all
```

**Available balls:** `ball-default`, `ball-plasma`, `ball-fire`, `ball-ice`, `ball-void`, `ball-rainbow`, `ball-neon`, `ball-pixel`, `ball-glitch`

### Generate Backgrounds

```bash
# Single layer (480x270)
bun run src/index.ts -t background -c neon-district -l sky

# Full background (all layers)
bun run src/index.ts -t background -c neon-district

# All backgrounds
bun run src/index.ts -t background --all
```

**Available courts:** `neon-district`, `sunset-beach`, `cyber-arena`, `night-market`, `retro-arcade`, `space-station`, `ancient-temple`, `urban-rooftop`

### Generate Audio (Music & SFX)

Requires ComfyUI-audio extension. **Restart ComfyUI** after installation to load MusicGen nodes.

```bash
# Single audio file
bun run src/index.ts -t audio -i menu-theme

# All audio files
bun run src/index.ts -t audio --all
```

**Available audio:**

| ID | Type | Duration | Description |
|----|------|----------|-------------|
| `menu-theme` | music | 60s | Main menu synthwave loop |
| `match-theme` | music | 60s | In-game match music |
| `shop-theme` | music | 45s | Shop browsing music |
| `victory-stinger` | stinger | 3s | Win fanfare |
| `defeat-stinger` | stinger | 3s | Loss sound |
| `ball-hit-soft` | sfx | 0.5s | Bump sound |
| `ball-hit-hard` | sfx | 0.5s | Spike sound |
| `player-jump` | sfx | 0.3s | Jump sound |
| `score-point` | sfx | 0.5s | Point scored |
| `button-click` | sfx | 0.2s | UI click |

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--type` | `-t` | Asset type: `character`, `portrait`, `ball`, `background`, `audio` |
| `--id` | `-i` | Asset ID (character name, ball skin, audio id) |
| `--animation` | `-a` | Animation name (for characters) |
| `--frame` | `-f` | Frame number (for single frame) |
| `--court` | `-c` | Court ID (for backgrounds) |
| `--layer` | `-l` | Layer name (for single background layer) |
| `--seed` | `-s` | Random seed for reproducible results |
| `--all` | | Generate all assets of type |
| `--test` | | Test ComfyUI connection |
| `--validate` | | Validate output (dimensions, alpha channel) |
| `--help` | `-h` | Show help |

### Validation

Use `--validate` to check generated assets meet requirements:

```bash
# Generate and validate
bun run src/index.ts -t portrait -i blitz --validate
bun run src/index.ts -t character -i blitz --validate
bun run src/index.ts -t ball -i ball-plasma --validate
```

Validation checks:
- **Character spritesheets:** 240×128, alpha channel required
- **Portraits:** 80×80, alpha channel required
- **Ball spritesheets:** 128×16, alpha channel required
- **Backgrounds:** 480×270, alpha optional

## Output

- **Raw files:** `tools/comfyui/output/`
- **Final images:** `client/public/assets/sprites/`
- **Final audio:** `client/public/assets/audio/` (music/, stingers/, sfx/)

## Post-Processing

Images are automatically post-processed with ImageMagick:

| Asset Type | Target Size | Colors | Outline |
|------------|-------------|--------|---------|
| Character | 24x32 | 16 | Yes |
| Ball | 16x16 | 16 | Yes |
| Portrait | 80x80 | 32 | No |
| Background | 480x270 | Full | No |

## Configuration

Edit `src/config.ts` to modify:

- `COMFYUI_URL` - ComfyUI server address
- `MODEL_CONFIG` - Model filenames and LoRA strength
- `GENERATION_DEFAULTS` - Steps, CFG, seed
- `GLOBAL_STYLE_HEADER` - Base prompt for all generations
- `CHARACTERS` - Character traits and descriptions
- `ANIMATIONS` - Frame descriptions for each animation
- `BALL_SKINS` - Ball theme descriptions
- `BACKGROUNDS` - Court layer descriptions
- `AUDIO_CONFIG` - MusicGen model settings
- `AUDIO_PROMPTS` - Audio prompts and durations

## Workflow

The workflow template is in `workflows/z-image-turbo.json`. It uses:

- `UNETLoader` → Z-Image-Turbo model
- `CLIPLoader` → Qwen text encoder (type: `qwen_image`)
- `VAELoader` → AE VAE
- `LoraLoader` → Pixel art style LoRA
- `TextEncodeZImageOmni` → Text encoding
- `EmptyFlux2LatentImage` → Latent generation
- `KSampler` → Sampling (euler, 8 steps, cfg 1.5)
- `VAEDecode` → Image decoding
- `SaveImage` → Output

## Troubleshooting

**Connection refused:**
- Make sure ComfyUI is running at `http://127.0.0.1:8188/`

**Model not found:**
- Check that all model files are in the correct ComfyUI directories

**Generation errors:**
- Check ComfyUI console for detailed error messages
- Ensure CLIP type matches your text encoder (`qwen_image` for Qwen)

**Wrong dimensions:**
- Z-Image-Turbo may adjust dimensions; post-processing handles the final size

**MusicGen nodes not available:**
- Restart ComfyUI after installing ComfyUI-audio extension
- Check that `custom_nodes/ComfyUI-audio/` exists
- Install transformers: `pip install transformers`

**Audio generation slow:**
- MusicGen downloads models on first use (~1-2GB)
- Use `musicgen-small` (default) for faster generation
- Longer audio takes more time (60s audio ≈ 2-5 min)
