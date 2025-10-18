/**
 * Gemini API 适配器实现
 * 用于与 Google Gemini API 进行交互
 */

import type { LLMAdapter } from './adapter';

export interface GeminiConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export class GeminiAdapter implements LLMAdapter {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model || 'gemini-2.5-pro';
  }

  async chat<TOut>(opts: {
    system?: string;
    prompt: string;
    temperature?: number;
  }): Promise<string> {
    try {
      // 构建请求体
      const requestBody: any = {
        contents: [
          {
            parts: [
              { text: opts.prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: 4000,
        }
      };

      // 如果有系统提示，添加到内容中
      if (opts.system) {
        requestBody.contents.unshift({
          parts: [{ text: opts.system }],
          role: 'system'
        });
      }

      const response = await fetch(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      // 提取生成的文本
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!content) {
        throw new Error('Gemini API返回空内容');
      }

      return content;
    } catch (error) {
      console.error('Gemini API调用失败:', error);
      throw error;
    }
  }
}

/**
 * 创建Gemini适配器实例的工厂函数
 */
export function createGeminiAdapter(config: GeminiConfig): GeminiAdapter {
  return new GeminiAdapter(config);
}