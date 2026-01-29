import { NextRequest, NextResponse } from 'next/server';
import { AdobeAdapter } from '@/lib/orchestration/AdobeAdapter';
import { SemanticProcessor } from '@/lib/orchestration/SemanticProcessor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, assetId, imageUrl } = body;

    // Validate required fields
    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'command field is required and must be a string' },
        { status: 400 },
      );
    }

    // Parse the command to understand intent
    const intent = await SemanticProcessor.parseCreativeIntent(command);

    if (!intent) {
      return NextResponse.json(
        {
          error:
            'Could not understand creative command. Try: "remove background", "vectorize", etc.',
        },
        { status: 400 },
      );
    }

    // Check if we have the required imageUrl for image operations
    const imageOperations = [
      'background_removal',
      'remove_background',
      'vectorization',
      'vectorize',
      'trace',
    ];
    if (imageOperations.includes(intent.operation) && !imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required for this operation' },
        { status: 400 },
      );
    }

    // Execute the operation
    const result = await AdobeAdapter.executeCommand(command, assetId, imageUrl);

    return NextResponse.json({
      operation: result.operation,
      status: result.status,
      artifactUrl: result.artifactUrl,
      maskUrl: result.maskUrl,
      jobId: result.jobId,
      processingTime: result.processingTime,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('[Creative Execute API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    description: 'Execute creative operations on images',
    supportedOperations: [
      'background_removal / remove background',
      'vectorization / vectorize / trace',
    ],
    usage: {
      method: 'POST',
      body: {
        command: 'string (required) - Natural language command like "remove background"',
        imageUrl: 'string (required for image ops) - URL of the image to process',
        assetId: 'string (optional) - Asset ID to track in preprocessing repo',
      },
    },
    examples: [
      { command: 'remove the background', imageUrl: '/uploads/photo.jpg' },
      { command: 'vectorize this image', imageUrl: '/uploads/logo.png' },
    ],
  });
}
