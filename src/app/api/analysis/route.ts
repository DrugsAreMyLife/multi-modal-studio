import { streamText } from 'ai';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { AnalysisPromptTemplate } from '@/lib/types/analysis-studio';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { NextRequest } from 'next/server';

// Allow long processing for video analysis
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(req, '/api/analysis', RATE_LIMITS.analysis);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { url, templateId, customGoal, templatePrompt, providerId, modelId } = await req.json();

    // 1. Select the Best Model (User selected or default Gemini)
    const model = createUniversalModel(
      providerId || 'google',
      modelId || 'models/gemini-1.5-pro-latest',
    );

    // 2. Construct the specialized prompt
    const systemPrompt = `
        ${templatePrompt}

        CONTEXT:
        The user has provided a video URL: ${url}
        Custom Goal: ${customGoal || 'None'}

        INSTRUCTIONS:
        1. Analyze the content of the video (if you have browsing capabilities or knowledge of this URL).
        2. If you cannot directly watch the video, assume the role of an expert simulator and infer the likely content based on the URL metadata, title, and context provided, OR explicitly state you are analyzing based on general knowledge if the video is famous.
        3. EXTRACT nuances, details, and specifics.
        4. OUTPUT FORMAT:
           - START with an "Executive Summary".
           - PROVIDE a Mermaid Diagram code block (start with \`\`\`mermaid) representing the flow or structure.
           - LIST at least 5-10 specific "Nuances" or "Details" found.
        `;

    // 3. Stream the response
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analyze this video: ${url}` }],
    });

    // @ts-expect-error toDataStreamResponse is present in runtime
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Analysis Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
