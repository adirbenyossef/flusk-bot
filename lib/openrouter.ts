import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const USE_MOCK = process.env.USE_MOCK_LLM === 'true';
const USE_OLLAMA = process.env.USE_OLLAMA === 'true';

// Configure client based on environment
function createClient(): OpenAI | null {
  if (USE_MOCK) {
    return null;
  }

  if (USE_OLLAMA) {
    return new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      apiKey: 'ollama', // Ollama doesn't need a real key
    });
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'Agent Platform',
    },
  });
}

export const openrouter = createClient();

export type Message = ChatCompletionMessageParam;

function getDefaultModel(): string {
  if (USE_OLLAMA) {
    return 'llama3.2';
  }
  return 'anthropic/claude-sonnet-4-20250514';
}

// Mock response generator for testing
async function* mockStreamResponse(messages: Message[]) {
  const lastMessage = messages[messages.length - 1];
  const userQuery = typeof lastMessage.content === 'string' ? lastMessage.content : 'your question';

  const mockResponse = `This is a mock response for testing. You asked: "${userQuery.slice(0, 50)}..." In production, this would be a real LLM response.`;

  for (const word of mockResponse.split(' ')) {
    yield {
      choices: [{
        delta: { content: word + ' ' },
        index: 0,
        finish_reason: null,
      }],
    };
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

export async function chat(messages: Message[], model?: string) {
  if (USE_MOCK || !openrouter) {
    return mockStreamResponse(messages);
  }

  const response = await openrouter.chat.completions.create({
    model: model || getDefaultModel(),
    messages,
    stream: true,
  });
  return response;
}

export async function chatCompletion(messages: Message[], model?: string) {
  if (USE_MOCK || !openrouter) {
    const lastMessage = messages[messages.length - 1];
    const userQuery = typeof lastMessage.content === 'string' ? lastMessage.content : 'your question';

    return {
      choices: [{
        message: {
          role: 'assistant' as const,
          content: `[Mock Response] You asked: "${userQuery.slice(0, 100)}..." This is a test response.`,
        },
        index: 0,
        finish_reason: 'stop' as const,
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  const response = await openrouter.chat.completions.create({
    model: model || getDefaultModel(),
    messages,
  });
  return response;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (USE_MOCK || !openrouter) {
    // Return a mock embedding (384 dimensions like small models)
    return Array(384).fill(0).map(() => Math.random() - 0.5);
  }

  const response = await openrouter.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}
