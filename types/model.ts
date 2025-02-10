import type { ClientOptions as AnthropicClientOptions } from "@anthropic-ai/sdk";
import type { ClientOptions as OpenAIClientOptions } from "openai";
import { z } from "zod";

export const AvailableModelSchema = z.enum([
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4o-2024-08-06",
  "claude-3-5-sonnet-latest",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-20240620",
  "o1-mini",
  "o1-preview",
  "o3-mini",
  "codebuff-latest",
]);

export type AvailableModel = z.infer<typeof AvailableModelSchema>;

export type ModelProvider = "openai" | "anthropic" | "codebuff";

export interface CodebuffClientOptions {
  backendUrl: string;
  authToken: string;
  fingerprintId: string;
  maxRetries?: number;
  timeout?: number;
}

export type ClientOptions =
  | OpenAIClientOptions
  | AnthropicClientOptions
  | CodebuffClientOptions;

export interface AnthropicJsonSchemaObject {
  definitions?: {
    MySchema?: { properties?: Record<string, unknown>; required?: string[] };
  };
  properties?: Record<string, unknown>;
  required?: string[];
}
