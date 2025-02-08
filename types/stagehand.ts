import { Browserbase } from "@browserbasehq/sdk";
import { Page, BrowserContext } from "../types/page";
import { z } from "zod";
import { LLMProvider } from "../lib/llm/LLMProvider";
import { LogLine } from "./log";
import { AvailableModel, ClientOptions } from "./model";
import { LLMClient } from "../lib/llm/LLMClient";
import { BrowserLaunchOptions } from "./browser";

export interface ConstructorParams {
  env?: "LOCAL" | "BROWSERBASE";
  apiKey?: string;
  projectId?: string;
  verbose?: 0 | 1 | 2;
  debugDom?: boolean;
  llmProvider?: LLMProvider;
  llmClient?: LLMClient;
  headless?: boolean;
  logger?: (logLine: LogLine) => void;
  browserbaseSessionCreateParams?: Browserbase.Sessions.SessionCreateParams;
  domSettleTimeoutMs?: number;
  enableCaching?: boolean;
  browserbaseSessionID?: string;
  modelName?: string;
  modelClientOptions?: Record<string, unknown>;
  systemPrompt?: string;
  browserLaunchOptions?: BrowserLaunchOptions;
}

export interface InitOptions {
  /** @deprecated Pass this into the Stagehand constructor instead. This will be removed in the next major version. */
  modelName?: AvailableModel;
  /** @deprecated Pass this into the Stagehand constructor instead. This will be removed in the next major version. */
  modelClientOptions?: ClientOptions;
  /** @deprecated Pass this into the Stagehand constructor instead. This will be removed in the next major version. */
  domSettleTimeoutMs?: number;
}

export interface InitResult {
  debugUrl: string;
  sessionUrl: string;
  sessionId: string;
}

export interface InitFromPageOptions {
  page: Page;
  /** @deprecated Pass this into the Stagehand constructor instead. This will be removed in the next major version. */
  modelName?: AvailableModel;
  /** @deprecated Pass this into the Stagehand constructor instead. This will be removed in the next major version. */
  modelClientOptions?: ClientOptions;
}

export interface InitFromPageResult {
  context: BrowserContext;
}

export interface ActOptions {
  action: string;
  modelName?: AvailableModel;
  modelClientOptions?: ClientOptions;
  /** @deprecated Vision is not supported in this version of Stagehand. */
  useVision?: boolean;
  variables?: Record<string, string>;
  domSettleTimeoutMs?: number;
}

export interface ActResult {
  success: boolean;
  message: string;
  action: string;
}

export interface ExtractOptions<T extends z.AnyZodObject> {
  instruction: string;
  schema: T;
  modelName?: AvailableModel;
  modelClientOptions?: ClientOptions;
  domSettleTimeoutMs?: number;
  useTextExtract?: boolean;
}

export type ExtractResult<T extends z.AnyZodObject> = z.infer<T>;

export interface ObserveOptions {
  instruction?: string;
  modelName?: AvailableModel;
  modelClientOptions?: ClientOptions;
  /** @deprecated Vision is not supported in this version of Stagehand. */
  useVision?: boolean;
  domSettleTimeoutMs?: number;
  returnAction?: boolean;
  onlyVisible?: boolean;
  /** @deprecated `useAccessibilityTree` is now deprecated. Use `onlyVisible` instead. */
  useAccessibilityTree?: boolean;
}

export interface ObserveResult {
  selector: string;
  description: string;
  backendNodeId?: number;
  method?: string;
  arguments?: string[];
}
