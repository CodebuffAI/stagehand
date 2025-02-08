import {
  LLMClient,
  CreateChatCompletionOptions,
  LLMResponse,
  ChatCompletionOptions,
  ChatMessage,
} from "./LLMClient";
import { AvailableModel } from "../../types/model";
import { LLMCache } from "../cache/LLMCache";
import { zodResponseFormat } from "openai/helpers/zod";
import { validateZodSchema } from "../utils";

export interface BackendClientOptions {
  backendUrl: string;
  apiKey?: string;
  organization?: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
}

export class BackendLLMClient extends LLMClient {
  public type = "backend" as const;
  private backendUrl: string;
  private enableCaching: boolean;
  private cache: LLMCache | undefined;
  public clientOptions: BackendClientOptions = { backendUrl: "" };

  constructor({
    enableCaching = false,
    cache,
    modelName,
    clientOptions,
  }: {
    enableCaching?: boolean;
    cache?: LLMCache;
    modelName: AvailableModel;
    clientOptions?: BackendClientOptions;
  }) {
    super(modelName);
    if (clientOptions?.backendUrl) {
      this.backendUrl = clientOptions.backendUrl;
      this.clientOptions = clientOptions;
    } else {
      throw new Error(
        "backendUrl must be provided in clientOptions for BackendLLMClient",
      );
    }
    this.enableCaching = enableCaching;
    this.cache = cache;
    this.modelName = modelName;
  }

  async createChatCompletion<T = LLMResponse>({
    options,
    logger,
    retries = 3,
  }: CreateChatCompletionOptions): Promise<T> {
    // Copy and adjust options
    const optionsCopy: Partial<ChatCompletionOptions> = { ...options };

    // If image is provided, add it as a screenshot message.
    if (options.image) {
      const screenshotMessage: ChatMessage = {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${options.image.buffer.toString(
                "base64",
              )}`,
            },
          },
          ...(options.image.description
            ? [{ type: "text", text: options.image.description }]
            : []),
        ],
      };
      optionsCopy.messages.push(screenshotMessage);
    }

    // Set up response format if a response_model is provided.
    let responseFormat = undefined;
    if (options.response_model) {
      responseFormat = zodResponseFormat(
        options.response_model.schema,
        options.response_model.name,
      );
    }

    // Remove image and requestId so they are not sent in the payload.
    const { image, requestId, ...payloadOptions } = optionsCopy;

    logger({
      category: "backend",
      message: "creating chat completion via backend proxy",
      level: 1,
      auxiliary: {
        options: {
          value: JSON.stringify({ ...payloadOptions, requestId }),
          type: "object",
        },
        modelName: {
          value: this.modelName,
          type: "string",
        },
      },
    });

    const cacheOptions = {
      model: this.modelName,
      messages: optionsCopy.messages,
      temperature: optionsCopy.temperature,
      top_p: optionsCopy.top_p,
      frequency_penalty: optionsCopy.frequency_penalty,
      presence_penalty: optionsCopy.presence_penalty,
      image: image,
      response_model: options.response_model,
    };

    if (this.enableCaching && this.cache) {
      const cachedResponse = await this.cache.get<T>(cacheOptions, requestId);
      if (cachedResponse) {
        logger({
          category: "llm_cache",
          message: "LLM cache hit - returning cached response",
          level: 1,
          auxiliary: {
            requestId: {
              value: requestId,
              type: "string",
            },
            cachedResponse: {
              value: JSON.stringify(cachedResponse),
              type: "object",
            },
          },
        });
        return cachedResponse;
      } else {
        logger({
          category: "llm_cache",
          message: "LLM cache miss - no cached response found",
          level: 1,
          auxiliary: {
            requestId: {
              value: requestId,
              type: "string",
            },
          },
        });
      }
    }

    const formattedMessages = optionsCopy.messages.map((message) => {
      if (Array.isArray(message.content)) {
        const contentParts = message.content.map((content) => {
          if ("image_url" in content) {
            return {
              image_url: {
                url: content.image_url.url,
              },
              type: "image_url",
            };
          } else {
            return {
              text: content.text,
              type: "text",
            };
          }
        });
        return { ...message, content: contentParts, role: message.role };
      }
      return { role: message.role, content: message.content };
    });

    const body = {
      ...payloadOptions,
      model: this.modelName,
      messages: formattedMessages,
      response_format: responseFormat,
      stream: false,
      tools: options.tools?.map((tool) => ({
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
        type: "function",
      })),
    };

    let response;
    try {
      const fetchResponse = await fetch(`${this.backendUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      response = await fetchResponse.json();
    } catch (error) {
      logger({
        category: "backend",
        message: "Error calling backend service",
        level: 0,
        auxiliary: {
          error: { value: error.message, type: "string" },
        },
      });
      if (retries > 0) {
        return this.createChatCompletion({
          options,
          logger,
          retries: retries - 1,
        });
      }
      throw error;
    }

    logger({
      category: "backend",
      message: "received response from backend proxy",
      level: 1,
      auxiliary: {
        response: { value: JSON.stringify(response), type: "object" },
        requestId: { value: requestId, type: "string" },
      },
    });

    if (options.response_model) {
      const extractedData = response.choices[0].message.content;
      const parsedData = JSON.parse(extractedData);
      if (!validateZodSchema(options.response_model.schema, parsedData)) {
        if (retries > 0) {
          return this.createChatCompletion({
            options,
            logger,
            retries: retries - 1,
          });
        }
        throw new Error("Invalid response schema");
      }
      if (this.enableCaching && this.cache) {
        this.cache.set(cacheOptions, parsedData, requestId);
      }
      return parsedData;
    }

    if (this.enableCaching && this.cache) {
      logger({
        category: "llm_cache",
        message: "caching response",
        level: 1,
        auxiliary: {
          requestId: { value: requestId, type: "string" },
          cacheOptions: { value: JSON.stringify(cacheOptions), type: "object" },
          response: { value: JSON.stringify(response), type: "object" },
        },
      });
      this.cache.set(cacheOptions, response, requestId);
    }
    return response as T;
  }
}
