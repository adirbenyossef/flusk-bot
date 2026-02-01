import { NextRequest, NextResponse } from 'next/server';
import { handleSlackEvent } from '@/lib/channels/slack';
import crypto from 'crypto';

function verifySlackSignature(
  signature: string | null,
  timestamp: string | null,
  body: string
): boolean {
  if (!signature || !timestamp) return false;

  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return false;

  // Check timestamp is within 5 minutes
  const time = Math.floor(Date.now() / 1000);
  if (Math.abs(time - parseInt(timestamp)) > 60 * 5) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature =
    'v0=' +
    crypto.createHmac('sha256', signingSecret).update(sigBasestring).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(mySignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-slack-signature');
  const timestamp = request.headers.get('x-slack-request-timestamp');

  // Verify signature in production
  if (process.env.NODE_ENV === 'production') {
    if (!verifySlackSignature(signature, timestamp, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const payload = JSON.parse(body);

  // Handle URL verification challenge
  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Process the event asynchronously
  const result = await handleSlackEvent(payload);

  return new NextResponse(result.body, {
    status: result.statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
