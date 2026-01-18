export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaTagResponse {
  models: OllamaModel[];
}

export interface OllamaPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

/**
 * List installed Ollama models
 */
export async function getInstalledModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!res.ok) throw new Error('Failed to fetch local models');
    const data: OllamaTagResponse = await res.json();
    return data.models;
  } catch (error) {
    console.error('Ollama connection error:', error);
    return [];
  }
}

/**
 * Pull a model from Ollama Library (Streaming)
 * Returns the raw Response object to be piped to the client
 */
export async function pullModelStream(modelName: string): Promise<Response> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: true }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to start pull: ${errorText}`);
  }

  return res;
}
