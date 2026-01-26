// src/app/api/comfyui/execute/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { comfyUIClient } from '@/lib/comfyui/client';
import type { ComfyUIWorkflow } from '@/lib/comfyui/types';

export async function POST(req: NextRequest) {
  // Auth and rate limiting
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/comfyui/execute',
    RATE_LIMITS.generation,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { workflow } = await req.json();

    // Validation
    if (!workflow || typeof workflow !== 'object') {
      return NextResponse.json({ error: 'Workflow object is required' }, { status: 400 });
    }

    // Basic workflow validation
    const nodeIds = Object.keys(workflow);
    if (nodeIds.length === 0) {
      return NextResponse.json(
        { error: 'Workflow must contain at least one node' },
        { status: 400 },
      );
    }

    // Validate each node has required fields
    for (const nodeId of nodeIds) {
      const node = workflow[nodeId];
      if (!node.class_type || !node.inputs) {
        return NextResponse.json(
          { error: `Invalid node structure for node ${nodeId}` },
          { status: 400 },
        );
      }
    }

    // Check ComfyUI connection
    const isConnected = await comfyUIClient.checkConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'ComfyUI server is not reachable. Please ensure ComfyUI is running.' },
        { status: 503 },
      );
    }

    // Queue the workflow
    const queueResult = await comfyUIClient.queuePrompt(workflow as ComfyUIWorkflow);

    // Check for node errors
    if (queueResult.node_errors && Object.keys(queueResult.node_errors).length > 0) {
      return NextResponse.json(
        {
          error: 'Workflow contains errors',
          node_errors: queueResult.node_errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      prompt_id: queueResult.prompt_id,
      queue_number: queueResult.number,
    });
  } catch (error) {
    console.error('[ComfyUI Execute] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute workflow',
      },
      { status: 500 },
    );
  }
}
