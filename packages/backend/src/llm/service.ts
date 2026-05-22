import OpenAI from 'openai';
import { db } from '../db.js';

export interface LlmCallParams {
  modelId: string;
  promptContent: string;
  userInput?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmCallResult {
  result: string | null;
  error: string | null;
  durationMs: number;
}

export async function callLlm(params: LlmCallParams): Promise<LlmCallResult> {
  const model = await db.model.findUnique({
    where: { id: params.modelId },
    include: { provider: true },
  });

  if (!model) {
    return { result: null, error: 'Model not found', durationMs: 0 };
  }

  const client = new OpenAI({
    apiKey: model.provider.apiKey,
    baseURL: model.provider.baseUrl,
  });

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: params.promptContent },
  ];

  if (params.userInput) {
    messages.push({ role: 'user', content: params.userInput });
  }

  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: model.modelId,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? undefined,
    });

    const durationMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content ?? null;

    return {
      result: content,
      error: null,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { result: null, error: message, durationMs };
  }
}
