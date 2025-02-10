import { LogLine } from "../../types/log";
import {
  AvailableModel,
  ClientOptions,
  ModelProvider,
  CodebuffClientOptions,
} from "../../types/model";
import { LLMCache } from "../cache/LLMCache";
import { AnthropicClient } from "./AnthropicClient";
import { LLMClient } from "./LLMClient";
import { OpenAIClient } from "./OpenAIClient";
import { CodebuffClient } from "./CodebuffClient";

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
    "codebuff-latest": "codebuff",
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
    if (!this.enableCaching) return;

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
    clientOptions?: ClientOptions,
  ): LLMClient {
    // Determine provider based on model name and/or client options
    let provider = this.modelToProviderMap[modelName];
    if (clientOptions && "backendUrl" in clientOptions) {
      provider = "codebuff";
    }

    if (!provider) {
      throw new Error(`Unsupported model: ${modelName}`);
    }

    const commonOptions = {
      logger: this.logger,
      enableCaching: this.enableCaching,
      cache: this.cache,
      modelName,
      clientOptions,
    };

    switch (provider) {
      case "openai":
        return new OpenAIClient(commonOptions);
      case "anthropic":
        return new AnthropicClient(commonOptions);
      case "codebuff":
        return new CodebuffClient({
          clientOptions: clientOptions as CodebuffClientOptions,
        });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
