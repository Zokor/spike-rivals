import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export type AssetType = 'character' | 'ball' | 'portrait' | 'background';

interface ProcessOptions {
  assetType: AssetType;
  outputPath: string;
}

/**
 * Asset-specific processing configurations
 */
const ASSET_CONFIGS = {
  character: {
    width: 24,
    height: 32,
    maxColors: 16,
    addOutline: true,
    outlineColor: '#1a1a1a',
  },
  ball: {
    width: 16,
    height: 16,
    maxColors: 16,
    addOutline: true,
    outlineColor: '#1a1a1a',
  },
  portrait: {
    width: 80,
    height: 80,
    maxColors: 32, // More colors allowed for portraits
    addOutline: false,
  },
  background: {
    width: 480,
    height: 270,
    maxColors: null, // No color reduction for backgrounds
    addOutline: false,
  },
};

/**
 * Process a generated image based on asset type
 */
export async function processImage(
  inputBuffer: Buffer,
  options: ProcessOptions
): Promise<void> {
  const { assetType, outputPath } = options;
  const config = ASSET_CONFIGS[assetType];

  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // Write input buffer to temp file
  const tempInput = `${outputPath}.temp.png`;
  await fs.writeFile(tempInput, inputBuffer);

  try {
    // Build ImageMagick command based on asset type
    let command = `magick "${tempInput}"`;

    // 0. Ensure alpha channel exists (required for transparency)
    command += ` -alpha on`;

    // 1. Downscale with nearest-neighbor (all asset types)
    command += ` -filter Point -resize ${config.width}x${config.height}!`;

    // 2. Remove anti-aliasing from alpha (all asset types)
    command += ` -channel A -threshold 50% +channel`;

    // 3. Reduce colors (not for backgrounds)
    if (config.maxColors) {
      command += ` -colors ${config.maxColors} -dither None`;
    }

    // 4. Force RGBA PNG output (preserve alpha channel)
    command += ` -define png:color-type=6 "${outputPath}"`;

    await execAsync(command);

    // 4. Add outline for characters and balls
    if (config.addOutline) {
      await addPixelOutline(outputPath, outputPath, config.outlineColor!);
    }
  } finally {
    // Clean up temp file
    await fs.unlink(tempInput).catch(() => {});
  }
}

/**
 * Add a 1px dark outline to an image
 */
async function addPixelOutline(
  inputPath: string,
  outputPath: string,
  color: string
): Promise<void> {
  const command = `magick "${inputPath}" \\
    \\( +clone -alpha extract -morphology Dilate Square:1 \\) \\
    -compose DstOver -composite \\
    \\( +clone -alpha extract -fill "${color}" -colorize 100% \\) \\
    -compose DstOver -composite \\
    "${outputPath}"`;

  await execAsync(command);
}

/**
 * Assemble multiple frames into a spritesheet
 */
export async function assembleSpritesheet(
  framePaths: string[],
  outputPath: string,
  options: { columns: number; rows: number; frameWidth: number; frameHeight: number }
): Promise<void> {
  const { columns, rows, frameWidth, frameHeight } = options;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const frameArgs = framePaths.map((p) => `"${p}"`).join(' ');
  const command = `magick montage ${frameArgs} \\
    -filter Point \\
    -tile ${columns}x${rows} \\
    -geometry ${frameWidth}x${frameHeight}+0+0 \\
    -background transparent \\
    -depth 8 \\
    "${outputPath}"`;

  await execAsync(command);
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  imagePath: string
): Promise<{ width: number; height: number }> {
  const { stdout } = await execAsync(`magick identify -format "%wx%h" "${imagePath}"`);
  const [width, height] = stdout.trim().split('x').map(Number);
  return { width, height };
}

/**
 * Get color count in an image
 */
export async function getColorCount(imagePath: string): Promise<number> {
  const { stdout } = await execAsync(`magick identify -format "%k" "${imagePath}"`);
  return parseInt(stdout.trim(), 10);
}

/**
 * Validate a processed asset
 */
export async function validateAsset(
  imagePath: string,
  assetType: AssetType
): Promise<{ valid: boolean; errors: string[] }> {
  const config = ASSET_CONFIGS[assetType];
  const errors: string[] = [];

  try {
    // Check dimensions
    const dims = await getImageDimensions(imagePath);
    if (dims.width !== config.width || dims.height !== config.height) {
      errors.push(
        `Expected ${config.width}x${config.height}, got ${dims.width}x${dims.height}`
      );
    }

    // Check color count (if applicable)
    if (config.maxColors) {
      const colorCount = await getColorCount(imagePath);
      if (colorCount > config.maxColors) {
        errors.push(`Has ${colorCount} colors, max is ${config.maxColors}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to read image: ${error}`);
  }

  return { valid: errors.length === 0, errors };
}
