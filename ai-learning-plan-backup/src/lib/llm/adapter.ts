import type { LLMAdapter } from '@/types';

export class LLMError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class DeepSeekAdapter implements LLMAdapter {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
    this.model = config.model || 'deepseek-chat';
  }

  async chat<TOut = string>(opts: {
    system?: string;
    prompt: string;
    temperature?: number;
  }): Promise<TOut> {
    try {
      const messages = [];

      if (opts.system) {
        messages.push({
          role: 'system' as const,
          content: opts.system,
        });
      }

      messages.push({
        role: 'user' as const,
        content: opts.prompt,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: opts.temperature || 0.2,
          max_tokens: 8000, // 限制在DeepSeek API的8192限制内
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new LLMError(
          `DeepSeek API error: ${response.status} ${response.statusText}`,
          response.status.toString(),
          errorData
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new LLMError('No content received from DeepSeek API');
      }

      // Try to parse as JSON if it looks like JSON
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        try {
          return JSON.parse(content) as TOut;
        } catch {
          // If parsing fails, return as string
          return content as TOut;
        }
      }

      return content as TOut;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new LLMError(`LLM call failed: ${error.message}`, 'NETWORK_ERROR', error);
      }

      throw new LLMError('Unknown LLM error', 'UNKNOWN_ERROR', error);
    }
  }
}

// Fallback adapter for testing/mock
export class MockAdapter implements LLMAdapter {
  private responses: Map<string, any> = new Map();
  private delay: number;

  constructor(config: { delay?: number } = {}) {
    this.delay = config.delay || 1000;
  }

  setMockResponse(key: string, response: any) {
    this.responses.set(key, response);
  }

  async chat<TOut = string>(opts: {
    system?: string;
    prompt: string;
    temperature?: number;
  }): Promise<TOut> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.delay));

    const key = opts.prompt.substring(0, 100); // Use first 100 chars as key
    const mockResponse = this.responses.get(key);

    if (mockResponse) {
      return mockResponse as TOut;
    }

    // Default mock response
    const defaultResponse = {
      success: false,
      error: 'No mock response configured',
      prompt: opts.prompt.substring(0, 50) + '...',
    };

    return defaultResponse as TOut;
  }
}

// Factory function to create adapter based on environment
export function createLLMAdapter(): LLMAdapter {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.warn('No DEEPSEEK_API_KEY found, using mock adapter');
    return new MockAdapter();
  }

  return new DeepSeekAdapter({
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  });
}

// Retry wrapper for LLM calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`LLM call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, lastError.message);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}