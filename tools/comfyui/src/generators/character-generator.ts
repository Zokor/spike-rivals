import * as fs from 'fs/promises';
import * as path from 'path';
import { ComfyUIClient } from '../api/comfyui-client';
import { buildWorkflow } from './workflow-builder';
import { processImage, assembleSpritesheet } from '../postprocess/image-processor';
import {
  CHARACTERS,
  ANIMATIONS,
  GLOBAL_STYLE_HEADER,
  NEGATIVE_PROMPT_SPRITE,
  GENERATION_SIZES,
  TEMP_OUTPUT_PATH,
  OUTPUT_PATH,
} from '../config';

interface GenerateOptions {
  characterId: string;
  animation?: string;
  frame?: number;
  seed?: number;
}

/**
 * Build prompt for a character animation frame
 */
function buildCharacterPrompt(
  characterId: string,
  animation: string,
  frameIndex: number,
  frameDescription: string
): string {
  const character = CHARACTERS[characterId as keyof typeof CHARACTERS];
  if (!character) {
    throw new Error(`Unknown character: ${characterId}`);
  }

  return `${GLOBAL_STYLE_HEADER}, single sprite frame for a 24x32 character animation, ${character.traits}, ${animation} animation frame ${frameIndex + 1}, ${frameDescription}, side view facing right, consistent proportions, feet locked to baseline, exaggerated readable pose, plain transparent background, no backdrop, no gradient, no vignette, isolated sprite`;
}

/**
 * Generate a single character frame
 */
export async function generateCharacterFrame(
  client: ComfyUIClient,
  options: GenerateOptions
): Promise<Buffer> {
  const { characterId, animation = 'idle', frame = 0, seed } = options;

  const anim = ANIMATIONS.find((a) => a.name === animation);
  if (!anim) {
    throw new Error(`Unknown animation: ${animation}`);
  }

  if (frame >= anim.frames) {
    throw new Error(`Frame ${frame} out of range for ${animation} (max: ${anim.frames - 1})`);
  }

  const prompt = buildCharacterPrompt(characterId, animation, frame, anim.descriptions[frame]);

  console.log(`Generating ${characterId} ${animation} frame ${frame}...`);

  const workflow = await buildWorkflow({
    positivePrompt: prompt,
    negativePrompt: NEGATIVE_PROMPT_SPRITE,
    width: GENERATION_SIZES.character.width,
    height: GENERATION_SIZES.character.height,
    seed,
    outputPrefix: `char_${characterId}_${animation}_${frame}`,
  });

  const { images } = await client.generate(workflow);
  return images[0];
}

/**
 * Generate all frames for a character and assemble into spritesheet
 */
export async function generateCharacterSpritesheet(
  client: ComfyUIClient,
  characterId: string,
  options: { seed?: number } = {}
): Promise<string> {
  const character = CHARACTERS[characterId as keyof typeof CHARACTERS];
  if (!character) {
    throw new Error(`Unknown character: ${characterId}`);
  }

  console.log(`\nGenerating full spritesheet for ${character.name}...`);

  // Create temp directory for frames
  const tempDir = path.join(TEMP_OUTPUT_PATH, 'characters', characterId);
  await fs.mkdir(tempDir, { recursive: true });

  const framePaths: string[] = [];
  const baseSeed = options.seed ?? Math.floor(Math.random() * 2147483647);

  // Generate all 40 frames (10 cols x 4 rows)
  // Seed scheme: animationSeed = baseSeed + (animIndex * 1000), frameSeed = animationSeed + frameIndex
  let frameIndex = 0;
  let animationIndex = 0;
  for (const anim of ANIMATIONS) {
    // Each animation gets a seed range of 1000 for pose continuity
    const animationSeed = baseSeed + animationIndex * 1000;

    for (let f = 0; f < anim.frames; f++) {
      console.log(
        `  [${frameIndex + 1}/40] ${anim.name} frame ${f + 1}/${anim.frames}...`
      );

      // frameSeed varies slightly within animation for subtle differences
      const frameSeed = animationSeed + f;
      const imageBuffer = await generateCharacterFrame(client, {
        characterId,
        animation: anim.name,
        frame: f,
        seed: frameSeed,
      });

      // Post-process the frame
      const rawPath = path.join(tempDir, `raw_${frameIndex}.png`);
      const processedPath = path.join(tempDir, `frame_${frameIndex}.png`);

      await fs.writeFile(rawPath, imageBuffer);
      await processImage(imageBuffer, {
        assetType: 'character',
        outputPath: processedPath,
      });

      framePaths.push(processedPath);
      frameIndex++;
    }

    animationIndex++;
  }

  // Verify we have exactly 40 frames (animations must sum to 40)
  if (framePaths.length !== 40) {
    throw new Error(`Expected 40 frames but got ${framePaths.length}. Check ANIMATIONS config.`);
  }

  // Assemble spritesheet
  const outputPath = path.join(OUTPUT_PATH, 'sprites', 'characters', `${characterId}.png`);
  await assembleSpritesheet(framePaths, outputPath, {
    columns: 10,
    rows: 4,
    frameWidth: 24,
    frameHeight: 32,
  });

  console.log(`  Spritesheet saved: ${outputPath}`);
  return outputPath;
}
