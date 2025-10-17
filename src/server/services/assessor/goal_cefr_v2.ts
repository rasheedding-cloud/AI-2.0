/**
 * Goal→CEFR Assessor v2
 * 基于语义分析和CEFR框架的智能目标评估系统
 */

import { LLMAdapter } from '@/lib/llm/adapter';
import {
  CefrBand,
  Track,
  CEFR_BANDS,
  TRACKS,
  CEFR_DIMENSIONS,
  HIGH_RISK_DOMAINS,
  LANGUAGE_DETECTION,
  AMBIGUITY_FLAGS,
  DEFAULT_CONFIG,
  ASSESSMENT_PROMPT_TEMPLATE,
  FEW_SHOT_EXAMPLES,
  AmbiguityFlag
} from './cefr_features';

// 输入接口
export interface GoalAssessInput {
  learner_goal_free_text: string;
  self_assessed_level?: "Pre-A"|"A1"|"A2"|"B1"|"B2"|"C1"|null;
  identity?: "working_adult"|"university"|"high_school";
  native_language?: "ar"|"zh"|"other";
  cultural_mode?: "sa"|"gcc"|"none";
}

// 输出接口
export interface GoalAssessOutput {
  ui_target_label: string;
  track_scores: Array<{track: Track; score: number}>;
  target_band_primary: CefrBand;
  alternatives: Array<{band: CefrBand; confidence: number; label: string}>;
  confidence_primary: number;
  rationale: string;
  evidence_phrases: string[];
  ambiguity_flags: AmbiguityFlag[];
  domain_risk: "low"|"medium"|"high";
  safety_margin: number;
  subgoals?: Array<{name: string; band: CefrBand}>;
  normalization: {
    detected_langs: string[];
    normalized_goal_en: string;
  };
}

// 语言检测结果
interface LanguageDetection {
  primary_lang: string;
  detected_langs: string[];
  confidence: number;
}

// 内部辅助函数
class GoalAssessorV2 {
  private llmAdapter: LLMAdapter;

  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter;
  }

  /**
   * 主评估入口
   */
  async assess(input: GoalAssessInput): Promise<GoalAssessOutput> {
    try {
      // 1. 语言检测与归一化
      const normalization = await this.detectAndNormalizeLanguage(input);

      // 2. 构建评估提示词
      const prompt = this.buildAssessmentPrompt(input, normalization);

      // 3. 调用LLM进行评估
      const rawResult = await this.callLLM(prompt);

      // 4. 解析和验证结果
      const parsedResult = this.parseAndValidateResult(rawResult);

      // 5. 后处理：安全检查、风险标记等
      const finalResult = await this.postProcess(parsedResult, input);

      return {
        ...finalResult,
        normalization
      };
    } catch (error) {
      console.error('Goal assessment failed:', error);
      return this.getFallbackResult(input);
    }
  }

  /**
   * 语言检测与归一化
   */
  private async detectAndNormalizeLanguage(input: GoalAssessInput): Promise<GoalAssessOutput['normalization']> {
    const text = input.learner_goal_free_text.toLowerCase();
    const detected_langs: string[] = [];

    // 脚本检测
    for (const [lang, script] of Object.entries(LANGUAGE_DETECTION.scripts)) {
      if (script.test(text)) {
        detected_langs.push(lang);
      }
    }

    // 关键词检测
    for (const [lang, keywords] of Object.entries(LANGUAGE_DETECTION.keywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        if (!detected_langs.includes(lang)) {
          detected_langs.push(lang);
        }
      }
    }

    const primary_lang = detected_langs.length > 0 ? detected_langs[0] : 'en';

    // 归一化为英文（如果需要）
    let normalized_goal_en = input.learner_goal_free_text;
    if (primary_lang !== 'en' && detected_langs.includes('zh')) {
      // 简单的中文关键词映射，实际项目中可能需要真正的翻译
      normalized_goal_en = this.simpleChineseToEnglish(input.learner_goal_free_text);
    }

    return {
      detected_langs,
      normalized_goal_en
    };
  }

  /**
   * 简单中英文映射（仅用于演示）
   */
  private simpleChineseToEnglish(text: string): string {
    const mappings: Record<string, string> = {
      '工作': 'work',
      '学习': 'study',
      '旅行': 'travel',
      '考试': 'exam',
      '日常': 'daily',
      '职场': 'workplace',
      '学术': 'academic',
      '会议': 'meeting',
      '邮件': 'email',
      '展示': 'presentation',
      '雅思': 'IELTS',
      '托福': 'TOEFL'
    };

    let result = text;
    for (const [chinese, english] of Object.entries(mappings)) {
      result = result.replace(new RegExp(chinese, 'g'), english);
    }
    return result;
  }

  /**
   * 构建评估提示词
   */
  private buildAssessmentPrompt(input: GoalAssessInput, normalization: GoalAssessOutput['normalization']): string {
    const examples = FEW_SHOT_EXAMPLES.map(example =>
      JSON.stringify(example, null, 2)
    ).join('\n\n');

    return ASSESSMENT_PROMPT_TEMPLATE
      .replace('{goal_text}', normalization.normalized_goal_en)
      .replace('{self_assessed_level}', input.self_assessed_level || '未提供')
      .replace('{identity}', input.identity || '未提供')
      .replace('{native_language}', input.native_language || '未提供')
      .replace('{cultural_mode}', input.cultural_mode || 'none')
      + '\n\nFew-shot示例:\n' + examples;
  }

  /**
   * 调用LLM
   */
  private async callLLM(prompt: string): Promise<string> {
    try {
      const result = await this.llmAdapter.chat({
        system: "你是一位专业的CEFR英语能力评估专家。请严格按照JSON格式输出评估结果。",
        prompt: prompt,
        temperature: 0.1 // 确保输出稳定性
      });
      return result;
    } catch (error) {
      console.error('LLM call failed:', error);
      throw new Error('LLM评估失败');
    }
  }

  /**
   * 解析和验证结果
   */
  private parseAndValidateResult(rawResult: string): Partial<GoalAssessOutput> {
    try {
      // 尝试提取JSON
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从LLM输出中提取JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 验证必需字段
      const required = ['ui_target_label', 'track_scores', 'target_band_primary', 'confidence_primary'];
      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`缺少必需字段: ${field}`);
        }
      }

      // 验证CEFR等级
      if (!Object.keys(CEFR_BANDS).includes(parsed.target_band_primary)) {
        throw new Error(`无效的CEFR等级: ${parsed.target_band_primary}`);
      }

      return parsed;
    } catch (error) {
      console.error('Result parsing failed:', error);
      throw new Error('结果解析失败');
    }
  }

  /**
   * 后处理：安全检查、风险标记等
   */
  private async postProcess(
    result: Partial<GoalAssessOutput>,
    input: GoalAssessInput
  ): Promise<Omit<GoalAssessOutput, 'normalization'>> {
    const finalResult = { ...result } as Omit<GoalAssessOutput, 'normalization'>;

    // 1. 域风险检测
    finalResult.domain_risk = this.assessDomainRisk(input.learner_goal_free_text);

    // 2. 模糊性标记
    finalResult.ambiguity_flags = this.detectAmbiguityFlags(input, finalResult);

    // 3. 自评差距检查
    if (input.self_assessed_level && this.hasLargeSelfAssessmentGap(input.self_assessed_level, finalResult.target_band_primary)) {
      if (!finalResult.ambiguity_flags.includes(AMBIGUITY_FLAGS.LARGE_GAP_SELF_ASSESS)) {
        finalResult.ambiguity_flags.push(AMBIGUITY_FLAGS.LARGE_GAP_SELF_ASSESS);
      }
    }

    // 4. 安全边际设置
    finalResult.safety_margin = DEFAULT_CONFIG.safety_margin;

    // 5. 生成备选方案（如果LLM没有提供）
    if (!finalResult.alternatives || finalResult.alternatives.length === 0) {
      finalResult.alternatives = this.generateAlternatives(finalResult.target_band_primary);
    }

    return finalResult;
  }

  /**
   * 评估域风险
   */
  private assessDomainRisk(goalText: string): "low"|"medium"|"high" {
    const text = goalText.toLowerCase();
    const riskMatches = HIGH_RISK_DOMAINS.filter(domain => text.includes(domain));

    if (riskMatches.length === 0) return "low";
    if (riskMatches.length <= 2) return "medium";
    return "high";
  }

  /**
   * 检测模糊性标记
   */
  private detectAmbiguityFlags(input: GoalAssessInput, result: Partial<GoalAssessOutput>): AmbiguityFlag[] {
    const flags: AmbiguityFlag[] = [];
    const text = input.learner_goal_free_text.toLowerCase();

    // 混合意图检测
    const trackCount = result.track_scores?.filter(t => t.score > 0.3).length || 0;
    if (trackCount > 1) {
      flags.push(AMBIGUITY_FLAGS.MIXED_INTENTS);
    }

    // 细节不足检测
    if (text.length < 20) {
      flags.push(AMBIGUITY_FLAGS.INSUFFICIENT_DETAIL);
    }

    // 多领域检测
    const domainKeywords = ['工作', '学习', '旅行', '日常', '考试', 'work', 'study', 'travel', 'daily', 'exam'];
    const foundDomains = domainKeywords.filter(keyword => text.includes(keyword));
    if (foundDomains.length > 2) {
      flags.push(AMBIGUITY_FLAGS.MULTIPLE_DOMAINS);
    }

    return flags;
  }

  /**
   * 检查自评差距
   */
  private hasLargeSelfAssessmentGap(selfAssessed: string, targetBand: CefrBand): boolean {
    const levels = ["Pre-A", "A1", "A2", "B1", "B2", "C1"];
    const selfIndex = levels.indexOf(selfAssessed);
    const targetIndex = levels.findIndex(level => targetBand.startsWith(level));

    return Math.abs(selfIndex - targetIndex) >= 2;
  }

  /**
   * 生成备选方案
   */
  private generateAlternatives(primary: CefrBand): Array<{band: CefrBand; confidence: number; label: string}> {
    const bands = Object.keys(CEFR_BANDS) as CefrBand[];
    const primaryIndex = bands.indexOf(primary);

    const alternatives = [];

    // 保守方案
    if (primaryIndex > 0) {
      alternatives.push({
        band: bands[primaryIndex - 1],
        confidence: 0.8,
        label: "保守目标"
      });
    }

    // 进取方案
    if (primaryIndex < bands.length - 1) {
      alternatives.push({
        band: bands[primaryIndex + 1],
        confidence: 0.6,
        label: "进取目标"
      });
    }

    return alternatives.slice(0, 2);
  }

  /**
   * 降级结果
   */
  private getFallbackResult(input: GoalAssessInput): Omit<GoalAssessOutput, 'normalization'> {
    return {
      ui_target_label: "通用英语提升",
      track_scores: [
        {track: "daily", score: 0.6},
        {track: "work", score: 0.4}
      ],
      target_band_primary: "A2",
      alternatives: [
        {band: "A2-", confidence: 0.9, label: "保守目标"},
        {band: "A2+", confidence: 0.5, label: "进取目标"}
      ],
      confidence_primary: 0.5,
      rationale: "基于目标描述的通用评估结果",
      evidence_phrases: ["目标分析"],
      ambiguity_flags: [AMBIGUITY_FLAGS.INSUFFICIENT_DETAIL],
      domain_risk: "low",
      safety_margin: 0.0
    };
  }
}

// 主要导出函数
export async function assessGoalCEFRv2(
  input: GoalAssessInput,
  llmAdapter?: LLMAdapter
): Promise<GoalAssessOutput> {
  // 如果没有提供适配器，创建默认的Gemini适配器
  if (!llmAdapter) {
    const { GeminiAdapter } = await import('@/lib/llm/gemini');
    const adapter = new GeminiAdapter({
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-2.5-pro'
    });

    const assessor = new GoalAssessorV2(adapter);
    return assessor.assess(input);
  }

  const assessor = new GoalAssessorV2(llmAdapter);
  return assessor.assess(input);
}

// 工具函数：转换为我们现有的DifficultyBand类型
export function convertToLegacyDifficultyBand(cefrBand: CefrBand): string {
  const mapping: Record<CefrBand, string> = {
    'A2-': 'A2',
    'A2': 'A2',
    'A2+': 'A2',
    'B1-': 'B1',
    'B1': 'B1'
  };

  return mapping[cefrBand] || 'A2';
}