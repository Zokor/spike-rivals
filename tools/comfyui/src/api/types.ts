export interface ComfyUINode {
  class_type: string;
  inputs: Record<string, unknown>;
}

export type Workflow = Record<string, ComfyUINode>;

export interface PromptRequest {
  client_id: string;
  prompt: Workflow;
}

export interface PromptResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, unknown>;
}

export interface ImageOutput {
  filename: string;
  subfolder: string;
  type: string;
}

export interface NodeOutput {
  images?: ImageOutput[];
  audio?: ImageOutput[];
}

export interface HistoryStatus {
  status_str: string;
  completed: boolean;
  messages: Array<[string, Record<string, unknown>]>;
}

export interface HistoryItem {
  prompt: [number, string, Workflow, Record<string, unknown>, string[]];
  outputs: Record<string, NodeOutput>;
  status: HistoryStatus;
}

export interface SystemStats {
  system: {
    os: string;
    ram_total: number;
    ram_free: number;
    comfyui_version: string;
    python_version: string;
    pytorch_version: string;
  };
  devices: Array<{
    name: string;
    type: string;
    vram_total: number;
    vram_free: number;
  }>;
}

export interface GenerationConfig {
  seed?: number;
  steps?: number;
  cfg?: number;
  width: number;
  height: number;
  positivePrompt: string;
  negativePrompt: string;
  checkpoint: string;
  loras?: Array<{ name: string; strength: number }>;
  outputPrefix?: string;
}
