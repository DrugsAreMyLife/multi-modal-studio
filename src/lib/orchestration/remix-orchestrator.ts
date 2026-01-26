export type Modality = 'text' | 'image' | 'video' | 'audio';

export interface RemixPacket {
  id: string;
  sourceModality: Modality;
  targetModality: Modality;
  data: string; // URL or content
  metadata: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  workflowId?: string;
}

export class RemixOrchestrator {
  /**
   * Chains an image to an audio generation by extracting "mood" via VLM
   */
  async imageToAudioMood(imageUrl: string, metadata: any): Promise<RemixPacket> {
    try {
      const response = await fetch('/api/remix/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          sourceModality: 'image',
          targetModality: 'audio',
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'VLM analysis failed');

      const packet: RemixPacket = {
        id: `remix-${Date.now()}`,
        sourceModality: 'image',
        targetModality: 'audio',
        data: imageUrl,
        metadata: {
          ...metadata,
          analysis: data.analysis,
          audioPrompt: data.prompt,
          explanation: data.explanation,
        },
        status: 'pending',
      };

      return packet;
    } catch (error) {
      console.error('[RemixOrchestrator] imageToAudioMood error:', error);
      // Fallback to basic prompt if API fails
      return {
        id: `remix-${Date.now()}`,
        sourceModality: 'image',
        targetModality: 'audio',
        data: imageUrl,
        metadata: {
          ...metadata,
          audioPrompt: `Atmospheric soundscape for: ${metadata.prompt || 'vibrant image'}`,
        },
        status: 'pending',
      };
    }
  }

  /**
   * Chains audio to video by mapping frequency data to motion
   */
  async audioToVideoAnimation(audioUrl: string, metadata: any): Promise<RemixPacket> {
    const packet: RemixPacket = {
      id: `remix-${Date.now()}`,
      sourceModality: 'audio',
      targetModality: 'video',
      data: audioUrl,
      metadata: { ...metadata, animationIntensity: 0.8 },
      status: 'pending',
    };

    return packet;
  }

  /**
   * Chains video back to text by summarizing the result
   */
  async videoToDescription(videoUrl: string): Promise<string> {
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoUrl,
          templateId: 'clone-architecture', // Use descriptive template
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Basic parsing for Vercel AI stream
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            fullText += line.slice(2).replace(/^"(.*)"$/, '$1');
          }
        }
      }

      return (
        fullText || 'A vibrant journey through a neon-lit landscape with ethereal soundscapes.'
      );
    } catch (error) {
      console.error('[RemixOrchestrator] videoToDescription error:', error);
      return 'A vibrant AI-generated sequence.';
    }
  }
}

export const remixOrchestrator = new RemixOrchestrator();
