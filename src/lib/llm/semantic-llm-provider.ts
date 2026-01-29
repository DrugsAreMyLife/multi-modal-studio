import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type LLMProvider = 'openai' | 'anthropic' | 'ollama';

export interface SemanticConstraint {
  id: string;
  type: 'geometric' | 'material' | 'structural' | 'creative';
  key: string;
  value: string | number;
  confidence: number;
  source: string;
}

export interface AnalyzeConstraintsOptions {
  text: string;
  domain: 'geometric' | 'material' | 'structural' | 'creative';
  provider?: LLMProvider;
}

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

const DEFAULT_CONFIG: LLMConfig = {
  provider: (process.env.LLM_PROVIDER as LLMProvider) || 'anthropic',
  model: process.env.LLM_MODEL,
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
};

export class SemanticLLMProvider {
  private config: LLMConfig;
  private anthropic?: Anthropic;
  private openai?: OpenAI;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeClients();
  }

  private initializeClients() {
    if (this.config.provider === 'anthropic' && this.config.apiKey) {
      this.anthropic = new Anthropic({ apiKey: this.config.apiKey });
    }
    if (this.config.provider === 'openai' && this.config.apiKey) {
      this.openai = new OpenAI({ apiKey: this.config.apiKey });
    }
  }

  async analyzeConstraints(options: AnalyzeConstraintsOptions): Promise<SemanticConstraint[]> {
    const { text, domain, provider = this.config.provider } = options;

    const systemPrompt = this.getSystemPrompt(domain);
    const userPrompt = `Analyze the following text and extract ${domain} constraints. Return JSON array of constraints.\n\nText: ${text}`;

    let response: string;

    switch (provider) {
      case 'anthropic':
        response = await this.callAnthropic(systemPrompt, userPrompt);
        break;
      case 'openai':
        response = await this.callOpenAI(systemPrompt, userPrompt);
        break;
      case 'ollama':
        response = await this.callOllama(systemPrompt, userPrompt);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    return this.parseConstraints(response, domain);
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<string> {
    const provider = this.config.provider;
    const system = systemPrompt || 'You are a professional pharmacological content creator.';

    switch (provider) {
      case 'anthropic':
        return await this.callAnthropic(system, prompt);
      case 'openai':
        return await this.callOpenAI(system, prompt);
      case 'ollama':
        return await this.callOllama(system, prompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callAnthropic(system: string, user: string): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const response = await this.anthropic.messages.create({
      model: this.config.model || 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return (textBlock as { type: 'text'; text: string })?.text || '';
  }

  private async callOpenAI(system: string, user: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const response = await this.openai.chat.completions.create({
      model: this.config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    });

    return response.choices[0]?.message?.content || '';
  }

  private async callOllama(system: string, user: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'llama3.2',
        prompt: `${system}\n\n${user}`,
        format: 'json',
        stream: false,
      }),
    });

    const data = await response.json();
    return data.response || '';
  }

  private getSystemPrompt(domain: string): string {
    const prompts: Record<string, string> = {
      geometric:
        'You are a geometric constraint analyzer. Extract pitch, tolerances, dimensions, and spatial relationships. Return JSON array.',
      material:
        'You are a material properties analyzer. Extract polymers, densities, thermal properties, and material specifications. Return JSON array.',
      structural:
        'You are a structural requirements analyzer. Extract load requirements, safety factors, and stress limits. Return JSON array.',
      creative:
        'You are a creative intent analyzer. Extract Adobe-style operations, filters, transformations, and visual effects. Return JSON array.',
    };
    return prompts[domain] || prompts.geometric;
  }

  private parseConstraints(response: string, domain: string): SemanticConstraint[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: Record<string, unknown>, i: number) => ({
        id: `constraint_${Date.now()}_${i}`,
        type: domain,
        key: item.key || item.name || 'unknown',
        value: item.value,
        confidence: (item.confidence as number) || 0.8,
        source: 'llm',
      }));
    } catch {
      return [];
    }
  }
}

// Singleton instance
let instance: SemanticLLMProvider | null = null;

export function getSemanticLLMProvider(): SemanticLLMProvider {
  if (!instance) {
    instance = new SemanticLLMProvider();
  }
  return instance;
}
