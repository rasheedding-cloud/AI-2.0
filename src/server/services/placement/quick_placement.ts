/**
 * QuickPlacement v1.1 - 核心评估逻辑
 * 三信号融合：Scene(0.6) + Objective(0.3) + Self(0.1)
 * 楼梯连续性规则 + 微档输出 (A2-/A2/A2+/B1-/B1)
 */

import { Question, QuestionLocale, getLocalizedQuestionBank } from './qb_bank';
import { LLMAdapter } from '@/lib/llm/adapter';

// 评估相关类型定义
export type LanguageLocale = 'zh' | 'en' | 'ar';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type MicroBand = 'A2-' | 'A2' | 'A2+' | 'B1-' | 'B1';  // v1.1 微档输出

// 场景锚点标签类型
export type SceneAnchor =
  | 'greeting_basic' | 'greeting_formal'
  | 'shopping_direction' | 'shopping_price'
  | 'travel_booking' | 'travel_navigation'
  | 'work_email' | 'work_meeting'
  | 'academic_reading' | 'academic_writing'
  | 'daily_time' | 'daily_number';

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
  // v1.1 新增字段
  scene_tags?: SceneAnchor[];  // 场景锚点标签（12-16项）
  objective_score?: number;    // 客观题得分（0-3分，≤3题）
  self_assessed_level?: CefrLevel | 'Pre-A';  // 简化自评
}

// v1.1 响应接口（新增字段，保持向后兼容）
export interface QuickPlacementResponse {
  // v1 兼容字段
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

  // v1.1 新增字段
  mapped_start_band?: MicroBand;        // 微档输出：A2-/A2/A2+/B1-/B1
  band_distribution?: Record<MicroBand, number>; // 概率分布
  flags?: string[];                     // 警告标记
  rationale?: string;                   // 推理说明
  evidence_phrases?: string[];          // 证据短语
  shadow_only?: boolean;                // 影子模式标记
}

export interface QuickPlacementConfig {
  enable_fusion: boolean;
  fusion_objective_weight: number;  // 客观题权重
  fusion_self_weight: number;       // 自评权重
  question_count: number;           // 默认10题
  time_limit_seconds: number;       // 3分钟

  // v1.1 新增配置
  v1_1_enabled?: boolean;           // v1.1功能开关
  scene_weight?: number;            // 场景锚点权重
  objective_weight_v1_1?: number;   // v1.1客观题权重
  self_weight_v1_1?: number;        // v1.1自评权重
  max_scored_questions?: number;    // 最大计分题数
}

// v1 默认配置
export const DEFAULT_CONFIG_V1: QuickPlacementConfig = {
  enable_fusion: true,
  fusion_objective_weight: 0.7,     // 客观题权重70%
  fusion_self_weight: 0.3,          // 自评权重30%
  question_count: 10,
  time_limit_seconds: 180           // 3分钟
};

// v1.1 默认配置
export const DEFAULT_CONFIG_V1_1: QuickPlacementConfig = {
  ...DEFAULT_CONFIG_V1,
  v1_1_enabled: false,              // 默认关闭
  scene_weight: 0.6,                // 场景锚点权重60%
  objective_weight_v1_1: 0.3,       // 客观题权重30%
  self_weight_v1_1: 0.1,            // 自评权重10%
  max_scored_questions: 3           // 最多3题计分
};

// 场景锚点映射到CEFR等级
const SCENE_ANCHORS: Record<SceneAnchor, { level: CefrLevel; description: string }> = {
  // A1 级别锚点
  greeting_basic: { level: 'A1', description: '基础问候' },
  daily_time: { level: 'A1', description: '基本时间表达' },
  daily_number: { level: 'A1', description: '基础数字理解' },

  // A2 级别锚点
  greeting_formal: { level: 'A2', description: '正式问候' },
  shopping_direction: { level: 'A2', description: '购物问路' },
  shopping_price: { level: 'A2', description: '价格询问' },
  travel_navigation: { level: 'A2', description: '旅行导航' },

  // B1- 级别锚点
  travel_booking: { level: 'B1', description: '旅行预订' },
  work_email: { level: 'B1', description: '工作邮件' },
  work_meeting: { level: 'B1', description: '工作会议' },

  // B1+ 级别锚点
  academic_reading: { level: 'B1', description: '学术阅读' },
  academic_writing: { level: 'B1', description: '学术写作' }
};

// ============================================================================
// v1.1 核心算法函数
// ============================================================================

/**
 * 1) 场景锚点 → 楼梯规则
 * 统计锚点命中并应用Guttman-like连续性规则
 */
export function scoreScene(sceneTags: SceneAnchor[]): {
  P_scene: Record<MicroBand, number>;
  ladder_status: {
    A1_passed: boolean;
    A2_passed: boolean;
    B1_passed: boolean;
  };
  evidence: SceneAnchor[];
} {
  // 统计各等级锚点命中数
  const levelCounts = {
    A1: 0,
    A2: 0,
    B1: 0
  };

  const evidence: SceneAnchor[] = [];

  sceneTags.forEach(tag => {
    const anchor = SCENE_ANCHORS[tag];
    if (anchor) {
      levelCounts[anchor.level]++;
      evidence.push(tag);
    }
  });

  // 通过条件检查（楼梯连续性规则）
  const A1_passed = levelCounts.A1 >= 3; // A1: ≥3个锚点
  const A2_passed = A1_passed && levelCounts.A2 >= 3; // A2: A1通过且 ≥3个A2锚点
  const B1_passed = A2_passed && levelCounts.B1 >= 2; // B1: A2通过且 ≥2个B1锚点

  // 计算覆盖率（用于微档细分）
  const totalAnchors = sceneTags.length || 1;
  const A2_coverage = levelCounts.A2 / totalAnchors;
  const B1_coverage = levelCounts.B1 / totalAnchors;

  // 初始化微档分布
  const P_scene: Record<MicroBand, number> = {
    'A2-': 0,
    'A2': 0,
    'A2+': 0,
    'B1-': 0,
    'B1': 0
  };

  // 应用楼梯规则和微档细分
  if (!A1_passed) {
    // A1未通过，默认到A2-
    P_scene['A2-'] = 0.8;
    P_scene['A2'] = 0.2;
  } else if (!A2_passed) {
    // A1通过但A2未通过
    if (A2_coverage >= 0.5) {
      P_scene['A2-'] = 0.3;
      P_scene['A2'] = 0.5;
      P_scene['A2+'] = 0.2;
    } else {
      P_scene['A2-'] = 0.7;
      P_scene['A2'] = 0.3;
    }
  } else if (!B1_passed) {
    // A2通过但B1未通过
    if (A2_coverage >= 0.9 && B1_coverage <= 0.25) {
      // A2+条件：A2覆盖率≥90%且B1覆盖率≤25%
      P_scene['A2'] = 0.3;
      P_scene['A2+'] = 0.6;
      P_scene['B1-'] = 0.1;
    } else if (A2_coverage >= 0.75) {
      // A2条件：A2覆盖率≥75%
      P_scene['A2'] = 0.7;
      P_scene['A2+'] = 0.2;
      P_scene['B1-'] = 0.1;
    } else if (A2_coverage >= 0.25) {
      // A2-条件：A2覆盖率25-50%
      P_scene['A2-'] = 0.4;
      P_scene['A2'] = 0.4;
      P_scene['A2+'] = 0.2;
    } else {
      P_scene['A2-'] = 0.6;
      P_scene['A2'] = 0.3;
      P_scene['A2+'] = 0.1;
    }
  } else {
    // B1通过
    if (B1_coverage >= 0.6) {
      P_scene['B1-'] = 0.6;
      P_scene['B1'] = 0.3;
      P_scene['A2+'] = 0.1;
    } else {
      P_scene['A2+'] = 0.4;
      P_scene['B1-'] = 0.4;
      P_scene['B1'] = 0.2;
    }
  }

  return {
    P_scene,
    ladder_status: { A1_passed, A2_passed, B1_passed },
    evidence
  };
}

/**
 * 2) 客观题 → 微调倾向（≤3题）
 * 根据客观题得分调整概率分布
 */
export function mapObjectiveScore(objScore: number): Record<MicroBand, number> {
  const P_obj: Record<MicroBand, number> = {
    'A2-': 0.2,
    'A2': 0.2,
    'A2+': 0.2,
    'B1-': 0.2,
    'B1': 0.2
  };

  switch (objScore) {
    case 0:
      // 0分：压低B1-/B1倾向
      P_obj['A2-'] = 0.4;
      P_obj['A2'] = 0.4;
      P_obj['A2+'] = 0.2;
      P_obj['B1-'] = 0;
      P_obj['B1'] = 0;
      break;
    case 1:
      // 1分：轻微提升A2+
      P_obj['A2-'] = 0.2;
      P_obj['A2'] = 0.3;
      P_obj['A2+'] = 0.3;
      P_obj['B1-'] = 0.2;
      P_obj['B1'] = 0;
      break;
    case 2:
      // 2分：提升B1-倾向
      P_obj['A2-'] = 0.1;
      P_obj['A2'] = 0.2;
      P_obj['A2+'] = 0.3;
      P_obj['B1-'] = 0.3;
      P_obj['B1'] = 0.1;
      break;
    case 3:
      // 3分：显著提升B1-倾向
      P_obj['A2-'] = 0;
      P_obj['A2'] = 0.1;
      P_obj['A2+'] = 0.2;
      P_obj['B1-'] = 0.5;
      P_obj['B1'] = 0.2;
      break;
  }

  return P_obj;
}

/**
 * 3) 自评先验
 * 根据自评等级生成温和先验分布
 */
export function mapSelfPrior(level?: string | null): Record<MicroBand, number> {
  const P_self: Record<MicroBand, number> = {
    'A2-': 0.2,
    'A2': 0.2,
    'A2+': 0.2,
    'B1-': 0.2,
    'B1': 0.2
  };

  if (!level) return P_self;

  switch (level) {
    case 'Pre-A':
    case 'A1':
      // Pre-A/A1→偏A2-
      P_self['A2-'] = 0.6;
      P_self['A2'] = 0.3;
      P_self['A2+'] = 0.1;
      P_self['B1-'] = 0;
      P_self['B1'] = 0;
      break;
    case 'A2':
      // A2→A2/A2+
      P_self['A2-'] = 0.2;
      P_self['A2'] = 0.5;
      P_self['A2+'] = 0.2;
      P_self['B1-'] = 0.1;
      P_self['B1'] = 0;
      break;
    case 'B1':
      // B1→B1-倾向
      P_self['A2-'] = 0;
      P_self['A2'] = 0.1;
      P_self['A2+'] = 0.2;
      P_self['B1-'] = 0.5;
      P_self['B1'] = 0.2;
      break;
    case 'B2':
      // B2→B1倾向（但我们的输出上限是B1）
      P_self['A2-'] = 0;
      P_self['A2'] = 0;
      P_self['A2+'] = 0.1;
      P_self['B1-'] = 0.4;
      P_self['B1'] = 0.5;
      break;
  }

  return P_self;
}

/**
 * 4) 融合算法
 * Scene(0.6) + Objective(0.3) + Self(0.1)
 * 无客观题时：Scene(0.8) + Self(0.2)
 */
export function fuse(
  P_scene: Record<MicroBand, number>,
  P_obj: Record<MicroBand, number>,
  P_self: Record<MicroBand, number>,
  hasObj: boolean
): Record<MicroBand, number> {
  const weights = hasObj
    ? { scene: 0.6, obj: 0.3, self: 0.1 }
    : { scene: 0.8, obj: 0, self: 0.2 };

  const P_fused: Record<MicroBand, number> = {
    'A2-': 0,
    'A2': 0,
    'A2+': 0,
    'B1-': 0,
    'B1': 0
  };

  // 加权融合
  for (const band of ['A2-', 'A2', 'A2+', 'B1-', 'B1'] as MicroBand[]) {
    P_fused[band] =
      P_scene[band] * weights.scene +
      P_obj[band] * weights.obj +
      P_self[band] * weights.self;
  }

  // 归一化
  const total = Object.values(P_fused).reduce((sum, val) => sum + val, 0);
  if (total > 0) {
    for (const band of ['A2-', 'A2', 'A2+', 'B1-', 'B1'] as MicroBand[]) {
      P_fused[band] = P_fused[band] / total;
    }
  }

  return P_fused;
}

/**
 * 5) Flags 与证据
 */
export function deriveFlags({
  scene,
  objScore,
  selfLevel,
  P,
  mapped
}: {
  scene: ReturnType<typeof scoreScene>;
  objScore?: number;
  selfLevel?: string | null;
  P: Record<MicroBand, number>;
  mapped: MicroBand;
}): string[] {
  const flags: string[] = [];

  // insufficient_data：锚点数量不足或客观题缺失
  if (scene.evidence.length < 6) {
    flags.push('insufficient_data');
  }

  // conflict_obj_scene：场景推向B1-/A2+但客观题0分
  if ((mapped === 'B1-' || mapped === 'A2+') && objScore === 0) {
    flags.push('conflict_obj_scene');
  }

  // self_gap_gt1band：自评与结果主档差≥1级
  if (selfLevel && selfLevel !== 'Pre-A') {
    const selfBands = {
      'A1': ['A2-', 'A2'],
      'A2': ['A2', 'A2+'],
      'B1': ['B1-', 'B1'],
      'B2': ['B1-', 'B1']
    };

    const selfPossibleBands = selfBands[selfLevel as keyof typeof selfBands] || [];
    if (!selfPossibleBands.includes(mapped)) {
      flags.push('self_gap_gt1band');
    }
  }

  return flags;
}

/**
 * 6) 证据短语生成
 */
export function buildEvidence({ sceneTags }: { sceneTags: SceneAnchor[] }): string[] {
  const evidence: string[] = [];

  // 选择关键的锚点（最多6条）
  const priorityAnchors = [
    'greeting_formal', 'travel_booking', 'work_email',
    'academic_reading', 'shopping_direction', 'travel_navigation'
  ];

  for (const anchor of priorityAnchors) {
    if (sceneTags.includes(anchor as SceneAnchor)) {
      const anchorInfo = SCENE_ANCHORS[anchor as SceneAnchor];
      if (anchorInfo) {
        evidence.push(anchorInfo.description);
      }
    }
  }

  return evidence.slice(0, 6);
}

/**
 * 7) 微档到CEFR映射（用于向后兼容）
 */
export function microBandToCefr(microBand: MicroBand): CefrLevel {
  const mapping: Record<MicroBand, CefrLevel> = {
    'A2-': 'A2',
    'A2': 'A2',
    'A2+': 'A2',
    'B1-': 'B1',
    'B1': 'B1'
  };
  return mapping[microBand];
}

/**
 * 8) v1.1 主评估函数
 */
export function quickPlacementV1_1(input: QuickPlacementRequest): QuickPlacementResponse {
  // 场景锚点评分
  const scene = scoreScene(input.scene_tags || []);

  // 客观题评分
  const P_obj = mapObjectiveScore(input.objective_score ?? 0);

  // 自评先验
  const P_self = mapSelfPrior(input.self_assessed_level);

  // 融合
  const P = fuse(scene.P_scene, P_obj, P_self, input.objective_score !== undefined);

  // 选择最高概率的微档
  const mapped = Object.entries(P).reduce((a, b) => P[a[0] as MicroBand] > P[b[0] as MicroBand] ? a : b)[0] as MicroBand;

  // 生成flags
  const flags = deriveFlags({
    scene,
    objScore: input.objective_score,
    selfLevel: input.self_assessed_level,
    P,
    mapped
  });

  // 生成证据短语
  const evidence = buildEvidence({ sceneTags: input.scene_tags || [] });

  // 构建rationale
  const rationale = `基于场景锚点分析(${scene.evidence.length}个锚点)${
    input.objective_score !== undefined ? `和客观题得分(${input.objective_score}/3)` : ''
  }${input.self_assessed_level ? `结合自评(${input.self_assessed_level})` : ''}`;

  // 检查是否为影子模式
  const shadowMode = process.env.QP_SHADOW === 'true';

  return {
    // v1兼容字段
    mapped_start: microBandToCefr(mapped),
    confidence: P[mapped],
    breakdown: {
      objective_score: {
        correct: input.objective_score ?? 0,
        total: 3,
        accuracy: (input.objective_score ?? 0) / 3
      },
      self_assessment: input.self_assessed_level || null,
      fusion_weights: {
        objective: input.objective_score !== undefined ? 0.3 : 0,
        self_assessment: input.self_assessed_level ? 0.1 : 0
      }
    },
    diagnostic: {
      stronger_skills: [],
      weaker_skills: [],
      recommended_focus: []
    },
    metadata: {
      question_count: input.user_answers?.length || 0,
      locale: input.locale
    },

    // v1.1新增字段
    mapped_start_band: mapped,
    band_distribution: P,
    flags,
    rationale,
    evidence_phrases: evidence,
    shadow_only: shadowMode
  };
}

// ============================================================================
// v1 原有实现（保持向后兼容）
// ============================================================================

/**
 * QuickPlacement v1 核心评估类
 */
export class QuickPlacement {
  private config: QuickPlacementConfig;
  private questions: Question[];

  constructor(config: Partial<QuickPlacementConfig> = {}, locale: LanguageLocale = 'en') {
    // 检查是否启用v1.1
    const v1_1_enabled = process.env.FEATURE_QP_V1_1 === 'true' || config.v1_1_enabled;

    if (v1_1_enabled) {
      // v1.1配置
      this.config = { ...DEFAULT_CONFIG_V1_1, ...config, v1_1_enabled: true };
    } else {
      // v1配置
      this.config = { ...DEFAULT_CONFIG_V1, ...config, v1_1_enabled: false };
    }

    this.questions = getLocalizedQuestionBank(locale);
  }

  /**
   * 主要评估入口点
   */
  async evaluate(request: QuickPlacementRequest): Promise<QuickPlacementResponse> {
    // 检查是否启用v1.1
    if (this.config.v1_1_enabled) {
      return this.evaluateV1_1(request);
    }

    // v1 原有逻辑
    return this.evaluateV1(request);
  }

  /**
   * v1.1 评估逻辑
   */
  private async evaluateV1_1(request: QuickPlacementRequest): Promise<QuickPlacementResponse> {
    // 提取客观题得分（只计算前max_scored_questions题）
    const scoredQuestions = this.config.max_scored_questions || 3;
    const scoredAnswers = request.user_answers.slice(0, scoredQuestions);
    const scoredQuestionsData = this.questions.slice(0, scoredQuestions);

    let objectiveScore = 0;
    scoredAnswers.forEach((answer, index) => {
      if (answer === scoredQuestionsData[index]?.content.answer) {
        objectiveScore++;
      }
    });

    // 构建v1.1输入
    const v1_1Input: QuickPlacementRequest = {
      ...request,
      objective_score: objectiveScore,
      // 简化自评为单一等级
      self_assessed_level: request.self_assessment?.overall || undefined
    };

    // 调用v1.1算法
    const result = quickPlacementV1_1(v1_1Input);

    // 补充诊断信息（保持v1的格式）
    const diagnostic = this.generateDiagnosticV1_1(request, objectiveScore);

    return {
      ...result,
      diagnostic
    };
  }

  /**
   * v1 原有评估逻辑
   */
  private async evaluateV1(request: QuickPlacementRequest): Promise<QuickPlacementResponse> {
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
   * v1.1 诊断信息生成
   */
  private generateDiagnosticV1_1(request: QuickPlacementRequest, objectiveScore: number): QuickPlacementResponse['diagnostic'] {
    const strongerSkills: string[] = [];
    const weakerSkills: string[] = [];
    const recommendedFocus: string[] = [];

    // 基于场景锚点分析技能
    if (request.scene_tags) {
      const listeningScenes = request.scene_tags.filter(tag =>
        tag.includes('travel') || tag.includes('academic')
      );
      const readingScenes = request.scene_tags.filter(tag =>
        tag.includes('shopping') || tag.includes('direction')
      );

      if (listeningScenes.length > readingScenes.length) {
        strongerSkills.push('Listening');
        weakerSkills.push('Reading');
      } else if (readingScenes.length > listeningScenes.length) {
        strongerSkills.push('Reading');
        weakerSkills.push('Listening');
      }
    }

    // 基于轨道推荐重点
    if (request.track_hint) {
      switch (request.track_hint) {
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