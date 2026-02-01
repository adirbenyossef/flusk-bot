export const MODEL_TIERS = {
  fast: 'openai/gpt-4o-mini',
  balanced: 'anthropic/claude-sonnet-4-20250514',
  powerful: 'anthropic/claude-sonnet-4-20250514',
  cheap: 'meta-llama/llama-3.1-8b-instruct',
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;
export type TaskType = 'triage' | 'answer' | 'complex';

export function selectModel(task: TaskType): string {
  switch (task) {
    case 'triage':
      return MODEL_TIERS.fast;
    case 'answer':
      return MODEL_TIERS.balanced;
    case 'complex':
      return MODEL_TIERS.powerful;
  }
}

export const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', tier: 'balanced' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', tier: 'powerful' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', tier: 'fast' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', tier: 'fast' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tier: 'cheap' },
] as const;

export type AvailableModel = (typeof AVAILABLE_MODELS)[number]['id'];
