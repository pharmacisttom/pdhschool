import crypto from 'crypto';

export type WebhookEventType =
  | 'training_request.created'
  | 'training_request.approved'
  | 'training_request.rejected'
  | 'placement.created'
  | 'training.starts_soon'
  | 'evaluation.pending'
  | 'training.completed';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export async function dispatchN8nWebhook(event: WebhookEventType, data: Record<string, unknown>) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl) {
    return { skipped: true, reason: 'N8N_WEBHOOK_URL not configured' };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payload: WebhookPayload = {
    event,
    timestamp,
    data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = webhookSecret
    ? crypto.createHmac('sha256', webhookSecret).update(`${timestamp}.${payloadString}`).digest('hex')
    : '';

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PDHSchool-Signature': signature,
        'X-PDHSchool-Timestamp': timestamp.toString(),
        'X-PDHSchool-Event': event,
      },
      body: payloadString,
      signal: AbortSignal.timeout(5000), // 5 seconds timeout
    });

    return {
      success: res.ok,
      status: res.status,
    };
  } catch (error) {
    console.warn(`Outbound n8n webhook failed for ${event}:`, error instanceof Error ? error.message : error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
