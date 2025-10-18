/**
 * DeepSeek API 适配器实现
 * 用于与 DeepSeek API 进行交互
 */

import type { LLMAdapter } from './adapter';

export interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class DeepSeekAdapter implements LLMAdapter {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.deepseek.com/v1';
    this.model = config.model || 'deepseek-chat';
  }

  async chat<TOut>(opts: {
    system?: string;
    prompt: string;
    temperature?: number;
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
            { role: 'user', content: opts.prompt }
          ],
          temperature: opts.temperature ?? 0.7,
          max_tokens: 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`DeepSeek API error: ${data.error.message}`);
      }

      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      throw error;
    }
  }
}

/**
 * 创建DeepSeek适配器实例的工厂函数
 */
export function createDeepSeekAdapter(config: DeepSeekConfig): DeepSeekAdapter {
  return new DeepSeekAdapter(config);
}