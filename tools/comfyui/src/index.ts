#!/usr/bin/env bun
import { parseArgs } from 'util';
import { ComfyUIClient } from './api/comfyui-client';
import { generateCharacterFrame, generateCharacterSpritesheet } from './generators/character-generator';
import { buildWorkflow } from './generators/workflow-builder';
import { processImage } from './postprocess/image-processor';
import {
  COMFYUI_URL,
  OUTPUT_PATH,
  TEMP_OUTPUT_PATH,
  CHARACTERS,
  BALL_SKINS,
  BACKGROUNDS,
  AUDIO_PROMPTS,
  GLOBAL_STYLE_HEADER,
  BACKGROUND_STYLE_HEADER,
  PORTRAIT_STYLE_HEADER,
  NEGATIVE_PROMPT_SPRITE,
  NEGATIVE_PROMPT_BACKGROUND,
  GENERATION_SIZES,
} from './config';
import { generateAudio, checkAudioNodesAvailable } from './generators/audio-generator';
import { validateAndReport } from './postprocess/validate';
import * as fs from 'fs/promises';
import * as path from 'path';

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    type: { type: 'string', short: 't' },
    id: { type: 'string', short: 'i' },
    animation: { type: 'string', short: 'a' },
    frame: { type: 'string', short: 'f' },
    court: { type: 'string', short: 'c' },
    layer: { type: 'string', short: 'l' },
    seed: { type: 'string', short: 's' },
    all: { type: 'boolean' },
    test: { type: 'boolean' },
    validate: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

function printHelp() {
  console.log(`
Spike Rivals ComfyUI Asset Generator

Usage: bun run src/index.ts [options]

Options:
  -t, --type <type>       Asset type: character, portrait, ball, background, audio
  -i, --id <id>           Asset ID (character name, ball skin, audio id, etc.)
  -a, --animation <name>  Animation name (for characters)
  -f, --frame <number>    Frame number (for single frame generation)
  -c, --court <id>        Court ID (for backgrounds)
  -l, --layer <name>      Layer name (for single background layer)
  -s, --seed <number>     Random seed for reproducible generation
  --all                   Generate all assets of the specified type
  --test                  Test ComfyUI connection
  --validate              Validate generated assets (dimensions, alpha channel)
  -h, --help              Show this help message

Examples:
  # Test connection
  bun run src/index.ts --test

  # Generate single character frame
  bun run src/index.ts -t character -i blitz -a idle -f 0

  # Generate full character spritesheet
  bun run src/index.ts -t character -i blitz

  # Generate all characters
  bun run src/index.ts -t character --all

  # Generate portrait
  bun run src/index.ts -t portrait -i blitz

  # Generate ball skin
  bun run src/index.ts -t ball -i ball-plasma

  # Generate background layer
  bun run src/index.ts -t background -c neon-district -l sky

  # Generate full background (all layers)
  bun run src/index.ts -t background -c neon-district

  # Generate audio (requires MusicGen nodes - restart ComfyUI after installing)
  bun run src/index.ts -t audio -i menu-theme
  bun run src/index.ts -t audio --all

  # Generate with validation (checks dimensions and alpha channel)
  bun run src/index.ts -t portrait -i blitz --validate
  bun run src/index.ts -t character -i blitz --validate

Characters: ${Object.keys(CHARACTERS).join(', ')}
Ball skins: ${BALL_SKINS.map((b) => b.id).join(', ')}
Courts: ${Object.keys(BACKGROUNDS).join(', ')}
Audio: ${Object.keys(AUDIO_PROMPTS).join(', ')}
`);
}

async function testConnection(client: ComfyUIClient) {
  console.log('Testing ComfyUI connection...');
  try {
    const stats = await client.getSystemStats();
    console.log('\n✓ ComfyUI is running!');
    console.log(`  Version: ${stats.system.comfyui_version}`);
    console.log(`  Python: ${stats.system.python_version.split(' ')[0]}`);
    console.log(`  PyTorch: ${stats.system.pytorch_version}`);
    console.log(`  Device: ${stats.devices[0]?.name || 'unknown'}`);
    console.log(
      `  VRAM: ${Math.round(stats.devices[0]?.vram_free / 1024 / 1024 / 1024)}GB free / ${Math.round(stats.devices[0]?.vram_total / 1024 / 1024 / 1024)}GB total`
    );
    return true;
  } catch (error) {
    console.error('\n✗ Failed to connect to ComfyUI');
    console.error(`  Make sure ComfyUI is running at ${COMFYUI_URL}`);
    console.error(`  Error: ${error}`);
    return false;
  }
}

async function generatePortrait(client: ComfyUIClient, characterId: string, seed?: number) {
  const character = CHARACTERS[characterId as keyof typeof CHARACTERS];
  if (!character) {
    throw new Error(`Unknown character: ${characterId}`);
  }

  console.log(`Generating portrait for ${character.name}...`);

  const prompt = `${PORTRAIT_STYLE_HEADER}, ${character.traits}`;

  const workflow = await buildWorkflow({
    positivePrompt: prompt,
    negativePrompt: NEGATIVE_PROMPT_SPRITE,
    width: GENERATION_SIZES.portrait.width,
    height: GENERATION_SIZES.portrait.height,
    seed,
    outputPrefix: `portrait_${characterId}`,
  });

  const { images } = await client.generate(workflow);

  // Post-process
  const outputPath = path.join(OUTPUT_PATH, 'sprites', 'portraits', `${characterId}.png`);
  await processImage(images[0], {
    assetType: 'portrait',
    outputPath,
  });

  console.log(`Portrait saved: ${outputPath}`);
  return outputPath;
}

async function generateBall(client: ComfyUIClient, ballId: string, seed?: number) {
  const ball = BALL_SKINS.find((b) => b.id === ballId);
  if (!ball) {
    throw new Error(`Unknown ball skin: ${ballId}`);
  }

  console.log(`Generating ball skin: ${ball.id}...`);

  const tempDir = path.join(TEMP_OUTPUT_PATH, 'balls', ballId);
  await fs.mkdir(tempDir, { recursive: true });

  const framePaths: string[] = [];
  const baseSeed = seed ?? Math.floor(Math.random() * 2147483647);

  // Generate 8 rotation frames
  for (let i = 0; i < 8; i++) {
    console.log(`  Frame ${i + 1}/8...`);

    const prompt = `${GLOBAL_STYLE_HEADER}, pixel art volleyball, 16x16 readable silhouette, ${ball.theme}, rotation frame ${i + 1}/8, rotation angle ${i * 45} degrees, crisp pixels, plain transparent background, no backdrop, no vignette, isolated sprite`;

    const workflow = await buildWorkflow({
      positivePrompt: prompt,
      negativePrompt: NEGATIVE_PROMPT_SPRITE,
      width: GENERATION_SIZES.ball.width,
      height: GENERATION_SIZES.ball.height,
      seed: baseSeed + i,
      outputPrefix: `ball_${ballId}_${i}`,
    });

    const { images } = await client.generate(workflow);

    // Post-process
    const processedPath = path.join(tempDir, `frame_${i}.png`);
    await processImage(images[0], {
      assetType: 'ball',
      outputPath: processedPath,
    });

    framePaths.push(processedPath);
  }

  // Assemble into 128x16 spritesheet
  const { assembleSpritesheet } = await import('./postprocess/image-processor');
  const outputPath = path.join(OUTPUT_PATH, 'sprites', 'balls', `${ballId}-spin.png`);
  await assembleSpritesheet(framePaths, outputPath, {
    columns: 8,
    rows: 1,
    frameWidth: 16,
    frameHeight: 16,
  });

  console.log(`Ball spritesheet saved: ${outputPath}`);
  return outputPath;
}

async function generateBackgroundLayer(
  client: ComfyUIClient,
  courtId: string,
  layerName: string,
  seed?: number
) {
  const court = BACKGROUNDS[courtId as keyof typeof BACKGROUNDS];
  if (!court) {
    throw new Error(`Unknown court: ${courtId}`);
  }

  const layer = court.layers.find((l) => l.name === layerName);
  if (!layer) {
    throw new Error(`Unknown layer: ${layerName} for court ${courtId}`);
  }

  console.log(`Generating ${court.name} - ${layer.name}...`);

  const otherLayers = court.layers.filter((l) => l.name !== layerName).map((l) => l.name);
  const excludeText = otherLayers.length > 0 ? `no ${otherLayers.join(', no ')}` : '';

  const prompt = `${BACKGROUND_STYLE_HEADER}, ${court.theme}, layer: ${layer.name}, ${layer.description}, ${excludeText}, ${layer.name === 'ground' || layer.name === 'sand' ? 'no transparency' : 'transparent background where no elements'}`;

  const workflow = await buildWorkflow({
    positivePrompt: prompt,
    negativePrompt: NEGATIVE_PROMPT_BACKGROUND,
    width: GENERATION_SIZES.background.width,
    height: GENERATION_SIZES.background.height,
    seed,
    outputPrefix: `bg_${courtId}_${layerName}`,
  });

  const { images } = await client.generate(workflow);

  // Post-process
  const outputPath = path.join(
    OUTPUT_PATH,
    'sprites',
    'backgrounds',
    courtId,
    `${layer.name}.png`
  );
  await processImage(images[0], {
    assetType: 'background',
    outputPath,
  });

  console.log(`Background layer saved: ${outputPath}`);
  return outputPath;
}

async function generateFullBackground(client: ComfyUIClient, courtId: string, seed?: number) {
  const court = BACKGROUNDS[courtId as keyof typeof BACKGROUNDS];
  if (!court) {
    throw new Error(`Unknown court: ${courtId}`);
  }

  console.log(`\nGenerating full background for ${court.name}...`);

  const baseSeed = seed ?? Math.floor(Math.random() * 2147483647);
  const outputPaths: string[] = [];

  for (let i = 0; i < court.layers.length; i++) {
    const layer = court.layers[i];
    const outputPath = await generateBackgroundLayer(client, courtId, layer.name, baseSeed + i);
    outputPaths.push(outputPath);
  }

  return outputPaths;
}

async function main() {
  if (values.help) {
    printHelp();
    return;
  }

  const client = new ComfyUIClient(COMFYUI_URL);

  // Test mode
  if (values.test) {
    await testConnection(client);
    return;
  }

  // Verify connection first
  const connected = await testConnection(client);
  if (!connected) {
    process.exit(1);
  }

  const seed = values.seed ? parseInt(values.seed, 10) : undefined;

  switch (values.type) {
    case 'character':
      if (values.all) {
        for (const charId of Object.keys(CHARACTERS)) {
          const outputPath = await generateCharacterSpritesheet(client, charId, { seed });
          if (values.validate) {
            const valid = await validateAndReport(outputPath, 'character');
            if (!valid) process.exit(1);
          }
        }
      } else if (values.id) {
        if (values.animation !== undefined && values.frame !== undefined) {
          // Single frame (no validation - intermediate output)
          const buffer = await generateCharacterFrame(client, {
            characterId: values.id,
            animation: values.animation,
            frame: parseInt(values.frame, 10),
            seed,
          });
          const outputPath = path.join(
            TEMP_OUTPUT_PATH,
            `char_${values.id}_${values.animation}_${values.frame}.png`
          );
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await fs.writeFile(outputPath, buffer);
          console.log(`Saved: ${outputPath}`);
        } else {
          // Full spritesheet
          const outputPath = await generateCharacterSpritesheet(client, values.id, { seed });
          if (values.validate) {
            const valid = await validateAndReport(outputPath, 'character');
            if (!valid) process.exit(1);
          }
        }
      } else {
        console.error('Please specify --id <character> or --all');
      }
      break;

    case 'portrait':
      if (values.all) {
        for (const charId of Object.keys(CHARACTERS)) {
          const outputPath = await generatePortrait(client, charId, seed);
          if (values.validate) {
            const valid = await validateAndReport(outputPath, 'portrait');
            if (!valid) process.exit(1);
          }
        }
      } else if (values.id) {
        const outputPath = await generatePortrait(client, values.id, seed);
        if (values.validate) {
          const valid = await validateAndReport(outputPath, 'portrait');
          if (!valid) process.exit(1);
        }
      } else {
        console.error('Please specify --id <character> or --all');
      }
      break;

    case 'ball':
      if (values.all) {
        for (const ball of BALL_SKINS) {
          const outputPath = await generateBall(client, ball.id, seed);
          if (values.validate) {
            const valid = await validateAndReport(outputPath, 'ball');
            if (!valid) process.exit(1);
          }
        }
      } else if (values.id) {
        const outputPath = await generateBall(client, values.id, seed);
        if (values.validate) {
          const valid = await validateAndReport(outputPath, 'ball');
          if (!valid) process.exit(1);
        }
      } else {
        console.error('Please specify --id <ball-skin> or --all');
      }
      break;

    case 'background':
      if (values.court) {
        if (values.layer) {
          const outputPath = await generateBackgroundLayer(client, values.court, values.layer, seed);
          if (values.validate) {
            const valid = await validateAndReport(outputPath, 'background');
            if (!valid) process.exit(1);
          }
        } else {
          const outputPaths = await generateFullBackground(client, values.court, seed);
          if (values.validate) {
            for (const outputPath of outputPaths) {
              const valid = await validateAndReport(outputPath, 'background');
              if (!valid) process.exit(1);
            }
          }
        }
      } else if (values.all) {
        for (const courtId of Object.keys(BACKGROUNDS)) {
          const outputPaths = await generateFullBackground(client, courtId, seed);
          if (values.validate) {
            for (const outputPath of outputPaths) {
              const valid = await validateAndReport(outputPath, 'background');
              if (!valid) process.exit(1);
            }
          }
        }
      } else {
        console.error('Please specify --court <court-id> or --all');
      }
      break;

    case 'audio':
      // Check if MusicGen nodes are available
      const audioAvailable = await checkAudioNodesAvailable(client);
      if (!audioAvailable) {
        console.error('\n✗ MusicGen nodes not available');
        console.error('  Please restart ComfyUI to load the ComfyUI-audio extension');
        console.error('  Extension location: ComfyUI/custom_nodes/ComfyUI-audio/');
        process.exit(1);
      }

      if (values.all) {
        for (const audioId of Object.keys(AUDIO_PROMPTS)) {
          await generateAudio(client, { audioId, seed });
        }
      } else if (values.id) {
        await generateAudio(client, { audioId: values.id, seed });
      } else {
        console.error('Please specify --id <audio-id> or --all');
        console.error(`Available: ${Object.keys(AUDIO_PROMPTS).join(', ')}`);
      }
      break;

    default:
      printHelp();
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
