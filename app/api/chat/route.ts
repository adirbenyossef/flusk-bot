import { NextRequest } from 'next/server';
import { runAgentStream, convertToAgentHistory } from '@/lib/agent';
import {
  getTenantById,
  getOrCreateConversation,
  saveMessages,
  getOrCreateUser,
  ObjectId,
} from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, tenantId, userId, conversationId } = body;

    if (!message || !tenantId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message, tenantId, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await getOrCreateUser({
      tenantId: tenant._id,
      externalId: userId,
      channelType: 'web',
    });

    const conversation = await getOrCreateConversation({
      tenantId: tenant._id,
      channelType: 'web',
      channelId: conversationId || `web-${userId}`,
      userId,
    });

    const stream = await runAgentStream(message, {
      tenantId: tenant._id.toString(),
      history: convertToAgentHistory(conversation.messages),
      userId,
      channelType: 'web',
      userRoles: user.roles,
    });

    // Create a TransformStream to capture the full response
    let fullResponse = '';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        fullResponse += text;
        controller.enqueue(chunk);
      },
      async flush() {
        // Save messages after stream completes
        await saveMessages(conversation._id, [
          { role: 'user', content: message },
          { role: 'assistant', content: fullResponse },
        ]);
      },
    });

    // Return streaming response
    return new Response(stream.textStream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Conversation-Id': conversation._id.toString(),
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
