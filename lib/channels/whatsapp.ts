import { runAgent, convertToAgentHistory } from '../agent';
import {
  getTenantByWhatsAppBusinessId,
  getOrCreateConversation,
  saveMessages,
  getOrCreateUser,
} from '../mongodb';

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
}

interface WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

interface WhatsAppChange {
  value: {
    messaging_product: string;
    metadata: WhatsAppMetadata;
    contacts?: Array<{
      profile: { name: string };
      wa_id: string;
    }>;
    messages?: WhatsAppMessage[];
  };
  field: string;
}

interface WhatsAppWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: WhatsAppChange[];
  }>;
}

export function verifyWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null
): { valid: boolean; challenge?: string } {
  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    return { valid: true, challenge: challenge || '' };
  }
  return { valid: false };
}

export async function handleWebhook(body: WhatsAppWebhookBody): Promise<void> {
  if (body.object !== 'whatsapp_business_account') return;

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.value.messages) {
        for (const message of change.value.messages) {
          await handleMessage(message, change.value.metadata, change.value.contacts);
        }
      }
    }
  }
}

async function handleMessage(
  message: WhatsAppMessage,
  metadata: WhatsAppMetadata,
  contacts?: Array<{ profile: { name: string }; wa_id: string }>
): Promise<void> {
  // Only handle text messages for now
  if (message.type !== 'text' || !message.text?.body) return;

  const phoneNumber = message.from;
  const messageText = message.text.body;
  const contact = contacts?.find((c) => c.wa_id === phoneNumber);

  const tenant = await getTenantByWhatsAppBusinessId(metadata.phone_number_id);
  if (!tenant) {
    console.error(`No tenant found for WhatsApp business ID: ${metadata.phone_number_id}`);
    await sendMessage(metadata.phone_number_id, phoneNumber, 'Sorry, this service is not configured.');
    return;
  }

  const user = await getOrCreateUser({
    tenantId: tenant._id,
    externalId: phoneNumber,
    channelType: 'whatsapp',
    name: contact?.profile.name,
  });

  const conversation = await getOrCreateConversation({
    tenantId: tenant._id,
    channelType: 'whatsapp',
    channelId: phoneNumber,
    userId: phoneNumber,
  });

  try {
    const response = await runAgent(messageText, {
      tenantId: tenant._id.toString(),
      history: convertToAgentHistory(conversation.messages),
      userId: phoneNumber,
      channelType: 'whatsapp',
      userRoles: user.roles,
    });

    await sendMessage(metadata.phone_number_id, phoneNumber, response.text);

    await saveMessages(conversation._id, [
      { role: 'user', content: messageText },
      {
        role: 'assistant',
        content: response.text,
        metadata: {
          toolCalls: response.toolCalls,
          tokens: response.usage
            ? response.usage.promptTokens + response.usage.completionTokens
            : undefined,
        },
      },
    ]);
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    await sendMessage(
      metadata.phone_number_id,
      phoneNumber,
      'Sorry, I encountered an error. Please try again.'
    );
  }
}

export async function sendMessage(
  phoneNumberId: string,
  to: string,
  text: string
): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('WhatsApp API error:', error);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }
}

export async function sendTemplateMessage(
  phoneNumberId: string,
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components?: unknown[]
): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('WhatsApp API error:', error);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }
}
