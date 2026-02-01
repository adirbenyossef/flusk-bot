import { App, LogLevel } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { runAgent, convertToAgentHistory } from '../agent';
import {
  getTenantBySlackTeam,
  getOrCreateConversation,
  saveMessages,
  getOrCreateUser,
  ObjectId,
} from '../mongodb';

let slackApp: App | null = null;

export function getSlackApp(): App {
  if (slackApp) return slackApp;

  slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: process.env.NODE_ENV === 'development',
    appToken: process.env.SLACK_APP_TOKEN,
    logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  });

  setupMessageHandlers(slackApp);
  return slackApp;
}

function setupMessageHandlers(app: App): void {
  // Handle direct messages
  app.message(async ({ message, say, client }) => {
    // Ignore bot messages and message edits
    if (message.subtype) return;
    if (!('text' in message) || !message.text) return;
    if (!('user' in message) || !message.user) return;
    if (!('team' in message)) return;

    const teamId = message.team as string;
    const tenant = await getTenantBySlackTeam(teamId);
    if (!tenant) {
      await say('Sorry, this workspace is not configured. Please contact your administrator.');
      return;
    }

    const user = await getOrCreateUser({
      tenantId: tenant._id,
      externalId: message.user,
      channelType: 'slack',
    });

    const conversation = await getOrCreateConversation({
      tenantId: tenant._id,
      channelType: 'slack',
      channelId: message.channel,
      userId: message.user,
    });

    // Show typing indicator
    await client.reactions.add({
      channel: message.channel,
      timestamp: message.ts,
      name: 'thinking_face',
    });

    try {
      const response = await runAgent(message.text, {
        tenantId: tenant._id.toString(),
        history: convertToAgentHistory(conversation.messages),
        userId: message.user,
        channelType: 'slack',
        userRoles: user.roles,
      });

      // Send response in thread
      await say({
        text: response.text,
        thread_ts: message.ts,
      });

      // Save messages to conversation
      await saveMessages(conversation._id, [
        { role: 'user', content: message.text },
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
      console.error('Error processing Slack message:', error);
      await say({
        text: 'Sorry, I encountered an error processing your message. Please try again.',
        thread_ts: message.ts,
      });
    } finally {
      // Remove thinking indicator
      try {
        await client.reactions.remove({
          channel: message.channel,
          timestamp: message.ts,
          name: 'thinking_face',
        });
      } catch {
        // Ignore if reaction was already removed
      }
    }
  });

  // Handle app mentions in channels
  app.event('app_mention', async ({ event, say, client }) => {
    const query = event.text.replace(/<@[A-Z0-9]+>/gi, '').trim();
    if (!query) {
      await say({
        text: 'Hi! How can I help you?',
        thread_ts: event.ts,
      });
      return;
    }

    const teamId = event.team as string;
    const tenant = await getTenantBySlackTeam(teamId);
    if (!tenant) {
      await say({
        text: 'Sorry, this workspace is not configured.',
        thread_ts: event.ts,
      });
      return;
    }

    const user = await getOrCreateUser({
      tenantId: tenant._id,
      externalId: event.user,
      channelType: 'slack',
    });

    const conversation = await getOrCreateConversation({
      tenantId: tenant._id,
      channelType: 'slack',
      channelId: event.channel,
      userId: event.user,
    });

    await client.reactions.add({
      channel: event.channel,
      timestamp: event.ts,
      name: 'thinking_face',
    });

    try {
      const response = await runAgent(query, {
        tenantId: tenant._id.toString(),
        history: convertToAgentHistory(conversation.messages),
        userId: event.user,
        channelType: 'slack',
        userRoles: user.roles,
      });

      await say({
        text: response.text,
        thread_ts: event.ts,
      });

      await saveMessages(conversation._id, [
        { role: 'user', content: query },
        { role: 'assistant', content: response.text },
      ]);
    } catch (error) {
      console.error('Error processing app mention:', error);
      await say({
        text: 'Sorry, I encountered an error. Please try again.',
        thread_ts: event.ts,
      });
    } finally {
      try {
        await client.reactions.remove({
          channel: event.channel,
          timestamp: event.ts,
          name: 'thinking_face',
        });
      } catch {
        // Ignore
      }
    }
  });
}

export async function startSlackApp(): Promise<void> {
  const app = getSlackApp();
  await app.start();
  console.log('Slack app is running!');
}

export async function handleSlackEvent(body: unknown): Promise<{ statusCode: number; body: string }> {
  const app = getSlackApp();

  return new Promise((resolve) => {
    // For URL verification challenge
    if (typeof body === 'object' && body !== null && 'challenge' in body) {
      resolve({
        statusCode: 200,
        body: (body as { challenge: string }).challenge,
      });
      return;
    }

    // Process the event
    app.processEvent({
      body: body as Record<string, unknown>,
      ack: async (response) => {
        resolve({
          statusCode: 200,
          body: typeof response === 'string' ? response : JSON.stringify(response || {}),
        });
      },
    } as never);
  });
}
