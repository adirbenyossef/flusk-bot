import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
    'X-Title': 'Agent Platform',
  },
});

export type Message = ChatCompletionMessageParam;

export async function chat(messages: Message[], model?: string) {
  const response = await openrouter.chat.completions.create({
    model: model || 'anthropic/claude-sonnet-4-20250514',
    messages,
    stream: true,
  });
  return response;
}

export async function chatCompletion(messages: Message[], model?: string) {
  const response = await openrouter.chat.completions.create({
    model: model || 'anthropic/claude-sonnet-4-20250514',
    messages,
  });
  return response;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openrouter.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}
