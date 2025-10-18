import type { PlanOption, Intake, DiagnosisColor } from '@/types';
import { TimeCalculator } from '@/lib/calc/time';

export interface DiagnosisResult {
  color: DiagnosisColor;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  adjustments: {
    dailyMinutes?: number;
    daysPerWeek?: number;
    targetLevel?: string;
  };
}

export interface FeasibilityFactors {
  timeFeasibility: number; // 0-100
  goalFeasibility: number; // 0-100
  scheduleFeasibility: number; // 0-100
  overallFeasibility: number; // 0-100
}

export class LearningPlanDiagnosis {
  /**
   * 诊断学习方案的可行性
   */
  static async diagnosePlan(
    plan: PlanOption,
    intake: Intake
  ): Promise<DiagnosisResult> {
    const factors = this.calculateFeasibilityFactors(plan, intake);
    const issues = this.identifyIssues(plan, intake, factors);
    const recommendations = this.generateRecommendations(plan, intake, issues);
    const adjustments = this.calculateAdjustments(plan, intake, factors);

    const overallScore = factors.overallFeasibility;
    const color = this.getDiagnosisColor(overallScore);

    return {
      color,
      score: overallScore,
      issues,
      recommendations,
      adjustments,
    };
  }

  /**
   * 计算可行性因子
   */
  private static calculateFeasibilityFactors(
    plan: PlanOption,
    intake: Intake
  ): FeasibilityFactors {
    // 时间可行性
    const timeFeasibility = this.calculateTimeFeasibility(plan, intake);

    // 目标可行性
    const goalFeasibility = this.calculateGoalFeasibility(plan, intake);

    // 日程可行性
    const scheduleFeasibility = this.calculateScheduleFeasibility(plan, intake);

    // 综合可行性
    const overallFeasibility = Math.round(
      (timeFeasibility * 0.4 + goalFeasibility * 0.3 + scheduleFeasibility * 0.3)
    );

    return {
      timeFeasibility,
      goalFeasibility,
      scheduleFeasibility,
      overallFeasibility,
    };
  }

  /**
   * 计算时间可行性
   */
  private static calculateTimeFeasibility(plan: PlanOption, intake: Intake): number {
    const { daily_minutes, days_per_week, weeks } = plan;
    const totalWeeklyMinutes = daily_minutes * days_per_week;
    const totalRequiredMinutes = totalWeeklyMinutes * weeks;

    // 理想学习时间（基于目标水平）
    const idealWeeklyMinutes = this.getIdealWeeklyTime(plan.track, plan.ui_label_target);

    // 时间匹配度
    const timeMatch = Math.min(totalWeeklyMinutes / idealWeeklyMinutes, 2) * 50;

    // 每日时间合理性
    let dailyReasonability = 50;
    if (daily_minutes >= 30 && daily_minutes <= 120) {
      dailyReasonability = 100;
    } else if (daily_minutes >= 25 && daily_minutes <= 180) {
      dailyReasonability = 80;
    } else {
      dailyReasonability = 30;
    }

    // 每周天数合理性
    let weeklyReasonability = 50;
    if (days_per_week >= 4 && days_per_week <= 5) {
      weeklyReasonability = 100;
    } else if (days_per_week >= 3 && days_per_week <= 6) {
      weeklyReasonability = 80;
    } else {
      weeklyReasonability = 40;
    }

    return Math.round((timeMatch + dailyReasonability + weeklyReasonability) / 3);
  }

  /**
   * 计算目标可行性
   */
  private static calculateGoalFeasibility(plan: PlanOption, intake: Intake): number {
    const { weeks, track, ui_label_target } = plan;
    const { zero_base, self_assessed_level } = intake;

    let feasibilityScore = 70; // 基础分数

    // 零基础调整
    if (zero_base) {
      if (weeks < 20) {
        feasibilityScore -= 20;
      } else if (weeks < 16) {
        feasibilityScore -= 35;
      }
    } else {
      // 根据自评水平调整
      if (self_assessed_level) {
        const levelGap = this.calculateLevelGap(self_assessed_level, ui_label_target);
        if (levelGap > 2) {
          feasibilityScore -= 25;
        } else if (levelGap > 1) {
          feasibilityScore -= 10;
        }
      }
    }

    // 学习轨道难度调整
    const trackDifficulty = this.getTrackDifficulty(track);
    feasibilityScore += (trackDifficulty - 5) * 5; // -10 to +10

    // 周期合理性
    if (weeks >= 12 && weeks <= 20) {
      feasibilityScore += 10;
    } else if (weeks < 8 || weeks > 24) {
      feasibilityScore -= 15;
    }

    return Math.max(0, Math.min(100, feasibilityScore));
  }

  /**
   * 计算日程可行性
   */
  private static calculateScheduleFeasibility(plan: PlanOption, intake: Intake): number {
    const { deadline_date } = intake;
    const { weeks } = plan;

    if (!deadline_date) {
      return 80; // 无截止日期时给中等分数
    }

    const now = new Date();
    const deadline = new Date(deadline_date);
    const availableWeeks = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));

    if (availableWeeks >= weeks) {
      return 100;
    } else if (availableWeeks >= weeks * 0.8) {
      return 70;
    } else if (availableWeeks >= weeks * 0.6) {
      return 40;
    } else {
      return 10;
    }
  }

  /**
   * 识别问题
   */
  private static identifyIssues(
    plan: PlanOption,
    intake: Intake,
    factors: FeasibilityFactors
  ): string[] {
    const issues: string[] = [];

    // 时间相关问题
    if (factors.timeFeasibility < 60) {
      if (plan.daily_minutes < 30) {
        issues.push('每日学习时间过短，可能影响学习效果');
      }
      if (plan.days_per_week < 4) {
        issues.push('每周学习天数较少，学习连贯性不足');
      }
      if (plan.weeks < 12) {
        issues.push('学习周期过短，难以达到目标水平');
      }
    }

    // 目标相关问题
    if (factors.goalFeasibility < 60) {
      if (intake.zero_base && plan.weeks < 16) {
        issues.push('零基础学员建议安排更长的学习周期');
      }
      issues.push('学习目标与当前基础差距较大，需要适当调整');
    }

    // 日程相关问题
    if (factors.scheduleFeasibility < 60) {
      if (intake.deadline_date) {
        const now = new Date();
        const deadline = new Date(intake.deadline_date);
        const availableWeeks = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));

        if (availableWeeks < plan.weeks) {
          issues.push(`截止日期前时间不足，需要${plan.weeks}周但只剩${availableWeeks}周`);
        }
      }
    }

    // 学习强度问题
    const weeklyHours = (plan.daily_minutes * plan.days_per_week) / 60;
    if (weeklyHours > 15) {
      issues.push('学习强度过高，可能导致疲劳');
    } else if (weeklyHours < 3) {
      issues.push('学习强度过低，进步可能缓慢');
    }

    return issues;
  }

  /**
   * 生成建议
   */
  private static generateRecommendations(
    plan: PlanOption,
    intake: Intake,
    issues: string[]
  ): string[] {
    const recommendations: string[] = [];

    // 基于问题生成建议
    for (const issue of issues) {
      if (issue.includes('时间过短')) {
        recommendations.push('建议每日学习时间增加到30-60分钟');
      }
      if (issue.includes('天数较少')) {
        recommendations.push('建议每周学习4-5天，保持学习连贯性');
      }
      if (issue.includes('周期过短')) {
        recommendations.push('建议延长学习周期至16周以上');
      }
      if (issue.includes('时间不足')) {
        recommendations.push('建议调整学习目标或延长截止日期');
      }
      if (issue.includes('强度过高')) {
        recommendations.push('建议适当降低学习强度，保证学习质量');
      }
      if (issue.includes('强度过低')) {
        recommendations.push('建议增加学习时间或强度以提高效率');
      }
    }

    // 通用建议
    if (recommendations.length === 0) {
      recommendations.push('学习计划整体合理，建议保持稳定的学习节奏');
    }

    recommendations.push('定期进行自我评估，及时调整学习计划');
    recommendations.push('结合实践应用，提高语言学习效果');

    return recommendations;
  }

  /**
   * 计算调整建议
   */
  private static calculateAdjustments(
    plan: PlanOption,
    intake: Intake,
    factors: FeasibilityFactors
  ): DiagnosisResult['adjustments'] {
    const adjustments: DiagnosisResult['adjustments'] = {};

    // 时间调整
    if (factors.timeFeasibility < 60) {
      if (plan.daily_minutes < 30) {
        adjustments.dailyMinutes = Math.min(plan.daily_minutes + 15, 60);
      }
      if (plan.days_per_week < 4) {
        adjustments.daysPerWeek = Math.min(plan.days_per_week + 1, 5);
      }
    } else if (factors.timeFeasibility > 90 && plan.daily_minutes > 90) {
      adjustments.dailyMinutes = Math.max(plan.daily_minutes - 15, 60);
    }

    // 目标调整
    if (factors.goalFeasibility < 50) {
      // 建议调整目标标签
      if (plan.ui_label_target.includes('自如')) {
        adjustments.targetLevel = plan.ui_label_target.replace('自如', '流利');
      }
    }

    return adjustments;
  }

  /**
   * 获取诊断颜色
   */
  private static getDiagnosisColor(score: number): DiagnosisColor {
    if (score >= 80) {
      return 'green';
    } else if (score >= 60) {
      return 'yellow';
    } else {
      return 'red';
    }
  }

  /**
   * 获取理想周学习时间
   */
  private static getIdealWeeklyTime(track: string, targetLevel: string): number {
    let baseMinutes = 300; // 基础5小时/周

    // 根据轨道调整
    const trackMultipliers = {
      work: 1.2,
      study: 1.3,
      exam: 1.4,
      travel: 0.9,
      daily: 1.0,
    };

    baseMinutes *= (trackMultipliers as any)[track] || 1.0;

    // 根据目标水平调整
    if (targetLevel.includes('自如') || targetLevel.includes('B1')) {
      baseMinutes *= 1.3;
    } else if (targetLevel.includes('生存') || targetLevel.includes('A2')) {
      baseMinutes *= 1.0;
    }

    return Math.round(baseMinutes);
  }

  /**
   * 计算水平差距
   */
  private static calculateLevelGap(currentLevel: string, targetLevel: string): number {
    const levels = ['Pre-A', 'A1', 'A2', 'B1', 'B2', 'C1'];

    let currentIndex = levels.findIndex(level =>
      currentLevel.toLowerCase().includes(level.toLowerCase())
    );
    let targetIndex = levels.findIndex(level =>
      targetLevel.toLowerCase().includes(level.toLowerCase())
    );

    if (currentIndex === -1) currentIndex = 1; // 默认A1
    if (targetIndex === -1) targetIndex = 2; // 默认A2

    return Math.abs(targetIndex - currentIndex);
  }

  /**
   * 获取轨道难度
   */
  private static getTrackDifficulty(track: string): number {
    const difficulties = {
      daily: 3,
      travel: 4,
      work: 6,
      study: 7,
      exam: 8,
    };

    return (difficulties as any)[track] || 5;
  }

  /**
   * 批量诊断多个方案
   */
  static async diagnoseMultiplePlans(
    plans: PlanOption[],
    intake: Intake
  ): Promise<DiagnosisResult[]> {
    const results = await Promise.all(
      plans.map(plan => this.diagnosePlan(plan, intake))
    );

    // 按可行性排序
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * 生成诊断报告
   */
  static generateDiagnosisReport(results: DiagnosisResult[]): {
    summary: string;
    recommendations: string[];
    bestPlan: number;
  } {
    const bestScore = Math.max(...results.map(r => r.score));
    const bestPlanIndex = results.findIndex(r => r.score === bestScore);
    const worstScore = Math.min(...results.map(r => r.score));

    let summary = `学习方案诊断完成。`;

    if (bestScore >= 80) {
      summary += `最佳方案可行性良好（${bestScore}分）`;
    } else if (bestScore >= 60) {
      summary += `最佳方案可行性中等（${bestScore}分），建议适当调整`;
    } else {
      summary += `所有方案可行性都较低（最高${bestScore}分），建议重新考虑学习目标`;
    }

    // 综合建议
    const commonIssues = this.findCommonIssues(results);
    const recommendations = [
      ...commonIssues,
      '建议选择可行性最高的方案开始学习',
      '学习过程中可根据实际情况灵活调整'
    ];

    return {
      summary,
      recommendations,
      bestPlan: bestPlanIndex,
    };
  }

  /**
   * 找出常见问题
   */
  private static findCommonIssues(results: DiagnosisResult[]): string[] {
    const issueCount = new Map<string, number>();

    results.forEach(result => {
      result.issues.forEach(issue => {
        issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
      });
    });

    // 找出出现频率最高的问题
    const commonIssues = Array.from(issueCount.entries())
      .filter(([_, count]) => count >= Math.ceil(results.length / 2))
      .map(([issue, _]) => issue)
      .slice(0, 3); // 最多返回3个常见问题

    return commonIssues;
  }
}