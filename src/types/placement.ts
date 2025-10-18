/**
 * QuickPlacement v1 相关类型定义
 */

import { z } from 'zod';

// 基础类型
export type LanguageLocale = 'zh' | 'en' | 'ar';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

// 自评技能类型
export const SelfAssessmentSchema = z.object({
  listening: z.enum(['A1', 'A2', 'B1', 'B2']),
  reading: z.enum(['A1', 'A2', 'B1', 'B2']),
  speaking: z.enum(['A1', 'A2', 'B1', 'B2']),
  writing: z.enum(['A1', 'A2', 'B1', 'B2']),
  overall: z.enum(['A1', 'A2', 'B1', 'B2'])
});

export type SelfAssessment = z.infer<typeof SelfAssessmentSchema>;

// 快测请求类型
export const QuickPlacementRequestSchema = z.object({
  locale: z.enum(['zh', 'en', 'ar']).default('en'),
  user_answers: z.array(z.number().int().min(0).max(3)).length(10),
  self_assessment: SelfAssessmentSchema.optional(),
  track_hint: z.enum(['daily', 'work', 'travel', 'academic']).optional(),
  metadata: z.object({
    time_spent_seconds: z.number().optional(),
    device_type: z.enum(['mobile', 'desktop', 'tablet']).optional()
  }).optional()
});

export type QuickPlacementRequest = z.infer<typeof QuickPlacementRequestSchema>;

// 诊断信息类型
export const DiagnosticSchema = z.object({
  stronger_skills: z.array(z.string()),
  weaker_skills: z.array(z.string()),
  recommended_focus: z.array(z.string())
});

export type Diagnostic = z.infer<typeof DiagnosticSchema>;

// 快测响应类型
export const QuickPlacementResponseSchema = z.object({
  mapped_start: z.enum(['A1', 'A2', 'B1', 'B2']),
  confidence: z.number().min(0).max(1),
  breakdown: z.object({
    objective_score: z.object({
      correct: z.number(),
      total: z.number(),
      accuracy: z.number()
    }),
    self_assessment: z.enum(['A1', 'A2', 'B1', 'B2']).nullable(),
    fusion_weights: z.object({
      objective: z.number(),
      self_assessment: z.number()
    })
  }),
  diagnostic: DiagnosticSchema,
  metadata: z.object({
    time_spent_seconds: z.number().optional(),
    question_count: z.number(),
    locale: z.enum(['zh', 'en', 'ar']),
    version: z.string().default('v1')
  })
});

export type QuickPlacementResponse = z.infer<typeof QuickPlacementResponseSchema>;

// 题目类型
export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  audio_url: z.string().optional(),
  options: z.array(z.string()).length(4),
  answer: z.number().int().min(0).max(3),
  translations: z.object({
    zh: z.object({
      text: z.string(),
      options: z.array(z.string()).length(4)
    }),
    ar: z.object({
      text: z.string(),
      options: z.array(z.string()).length(4)
    })
  }),
  cefr_map: z.object({
    A1: z.number(),
    A2: z.number(),
    B1: z.number(),
    B2: z.number()
  }),
  metadata: z.object({
    scene: z.enum(['daily', 'work', 'travel', 'academic']),
    domain: z.string(),
    skill: z.enum(['listening', 'reading', 'vocabulary'])
  })
});

export type Question = z.infer<typeof QuestionSchema>;

// 题库响应类型
export const QuestionBankResponseSchema = z.object({
  questions: z.array(QuestionSchema).length(10),
  locale: z.enum(['zh', 'en', 'ar']),
  config: z.object({
    time_limit_seconds: z.number(),
    question_count: z.number()
  }),
  stats: z.object({
    total_questions: z.number(),
    by_scene: z.record(z.number()),
    by_skill: z.record(z.number())
  })
});

export type QuestionBankResponse = z.infer<typeof QuestionBankResponseSchema>;

// 影子模式响应类型
export const ShadowModeResponseSchema = z.object({
  new_result: QuickPlacementResponseSchema,
  legacy_result: z.object({
    level: z.enum(['A1', 'A2', 'B1', 'B2']),
    confidence: z.number()
  }).optional(),
  comparison: z.object({
    level_match: z.boolean(),
    confidence_diff: z.number(),
    recommendation: z.enum(['use_new', 'use_legacy', 'inconclusive'])
  }),
  shadow_mode_enabled: z.boolean()
});

export type ShadowModeResponse = z.infer<typeof ShadowModeResponseSchema>;

// 功能特性配置类型
export const FeatureConfigSchema = z.object({
  quick_placement_enabled: z.boolean().default(false),
  shadow_mode_enabled: z.boolean().default(false),
  self_assessment_fusion_enabled: z.boolean().default(true),
  objective_weight: z.number().min(0).max(1).default(0.7),
  self_weight: z.number().min(0).max(1).default(0.3),
  supported_locales: z.array(z.enum(['zh', 'en', 'ar'])).default(['zh', 'en', 'ar'])
});

export type FeatureConfig = z.infer<typeof FeatureConfigSchema>;

// 错误响应类型
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }),
  request_id: z.string().optional(),
  timestamp: z.string()
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// API响应包装类型
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: ErrorResponseSchema.optional(),
  metadata: z.object({
    version: z.string(),
    timestamp: z.string(),
    processing_time_ms: z.number()
  })
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// 快测会话类型（用于跟踪用户进度）
export const PlacementSessionSchema = z.object({
  session_id: z.string(),
  locale: z.enum(['zh', 'en', 'ar']),
  start_time: z.string(),
  current_question: z.number().default(0),
  answers: z.array(z.number().int().min(0).max(3)).max(10),
  completed: z.boolean().default(false),
  time_spent_seconds: z.number().default(0)
});

export type PlacementSession = z.infer<typeof PlacementSessionSchema>;

// 用户进度类型
export const UserProgressSchema = z.object({
  user_id: z.string().optional(),
  session_id: z.string(),
  current_step: z.enum(['introduction', 'questions', 'self_assessment', 'results']),
  progress_percentage: z.number().min(0).max(100),
  time_remaining_seconds: z.number().optional()
});

export type UserProgress = z.infer<typeof UserProgressSchema>;