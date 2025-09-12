import { z } from 'zod';

export const ConfigSchema = z.object({
  fireworksApiKey: z.string().default(''),
  modelId: z.string().default('accounts/fireworks/models/llama-v3p1-70b-instruct'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8192).default(2048),
  windowMode: z.enum(['doc-pip', 'popup', 'sidepanel']).default('doc-pip'),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
});

export type Config = z.infer<typeof ConfigSchema>;

export const PartialConfigSchema = ConfigSchema.partial();
export type PartialConfig = z.infer<typeof PartialConfigSchema>;