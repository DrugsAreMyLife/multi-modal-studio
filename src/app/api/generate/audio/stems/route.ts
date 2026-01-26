import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { ensureWorkerReady, getWorkerUrl } from '@/lib/workers/local-worker-manager';
import { validateFile, validateUUID } from '@/lib/validation/input-validation';

export async function POST(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/stems',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size and type
    const fileValidation = validateFile(file, 'audio');
    if (!fileValidation.valid) {
      return NextResponse.json({ success: false, error: fileValidation.error }, { status: 400 });
    }

    // Ensure Audio Processor worker is running (auto-starts if needed)
    const workerStatus = await ensureWorkerReady('audio-processor');
    if (!workerStatus.ready) {
      return NextResponse.json(
        {
          success: false,
          error: `Audio Processor worker failed to start: ${workerStatus.error}`,
          workerError: true,
          workerId: 'audio-processor',
        },
        { status: 503 },
      );
    }

    // Forward multipart to local Python worker
    const workerUrl = getWorkerUrl('audio-processor');
    const workerFormData = new FormData();
    workerFormData.append('file', file);

    const response = await fetch(`${workerUrl}/separate`, {
      method: 'POST',
      body: workerFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Worker failed to process stems');
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      jobId: data.jobId,
      status: data.status,
      provider: 'demucs',
    });
  } catch (error: unknown) {
    console.error('[Stems API] Error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Audio Processor worker connection failed. Python dependencies may need to be installed.',
          workerError: true,
          workerId: 'audio-processor',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  // Require auth and rate limiting even for status checks (prevent unauthenticated polling)
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/generate/audio/stems',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId || !validateUUID(jobId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing jobId' },
      { status: 400 },
    );
  }

  try {
    const workerUrl = getWorkerUrl('audio-processor');
    const response = await fetch(`${workerUrl}/status/${jobId}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
