/**
 * ComfyUI Client
 *
 * Robust TypeScript client for communicating with ComfyUI server.
 * Handles all HTTP communication, error handling, and state management.
 */

import { ComfyUIWorkflow } from './types';

/**
 * Response from /prompt endpoint
 */
export interface ComfyUIQueueResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, unknown>;
}

/**
 * Queue status response from /queue endpoint
 */
export interface ComfyUIQueueStatus {
  queue_pending: Array<[string, number]>;
  queue_running: Array<[string, number]>;
}

/**
 * Node output definition
 */
export interface NodeOutput {
  [key: string]: string | string[];
}

/**
 * Node definition from /object_info
 */
export interface NodeDefinition {
  display: string;
  category: string;
  output: string[];
  output_tooltips?: string[];
  output_node?: boolean;
  description?: string;
  python_type?: string;
  type_hints?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  inputs_dict?: Record<string, unknown>;
}

/**
 * Complete object info from /object_info endpoint
 */
export interface ComfyUIObjectInfo {
  [nodeType: string]: NodeDefinition;
}

/**
 * Image output from a node
 */
export interface ComfyUIImageOutput {
  filename: string;
  subfolder?: string;
  type?: string;
}

/**
 * Node output structure
 */
export interface ComfyUINodeOutput {
  images?: ComfyUIImageOutput[];
  [key: string]: unknown;
}

/**
 * Single execution entry from history
 */
export interface ComfyUIExecutionEntry {
  prompt: ComfyUIWorkflow;
  outputs: Record<string, ComfyUINodeOutput>;
  status: {
    status_str: string;
    completed: boolean;
    messages: string[];
  };
}

/**
 * History response structure
 */
export interface ComfyUIHistoryResponse {
  [promptId: string]: ComfyUIExecutionEntry;
}

/**
 * Single history entry
 */
export type ComfyUIHistoryEntry = ComfyUIExecutionEntry;

/**
 * ComfyUI Client for managing workflow execution and communication
 */
export class ComfyUIClient {
  private baseUrl: string;
  private clientId: string;
  private readonly requestTimeout = 30000; // 30 seconds

  /**
   * Create a new ComfyUI client instance
   * @param baseUrl - Optional base URL for ComfyUI server (defaults to env variable or localhost:8188)
   */
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.COMFYUI_BASE_URL || 'http://localhost:8188';

    // Remove trailing slash if present
    this.baseUrl = this.baseUrl.replace(/\/$/, '');

    // Generate unique client ID
    this.clientId = this.generateClientId();
  }

  /**
   * Get the current client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Generate a unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Make a fetch request with timeout and error handling
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if the ComfyUI server is running and accessible
   */
  async checkConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/system_stats`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        console.error(`[ComfyUI] Server responded with status ${response.status}`);
        return false;
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ComfyUI] Connection check failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get all available node definitions from the server
   */
  async getNodeDefinitions(): Promise<ComfyUIObjectInfo> {
    try {
      const url = `${this.baseUrl}/object_info`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = (await response.json()) as ComfyUIObjectInfo;
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ComfyUI] Failed to get node definitions: ${errorMessage}`);
      throw new Error(`Failed to fetch node definitions: ${errorMessage}`);
    }
  }

  /**
   * Queue a workflow for execution
   */
  async queuePrompt(workflow: ComfyUIWorkflow): Promise<ComfyUIQueueResponse> {
    try {
      const url = `${this.baseUrl}/prompt`;
      const body = {
        prompt: workflow,
        client_id: this.clientId,
      };

      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as ComfyUIQueueResponse;
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ComfyUI] Failed to queue prompt: ${errorMessage}`);
      throw new Error(`Failed to queue workflow: ${errorMessage}`);
    }
  }

  /**
   * Get the current queue status
   */
  async getQueue(): Promise<ComfyUIQueueStatus> {
    try {
      const url = `${this.baseUrl}/queue`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = (await response.json()) as ComfyUIQueueStatus;
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ComfyUI] Failed to get queue status: ${errorMessage}`);
      throw new Error(`Failed to fetch queue status: ${errorMessage}`);
    }
  }

  /**
   * Get execution history for a specific prompt ID
   */
  async getHistory(promptId: string): Promise<ComfyUIHistoryEntry | null> {
    try {
      const url = `${this.baseUrl}/history/${encodeURIComponent(promptId)}`;
      const response = await this.fetchWithTimeout(url);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = (await response.json()) as ComfyUIHistoryResponse;
      const entry = data[promptId];

      if (!entry) {
        return null;
      }

      return entry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ComfyUI] Failed to get history for ${promptId}: ${errorMessage}`);
      throw new Error(`Failed to fetch history: ${errorMessage}`);
    }
  }

  /**
   * Download an image result from the server
   */
  async getImage(filename: string, subfolder: string = '', type: string = 'output'): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('filename', filename);

      if (subfolder) {
        params.append('subfolder', subfolder);
      }

      params.append('type', type);

      const url = `${this.baseUrl}/view?${params.toString()}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ComfyUI] Failed to get image ${filename}: ${errorMessage}`);
      throw new Error(`Failed to download image: ${errorMessage}`);
    }
  }

  /**
   * Cancel execution of a queued or running prompt
   */
  async cancelPrompt(promptId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/interrupt`;
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ComfyUI] Failed to cancel prompt ${promptId}: ${errorMessage}`);
      throw new Error(`Failed to cancel prompt: ${errorMessage}`);
    }
  }

  /**
   * Set a new base URL for the client
   * Useful for dynamic server configuration
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

/**
 * Singleton instance of ComfyUI client
 * Use this for all ComfyUI communication
 */
export const comfyUIClient = new ComfyUIClient();
