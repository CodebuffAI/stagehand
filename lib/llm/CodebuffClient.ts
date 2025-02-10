import {
  LLMClient,
  CreateChatCompletionOptions,
  LLMResponse,
} from "./LLMClient";

export interface CodebuffClientOptions {
  backendUrl: string;
  authToken: string;
  fingerprintId: string;
  maxRetries?: number;
  timeout?: number;
}

export class CodebuffClient extends LLMClient {
  public type = "codebuff" as const;
  private backendUrl: string;
  private authToken: string;
  private fingerprintId: string;

  constructor({ clientOptions }: { clientOptions: CodebuffClientOptions }) {
    super("codebuff-latest");
    if (!clientOptions) {
      throw new Error("clientOptions must be provided for CodebuffLLMClient");
    }
    if (!clientOptions.backendUrl) {
      throw new Error(
        "backendUrl must be provided in clientOptions for CodebuffLLMClient",
      );
    }
    if (!clientOptions.authToken) {
      throw new Error(
        "authToken must be provided in clientOptions for CodebuffLLMClient",
      );
    }
    if (!clientOptions.fingerprintId) {
      throw new Error(
        "fingerprintId must be provided in clientOptions for CodebuffLLMClient",
      );
    }
    this.backendUrl = clientOptions.backendUrl;
    this.authToken = clientOptions.authToken;
    this.fingerprintId = clientOptions.fingerprintId;
  }

  async createChatCompletion<T = LLMResponse>({
    options,
    logger,
  }: CreateChatCompletionOptions): Promise<T> {
    if (!this.backendUrl || !this.authToken || !this.fingerprintId) {
      throw new Error(
        "CodebuffClient not properly initialized with required credentials",
      );
    }

    logger({
      category: "codebuff",
      message: "creating chat completion via Codebuff proxy",
      level: 1,
    });
    try {
      const fetchResponse = await fetch(`${this.backendUrl}/browser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
          "X-Fingerprint-ID": this.fingerprintId,
        },
        body: JSON.stringify(options),
      });
      if (!fetchResponse.ok) {
        logger({
          category: "codebuff",
          message: "Error calling Codebuff service",
          level: 1,
          auxiliary: {
            status: { value: fetchResponse.status.toString(), type: "integer" },
          },
        });
        throw new Error(`Codebuff service returned ${fetchResponse.status}`);
      }
      const responseData = await fetchResponse.json();
      logger({
        category: "codebuff",
        message: "received response from Codebuff proxy",
        level: 1,
      });
      return responseData as T;
    } catch (error) {
      logger({
        category: "codebuff",
        message: "Error calling Codebuff service",
        level: 1,
        auxiliary: {
          error: { value: error.message, type: "string" },
          trace: { value: error.stack, type: "string" },
        },
      });
      throw error;
    }
  }
}
