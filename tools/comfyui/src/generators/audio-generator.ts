import * as fs from 'fs/promises';
import * as path from 'path';
import { ComfyUIClient } from '../api/comfyui-client';
import type { Workflow } from '../api/types';
import { AUDIO_CONFIG, AUDIO_PROMPTS, OUTPUT_PATH, TEMP_OUTPUT_PATH } from '../config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface AudioGenerateOptions {
  audioId: string;
  seed?: number;
}

/**
 * Build MusicGen workflow from template
 */
async function buildAudioWorkflow(params: {
  prompt: string;
  duration: number;
  seed?: number;
  outputPrefix?: string;
}): Promise<Workflow> {
  const templatePath = path.resolve(__dirname, '../../workflows/musicgen-hf.json');
  const templateStr = await fs.readFile(templatePath, 'utf-8');

  const replacements: Record<string, string | number> = {
    __MODEL_NAME__: AUDIO_CONFIG.model,
    __PROMPT__: params.prompt,
    __DURATION__: params.duration,
    __SEED__: params.seed ?? Math.floor(Math.random() * 2147483647),
    __OUTPUT_PREFIX__: params.outputPrefix ?? 'audio',
  };

  let result = templateStr;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`"${placeholder}"`, 'g'), JSON.stringify(value));
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }

  return JSON.parse(result);
}

/**
 * Get output path based on audio type
 */
function getOutputPath(audioId: string, type: string): string {
  const extension = type === 'music' || type === 'stinger' ? 'mp3' : 'wav';
  const subdir = type === 'stinger' ? 'stingers' : type;
  return path.join(OUTPUT_PATH, 'audio', subdir, `${audioId}.${extension}`);
}

/**
 * Post-process audio (normalize, convert format)
 */
async function processAudio(
  inputPath: string,
  outputPath: string,
  type: string
): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const extension = path.extname(outputPath).slice(1);

  let command = `ffmpeg -y -i "${inputPath}"`;

  // Normalize to -14 LUFS
  command += ` -af "loudnorm=I=-14:TP=-1:LRA=11"`;

  // Output format
  if (extension === 'mp3') {
    command += ` -c:a libmp3lame -b:a 192k`;
  } else if (extension === 'wav') {
    command += ` -c:a pcm_s16le`;
  }

  command += ` "${outputPath}"`;

  await execAsync(command);
}

/**
 * Generate audio using MusicGen
 */
export async function generateAudio(
  client: ComfyUIClient,
  options: AudioGenerateOptions
): Promise<string> {
  const { audioId, seed } = options;

  const audioConfig = AUDIO_PROMPTS[audioId as keyof typeof AUDIO_PROMPTS];
  if (!audioConfig) {
    throw new Error(`Unknown audio ID: ${audioId}. Available: ${Object.keys(AUDIO_PROMPTS).join(', ')}`);
  }

  console.log(`Generating audio: ${audioId} (${audioConfig.type}, ${audioConfig.duration}s)...`);

  const workflow = await buildAudioWorkflow({
    prompt: audioConfig.prompt,
    duration: audioConfig.duration,
    seed,
    outputPrefix: `audio_${audioId}`,
  });

  // Queue and wait
  const { prompt_id } = await client.queuePrompt(workflow);
  console.log(`  Queued: ${prompt_id}`);

  const history = await client.waitForCompletion(prompt_id, { timeoutMs: 600000 }); // 10 min timeout for audio

  // Find audio output
  let audioOutput = null;
  for (const nodeOutput of Object.values(history.outputs)) {
    if (nodeOutput.audio && nodeOutput.audio.length > 0) {
      audioOutput = nodeOutput.audio[0];
      break;
    }
  }

  if (!audioOutput) {
    throw new Error('No audio generated');
  }

  // Download raw audio
  const tempDir = path.join(TEMP_OUTPUT_PATH, 'audio');
  await fs.mkdir(tempDir, { recursive: true });
  const tempPath = path.join(tempDir, `${audioId}_raw.wav`);

  const params = new URLSearchParams({
    filename: audioOutput.filename,
    subfolder: audioOutput.subfolder || '',
    type: audioOutput.type,
  });
  const response = await fetch(`${client['baseUrl']}/view?${params}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(tempPath, buffer);

  // Post-process
  const outputPath = getOutputPath(audioId, audioConfig.type);
  await processAudio(tempPath, outputPath, audioConfig.type);

  console.log(`  Saved: ${outputPath}`);
  return outputPath;
}

/**
 * Check if MusicGen nodes are available
 */
export async function checkAudioNodesAvailable(client: ComfyUIClient): Promise<boolean> {
  try {
    const response = await fetch(`${client['baseUrl']}/object_info/MusicgenHFLoader`);
    return response.ok;
  } catch {
    return false;
  }
}
