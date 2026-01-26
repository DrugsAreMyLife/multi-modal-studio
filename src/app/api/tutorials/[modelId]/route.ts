import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { supabase } from '@/lib/db/server';
import { tutorialGenerator } from '@/lib/models/tutorial-generator';

/**
 * API to fetch or trigger generation of a model tutorial
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ modelId: string }> }) {
  const authResult = await requireAuthAndRateLimit(req, '/api/tutorials', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { modelId } = await params;
  if (!modelId) {
    return NextResponse.json({ success: false, error: 'Missing modelId' }, { status: 400 });
  }

  try {
    // 1. Try to fetch existing tutorial
    const { data: tutorial, error } = await supabase
      .from('model_tutorials')
      .select('*')
      .eq('model_id', modelId)
      .single();

    if (tutorial) {
      return NextResponse.json({
        success: true,
        tutorial,
        cached: true,
      });
    }

    // 2. If not found, trigger generation (Phase 6 logic)
    console.log(`[TutorialAPI] Tutorial for ${modelId} not found. Generating...`);
    const content = await tutorialGenerator.generateForModel(modelId);

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate tutorial' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      tutorial: { model_id: modelId, content_markdown: content },
      cached: false,
    });
  } catch (error) {
    console.error('[TutorialAPI] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
