// Auth schemas
export { tokenPayloadSchema, loginSchema, registerSchema } from './schemas/auth.js';
export type { TokenPayload, LoginInput, RegisterInput } from './schemas/auth.js';

// Prompt schemas
export {
  promptSchema,
  createPromptSchema,
  updatePromptSchema,
  projectSchema,
  createProjectSchema,
} from './schemas/prompt.js';
export type {
  Prompt,
  CreatePromptInput,
  UpdatePromptInput,
  Project,
  CreateProjectInput,
} from './schemas/prompt.js';

// Model provider schemas
export {
  modelProviderSchema,
  createModelProviderSchema,
  updateModelProviderSchema,
} from './schemas/model-provider.js';
export type {
  ModelProvider,
  CreateModelProviderInput,
  UpdateModelProviderInput,
} from './schemas/model-provider.js';

// Model schemas
export {
  modelSchema,
  createModelSchema,
  updateModelSchema,
} from './schemas/model.js';
export type {
  Model,
  CreateModelInput,
  UpdateModelInput,
} from './schemas/model.js';

// Execution schemas
export {
  promptExecutionSchema,
  executePromptSchema,
} from './schemas/execution.js';
export type {
  PromptExecution,
  ExecutePromptInput,
} from './schemas/execution.js';

// Optimization schemas
export {
  optimizePromptRequestSchema,
  optimizePromptResponseSchema,
} from './schemas/optimization.js';
export type {
  OptimizePromptRequest,
  OptimizePromptResponse,
} from './schemas/optimization.js';
