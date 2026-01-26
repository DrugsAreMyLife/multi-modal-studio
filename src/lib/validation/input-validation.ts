/**
 * Shared validation rules and helpers for API input sanitization
 */

export const ValidationRules = {
  prompt: {
    maxLength: 2000,
    // pattern: /^[^<>{}]*$/ // Basic protection against HTML tags, though we should be careful with prompt characters
  },
  chatMessage: {
    maxLength: 5000,
  },
  conversation: {
    maxMessages: 100,
  },
  file: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedImageTypes: ['image/png', 'image/jpeg', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  },
  json: {
    maxPayloadSize: 1024 * 1024, // 1MB for generic JSON payloads
    maxDepth: 5,
  },
};

/**
 * Validates a prompt string with enhanced security checks
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a non-empty string' };
  }

  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (trimmed.length > ValidationRules.prompt.maxLength) {
    return {
      valid: false,
      error: `Prompt exceeds maximum length of ${ValidationRules.prompt.maxLength} characters`,
    };
  }

  // Check for null bytes
  if (prompt.includes('\0')) {
    return { valid: false, error: 'Prompt contains invalid characters' };
  }

  // Check for extremely long words (no spaces)
  const words = trimmed.split(/\s+/);
  const maxWordLength = 100;
  if (words.some((word) => word.length > maxWordLength)) {
    return { valid: false, error: 'Prompt contains excessively long words' };
  }

  return { valid: true };
}

/**
 * Validates UUID format
 */
export function validateUUID(id: string | null): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Safely parses JSON with size validation and error handling
 */
export async function safeJsonParse<T>(
  req: Request,
): Promise<{ data?: T; error?: string; statusCode?: number }> {
  try {
    const bodyText = await req.text();

    if (bodyText.length > ValidationRules.json.maxPayloadSize) {
      return { error: 'Payload too large', statusCode: 413 };
    }

    if (!bodyText) {
      return { error: 'Empty request body', statusCode: 400 };
    }

    return { data: JSON.parse(bodyText) as T };
  } catch (error) {
    console.error('[Validation] JSON parse error:', error);
    return { error: 'Invalid JSON payload', statusCode: 400 };
  }
}

/**
 * Validates a file size and type
 */
export function validateFile(
  file: File,
  type: 'image' | 'video' | 'audio',
): { valid: boolean; error?: string } {
  if (file.size > ValidationRules.file.maxSizeBytes) {
    return { valid: false, error: `File size exceeds maximum limit of 50MB` };
  }

  const allowedTypes =
    type === 'image'
      ? ValidationRules.file.allowedImageTypes
      : type === 'video'
        ? ValidationRules.file.allowedVideoTypes
        : ValidationRules.file.allowedAudioTypes;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Sanitizes a string for safe output (basic HTML escaping)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
