import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Validates a Replicate webhook signature using HMAC-SHA256
 * Replicate uses: webhook-id, webhook-timestamp, and webhook-signature headers
 */
export async function validateReplicateWebhook(
  req: Request,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret) {
    console.error('[WebhookValidation] REPLICATE_WEBHOOK_SIGNING_SECRET is not configured');
    return false;
  }

  try {
    const webhookId = req.headers.get('webhook-id');
    const webhookTimestamp = req.headers.get('webhook-timestamp');
    const webhookSignature = req.headers.get('webhook-signature');

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error('[WebhookValidation] Missing required webhook headers');
      return false;
    }

    // Validate timestamp to prevent replay attacks
    if (!validateWebhookTimestamp(webhookTimestamp)) {
      console.error('[WebhookValidation] Webhook timestamp is too old');
      return false;
    }

    // Get the request body
    const body = await req.clone().text();

    // Construct the signed payload: id.timestamp.body
    const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;

    // Compute HMAC
    const hmac = createHmac('sha256', secret);
    hmac.update(signedPayload);
    const expectedSignature = `v1,${hmac.digest('base64')}`;

    // The webhook-signature header can contain multiple signatures (e.g., "v1,sig1 v1,sig2")
    const signatures = webhookSignature.split(' ');
    for (const sig of signatures) {
      if (sig.startsWith('v1,')) {
        try {
          if (timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expectedSignature, 'utf8'))) {
            return true;
          }
        } catch {
          // Length mismatch, continue to next signature
        }
      }
    }

    return false;
  } catch (error) {
    console.error('[WebhookValidation] Error validating Replicate webhook:', error);
    return false;
  }
}

/**
 * Generic HMAC-SHA256 signature validation
 */
export function validateHmacSignature(
  body: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) return false;

  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    // Timing-safe comparison to prevent side-channel attacks
    return timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
  } catch (error) {
    console.error('[WebhookValidation] HMAC validation error:', error);
    return false;
  }
}

/**
 * Validates a webhook timestamp to prevent replay attacks (tolerance: 5 minutes)
 */
export function validateWebhookTimestamp(timestamp: string | null): boolean {
  if (!timestamp) return false;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - ts);

  return diff < 300; // 5 minutes tolerance
}
