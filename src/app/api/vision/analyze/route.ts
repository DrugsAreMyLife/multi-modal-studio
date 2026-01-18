import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { streamText } from 'ai';

// Allow extended processing for vision analysis
export const maxDuration = 60;

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * POST /api/vision/analyze
 * Analyzes images with Ollama vision models (llava)
 *
 * Request body:
 * {
 *   images: string[], // Base64 encoded images or data URLs
 *   prompt: string,   // Analysis prompt
 *   modelId: string   // Model ID (e.g., 'llava', 'llava:latest')
 * }
 *
 * Response: Streaming text response with image analysis
 */
export async function POST(req: NextRequest) {
  // Auth and rate limiting check
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/vision/analyze',
    RATE_LIMITS.analysis,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { images, prompt, modelId } = await req.json();

    // Validation: Images array
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid images',
          message: 'Images array is required and must contain at least one image',
        },
        { status: 400 },
      );
    }

    // Validation: All items in images array must be strings
    if (!images.every((img: unknown) => typeof img === 'string')) {
      return NextResponse.json(
        {
          error: 'Invalid images format',
          message: 'All images must be strings (base64 or data URLs)',
        },
        { status: 400 },
      );
    }

    // Validation: Prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid prompt',
          message: 'Prompt is required and must be a non-empty string',
        },
        { status: 400 },
      );
    }

    // Validation: Model ID
    if (!modelId || typeof modelId !== 'string' || modelId.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid model ID',
          message: 'Model ID is required and must be a non-empty string',
        },
        { status: 400 },
      );
    }

    // Validation: Check if model is a vision model (llava-based)
    const normalizedModelId = modelId.toLowerCase();
    if (
      !normalizedModelId.includes('llava') &&
      !normalizedModelId.includes('vision') &&
      !normalizedModelId.includes('minicpm')
    ) {
      return NextResponse.json(
        {
          error: 'Unsupported model type',
          message: 'Only vision models (llava, minicpm, etc.) are supported for image analysis',
        },
        { status: 400 },
      );
    }

    // Validate image size (basic check - max 5MB per image when base64)
    for (let i = 0; i < images.length; i++) {
      if (images[i].length > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: 'Image too large',
            message: `Image ${i} exceeds 5MB limit`,
          },
          { status: 413 },
        );
      }
    }

    console.log('[VisionAnalyze] Processing request:', {
      modelId,
      imageCount: images.length,
      promptLength: prompt.length,
    });

    // Create the model using universal factory
    const model = createUniversalModel('ollama', modelId);

    // Format messages with images for vision model
    // The AI SDK expects content as an array of content blocks
    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: prompt,
          },
          ...images.map((image: string, index: number) => {
            // Ensure image is properly formatted as data URL
            const imageData = image.startsWith('data:')
              ? image
              : image.startsWith('http')
                ? image // URL reference
                : `data:image/jpeg;base64,${image}`;

            return {
              type: 'image' as const,
              image: imageData,
            };
          }),
        ],
      },
    ];

    console.log('[VisionAnalyze] Streaming response for model:', modelId);

    // Stream the response
    const result = await streamText({
      model,
      messages,
    });

    // Return streaming response
    // @ts-expect-error toDataStreamResponse is present in runtime
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[VisionAnalyze] Error:', error);

    // More specific error handling
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      // Handle connection errors
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Service unavailable',
            message: 'Vision analysis service is not available. Please check Ollama is running.',
          },
          { status: 503 },
        );
      }

      // Handle model not found
      if (error.message.includes('model not found') || error.message.includes('no such file')) {
        return NextResponse.json(
          {
            error: 'Model not found',
            message: `The specified model is not available. Please pull it first using Ollama.`,
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error: 'Analysis failed',
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during image analysis',
      },
      { status: 500 },
    );
  }
}
