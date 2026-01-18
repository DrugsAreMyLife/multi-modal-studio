// Dataset Upload API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { createDataset, updateDataset } from '@/lib/db/training';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'datasets');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  // Auth and rate limiting
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/datasets/upload',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const files = formData.getAll('images') as File[];

    // Validation
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    if (!['image', 'audio', 'video', 'text'].includes(type)) {
      return NextResponse.json({ error: 'Invalid dataset type' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    if (files.length > 1000) {
      return NextResponse.json({ error: 'Maximum 1000 images allowed' }, { status: 400 });
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Allowed: JPEG, PNG, WebP` },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum 10MB per file` },
          { status: 400 },
        );
      }
    }

    // Create dataset record
    const dataset = await createDataset({
      user_id: authResult.userId,
      name,
      type: type as 'image' | 'audio' | 'video' | 'text',
      image_count: files.length,
      status: 'processing',
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Failed to create dataset record' }, { status: 500 });
    }

    // Create dataset directory
    const datasetDir = path.join(UPLOAD_DIR, dataset.id);
    try {
      await mkdir(datasetDir, { recursive: true });
    } catch (dirError) {
      console.error('[Dataset Upload] Failed to create directory:', dirError);
      // Continue anyway as directory might exist
    }

    // Save images
    const savedImages: string[] = [];
    let saveErrors = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.name);
      const filename = `${i.toString().padStart(4, '0')}${ext}`;
      const filepath = path.join(datasetDir, filename);

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filepath, buffer);
        savedImages.push(`/datasets/${dataset.id}/${filename}`);
      } catch (writeError) {
        console.error(`[Dataset Upload] Failed to save image ${i}:`, writeError);
        saveErrors++;
      }
    }

    // If all saves failed, mark as failed
    if (saveErrors === files.length) {
      await updateDataset(dataset.id, authResult.userId, { status: 'failed' });
      return NextResponse.json({ error: 'Failed to save all images to storage' }, { status: 500 });
    }

    // Update dataset status to active
    const updated = await updateDataset(dataset.id, authResult.userId, {
      status: 'active',
      image_count: savedImages.length,
    });

    if (!updated) {
      console.error('[Dataset Upload] Failed to update dataset status');
    }

    return NextResponse.json({
      success: true,
      dataset_id: dataset.id,
      name: dataset.name,
      type: dataset.type,
      image_count: savedImages.length,
      images: savedImages,
      failed_count: saveErrors,
    });
  } catch (error) {
    console.error('[Dataset Upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload dataset' },
      { status: 500 },
    );
  }
}
