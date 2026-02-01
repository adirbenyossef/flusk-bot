import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook, handleWebhook } from '@/lib/channels/whatsapp';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const result = verifyWebhook(mode, token, challenge);

  if (result.valid) {
    return new NextResponse(result.challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Process webhook asynchronously to respond quickly
    handleWebhook(body).catch((error) => {
      console.error('Error processing WhatsApp webhook:', error);
    });

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error parsing WhatsApp webhook:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
