import { LogLine } from "../../types/log";
import {
  AvailableModel,
  ClientOptions,
  ModelProvider,
} from "../../types/model";
import { LLMCache } from "../cache/LLMCache";
import { AnthropicClient } from "./AnthropicClient";
import { LLMClient } from "./LLMClient";
import { OpenAIClient } from "./OpenAIClient";
import { BackendLLMClient, BackendClientOptions } from "./BackendLLMClient";

export class LLMProvider {
  private modelToProviderMap: { [key in AvailableModel]: ModelProvider } = {
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
    "gpt-4o-2024-08-06": "openai",
    "o1-mini": "openai",
    "o1-preview": "openai",
    "o3-mini": "openai",
    "claude-3-5-sonnet-latest": "anthropic",
    "claude-3-5-sonnet-20240620": "anthropic",
    "claude-3-5-sonnet-20241022": "anthropic",
  };

  private logger: (message: LogLine) => void;
  private enableCaching: boolean;
  private cache: LLMCache | undefined;

  constructor(logger: (message: LogLine) => void, enableCaching: boolean) {
    this.logger = logger;
    this.enableCaching = enableCaching;
    this.cache = enableCaching ? new LLMCache(logger) : undefined;
  }

  cleanRequestCache(requestId: string): void {
    if (!this.enableCaching) {
      return;
    }
    this.logger({
      category: "llm_cache",
      message: "cleaning up cache",
      level: 1,
      auxiliary: {
        requestId: { value: requestId, type: "string" },
      },
    });
    this.cache.deleteCacheForRequestId(requestId);
  }

  getClient(
    modelName: AvailableModel,
    clientOptions?: ClientOptions | BackendClientOptions,
  ): LLMClient {
    // If a backendUrl is provided in clientOptions, override the provider to "backend"
    let provider = this.modelToProviderMap[modelName];
    if (clientOptions && "backendUrl" in clientOptions) {
      provider = "backend";
    }
    if (!provider) {
      throw new Error(`Unsupported model: ${modelName}`);
    }

    switch (provider) {
      case "openai":
        return new OpenAIClient({
          logger: this.logger,
          enableCaching: this.enableCaching,
          cache: this.cache,
          modelName,
          clientOptions,
        });
      case "anthropic":
        return new AnthropicClient({
          logger: this.logger,
          enableCaching: this.enableCaching,
          cache: this.cache,
          modelName,
          clientOptions,
        });
      case "backend":
        return new BackendLLMClient({
          enableCaching: this.enableCaching,
          cache: this.cache,
          modelName,
          clientOptions: clientOptions as BackendClientOptions,
        });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
