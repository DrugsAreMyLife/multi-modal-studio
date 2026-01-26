import { supabase } from '@/lib/db/server';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { generateText } from 'ai';

/**
 * Automated Tutorial Generation System
 * Uses LLMs to create usage guides for newly available models
 */
export class TutorialGenerator {
  /**
   * Generates a comprehensive tutorial for a model
   */
  async generateForModel(modelId: string) {
    console.log(`[*] Generating tutorial for ${modelId}...`);

    // 1. Get model config
    const { data: model } = await supabase
      .from('model_registry')
      .select('*')
      .eq('id', modelId)
      .single();

    if (!model) return;

    // 2. Use LLM to generate content
    const modelInstance = createUniversalModel('openai', 'gpt-5');
    const { text } = await generateText({
      model: modelInstance,
      prompt: `Create a concise technical tutorial for the AI model: ${modelId}.
               Name: ${model.name}
               Provider: ${model.provider}
               Type: ${model.type}
               
               Include:
               - Overview
               - Best prompt patterns
               - Sample JSON payload for API usage
               - Limitations`,
    });

    // 3. Save to DB
    const { error } = await supabase.from('model_tutorials').upsert({
      model_id: modelId,
      content_markdown: text,
      last_generated_at: new Date().toISOString(),
    });

    if (error) throw error;

    console.log(`[+] Tutorial generated for ${modelId}`);
    return text;
  }
}

export const tutorialGenerator = new TutorialGenerator();
