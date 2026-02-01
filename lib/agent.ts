import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, generateText, CoreMessage } from 'ai';
import { z } from 'zod';
import { searchKnowledge } from './knowledge';
import { getTenantById } from './mongodb';
import { MODEL_TIERS } from './model-router';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export interface AgentContext {
  tenantId: string;
  history: CoreMessage[];
  userId: string;
  channelType?: 'slack' | 'whatsapp' | 'web';
  userRoles?: string[];
}

export interface AgentResult {
  text: string;
  toolCalls?: unknown[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

function buildSystemPrompt(context: AgentContext, tenantPrompt?: string): string {
  const basePrompt =
    tenantPrompt ||
    `You are a helpful AI assistant. You help users by answering questions, searching knowledge bases, and performing tasks.

Guidelines:
- Be concise and helpful
- If you don't know something, say so
- Use the searchKnowledge tool to find relevant information when needed
- Be professional and friendly`;

  return `${basePrompt}

Context:
- User ID: ${context.userId}
- Channel: ${context.channelType || 'unknown'}
- Current time: ${new Date().toISOString()}`;
}

export async function runAgent(
  userMessage: string,
  context: AgentContext
): Promise<AgentResult> {
  const tenant = await getTenantById(context.tenantId);
  const systemPrompt = buildSystemPrompt(context, tenant?.settings.systemPrompt);
  const model = tenant?.settings.defaultModel || MODEL_TIERS.balanced;

  const messages: CoreMessage[] = [
    ...context.history,
    { role: 'user', content: userMessage },
  ];

  const result = await generateText({
    model: openrouter(model),
    system: systemPrompt,
    messages,
    tools: {
      searchKnowledge: {
        description: 'Search the company knowledge base for relevant information',
        parameters: z.object({
          query: z.string().describe('The search query'),
        }),
        execute: async ({ query }) => {
          const results = await searchKnowledge(
            query,
            context.tenantId,
            context.userRoles || []
          );
          return results.map((doc) => ({
            title: doc.title,
            content: doc.content.slice(0, 500),
            category: doc.category,
          }));
        },
      },
    },
    maxSteps: 5,
  });

  return {
    text: result.text,
    toolCalls: result.toolCalls,
    usage: result.usage
      ? {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
        }
      : undefined,
  };
}

export async function runAgentStream(
  userMessage: string,
  context: AgentContext
) {
  const tenant = await getTenantById(context.tenantId);
  const systemPrompt = buildSystemPrompt(context, tenant?.settings.systemPrompt);
  const model = tenant?.settings.defaultModel || MODEL_TIERS.balanced;

  const messages: CoreMessage[] = [
    ...context.history,
    { role: 'user', content: userMessage },
  ];

  const result = streamText({
    model: openrouter(model),
    system: systemPrompt,
    messages,
    tools: {
      searchKnowledge: {
        description: 'Search the company knowledge base for relevant information',
        parameters: z.object({
          query: z.string().describe('The search query'),
        }),
        execute: async ({ query }) => {
          const results = await searchKnowledge(
            query,
            context.tenantId,
            context.userRoles || []
          );
          return results.map((doc) => ({
            title: doc.title,
            content: doc.content.slice(0, 500),
            category: doc.category,
          }));
        },
      },
    },
    maxSteps: 5,
  });

  return result;
}

export function convertToAgentHistory(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): CoreMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
