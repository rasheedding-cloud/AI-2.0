/**
 * Goal→CEFR Assessor 适配层
 * 提供v1/v2版本切换、影子模式、回滚等功能
 */

import { assessGoalCEFRv1, V1AssessmentResult } from './goal_cefr_v1';
import { assessGoalCEFRv2, GoalAssessInput, GoalAssessOutput, convertToLegacyDifficultyBand } from './goal_cefr_v2';
import type { Intake } from '@/types';

// 统一输入接口
export interface UnifiedAssessInput {
  learner_goal_free_text: string;
  self_assessed_level?: "Pre-A"|"A1"|"A2"|"B1"|"B2"|"C1"|null;
  identity?: "working_adult"|"university"|"high_school";
  native_language?: "ar"|"zh"|"other";
  cultural_mode?: "sa"|"gcc"|"none";
}

// 统一输出接口（兼容现有系统）
export interface UnifiedAssessResult {
  targetBand: string;        // 保持现有格式
  track: string;           // 保持现有格式
  confidence: number;      // 保持现有格式
  explanation: string;     // 保持现有格式

  // v2扩展字段（仅在v2模式下填充）
  v2_data?: {
    ui_target_label: string;
    alternatives: Array<{band: string; confidence: number; label: string}>;
    rationale: string;
    evidence_phrases: string[];
    ambiguity_flags: string[];
    domain_risk: string;
    normalization: {
      detected_langs: string[];
      normalized_goal_en: string;
    };
  };
}

// 差异日志接口
interface AssessmentDiff {
  session_id: string;
  timestamp: string;
  v1_result: {
    targetBand: string;
    track: string;
    confidence: number;
  };
  v2_result: {
    target_band_primary: string;
    confidence_primary: number;
    track_scores: Array<{track: string; score: number}>;
  };
  diff_summary: {
    band_diff: boolean;
    confidence_diff: number;
    track_diff: boolean;
  };
  ambiguity_flags: string[];
  evidence_count: number;
}

/**
 * 主要评估函数
 */
export async function assessGoalCEFR(
  input: UnifiedAssessInput,
  opts?: { shadow?: boolean; session_id?: string }
): Promise<UnifiedAssessResult> {
  const useV2 = process.env.FEATURE_GOAL_ASSESSOR_V2 === "true";
  const shadow = opts?.shadow || process.env.GOAL_ASSESSOR_SHADOW === "true";

  // v2模式（非影子）
  if (useV2 && !shadow) {
    try {
      const v2Result = await assessGoalCEFRv2(input);
      return convertV2ToUnified(v2Result);
    } catch (error) {
      console.error('V2 assessment failed, falling back to V1:', error);
      // v2失败时降级到v1
      const v1Result = await assessGoalCEFRv1(convertToV1Input(input));
      return convertV1ToUnified(v1Result);
    }
  }

  // 影子模式：v1为主，v2为辅
  if (shadow) {
    try {
      const [v1, v2] = await Promise.all([
        assessGoalCEFRv1(convertToV1Input(input)),
        assessGoalCEFRv2(input)
      ]);

      // 记录差异日志
      logGoalAssessorDiff(v1, v2, input, opts?.session_id);

      // 返回v1结果（UI不变）
      return convertV1ToUnified(v1);
    } catch (error) {
      console.warn("Shadow compare failed:", error);
      // 影子模式失败时使用v1
      const v1Result = await assessGoalCEFRv1(convertToV1Input(input));
      return convertV1ToUnified(v1Result);
    }
  }

  // 默认v1模式
  const v1Result = await assessGoalCEFRv1(convertToV1Input(input));
  return convertV1ToUnified(v1Result);
}

/**
 * v1结果转换为统一格式
 */
function convertV1ToUnified(v1Result: V1AssessmentResult): UnifiedAssessResult {
  return {
    targetBand: v1Result.targetBand,
    track: v1Result.track,
    confidence: v1Result.confidence,
    explanation: v1Result.explanation
  };
}

/**
 * v2结果转换为统一格式
 */
function convertV2ToUnified(v2Result: GoalAssessOutput): UnifiedAssessResult {
  // 获取得分最高的轨道
  const primaryTrack = v2Result.track_scores.reduce((max, current) =>
    current.score > max.score ? current : max
  ).track;

  return {
    targetBand: convertToLegacyDifficultyBand(v2Result.target_band_primary),
    track: primaryTrack,
    confidence: v2Result.confidence_primary,
    explanation: v2Result.rationale || v2Result.explanation,
    v2_data: {
      ui_target_label: v2Result.ui_target_label,
      alternatives: v2Result.alternatives.map(alt => ({
        band: convertToLegacyDifficultyBand(alt.band),
        confidence: alt.confidence,
        label: alt.label
      })),
      rationale: v2Result.rationale,
      evidence_phrases: v2Result.evidence_phrases,
      ambiguity_flags: v2Result.ambiguity_flags,
      domain_risk: v2Result.domain_risk,
      normalization: v2Result.normalization
    }
  };
}

/**
 * 转换为v1输入格式
 */
function convertToV1Input(input: UnifiedAssessInput): Intake {
  return {
    gender: 'prefer_not_to_say', // 默认值
    identity: input.identity || 'working_adult',
    native_language: input.native_language || 'other',
    goal_free_text: input.learner_goal_free_text,
    zero_base: null,
    self_assessed_level: input.self_assessed_level as any,
    deadline_date: null,
    daily_minutes_pref: null,
    study_days_per_week: null,
    cultural_mode: input.cultural_mode || 'none',
    track_override: null
  };
}

/**
 * 记录差异日志
 */
function logGoalAssessorDiff(
  v1Result: V1AssessmentResult,
  v2Result: GoalAssessOutput,
  input: UnifiedAssessInput,
  sessionId?: string
): void {
  const diff: AssessmentDiff = {
    session_id: sessionId || generateSessionId(),
    timestamp: new Date().toISOString(),
    v1_result: {
      targetBand: v1Result.targetBand,
      track: v1Result.track,
      confidence: v1Result.confidence
    },
    v2_result: {
      target_band_primary: v2Result.target_band_primary,
      confidence_primary: v2Result.confidence_primary,
      track_scores: v2Result.track_scores
    },
    diff_summary: {
      band_diff: convertToLegacyDifficultyBand(v2Result.target_band_primary) !== v1Result.targetBand,
      confidence_diff: Math.abs(v2Result.confidence_primary - v1Result.confidence),
      track_diff: v2Result.track_scores[0]?.track !== v1Result.track
    },
    ambiguity_flags: v2Result.ambiguity_flags,
    evidence_count: v2Result.evidence_phrases?.length || 0
  };

  // 记录到可观测日志（不记录敏感原文）
  const logData = {
    ...diff,
    input_hash: hashInput(input.learner_goal_free_text), // 匿名化处理
    input_length: input.learner_goal_free_text.length
  };

  console.log('ASSESSOR_DIFF', JSON.stringify(logData));

  // 异步发送到分析API进行数据收集（不阻塞主流程）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/assessor/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData)
    }).catch(error => {
      console.warn('Failed to send analytics data:', error);
    });
  }
}

/**
 * 生成会话ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 输入文本哈希（匿名化）
 */
function hashInput(text: string): string {
  // 简单哈希函数，生产环境建议使用更强的哈希算法
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString(36);
}

/**
 * 获取评估统计信息
 */
export function getAssessmentStats(): {
  v1_usage: number;
  v2_usage: number;
  shadow_comparisons: number;
  avg_confidence_diff: number;
} {
  // 这里可以从日志系统或数据库中获取统计信息
  // 目前返回模拟数据
  return {
    v1_usage: 0,
    v2_usage: 0,
    shadow_comparisons: 0,
    avg_confidence_diff: 0
  };
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<{
  v1_available: boolean;
  v2_available: boolean;
  gemini_available: boolean;
  deepseek_available: boolean;
}> {
  const checks = {
    v1_available: true, // v1总是可用
    v2_available: false,
    gemini_available: false,
    deepseek_available: false
  };

  // 检查v2可用性
  try {
    if (process.env.GEMINI_API_KEY) {
      const { GeminiAdapter } = await import('@/lib/llm/gemini');
      const adapter = new GeminiAdapter({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-pro'
      });

      // 简单测试
      await adapter.chat({ prompt: 'test', temperature: 0.1 });
      checks.gemini_available = true;
      checks.v2_available = true;
    }
  } catch (error) {
    console.warn('Gemini health check failed:', error);
  }

  // 检查DeepSeek可用性
  try {
    if (process.env.DEEPSEEK_API_KEY) {
      const { DeepSeekAdapter } = await import('@/lib/llm/deepseek');
      const adapter = new DeepSeekAdapter({
        apiKey: process.env.DEEPSEEK_API_KEY
      });

      await adapter.chat({ prompt: 'test', temperature: 0.1 });
      checks.deepseek_available = true;
    }
  } catch (error) {
    console.warn('DeepSeek health check failed:', error);
  }

  return checks;
}

// 环境变量检查
export const FEATURE_FLAGS = {
  V2_ENABLED: process.env.FEATURE_GOAL_ASSESSOR_V2 === "true",
  SHADOW_MODE: process.env.GOAL_ASSESSOR_SHADOW === "true",
  LOGGING_ENABLED: process.env.ASSESSOR_LOGGING_ENABLED !== "false"
} as const;