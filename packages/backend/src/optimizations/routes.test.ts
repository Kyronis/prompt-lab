import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app/build-app.js';
import { db } from '../db.js';
import type { OptimizeLlmPromptOutcome } from '../llm/service.js';

// 通过 vi.mock 替换 llm/service 中的 optimizeLlmPrompt，便于在测试中控制 LLM 行为。
// 必须使用工厂函数返回包含所有原导出的对象，这里只替换 optimizeLlmPrompt，其余保持原样。
vi.mock('../llm/service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../llm/service.js')>();
  return {
    ...actual,
    optimizeLlmPrompt: vi.fn(),
  };
});

import { optimizeLlmPrompt } from '../llm/service.js';

const mockedOptimizeLlmPrompt = vi.mocked(optimizeLlmPrompt);

// 在每个测试用例中复用的状态
interface TestFixtures {
  app: FastifyInstance;
  userToken: string;
  userId: string;
  providerId: string;
  modelId: string;
}

let fixtures: TestFixtures;

// 每个用例前都会重置 mock，避免用例之间串扰
beforeEach(() => {
  mockedOptimizeLlmPrompt.mockReset();
});

beforeAll(async () => {
  const app = await buildApp();
  await app.ready();

  // 注册一个测试用户并拿到 JWT
  const registerRes = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      email: `api-test-${Date.now()}@prompt-lab.test`,
      password: 'TestPassword123!',
      name: 'API Tester',
    },
  });
  expect(registerRes.statusCode).toBe(200);
  const registerBody = registerRes.json() as { token: string; user: { id: string } };
  const userToken = registerBody.token;
  const userId = registerBody.user.id;

  // 注册一个 Model Provider（baseUrl 随意，因为 LLM 调用已被 mock）
  const providerRes = await app.inject({
    method: 'POST',
    url: '/api/model-providers',
    headers: { authorization: `Bearer ${userToken}` },
    payload: {
      name: 'Test Provider',
      providerId: `test-provider-${Date.now()}`,
      baseUrl: 'https://api.test-provider.local/v1',
      apiKey: 'test-api-key',
    },
  });
  expect(providerRes.statusCode).toBe(200);
  const providerBody = providerRes.json() as { id: string };
  const providerId = providerBody.id;

  // 注册一个 Model，关联到上面的 Provider
  const modelRes = await app.inject({
    method: 'POST',
    url: '/api/models',
    headers: { authorization: `Bearer ${userToken}` },
    payload: {
      modelId: 'gpt-test-mini',
      name: 'Test Mini Model',
      maxTokens: 2048,
      isMultimodal: false,
      supportsDeepThinking: false,
      providerId,
    },
  });
  expect(modelRes.statusCode).toBe(200);
  const modelBody = modelRes.json() as { id: string };
  const modelId = modelBody.id;

  fixtures = { app, userToken, userId, providerId, modelId };
});

afterAll(async () => {
  if (!fixtures) return;
  // 清理：按依赖反序删除，避免外键冲突
  await db.model.deleteMany({ where: { providerId: fixtures.providerId } });
  await db.modelProvider.deleteMany({ where: { id: fixtures.providerId } });
  await db.user.deleteMany({ where: { id: fixtures.userId } });
  await fixtures.app.close();
});

describe('POST /api/prompts/optimize - 集成测试', () => {
  const url = '/api/prompts/optimize';

  describe('401 未认证', () => {
    it('缺少 Authorization 头应返回 401', async () => {
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        payload: {
          promptContent: '请优化这段提示词',
          modelId: fixtures.modelId,
        },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json()).toMatchObject({ error: 'Unauthorized' });
    });

    it('Authorization 头非 Bearer 格式应返回 401', async () => {
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
        payload: {
          promptContent: '请优化这段提示词',
          modelId: fixtures.modelId,
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('伪造/签名错误的 JWT 应返回 401', async () => {
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQsTwRc' },
        payload: {
          promptContent: '请优化这段提示词',
          modelId: fixtures.modelId,
        },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json()).toMatchObject({ error: 'Invalid token' });
    });
  });

  describe('400 参数校验', () => {
    it('缺少必填字段 promptContent 应返回 400', async () => {
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(400);
      const body = res.json() as { error: string; details?: Array<{ path: string }> };
      expect(body.error).toBe('Validation Error');
      expect(body.details?.some((d) => d.path === 'promptContent')).toBe(true);
    });

    it('promptContent 为空字符串应返回 400', async () => {
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: '', modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(400);
    });

    it('promptContent 超过 10000 字符上限应返回 400', async () => {
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: 'x'.repeat(10001), modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(400);
    });

    it('context 超过 5000 字符上限应返回 400', async () => {
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: {
          promptContent: '请优化这段提示词',
          modelId: fixtures.modelId,
          context: 'y'.repeat(5001),
        },
      });
      expect(res.statusCode).toBe(400);
      const body = res.json() as { details?: Array<{ path: string }> };
      expect(body.details?.some((d) => d.path === 'context')).toBe(true);
    });

    it('modelId 非 UUID 格式应返回 400', async () => {
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: '请优化', modelId: 'not-a-uuid' },
      });
      expect(res.statusCode).toBe(400);
      const body = res.json() as { details?: Array<{ path: string }> };
      expect(body.details?.some((d) => d.path === 'modelId')).toBe(true);
    });

    it('modelId 为合法 UUID 但不存在于 DB 中，应返回 404 并携带 MODEL_NOT_FOUND code', async () => {
      // 路由委托给 optimizeLlmPrompt，后者在调用 LLM 之前会先查询 model 是否存在，
      // 找不到直接返回 { ok: false, error: { code: 'MODEL_NOT_FOUND', ... } }，
      // 路由层据此映射为 404。这里让 mock 模拟同样的行为。
      mockedOptimizeLlmPrompt.mockResolvedValueOnce({
        ok: false,
        error: { code: 'MODEL_NOT_FOUND', error: '模型不存在: 00000000-0000-0000-0000-000000000000' },
      });
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: {
          promptContent: '请优化',
          modelId: '00000000-0000-0000-0000-000000000000',
        },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({
        error: '模型不存在: 00000000-0000-0000-0000-000000000000',
        code: 'MODEL_NOT_FOUND',
      });
    });
  });

  describe('200 正常优化路径', () => {
    it('optimizeLlmPrompt 返回成功结果时应返回 optimizedContent', async () => {
      const fakeOptimized = '优化后的提示词：请作为一名资深工程师回答以下问题，要求输出结构化 JSON';
      mockedOptimizeLlmPrompt.mockResolvedValueOnce({
        ok: true,
        data: { optimizedContent: fakeOptimized },
      });

      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: {
          promptContent: '回答我的问题',
          modelId: fixtures.modelId,
          context: '这是一个测试场景',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as { optimizedContent: string };
      expect(body.optimizedContent).toBe(fakeOptimized);

      // 校验 optimizeLlmPrompt 被以正确的参数调用
      expect(mockedOptimizeLlmPrompt).toHaveBeenCalledTimes(1);
      const callArgs = mockedOptimizeLlmPrompt.mock.calls[0]![0];
      expect(callArgs.modelId).toBe(fixtures.modelId);
      expect(callArgs.promptContent).toBe('回答我的问题');
      expect(callArgs.context).toBe('这是一个测试场景');
    });

    it('响应体只能包含 optimizedContent，不包含 original/suggestions 等旧字段', async () => {
      mockedOptimizeLlmPrompt.mockResolvedValueOnce({
        ok: true,
        data: { optimizedContent: '优化后的结果' },
      });
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: '原始提示词', modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as Record<string, unknown>;
      expect(body.optimizedContent).toBe('优化后的结果');
      // 确保旧字段不再返回
      expect(body).not.toHaveProperty('original');
      expect(body).not.toHaveProperty('optimized');
      expect(body).not.toHaveProperty('suggestions');
    });
  });

  describe('502 LLM 异常', () => {
    it('optimizeLlmPrompt 返回 LLM_CALL_FAILED 时应返回 502', async () => {
      mockedOptimizeLlmPrompt.mockResolvedValueOnce({
        ok: false,
        error: { code: 'LLM_CALL_FAILED', error: 'Connection timeout' },
      });
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: '请优化', modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(502);
      expect(res.json()).toMatchObject({
        error: 'Connection timeout',
        code: 'LLM_CALL_FAILED',
      });
    });

    it('optimizeLlmPrompt 返回 LLM 未返回结果时应返回 502', async () => {
      mockedOptimizeLlmPrompt.mockResolvedValueOnce({
        ok: false,
        error: { code: 'LLM_CALL_FAILED', error: 'LLM 未返回结果' },
      });
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: '请优化', modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(502);
      expect(res.json()).toMatchObject({ code: 'LLM_CALL_FAILED' });
    });

    it('optimizeLlmPrompt 返回 EMPTY_RESPONSE 时应返回 502', async () => {
      mockedOptimizeLlmPrompt.mockResolvedValueOnce({
        ok: false,
        error: { code: 'EMPTY_RESPONSE', error: 'LLM 返回内容为空' },
      });
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: '请优化', modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(502);
      expect(res.json()).toMatchObject({
        error: 'LLM 返回内容为空',
        code: 'EMPTY_RESPONSE',
      });
    });

    it('非 MODEL_NOT_FOUND 的所有错误码均应映射为 502', async () => {
      // 验证路由层的兜底逻辑：除 MODEL_NOT_FOUND 外，所有 optimizeLlmPrompt 错误都映射到 502
      mockedOptimizeLlmPrompt.mockResolvedValueOnce({
        ok: false,
        error: { code: 'LLM_CALL_FAILED', error: 'Unknown LLM error' },
      });
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: '请优化', modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(502);
    });

    it('502 错误响应必须同时包含 error 与 code 字段', async () => {
      mockedOptimizeLlmPrompt.mockResolvedValueOnce({
        ok: false,
        error: { code: 'LLM_CALL_FAILED', error: 'Some provider error' },
      });
      const res = await fixtures.app.inject({
        method: 'POST',
        url,
        headers: { authorization: `Bearer ${fixtures.userToken}` },
        payload: { promptContent: '请优化', modelId: fixtures.modelId },
      });
      expect(res.statusCode).toBe(502);
      const body = res.json() as { error?: string; code?: string };
      expect(typeof body.error).toBe('string');
      expect(typeof body.code).toBe('string');
      expect(body.error!.length).toBeGreaterThan(0);
      expect(body.code!.length).toBeGreaterThan(0);
    });
  });
});
