import * as path from 'path';

// Paths
export const COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
export const OUTPUT_PATH =
  process.env.COMFYUI_OUTPUT_PATH ||
  path.resolve(__dirname, '../../../client/public/assets');
export const TEMP_OUTPUT_PATH = path.resolve(__dirname, '../output');

// Model configuration
export const MODEL_CONFIG = {
  unet: 'z_image_turbo_bf16.safetensors',
  clip: 'qwen_3_4b.safetensors',
  vae: 'ae.safetensors',
  lora: 'pixel_art_style_z_image_turbo.safetensors',
  loraStrength: 0.8,
};

// Generation defaults
export const GENERATION_DEFAULTS = {
  steps: 8, // Turbo model needs fewer steps
  cfg: 1.5, // Lower CFG for turbo models
  seed: -1, // Random
};

// Prompts
export const GLOBAL_STYLE_HEADER = `retro arcade pixel art, early 90s arcade/SNES sprite style, cyberpunk neo-noir vibe (rainy neon, purple/cyan/magenta), clean readable silhouette, 1px dark outline + selective neon rim light, high contrast, minimal dithering, no gradients, no anti-aliasing, crisp pixels, limited 16-color palette, consistent light direction (top-left), side view orthographic camera`;

export const BACKGROUND_STYLE_HEADER = `pixel art parallax background layer, early 90s arcade style, cyberpunk neo-noir atmosphere (rainy neon, purple/cyan/magenta), high contrast, no anti-aliasing, crisp pixels, 480x270 resolution`;

// Legacy - kept for backwards compatibility
export const NEGATIVE_PROMPT = `blurry, antialiasing, smooth shading, gradients, painterly, high detail textures, photorealistic, 3d render, soft edges, bloom haze, lens flare, compression artifacts, watermark, text, logo`;

// For characters, portraits, balls, UI (transparent background required)
export const NEGATIVE_PROMPT_SPRITE = `blurry, antialiasing, smooth shading, gradients, painterly, high detail textures, photorealistic, 3d render, soft edges, bloom haze, lens flare, compression artifacts, watermark, text, logo, background, backdrop, gradient background, vignette, floor, ground, environment`;

// For backgrounds ONLY (do NOT ban background/ground/environment)
export const NEGATIVE_PROMPT_BACKGROUND = `blurry, antialiasing, smooth shading, painterly, photorealistic, 3d render, lens flare, compression artifacts, watermark, text, logo`;

// Portrait-specific style (no side-view orthographic camera)
export const PORTRAIT_STYLE_HEADER = `retro arcade pixel art, early 90s arcade/SNES portrait style, cyberpunk neo-noir vibe (purple/cyan/magenta), crisp pixels, limited 16-color palette, no gradients, no anti-aliasing, 1px dark outline, strong facial readability, bust shot, 3/4 view slightly toward camera, isolated portrait, transparent background, no backdrop, no vignette`;

// Asset generation resolutions (generate high, downscale later)
export const GENERATION_SIZES = {
  character: { width: 384, height: 512 },
  ball: { width: 256, height: 256 },
  portrait: { width: 640, height: 640 },
  background: { width: 1920, height: 1080 },
};

// Characters
export const CHARACTERS = {
  blitz: {
    id: 'blitz',
    name: 'Blitz',
    traits:
      'lean athletic cyberpunk speedster, spiky electric-blue hair, blue/white sports jacket with neon piping, lightning bolt shoulder patch, fingerless gloves, knee pads, determined face, minimal cyber visor',
  },
  crusher: {
    id: 'crusher',
    name: 'Crusher',
    traits:
      'muscular cyberpunk power hitter, red/black armored sports top, cybernetic forearms with subtle glow seams, buzz cut, heavy knee braces, intimidating stance',
  },
  sky: {
    id: 'sky',
    name: 'Sky',
    traits:
      'tall agile cyberpunk high flyer, purple/cyan suit with lightweight anti-grav belt, flowing white hair tied back, small readable wing-like jacket tails, serene focus',
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    traits:
      'calm cyberpunk precision player, green/white minimalist outfit, small targeting monocle visor, wrist tape, balanced stance, subtle zen-circle emblem',
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    traits:
      'stocky cyberpunk defender, gray/orange exo-vest, padded shoulders, grounded stance, shield emblem',
  },
  flash: {
    id: 'flash',
    name: 'Flash',
    traits:
      'hyper energetic cyberpunk sprinter, yellow/orange suit, flame-like hair spikes, tiny heel thrusters, excited grin',
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    traits:
      'confident cyberpunk captain, pink/gold suit with starburst chest emblem, stylish undercut hair, leader stance',
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    traits:
      'mysterious cyberpunk trickster, teal/purple cloak jacket, subtle hologram shimmer outline, flowing gray hair, enigmatic expression',
  },
};

// Animations
export const ANIMATIONS = [
  {
    name: 'idle',
    frames: 4,
    row: 0,
    startCol: 0,
    descriptions: [
      'neutral standing pose',
      'inhale, shoulders slightly up',
      'neutral standing pose',
      'exhale, shoulders slightly down',
    ],
  },
  {
    name: 'run',
    frames: 6,
    row: 0,
    startCol: 4,
    descriptions: [
      'right foot contact',
      'push off right',
      'passing position',
      'left foot contact',
      'push off left',
      'passing position',
    ],
  },
  {
    name: 'jump',
    frames: 3,
    row: 1,
    startCol: 0,
    descriptions: ['crouch anticipation', 'lift-off, legs pushing', 'apex hold, arms up'],
  },
  {
    name: 'fall',
    frames: 3,
    row: 1,
    startCol: 3,
    descriptions: ['descending', 'land squash', 'recover'],
  },
  {
    name: 'bump',
    frames: 4,
    row: 1,
    startCol: 6,
    descriptions: ['ready stance', 'arms down anticipation', 'contact platform', 'follow-through'],
  },
  {
    name: 'spike',
    frames: 4,
    row: 2,
    startCol: 0,
    descriptions: ['approach step', 'jump', 'arm cock back', 'smash contact'],
  },
  {
    name: 'dive',
    frames: 3,
    row: 2,
    startCol: 4,
    descriptions: ['launch', 'extend arms', 'slide'],
  },
  {
    name: 'recover',
    frames: 3,
    row: 2,
    startCol: 7,
    descriptions: ['push up from floor', 'kneel', 'stand'],
  },
  {
    name: 'serve',
    frames: 4,
    row: 3,
    startCol: 0,
    descriptions: ['ball toss', 'reach up', 'contact', 'follow-through'],
  },
  {
    name: 'victory',
    frames: 4,
    row: 3,
    startCol: 4,
    descriptions: ['fist pump start', 'fist pump up', 'small hop', 'land celebrate'],
  },
  {
    name: 'defeat',
    frames: 2,
    row: 3,
    startCol: 8,
    descriptions: ['disappointed', 'slump'],
  },
];

// Ball skins
export const BALL_SKINS = [
  { id: 'ball-default', theme: 'classic white/red/blue volleyball panels' },
  { id: 'ball-plasma', theme: 'crackling energy core, cyan/purple glow' },
  { id: 'ball-fire', theme: 'blazing flames, orange/red/yellow' },
  { id: 'ball-ice', theme: 'crystalline facets, light blue/white/cyan sparkle' },
  { id: 'ball-void', theme: 'dark matter orb, black/purple swirl, white stars inside' },
  { id: 'ball-rainbow', theme: 'prismatic gradient bands, full spectrum cycling' },
  { id: 'ball-neon', theme: 'glowing wireframe, hot pink/cyan/purple' },
  { id: 'ball-pixel', theme: '8-bit chunky pixels, green/black' },
  { id: 'ball-glitch', theme: 'corrupted texture, cyan/magenta/random glitch artifacts' },
];

// Audio configuration
export const AUDIO_CONFIG = {
  model: 'musicgen-small', // Options: musicgen-small, musicgen-medium, musicgen-large, musicgen-melody
  defaultDuration: 10, // seconds
};

// Audio prompts
export const AUDIO_PROMPTS = {
  // Music
  'menu-theme': {
    type: 'music',
    prompt:
      'Instrumental, retro arcade, cyberpunk neo-noir, synthwave with warm pads, simple arpeggio, 707 drums, 80-100 BPM, uplifting but mysterious, seamless loop',
    duration: 60,
  },
  'match-theme': {
    type: 'music',
    prompt:
      'Instrumental, cyberpunk rooftop rain, 125-135 BPM, driving kick, snappy snare, FM bass, neon arpeggios, minor key pads, energetic match music, seamless loop',
    duration: 60,
  },
  'shop-theme': {
    type: 'music',
    prompt:
      'Instrumental, chill synthwave, relaxed shopping music, warm pads, soft drums, 90 BPM, lo-fi arcade vibes, seamless loop',
    duration: 45,
  },
  // Stingers
  'victory-stinger': {
    type: 'stinger',
    prompt:
      'Short victory fanfare, bright major chord, arcade win sound, triumphant, 2-3 seconds',
    duration: 3,
  },
  'defeat-stinger': {
    type: 'stinger',
    prompt: 'Short defeat sound, minor chord, sad arcade game over, melancholic, 2-3 seconds',
    duration: 3,
  },
  // SFX
  'ball-hit-soft': {
    type: 'sfx',
    prompt: '8-bit retro game sound effect, soft volleyball bump, hollow pop sound',
    duration: 0.5,
  },
  'ball-hit-hard': {
    type: 'sfx',
    prompt: '8-bit retro game sound effect, powerful volleyball spike, sharp impact sound',
    duration: 0.5,
  },
  'player-jump': {
    type: 'sfx',
    prompt: '8-bit retro game sound effect, character jump, spring bounce sound',
    duration: 0.3,
  },
  'score-point': {
    type: 'sfx',
    prompt: '8-bit retro game sound effect, point scored, cheerful ding, positive feedback',
    duration: 0.5,
  },
  'button-click': {
    type: 'sfx',
    prompt: '8-bit retro game UI sound, menu button click, satisfying click',
    duration: 0.2,
  },
};

// Background courts
export const BACKGROUNDS = {
  'neon-district': {
    id: 'neon-district',
    name: 'Neon District',
    theme: 'Cyberpunk rooftop with rain and neon signs',
    layers: [
      {
        name: 'sky',
        description: 'Night sky with neon haze and light pollution glow, no buildings',
      },
      {
        name: 'buildings-far',
        description: 'Distant skyscraper silhouettes with a few neon signs, low contrast',
      },
      {
        name: 'buildings-mid',
        description: 'Mid-distance rooftops and billboards, a few tiny flying car lights',
      },
      { name: 'rooftop', description: 'Rooftop props: vents, pipes, railings, steam puffs' },
      {
        name: 'ground',
        description: 'Wet metal volleyball court floor with neon reflections, court lines',
      },
    ],
  },
  'sunset-beach': {
    id: 'sunset-beach',
    name: 'Sunset Beach',
    theme: 'Classic beach volleyball at sunset',
    layers: [
      { name: 'sky', description: 'Sunset sky gradient, warm orange/pink/purple' },
      { name: 'ocean', description: 'Ocean horizon with gentle waves, reflecting sunset' },
      { name: 'palms', description: 'Palm tree silhouettes in foreground' },
      { name: 'sand', description: 'Sandy beach ground, volleyball court lines' },
    ],
  },
  'cyber-arena': {
    id: 'cyber-arena',
    name: 'Cyber Arena',
    theme: 'Holographic stadium with digital crowd',
    layers: [
      { name: 'back', description: 'Dark arena background with holographic displays' },
      { name: 'crowd', description: 'Stylized crowd silhouettes with glowing effects' },
      { name: 'structure', description: 'Arena structure, barriers, neon trim' },
      { name: 'ground', description: 'Glowing court floor with digital grid lines' },
    ],
  },
  'night-market': {
    id: 'night-market',
    name: 'Night Market',
    theme: 'Asian street court with food stalls',
    layers: [
      { name: 'sky', description: 'Night sky, faint stars' },
      { name: 'buildings', description: 'Narrow buildings with lanterns and signs' },
      { name: 'stalls', description: 'Food stalls, hanging lights, steam' },
      { name: 'ground', description: 'Wet street floor, court markings' },
    ],
  },
  'retro-arcade': {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    theme: 'Inside 80s arcade with CRT monitors',
    layers: [
      { name: 'back', description: 'Dark arcade interior, distant cabinets' },
      { name: 'cabinets', description: 'Arcade cabinet rows with glowing screens' },
      { name: 'near', description: 'Closer cabinets, neon signs' },
      { name: 'ground', description: 'Carpet pattern floor, court lines' },
    ],
  },
  'space-station': {
    id: 'space-station',
    name: 'Space Station',
    theme: 'Zero-G court with Earth view',
    layers: [
      { name: 'stars', description: 'Star field, deep space' },
      { name: 'earth', description: 'Earth visible through window, blue glow' },
      { name: 'station', description: 'Space station interior, panels, lights' },
      { name: 'ground', description: 'Metal floor with grip panels, court markings' },
    ],
  },
  'ancient-temple': {
    id: 'ancient-temple',
    name: 'Ancient Temple',
    theme: 'Mystical ruins with floating stones',
    layers: [
      { name: 'sky', description: 'Mystical sky, aurora, stars' },
      { name: 'ruins', description: 'Distant temple ruins, overgrown' },
      { name: 'columns', description: 'Stone columns, floating rocks, magic particles' },
      { name: 'ground', description: 'Stone floor with ancient markings, court lines' },
    ],
  },
  'urban-rooftop': {
    id: 'urban-rooftop',
    name: 'Urban Rooftop',
    theme: 'City skyline at night',
    layers: [
      { name: 'sky', description: 'Night sky with city light pollution' },
      { name: 'skyline', description: 'City skyline silhouette, lit windows' },
      { name: 'rooftop', description: 'Rooftop elements, water tower, antenna' },
      { name: 'ground', description: 'Concrete rooftop floor, court markings' },
    ],
  },
};
