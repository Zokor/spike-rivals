import { v4 as uuidv4 } from 'uuid';
import type {
  Workflow,
  PromptRequest,
  PromptResponse,
  HistoryItem,
  ImageOutput,
  SystemStats,
} from './types';

export class ComfyUIClient {
  private baseUrl: string;
  private clientId: string;

  constructor(baseUrl = 'http://127.0.0.1:8188') {
    this.baseUrl = baseUrl;
    this.clientId = uuidv4();
  }

  /**
   * Check if ComfyUI is running and get system stats
   */
  async getSystemStats(): Promise<SystemStats> {
    const response = await fetch(`${this.baseUrl}/system_stats`);
    if (!response.ok) {
      throw new Error(`Failed to get system stats: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get available checkpoints and loras
   */
  async getObjectInfo(): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/object_info`);
    if (!response.ok) {
      throw new Error(`Failed to get object info: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Queue a workflow for execution
   */
  async queuePrompt(workflow: Workflow): Promise<PromptResponse> {
    const request: PromptRequest = {
      client_id: this.clientId,
      prompt: workflow,
    };

    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to queue prompt: ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get the execution history for a prompt
   */
  async getHistory(promptId: string): Promise<HistoryItem | null> {
    const response = await fetch(`${this.baseUrl}/history/${promptId}`);
    if (!response.ok) {
      return null;
    }
    const history = await response.json();
    return history[promptId] || null;
  }

  /**
   * Wait for a prompt to complete
   */
  async waitForCompletion(
    promptId: string,
    options: { timeoutMs?: number; pollIntervalMs?: number } = {}
  ): Promise<HistoryItem> {
    const { timeoutMs = 300000, pollIntervalMs = 1000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const history = await this.getHistory(promptId);

      if (history?.status?.completed) {
        return history;
      }

      // Check for errors
      if (history?.status?.status_str === 'error') {
        throw new Error(`Generation failed: ${JSON.stringify(history.status.messages)}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Generation timed out after ${timeoutMs}ms`);
  }

  /**
   * Download a generated image
   */
  async downloadImage(output: ImageOutput): Promise<Buffer> {
    const params = new URLSearchParams({
      filename: output.filename,
      subfolder: output.subfolder,
      type: output.type,
    });

    const response = await fetch(`${this.baseUrl}/view?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Generate an image and return the buffer
   */
  async generate(workflow: Workflow): Promise<{ images: Buffer[]; outputs: ImageOutput[] }> {
    // Queue the prompt
    const { prompt_id } = await this.queuePrompt(workflow);
    console.log(`Queued prompt: ${prompt_id}`);

    // Wait for completion
    const history = await this.waitForCompletion(prompt_id);

    // Find all image outputs
    const imageOutputs: ImageOutput[] = [];
    for (const nodeOutput of Object.values(history.outputs)) {
      if (nodeOutput.images) {
        imageOutputs.push(...nodeOutput.images);
      }
    }

    if (imageOutputs.length === 0) {
      throw new Error('No images generated');
    }

    // Download all images
    const images: Buffer[] = [];
    for (const output of imageOutputs) {
      const buffer = await this.downloadImage(output);
      images.push(buffer);
    }

    return { images, outputs: imageOutputs };
  }
}

export const client = new ComfyUIClient();
