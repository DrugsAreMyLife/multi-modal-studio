# ComfyUI Client Usage Guide

## Overview

The `ComfyUIClient` is a robust, type-safe TypeScript client for communicating with ComfyUI servers. It handles all HTTP communication, error handling, and state management.

## Installation & Import

```typescript
import { comfyUIClient, ComfyUIClient } from '@/lib/comfyui';

// Use the singleton instance
const isConnected = await comfyUIClient.checkConnection();

// Or create a new instance with custom URL
const client = new ComfyUIClient('http://custom-server:8188');
```

## Configuration

The client uses the `COMFYUI_BASE_URL` environment variable by default:

```env
COMFYUI_BASE_URL=http://localhost:8188
```

If not set, defaults to `http://localhost:8188`.

## API Reference

### `checkConnection(): Promise<boolean>`

Check if the ComfyUI server is running and accessible.

```typescript
const isConnected = await comfyUIClient.checkConnection();
if (isConnected) {
  console.log('ComfyUI server is online');
} else {
  console.log('ComfyUI server is offline');
}
```

### `getNodeDefinitions(): Promise<ComfyUIObjectInfo>`

Get all available node definitions from the server.

```typescript
const nodeDefinitions = await comfyUIClient.getNodeDefinitions();
const loaderNodes = Object.entries(nodeDefinitions).filter(
  ([_, def]) => def.category === 'loaders',
);
```

### `queuePrompt(workflow: ComfyUIWorkflow): Promise<ComfyUIQueueResponse>`

Queue a workflow for execution.

```typescript
const workflow: ComfyUIWorkflow = {
  '1': {
    class_type: 'CheckpointLoader',
    inputs: { ckpt_name: 'model.safetensors' },
  },
  '2': {
    class_type: 'CLIPTextEncode',
    inputs: { text: 'a beautiful landscape', clip: ['1', 0] },
  },
};

try {
  const response = await comfyUIClient.queuePrompt(workflow);
  console.log('Queued with ID:', response.prompt_id);
  console.log('Queue number:', response.number);
} catch (error) {
  console.error('Failed to queue:', error);
}
```

### `getQueue(): Promise<ComfyUIQueueStatus>`

Get the current queue status.

```typescript
const queue = await comfyUIClient.getQueue();
console.log('Pending:', queue.queue_pending.length);
console.log('Running:', queue.queue_running.length);
```

### `getHistory(promptId: string): Promise<ComfyUIHistoryEntry | null>`

Get execution history for a specific prompt.

```typescript
const history = await comfyUIClient.getHistory(promptId);
if (history) {
  console.log('Execution outputs:', history.outputs);
  console.log('Status:', history.status.status_str);
} else {
  console.log('History not found');
}
```

### `getImage(filename: string, subfolder?: string, type?: string): Promise<Blob>`

Download an image result from the server.

```typescript
const imageBlob = await comfyUIClient.getImage(
  'image_12345.png',
  'output', // optional subfolder
  'output', // optional type: 'output', 'input', or 'temp'
);

// Convert blob to URL
const imageUrl = URL.createObjectURL(imageBlob);
```

### `cancelPrompt(promptId: string): Promise<void>`

Cancel execution of a queued or running prompt.

```typescript
try {
  await comfyUIClient.cancelPrompt(promptId);
  console.log('Prompt cancelled successfully');
} catch (error) {
  console.error('Failed to cancel:', error);
}
```

### `getClientId(): string`

Get the unique client ID for this instance.

```typescript
const clientId = comfyUIClient.getClientId();
console.log('Client ID:', clientId);
```

### `getBaseUrl(): string`

Get the current base URL.

```typescript
const url = comfyUIClient.getBaseUrl();
```

### `setBaseUrl(baseUrl: string): void`

Update the base URL dynamically.

```typescript
comfyUIClient.setBaseUrl('http://new-server:8188');
```

## Error Handling

All methods throw descriptive errors on failure. Use try/catch or `.catch()` to handle them:

```typescript
try {
  const definitions = await comfyUIClient.getNodeDefinitions();
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // Handle specific error scenarios
  }
}
```

All errors are logged with `[ComfyUI]` prefix for easy filtering:

```
[ComfyUI] Connection check failed: getaddrinfo ENOTFOUND localhost
[ComfyUI] Failed to queue prompt: Server responded with status 400: Invalid workflow
```

## Type Definitions

```typescript
// Response types
interface ComfyUIQueueResponse {
  prompt_id: string;
  number: number;
}

interface ComfyUIQueueStatus {
  queue_pending: Array<[string, number]>;
  queue_running: Array<[string, number]>;
}

interface ComfyUIObjectInfo {
  [nodeType: string]: NodeDefinition;
}

interface ComfyUIHistoryEntry {
  prompt: ComfyUIWorkflow;
  outputs: Record<string, unknown>;
  status: {
    status_str: string;
    completed: boolean;
    messages: string[];
  };
}
```

## Implementation Details

### Client ID Generation

Each client instance generates a unique client ID on construction:

```
client_1705430123456_a3f9b2c1
```

This ID persists across all requests made by that instance and is used by ComfyUI to track client sessions.

### Request Timeout

All requests have a 30-second timeout to prevent hanging connections.

### Error Logging

All errors are logged with a `[ComfyUI]` prefix for easy debugging and filtering in logs.

### Graceful Offline Handling

- `checkConnection()` returns `false` instead of throwing
- Other methods throw descriptive errors with offline-specific messages

## Common Patterns

### Full Workflow Execution Pipeline

```typescript
async function executeWorkflow(workflow: ComfyUIWorkflow) {
  // Check server is online
  if (!(await comfyUIClient.checkConnection())) {
    throw new Error('ComfyUI server is offline');
  }

  // Queue the workflow
  const { prompt_id } = await comfyUIClient.queuePrompt(workflow);
  console.log('Workflow queued:', prompt_id);

  // Poll for completion
  let completed = false;
  while (!completed) {
    const history = await comfyUIClient.getHistory(prompt_id);
    if (history?.status.completed) {
      completed = true;
      return history.outputs;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
```

### Download Generated Images

```typescript
async function downloadImages(promptId: string, outputNodeId: string) {
  const history = await comfyUIClient.getHistory(promptId);
  if (!history) throw new Error('Execution not found');

  const outputs = history.outputs[outputNodeId];
  if (!outputs || !outputs.images) return [];

  return Promise.all(
    outputs.images.map((img: any) => comfyUIClient.getImage(img.filename, img.subfolder)),
  );
}
```

## Performance Considerations

- Client ID is generated once and cached
- Base URL is stored as instance property (no environment lookups on each request)
- Fetch timeout prevents resource leaks
- No automatic retries (implement your own retry logic if needed)
