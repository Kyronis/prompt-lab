import type { FastifyInstance } from 'fastify';
import { authenticate } from '../auth/authenticate.js';
import { optimizePromptRequestSchema } from '@prompt-lab/shared';
import type { OptimizePromptResponse } from '@prompt-lab/shared';
import { callLlm } from '../llm/service.js';

// 元提示词：指导 LLM 作为提示词优化专家，输出结构化 JSON
const OPTIMIZER_SYSTEM_PROMPT = `你是一位专业的提示词工程师。你的任务是优化用户提供的提示词，使其更清晰、更具体、更有效。

请分析用户提供的提示词，并返回一个 JSON 对象（不要包含 markdown 代码块标记），包含以下字段：
- "optimized": 优化后的完整提示词（字符串）
- "suggestions": 改进建议列表（字符串数组，2-5 条）

优化原则：
1. 明确角色和目标受众
2. 增加具体的约束和期望输出格式
3. 消除歧义和模糊表达
4. 补充缺失的上下文信息
5. 保持原始意图不变

只输出 JSON，不要输出其他内容。`;

// 从 LLM 响应中解析 JSON，兼容 markdown 代码块包裹的情况
function parseOptimizerResponse(raw: string): OptimizePromptResponse | null {
  // 尝试直接解析
  try {
    return JSON.parse(raw) as OptimizePromptResponse;
  } catch {
    // 忽略，继续尝试
  }

  // 尝试提取 markdown 代码块中的 JSON
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as OptimizePromptResponse;
    } catch {
      // 忽略
    }
  }

  // 尝试提取花括号之间的内容
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]) as OptimizePromptResponse;
    } catch {
      // 忽略
    }
  }

  return null;
}

export async function optimizationRoutes(app: FastifyInstance) {
  // 优化提示词
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const data = optimizePromptRequestSchema.parse(request.body);

    const userMessage = data.context
      ? `请优化以下提示词：\n\n${data.promptContent}\n\n补充上下文：${data.context}`
      : `请优化以下提示词：\n\n${data.promptContent}`;

    const llmResult = await callLlm({
      modelId: data.modelId,
      promptContent: OPTIMIZER_SYSTEM_PROMPT,
      userInput: userMessage,
      temperature: 0.4,
    });

    if (llmResult.error || !llmResult.result) {
      return reply.status(502).send({
        error: 'LLM 调用失败',
        detail: llmResult.error ?? '无返回结果',
      });
    }

    const parsed = parseOptimizerResponse(llmResult.result);
    if (!parsed || typeof parsed.optimized !== 'string' || !Array.isArray(parsed.suggestions)) {
      return reply.status(502).send({
        error: 'LLM 返回格式异常',
        raw: llmResult.result,
      });
    }

    return {
      original: data.promptContent,
      optimized: parsed.optimized,
      suggestions: parsed.suggestions.filter((s) => typeof s === 'string'),
    } satisfies OptimizePromptResponse;
  });
}
