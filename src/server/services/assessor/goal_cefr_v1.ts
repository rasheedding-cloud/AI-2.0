/**
 * Goal→CEFR Assessor v1 (现有逻辑)
 * 保持向后兼容，不修改现有行为
 */

import { inferTargetBandFromIntake } from '@/lib/learning/caps';
import { recommendLearningTrack } from '@/lib/trackRecommendation';
import type { Intake } from '@/types';

// v1输出接口（保持现有格式）
export interface V1AssessmentResult {
  targetBand: string;
  track: string;
  confidence: number;
  explanation: string;
}

/**
 * v1评估逻辑（现有实现）
 */
export async function assessGoalCEFRv1(intake: Intake): Promise<V1AssessmentResult> {
  // 使用现有的推断逻辑
  const targetBand = inferTargetBandFromIntake(intake);
  const track = intake.track_override || recommendLearningTrack(intake);

  // 简单的置信度计算
  const confidence = calculateConfidence(intake, targetBand);

  return {
    targetBand,
    track,
    confidence,
    explanation: generateExplanation(intake, targetBand, track)
  };
}

/**
 * 计算置信度（简化版）
 */
function calculateConfidence(intake: Intake, targetBand: string): number {
  let confidence = 0.7; // 基础置信度

  // 根据目标文本长度调整
  if (intake.goal_free_text && intake.goal_free_text.length > 50) {
    confidence += 0.1;
  }

  // 根据自评一致性调整
  if (intake.self_assessed_level) {
    const levels = ['Pre-A', 'A1', 'A2', 'B1', 'B2', 'C1'];
    const selfIndex = levels.indexOf(intake.self_assessed_level);
    const targetIndex = levels.findIndex(level => targetBand.startsWith(level));

    if (Math.abs(selfIndex - targetIndex) <= 1) {
      confidence += 0.1;
    }
  }

  return Math.min(confidence, 1.0);
}

/**
 * 生成解释
 */
function generateExplanation(intake: Intake, targetBand: string, track: string): string {
  const explanations: Record<string, string> = {
    'work': '职场沟通需要专业英语能力',
    'travel': '旅行交流需要实用的日常英语',
    'study': '学术学习需要较强的英语理解能力',
    'daily': '日常交流需要基础的英语沟通能力',
    'exam': '考试准备需要针对性的英语技能训练'
  };

  return explanations[track] || '根据您的目标推荐的英语学习计划';
}