/**
 * QuickPlacement v1 - 核心评估逻辑
 * 3分钟可选快测，包含场景锚定、客观题、自评融合
 */

import { Question, QuestionLocale, getLocalizedQuestionBank } from './qb_bank';
import { LLMAdapter } from '@/lib/llm/adapter';

// 评估相关类型定义
export type LanguageLocale = 'zh' | 'en' | 'ar';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

export interface QuickPlacementRequest {
  locale: LanguageLocale;
  user_answers: number[];  // 用户答案（长度10，索引对应当前顺序题库）
  self_assessment?: {
    listening: CefrLevel;
    reading: CefrLevel;
    speaking: CefrLevel;
    writing: CefrLevel;
    overall: CefrLevel;
  };
  track_hint?: 'daily' | 'work' | 'travel' | 'academic';  // 轨道提示（可选）
}

export interface QuickPlacementResponse {
  mapped_start: CefrLevel;
  confidence: number;     // 0-1
  breakdown: {
    objective_score: {
      correct: number;
      total: number;
      accuracy: number;
    };
    self_assessment: CefrLevel | null;
    fusion_weights: {
      objective: number;
      self_assessment: number;
    };
  };
  diagnostic: {
    stronger_skills: string[];
    weaker_skills: string[];
    recommended_focus: string[];
  };
  metadata: {
    time_spent_seconds?: number;
    question_count: number;
    locale: LanguageLocale;
  };
}

export interface QuickPlacementConfig {
  enable_fusion: boolean;
  fusion_objective_weight: number;  // 客观题权重
  fusion_self_weight: number;       // 自评权重
  question_count: number;           // 默认10题
  time_limit_seconds: number;       // 3分钟
}

// 默认配置
export const DEFAULT_CONFIG: QuickPlacementConfig = {
  enable_fusion: true,
  fusion_objective_weight: 0.7,     // 客观题权重70%
  fusion_self_weight: 0.3,          // 自评权重30%
  question_count: 10,
  time_limit_seconds: 180           // 3分钟
};

/**
 * QuickPlacement v1 核心评估类
 */
export class QuickPlacement {
  private config: QuickPlacementConfig;
  private questions: Question[];

  constructor(config: Partial<QuickPlacementConfig> = {}, locale: LanguageLocale = 'en') {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.questions = getLocalizedQuestionBank(locale);
  }

  /**
   * 主要评估入口点
   */
  async evaluate(request: QuickPlacementRequest): Promise<QuickPlacementResponse> {
    // 1. 客观题评分
    const objectiveScore = this.calculateObjectiveScore(request.user_answers);

    // 2. 融合算法（如果有自评）
    const finalResult = this.fuseResults(objectiveScore, request.self_assessment);

    // 3. 生成诊断信息
    const diagnostic = this.generateDiagnostic(request.user_answers, request.self_assessment, request.track_hint);

    // 4. 计算置信度
    const confidence = this.calculateConfidence(objectiveScore, request.self_assessment);

    return {
      mapped_start: finalResult.level,
      confidence,
      breakdown: {
        objective_score: objectiveScore,
        self_assessment: request.self_assessment?.overall || null,
        fusion_weights: {
          objective: this.config.fusion_objective_weight,
          self_assessment: request.config?.enable_fusion ? this.config.fusion_self_weight : 0
        }
      },
      diagnostic,
      metadata: {
        question_count: request.user_answers.length,
        locale: request.locale
      }
    };
  }

  /**
   * 客观题评分
   * 映射规则：答对题数 → CEFR起始等级
   */
  private calculateObjectiveScore(userAnswers: number[]): { correct: number; total: number; accuracy: number; mappedLevel: CefrLevel } {
    const correct = userAnswers.reduce((count, answer, index) => {
      return count + (answer === this.questions[index]?.content.answer ? 1 : 0);
    }, 0);

    const total = userAnswers.length;
    const accuracy = total > 0 ? correct / total : 0;

    // CEFR映射规则（根据答对题数）
    let mappedLevel: CefrLevel;
    if (correct >= 9) {
      mappedLevel = 'B2';      // 9-10题对
    } else if (correct >= 7) {
      mappedLevel = 'B1';      // 7-8题对
    } else if (correct >= 4) {
      mappedLevel = 'A2';      // 4-6题对
    } else {
      mappedLevel = 'A1';      // 0-3题对
    }

    return {
      correct,
      total,
      accuracy,
      mappedLevel
    };
  }

  /**
   * 融合算法：客观题 + 自评
   * 规则：客观题权重70%，自评权重30%
   */
  private fuseResults(
    objectiveScore: { mappedLevel: CefrLevel },
    selfAssessment?: QuickPlacementRequest['self_assessment']
  ): { level: CefrLevel; method: string } {
    if (!selfAssessment || !this.config.enable_fusion) {
      return { level: objectiveScore.mappedLevel, method: 'objective_only' };
    }

    const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2'];
    const objIndex = levelOrder.indexOf(objectiveScore.mappedLevel);
    const selfIndex = levelOrder.indexOf(selfAssessment.overall);

    // 计算加权平均分数
    const weightedIndex = Math.round(
      objIndex * this.config.fusion_objective_weight +
      selfIndex * this.config.fusion_self_weight
    );

    const finalLevel = levelOrder[Math.max(0, Math.min(levelOrder.length - 1, weightedIndex))];

    return {
      level: finalLevel,
      method: 'fusion'
    };
  }

  /**
   * 生成诊断信息
   */
  private generateDiagnostic(
    userAnswers: number[],
    selfAssessment?: QuickPlacementRequest['self_assessment'],
    trackHint?: string
  ): QuickPlacementResponse['diagnostic'] {
    const strongerSkills: string[] = [];
    const weakerSkills: string[] = [];
    const recommendedFocus: string[] = [];

    // 分析客观题表现
    const listeningCorrect = this.countSkillCorrect(userAnswers, 'listening');
    const readingCorrect = this.countSkillCorrect(userAnswers, 'reading');

    if (listeningCorrect > readingCorrect) {
      strongerSkills.push('Listening');
      weakerSkills.push('Reading');
    } else if (readingCorrect > listeningCorrect) {
      strongerSkills.push('Reading');
      weakerSkills.push('Listening');
    }

    // 基于轨道推荐重点
    if (trackHint) {
      switch (trackHint) {
        case 'work':
          recommendedFocus.push('商务英语', '职场沟通');
          break;
        case 'travel':
          recommendedFocus.push('旅行对话', '实用表达');
          break;
        case 'academic':
          recommendedFocus.push('学术写作', '专业词汇');
          break;
        default:
          recommendedFocus.push('日常交流', '基础语法');
      }
    }

    return {
      stronger_skills: strongerSkills,
      weaker_skills: weakerSkills,
      recommended_focus: recommendedFocus
    };
  }

  /**
   * 计算特定技能的正确题数
   */
  private countSkillCorrect(userAnswers: number[], skill: string): number {
    return userAnswers.reduce((count, answer, index) => {
      const question = this.questions[index];
      const isCorrect = answer === question?.content.answer;
      return count + (question?.metadata.skill === skill && isCorrect ? 1 : 0);
    }, 0);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    objectiveScore: { accuracy: number },
    selfAssessment?: QuickPlacementRequest['self_assessment']
  ): number {
    let confidence = objectiveScore.accuracy; // 基础置信度来自客观题准确率

    // 如果有自评，且与客观题结果一致，提高置信度
    if (selfAssessment) {
      const levelOrder: CefrLevel[] = ['A1', 'A2', 'B1', 'B2'];
      const objIndex = levelOrder.indexOf(objectiveScore.mappedLevel);
      const selfIndex = levelOrder.indexOf(selfAssessment.overall);

      const difference = Math.abs(objIndex - selfIndex);
      if (difference <= 1) {
        confidence += 0.1; // 自评与客观题接近，提高置信度
      } else if (difference >= 3) {
        confidence -= 0.2; // 自评与客观题差距大，降低置信度
      }
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * 获取题目列表（用于前端显示）
   */
  getQuestions(): Question[] {
    return this.questions.slice(0, this.config.question_count);
  }

  /**
   * 验证用户答案格式
   */
  validateAnswers(userAnswers: number[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(userAnswers)) {
      errors.push('用户答案必须是数组');
      return { valid: false, errors };
    }

    if (userAnswers.length !== this.config.question_count) {
      errors.push(`答案数量不正确，期望${this.config.question_count}题，实际${userAnswers.length}题`);
    }

    for (let i = 0; i < userAnswers.length; i++) {
      const answer = userAnswers[i];
      if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
        errors.push(`第${i + 1}题答案无效，必须是0-3的整数`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * 便捷函数：执行快速评估
 */
export async function performQuickPlacement(
  request: QuickPlacementRequest,
  config?: Partial<QuickPlacementConfig>
): Promise<QuickPlacementResponse> {
  const placement = new QuickPlacement(config, request.locale);
  return placement.evaluate(request);
}

/**
 * 影子模式：并行运行新旧算法，用于A/B测试
 */
export async function shadowModeEvaluation(
  request: QuickPlacementRequest,
  legacyAdapter?: LLMAdapter
): Promise<{
  new_result: QuickPlacementResponse;
  legacy_result?: { level: CefrLevel; confidence: number };
  comparison: {
    level_match: boolean;
    confidence_diff: number;
    recommendation: 'use_new' | 'use_legacy' | 'inconclusive';
  };
}> {
  // 新算法评估
  const newResult = await performQuickPlacement(request);

  // 旧算法评估（如果有适配器）
  let legacyResult;
  if (legacyAdapter) {
    try {
      // 这里可以调用原有的评估逻辑
      // legacyResult = await legacyEvaluate(request, legacyAdapter);
    } catch (error) {
      console.warn('Legacy evaluation failed:', error);
    }
  }

  // 比较结果
  const comparison = {
    level_match: legacyResult ? legacyResult.level === newResult.mapped_start : false,
    confidence_diff: legacyResult ? Math.abs(legacyResult.confidence - newResult.confidence) : 0,
    recommendation: 'use_new' as const // 默认推荐新算法
  };

  if (legacyResult) {
    if (newResult.confidence > legacyResult.confidence) {
      comparison.recommendation = 'use_new';
    } else if (legacyResult.confidence > newResult.confidence + 0.1) {
      comparison.recommendation = 'use_legacy';
    } else {
      comparison.recommendation = 'inconclusive';
    }
  }

  return {
    new_result: newResult,
    legacy_result: legacyResult,
    comparison
  };
}