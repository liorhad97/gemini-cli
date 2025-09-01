/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from 'openai';
import type { 
  ChatCompletion, 
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam 
} from 'openai/resources/chat/completions';

// Legacy Gemini types for backward compatibility
export type GenerateContentResponse = {
  text?: string;
  data?: any;
  functionCalls?: any[];
  executableCode?: any;
  codeExecutionResult?: any;
  choices?: Array<{
    message?: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
};

export type GenerateContentParameters = {
  contents?: any[];
  model?: string;
  messages?: ChatCompletionMessageParam[];
  max_tokens?: number;
  temperature?: number;
};

export type CountTokensParameters = {
  model: string;
  contents: any[];
};

export type CountTokensResponse = {
  totalTokens: number;
};

export type EmbedContentParameters = {
  model: string;
  content: any;
};

export type EmbedContentResponse = {
  embedding: number[];
};
import { createCodeAssistContentGenerator } from '../code_assist/codeAssist.js';
import { DEFAULT_DEEPSEEK_MODEL } from '../config/models.js';
import type { Config } from '../config/config.js';

import type { UserTierId } from '../code_assist/types.js';
import { LoggingContentGenerator } from './loggingContentGenerator.js';
import { InstallationManager } from '../utils/installationManager.js';

/**
 * Interface abstracting the core functionalities for generating content.
 * Supports both legacy Gemini-style and new DeepSeek/OpenAI-style interfaces.
 */
export interface ContentGenerator {
  generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse>;

  generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;

  countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;

  embedContent?(request: EmbedContentParameters): Promise<EmbedContentResponse>;

  userTier?: UserTierId;
}

export enum AuthType {
  USE_DEEPSEEK = 'deepseek-api-key',
  // Keep legacy options for potential backward compatibility
  LOGIN_WITH_GOOGLE = 'oauth-personal',
  USE_GEMINI = 'gemini-api-key', 
  USE_VERTEX_AI = 'vertex-ai',
  CLOUD_SHELL = 'cloud-shell',
}

export type ContentGeneratorConfig = {
  model: string;
  apiKey?: string;
  baseURL?: string;
  authType?: AuthType;
  proxy?: string;
};

export function createContentGeneratorConfig(
  config: Config,
  authType: AuthType | undefined,
): ContentGeneratorConfig {
  const deepSeekApiKey = process.env['DEEPSEEK_API_KEY'] || undefined;
  
  // Use runtime model from config if available; otherwise, fall back to default
  const effectiveModel = config.getModel() || DEFAULT_DEEPSEEK_MODEL;

  const contentGeneratorConfig: ContentGeneratorConfig = {
    model: effectiveModel,
    authType,
    proxy: config?.getProxy(),
    baseURL: 'https://api.deepseek.com',
  };

  // For DeepSeek API, we need an API key
  if (authType === AuthType.USE_DEEPSEEK && deepSeekApiKey) {
    contentGeneratorConfig.apiKey = deepSeekApiKey;
    return contentGeneratorConfig;
  }

  // Legacy support for other auth types (for backward compatibility)
  if (
    authType === AuthType.LOGIN_WITH_GOOGLE ||
    authType === AuthType.CLOUD_SHELL
  ) {
    return contentGeneratorConfig;
  }

  // Legacy Gemini support
  const geminiApiKey = process.env['GEMINI_API_KEY'] || undefined;
  if (authType === AuthType.USE_GEMINI && geminiApiKey) {
    contentGeneratorConfig.apiKey = geminiApiKey;
    return contentGeneratorConfig;
  }

  return contentGeneratorConfig;
}

export async function createContentGenerator(
  config: ContentGeneratorConfig,
  gcConfig: Config,
  sessionId?: string,
): Promise<ContentGenerator> {
  const version = process.env['CLI_VERSION'] || process.version;
  const userAgent = `DeepSeekCLI/${version} (${process.platform}; ${process.arch})`;

  // For DeepSeek API
  if (config.authType === AuthType.USE_DEEPSEEK) {
    if (!config.apiKey) {
      throw new Error('DeepSeek API key is required. Please set DEEPSEEK_API_KEY environment variable.');
    }

    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: {
        'User-Agent': userAgent,
      },
    });

    return new DeepSeekContentGenerator(openai, gcConfig, config.model);
  }

  // Legacy support for other auth types
  if (
    config.authType === AuthType.LOGIN_WITH_GOOGLE ||
    config.authType === AuthType.CLOUD_SHELL
  ) {
    const httpOptions = { headers: { 'User-Agent': userAgent } };
    return new LoggingContentGenerator(
      await createCodeAssistContentGenerator(
        httpOptions,
        config.authType,
        gcConfig,
        sessionId,
      ),
      gcConfig,
    );
  }

  throw new Error(
    `Error creating contentGenerator: Unsupported authType: ${config.authType}`,
  );
}

/**
 * DeepSeek-specific implementation of ContentGenerator using OpenAI SDK
 */
class DeepSeekContentGenerator implements ContentGenerator {
  constructor(
    private openai: OpenAI,
    private config: Config,
    private model: string
  ) {}

  private convertGeminiToOpenAI(request: GenerateContentParameters): ChatCompletionCreateParamsBase {
    // Convert Gemini-style request to OpenAI-style
    let messages: ChatCompletionMessageParam[] = [];
    
    if (request.messages) {
      messages = request.messages;
    } else if (request.contents) {
      // Convert Gemini contents to OpenAI messages
      messages = request.contents.map((content: any, index: number) => ({
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: typeof content === 'string' ? content : JSON.stringify(content)
      }));
    } else {
      messages = [{ role: 'user', content: 'Hello' }];
    }

    return {
      messages,
      model: request.model || this.model,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
    };
  }

  private convertOpenAIToGemini(response: ChatCompletion): GenerateContentResponse {
    return {
      text: response.choices?.[0]?.message?.content || '',
      choices: response.choices?.map(choice => ({
        message: {
          content: choice.message?.content || '',
          role: choice.message?.role || 'assistant',
        },
        finish_reason: choice.finish_reason,
      })),
      data: response,
      functionCalls: [],
      executableCode: undefined,
      codeExecutionResult: undefined,
    };
  }

  async generateContent(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const openaiRequest = this.convertGeminiToOpenAI(request);
    const response = await this.openai.chat.completions.create({
      ...openaiRequest,
      stream: false,
    });
    
    return this.convertOpenAIToGemini(response);
  }

  async generateContentStream(
    request: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const openaiRequest = this.convertGeminiToOpenAI(request);
    const stream = await this.openai.chat.completions.create({
      ...openaiRequest,
      stream: true,
    });

    return this.convertStreamToGenerator(stream);
  }

  private async* convertStreamToGenerator(stream: any): AsyncGenerator<GenerateContentResponse> {
    for await (const chunk of stream) {
      // Convert streaming chunk to Gemini-compatible format
      const completion: ChatCompletion = {
        id: chunk.id,
        object: 'chat.completion',
        created: chunk.created,
        model: chunk.model,
        choices: chunk.choices?.map((choice: any) => ({
          index: choice.index,
          message: {
            role: choice.delta?.role || 'assistant',
            content: choice.delta?.content || '',
          },
          finish_reason: choice.finish_reason,
        })) || [],
        usage: chunk.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      };
      yield this.convertOpenAIToGemini(completion);
    }
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // DeepSeek API doesn't provide token counting, so we'll estimate
    // This is a rough approximation: ~4 characters per token for English text
    let totalContent = '';
    
    if (request.contents) {
      totalContent = request.contents
        .map(content => typeof content === 'string' ? content : JSON.stringify(content))
        .join(' ');
    }
    
    const estimatedTokens = Math.ceil(totalContent.length / 4);
    return { totalTokens: estimatedTokens };
  }

  async embedContent?(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    // DeepSeek doesn't support embeddings, return a mock response
    return {
      embedding: new Array(1536).fill(0), // Standard embedding dimension
    };
  }
}
