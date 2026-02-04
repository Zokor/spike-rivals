import sharp from 'sharp';

export type AssetValidationType = 'character' | 'portrait' | 'ball' | 'background';

interface ValidationRule {
  width: number;
  height: number;
  requiresAlpha: boolean;
}

const VALIDATION_RULES: Record<AssetValidationType, ValidationRule> = {
  character: { width: 240, height: 128, requiresAlpha: true },
  portrait: { width: 80, height: 80, requiresAlpha: true },
  ball: { width: 128, height: 16, requiresAlpha: true },
  background: { width: 480, height: 270, requiresAlpha: false },
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  metadata?: {
    width: number;
    height: number;
    hasAlpha: boolean;
  };
}

/**
 * Validate a generated asset file
 */
export async function validateAsset(
  filePath: string,
  assetType: AssetValidationType
): Promise<ValidationResult> {
  const rule = VALIDATION_RULES[assetType];
  const errors: string[] = [];

  try {
    const metadata = await sharp(filePath).metadata();

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const hasAlpha = metadata.hasAlpha ?? false;

    // Check dimensions
    if (width !== rule.width || height !== rule.height) {
      errors.push(
        `Dimension mismatch: expected ${rule.width}×${rule.height}, got ${width}×${height}`
      );
    }

    // Check alpha channel (only for sprites, not backgrounds)
    if (rule.requiresAlpha && !hasAlpha) {
      errors.push('Missing alpha channel: transparent background required');
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata: { width, height, hasAlpha },
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to read image: ${error}`],
    };
  }
}

/**
 * Validate and print results to console
 */
export async function validateAndReport(
  filePath: string,
  assetType: AssetValidationType
): Promise<boolean> {
  console.log(`Validating ${assetType}: ${filePath}`);

  const result = await validateAsset(filePath, assetType);

  if (result.valid) {
    console.log(
      `  ✓ Valid (${result.metadata?.width}×${result.metadata?.height}, alpha: ${result.metadata?.hasAlpha})`
    );
    return true;
  } else {
    console.error(`  ✗ Validation failed:`);
    for (const error of result.errors) {
      console.error(`    - ${error}`);
    }
    return false;
  }
}
