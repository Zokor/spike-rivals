import * as fs from 'fs/promises';
import * as path from 'path';
import type { Workflow } from '../api/types';
import { MODEL_CONFIG, GENERATION_DEFAULTS } from '../config';

interface WorkflowParams {
  positivePrompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed?: number;
  steps?: number;
  cfg?: number;
  loraStrength?: number;
  outputPrefix?: string;
}

/**
 * Load and parameterize a workflow template
 */
export async function buildWorkflow(params: WorkflowParams): Promise<Workflow> {
  const templatePath = path.resolve(__dirname, '../../workflows/z-image-turbo.json');
  const templateStr = await fs.readFile(templatePath, 'utf-8');

  const replacements: Record<string, string | number> = {
    __POSITIVE_PROMPT__: params.positivePrompt,
    __NEGATIVE_PROMPT__: params.negativePrompt,
    __WIDTH__: params.width,
    __HEIGHT__: params.height,
    __SEED__: params.seed ?? Math.floor(Math.random() * 2147483647),
    __STEPS__: params.steps ?? GENERATION_DEFAULTS.steps,
    __CFG__: params.cfg ?? GENERATION_DEFAULTS.cfg,
    __LORA_STRENGTH__: params.loraStrength ?? MODEL_CONFIG.loraStrength,
    __OUTPUT_PREFIX__: params.outputPrefix ?? 'spike_rivals',
  };

  let result = templateStr;
  for (const [placeholder, value] of Object.entries(replacements)) {
    // Handle both quoted and unquoted placeholders
    result = result.replace(new RegExp(`"${placeholder}"`, 'g'), JSON.stringify(value));
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }

  return JSON.parse(result);
}
