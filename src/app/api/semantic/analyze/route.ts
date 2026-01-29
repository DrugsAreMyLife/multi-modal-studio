import { NextRequest, NextResponse } from 'next/server';
import { getSemanticLLMProvider } from '@/lib/llm/semantic-llm-provider';
import { validateDomain, SemanticDomain } from '@/lib/llm/prompts/semantic-prompts';
import { PreprocessingRepo } from '@/lib/orchestration/PreprocessingRepo';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from header or use IP
    const userId =
      request.headers.get('x-user-id') || request.headers.get('x-forwarded-for') || 'anonymous';

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { text, domain, assetId } = body;

    // Validate required fields
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text field is required and must be a string' },
        { status: 400 },
      );
    }

    if (!domain || !validateDomain(domain)) {
      return NextResponse.json(
        { error: 'domain must be one of: geometric, material, structural, creative' },
        { status: 400 },
      );
    }

    // Get LLM provider and analyze
    const llmProvider = getSemanticLLMProvider();
    const constraints = await llmProvider.analyzeConstraints({
      text,
      domain: domain as SemanticDomain,
    });

    // Optionally log to PreprocessingRepo
    if (assetId) {
      const existingAsset = PreprocessingRepo.getAsset(assetId);
      if (existingAsset) {
        PreprocessingRepo.refineAsset(
          assetId,
          {
            semanticData: {
              id: `sem_${Date.now()}`,
              source: 'semantic-analysis',
              tags: [domain, 'llm-analyzed'],
              constraints,
              timestamp: Date.now(),
            },
          },
          existingAsset.version,
        );
      }
    }

    // Build response
    const response: {
      constraints: typeof constraints;
      intent?: { domain: string; operation: string; confidence: number };
    } = { constraints };

    // For creative domain, also extract intent
    if (domain === 'creative' && constraints.length > 0) {
      const opConstraint = constraints.find((c) => c.key === 'operation');
      if (opConstraint) {
        response.intent = {
          domain: 'raster',
          operation: opConstraint.value as string,
          confidence: opConstraint.confidence,
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Semantic Analysis API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    availableDomains: ['geometric', 'material', 'structural', 'creative'],
    rateLimit: `${RATE_LIMIT} requests per minute`,
    usage: {
      method: 'POST',
      body: {
        text: 'string (required) - The text to analyze',
        domain: 'string (required) - One of: geometric, material, structural, creative',
        assetId: 'string (optional) - Asset ID to associate results with',
      },
    },
  });
}
