export * from './system';
export * from './generatePlans';
export * from './generateMonthly';
export * from './generateSyllabus';

// 提示词版本管理
export const PROMPT_VERSIONS = {
  SYSTEM: '1.0.0',
  GENERATE_PLANS: '1.0.0',
  GENERATE_MONTHLY: '1.0.0',
  GENERATE_SYLLABUS: '1.0.0',
  QUICK_TEST: '1.0.0',
  CULTURAL_COMPLIANCE: '1.0.0',
  REPAIR: '1.0.0',
} as const;

// 提示词配置
export const PROMPT_CONFIG = {
  // 默认温度设置
  DEFAULT_TEMPERATURE: 0.2,

  // 创意性提示词温度
  CREATIVE_TEMPERATURE: 0.7,

  // 修复类提示词温度
  REPAIR_TEMPERATURE: 0.1,

  // 最大token数
  MAX_TOKENS: 4000,

  // 超时时间（毫秒）
  TIMEOUT: 30000,
} as const;

// 提示词模板替换
export class PromptTemplate {
  static replacePlaceholders(template: string, replacements: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(replacements)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return result;
  }

  static validateRequiredPlaceholders(template: string, required: string[]): string[] {
    const missing: string[] = [];

    for (const placeholder of required) {
      const pattern = `{${placeholder}}`;
      if (!template.includes(pattern)) {
        missing.push(placeholder);
      }
    }

    return missing;
  }
}

// 提示词缓存
export class PromptCache {
  private static cache = new Map<string, string>();

  static set(key: string, prompt: string): void {
    this.cache.set(key, prompt);
  }

  static get(key: string): string | undefined {
    return this.cache.get(key);
  }

  static has(key: string): boolean {
    return this.cache.has(key);
  }

  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }

  static size(): number {
    return this.cache.size;
  }
}

// 提示词历史记录
export class PromptHistory {
  private static history: Array<{
    id: string;
    type: string;
    prompt: string;
    response: string;
    timestamp: Date;
    success: boolean;
    error?: string;
  }> = [];

  static add(entry: {
    id: string;
    type: string;
    prompt: string;
    response: string;
    success: boolean;
    error?: string;
  }): void {
    this.history.unshift({
      ...entry,
      timestamp: new Date(),
    });

    // 保持历史记录不超过100条
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
  }

  static get(type?: string): typeof this.history {
    if (type) {
      return this.history.filter(entry => entry.type === type);
    }
    return [...this.history];
  }

  static clear(): void {
    this.history = [];
  }

  static getStats(): {
    total: number;
    successRate: number;
    byType: Record<string, { total: number; successRate: number }>;
  } {
    const total = this.history.length;
    const successCount = this.history.filter(entry => entry.success).length;

    const byType: Record<string, { total: number; successRate: number }> = {};

    for (const entry of this.history) {
      if (!byType[entry.type]) {
        byType[entry.type] = { total: 0, successRate: 0 };
      }
      byType[entry.type].total++;
    }

    for (const type of Object.keys(byType)) {
      const typeEntries = this.history.filter(entry => entry.type === type);
      const typeSuccessCount = typeEntries.filter(entry => entry.success).length;
      byType[type].successRate = typeSuccessCount / typeEntries.length;
    }

    return {
      total,
      successRate: total > 0 ? successCount / total : 0,
      byType,
    };
  }
}

// 提示词错误处理
export class PromptError extends Error {
  constructor(
    message: string,
    public type: 'template' | 'validation' | 'generation' | 'api',
    public details?: any
  ) {
    super(message);
    this.name = 'PromptError';
  }
}

// 提示词验证器
export class PromptValidator {
  static validateSystemPrompt(prompt: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prompt.includes('CEFR')) {
      errors.push('System prompt must mention CEFR restrictions');
    }

    if (!prompt.includes('16周')) {
      errors.push('System prompt must mention 16-week progression');
    }

    if (!prompt.includes('文化')) {
      errors.push('System prompt must mention cultural compliance');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateGeneratePlansPrompt(prompt: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prompt.includes('JSON')) {
      errors.push('Generate plans prompt must require JSON output');
    }

    if (!prompt.includes('light|standard|intensive')) {
      errors.push('Generate plans prompt must mention three tiers');
    }

    if (!prompt.includes('diagnosis')) {
      errors.push('Generate plans prompt must include diagnosis');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateMonthlyPlanPrompt(prompt: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prompt.includes('milestones')) {
      errors.push('Monthly plan prompt must include milestones');
    }

    if (!prompt.includes('assessment_gate')) {
      errors.push('Monthly plan prompt must include assessment gates');
    }

    if (!prompt.includes('A2+')) {
      errors.push('Monthly plan prompt must mention difficulty bands');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateSyllabusPrompt(prompt: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prompt.includes('weeks')) {
      errors.push('Syllabus prompt must include weeks structure');
    }

    if (!prompt.includes('lessons')) {
      errors.push('Syllabus prompt must include lessons');
    }

    if (!prompt.includes('caps')) {
      errors.push('Syllabus prompt must include learning caps');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}