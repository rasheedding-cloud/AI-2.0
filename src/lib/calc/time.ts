import type { Intake, PlanOption } from '@/types';
import type { DifficultyBand } from '@/types';
import { recommendLearningTrack } from '@/lib/trackRecommendation';
import { inferStartBand, inferTargetBandFromIntake } from '@/lib/learning/caps';
import { assessGoalCEFR, FEATURE_FLAGS } from '@/server/services/assessor';

// 基础计算常量
export const LESSON_MINUTES = 25; // 25分钟一课

/**
 * 阶梯式学习时间需求（分钟）
 * 每个级别代表达到该水平所需的累计学习时间
 * 修正为更合理的学习时间分配
 */
export const BAND_PROGRESS_MINUTES: Record<string, number> = {
  'Pre-A': 0,      // 零基础
  'A1-': 1800,     // 基础入门 (30小时)
  'A1': 3600,      // A1水平 (60小时)
  'A1+': 5400,     // A1进阶 (90小时)
  'A2-': 7200,     // A2预备 (120小时)
  'A2': 9000,      // A2水平 (150小时)
  'A2+': 10800,    // A2进阶 (180小时)
  'B1-': 12600,    // B1预备 (210小时)
  'B1': 14400,     // B1水平 (240小时)
  'B1+': 18000,    // B1进阶 (300小时)
  'B2': 24000,     // B2水平 (400小时) - 雅思6.0-6.5分
  'B2+': 30000,    // B2进阶 (500小时) - 雅思7.0分
  'C1': 40000,     // C1水平 (667小时) - 雅思8.0分
};

/**
 * 档位范围配置（分钟/天）
 * 基于25分钟课程时长的合理配置
 */
export const TIER_RANGES = {
  light: { min: 25, max: 50 },      // 1-2节课：25-50分钟
  standard: { min: 50, max: 75 },   // 2-3节课：50-75分钟
  intensive: { min: 75, max: 150 }, // 3-6节课：75-150分钟
};

/**
 * 将用户偏好snap到最接近的档位
 */
export function snapUserPreferenceToTier(userMinutes: number): {
  tier: 'light' | 'standard' | 'intensive';
  minutes: number;
} {
  // 找到最接近的档位
  let bestTier: 'light' | 'standard' | 'intensive' = 'standard';
  let minDiff = Infinity;

  for (const [tier, range] of Object.entries(TIER_RANGES)) {
    const center = (range.min + range.max) / 2;
    const diff = Math.abs(userMinutes - center);

    if (diff < minDiff) {
      minDiff = diff;
      bestTier = tier as 'light' | 'standard' | 'intensive';
    }
  }

  const range = TIER_RANGES[bestTier];
  return {
    tier: bestTier,
    minutes: Math.max(range.min, Math.min(userMinutes, range.max)),
  };
}

/**
 * 计算每分钟学习时间
 */
export function minutesPerWeek(dailyMinutes: number, daysPerWeek: number): number {
  return Math.max(1, Math.round(dailyMinutes)) * Math.max(1, daysPerWeek);
}

/**
 * 计算每天课程数
 * 基于25分钟课程时长的准确计算
 */
export function lessonsPerDay(dailyMinutes: number): number {
  // 直接基于25分钟课程时长计算
  // 25分钟 = 1节课
  // 50分钟 = 2节课
  // 75分钟 = 3节课
  const lessonsPerDay = Math.ceil(dailyMinutes / LESSON_MINUTES);
  return Math.max(1, lessonsPerDay);
}

/**
 * 计算从起点到目标的总分钟需求
 * 修正：正确计算从起点到目标的增量学习时间
 */
export function totalMinutesRequired(startBand: DifficultyBand, targetBand: DifficultyBand): number {
  if (startBand === targetBand) {
    // 即使起点和目标相同，也需要一定的巩固和提升时间
    // 给出合理的巩固时间：相当于半个级别的学习时间，但不低于最低学习时间
    const consolidationMinutes = Math.max(
      1800, // 最低30小时（约4-6周学习时间）
      BAND_PROGRESS_MINUTES[startBand] ?
        Math.floor(BAND_PROGRESS_MINUTES[startBand] * 0.5) : 3600 // 默认至少60小时
    );
    return consolidationMinutes;
  }

  const bandOrder = ['Pre-A', 'A1-', 'A1', 'A1+', 'A2-', 'A2', 'A2+', 'B1-', 'B1', 'B1+', 'B2', 'B2+', 'C1'];
  const startIndex = bandOrder.indexOf(startBand);
  const targetIndex = bandOrder.indexOf(targetBand);

  if (startIndex === -1 || targetIndex === -1) {
    return 0;
  }

  // 获取起点和目标的累计分钟数
  const startMinutes = BAND_PROGRESS_MINUTES[startBand] || 0;
  const targetMinutes = BAND_PROGRESS_MINUTES[targetBand] || 0;

  // 正确计算：从起点到目标的增量学习时间
  const minutesDifference = targetMinutes - startMinutes;

  // 如果目标等级高于起点等级，需要额外学习时间
  // 如果目标等级低于起点等级，需要复习和巩固时间
  const totalMinutes = Math.max(
    1800, // 最低30小时学习时间（约4-6周）
    minutesDifference > 0 ? minutesDifference : Math.abs(minutesDifference) * 0.5 // 降级目标需要一半时间复习
  );

  return totalMinutes;
}

/**
 * 计算需要的周数
 */
export function weeksNeeded(totalMinutes: number, minutesPerWeek: number): number {
  return Math.max(1, Math.ceil(totalMinutes / Math.max(1, minutesPerWeek)));
}

/**
 * 计算总课程数
 */
export function totalLessonsRequired(totalMinutes: number): number {
  return Math.ceil(totalMinutes / LESSON_MINUTES);
}

/**
 * 估算完成日期（YYYY-MM格式）
 */
export function finishDateEst(weeks: number, startDate: Date = new Date()): string {
  const finishDate = new Date(startDate);
  finishDate.setDate(finishDate.getDate() + weeks * 7);

  const year = finishDate.getFullYear();
  const month = String(finishDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 计算基于截止日期的周数约束
 */
export function weeksFromDeadline(deadline?: string, startDate: Date = new Date()): number | null {
  if (!deadline) return null;

  const deadlineDate = new Date(deadline);
  const diffTime = Math.abs(deadlineDate.getTime() - startDate.getTime());
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

  return Math.max(diffWeeks, 1); // 至少1周
}

/**
 * 可达性诊断
 */
export function diagnoseFeasibility(
  intake: Intake,
  calculatedWeeks: number,
  calculatedMinutes: number
): {
  color: 'green' | 'yellow' | 'red';
  tips: string[];
} {
  const tips: string[] = [];
  let color: 'green' | 'yellow' | 'red' = 'green';

  // 检查每日学习时间
  if (intake.daily_minutes_pref) {
    if (intake.daily_minutes_pref < 25) {
      color = 'red';
      tips.push('每日学习时间过短，建议至少25分钟');
    }
    if (intake.daily_minutes_pref > 180) {
      color = 'red';
      tips.push('每日学习时间过长，建议不超过180分钟');
    }
  }

  // 检查每周学习天数
  if (intake.study_days_per_week) {
    if (intake.study_days_per_week < 3) {
      color = 'red';
      tips.push('每周学习天数过少，建议至少3天');
    }
    if (intake.study_days_per_week > 6) {
      color = 'red';
      tips.push('每周学习天数过多，建议保留1天休息');
    }
  }

  // 检查截止日期约束
  const deadlineWeeks = weeksFromDeadline(intake.deadline_date);
  if (deadlineWeeks !== null && calculatedWeeks > deadlineWeeks) {
    color = 'red';
    tips.push(`截止日期前时间不足，需要${calculatedWeeks}周，但只剩${deadlineWeeks}周`);
  }

  // 检查零基础特殊处理
  if (intake.zero_base) {
    color = 'yellow';
    tips.push('零基础学员需要额外时间建立基础');
  }

  // 经验参考：B1目标通常需要16周作为参考
  if (color === 'green' && calculatedWeeks > 20) {
    color = 'yellow';
    tips.push('学习周期较长，建议分阶段执行');
  }

  return { color, tips };
}

/**
 * 后端复算函数 - 确保计算一致性
 */
export function finalizePlanOption(
  intake: Intake,
  draft: PlanOption,
  startBand: DifficultyBand,
  targetBand: DifficultyBand
): PlanOption {
  // 使用档位或用户偏好，改为更合理的默认值60分钟
  const dailyMinutes = draft.daily_minutes || snapUserPreferenceToTier(intake.daily_minutes_pref || 60).minutes;
  const daysPerWeek = draft.days_per_week || intake.study_days_per_week || 5;

  // 计算核心数据
  const totalMinutes = totalMinutesRequired(startBand, targetBand);
  const mpw = minutesPerWeek(dailyMinutes, daysPerWeek);
  const weeks = weeksNeeded(totalMinutes, mpw);
  const lessons = totalLessonsRequired(totalMinutes);

  // 生成完成日期
  const finishDate = finishDateEst(weeks);

  // 可达性诊断
  const diagnosis = diagnoseFeasibility(intake, weeks, totalMinutes);

  // 构建提示信息
  const diagnosisTips = diagnosis.tips.length > 0
    ? diagnosis.tips
    : [
      `建议每天${dailyMinutes}分钟，每周${daysPerWeek}天`,
      '保持稳定的学习节奏'
    ];

  // 确保有月度里程碑
  const monthlyMilestones = draft.monthly_milestones_one_line && draft.monthly_milestones_one_line.length > 0
    ? draft.monthly_milestones_one_line
    : generateMonthlyMilestones(draft.track || 'daily', weeks, draft.tier);

  return {
    ...draft,
    daily_minutes: dailyMinutes,
    days_per_week: daysPerWeek,
    weeks,
    lessons_total: lessons,
    finish_date_est: finishDate,
    diagnosis: diagnosis.color,
    diagnosis_tips: diagnosisTips,
    monthly_milestones_one_line: monthlyMilestones,
  };
}

/**
 * 生成基于用户偏好的三档方案
 */
export function generateThreeTiers(intake: Intake): {
  light: PlanOption;
  standard: PlanOption;
  intensive: PlanOption;
} {
  const userPreference = snapUserPreferenceToTier(intake.daily_minutes_pref || 60);
  const baseDaysPerWeek = intake.study_days_per_week || 5;

  // 使用统一的起点推断逻辑，确保前后端一致
  const startBand = inferStartBand(intake);

  // 围定目标为B1（可根据需求调整）
  const targetBand: DifficultyBand = inferTargetBandFromIntake(intake);
  const totalMinutes = totalMinutesRequired(startBand, targetBand);

  // 使用智能轨道推荐，如果没有指定则根据目标智能推荐
  const recommendedTrack = intake.track_override || recommendLearningTrack(intake);

  console.log('计算学习方案:', {
    startBand,
    targetBand,
    totalMinutes,
    recommendedTrack,
    userLevel: intake.self_assessed_level || '未提供',
    zeroBase: intake.zero_base,
    selfAssessedLevel: intake.self_assessed_level,
    goalText: intake.goal_free_text
  });

  // 生成三档的档位设置 - 使用固定的合理配置
  const tiers = {
    light: {
      tier: 'light' as const,
      daily_minutes: 30,  // 固定30分钟=1节课+5分钟复习
      days_per_week: Math.max(3, baseDaysPerWeek - 1),
    },
    standard: {
      tier: 'standard' as const,
      daily_minutes: 50,  // 固定50分钟=2节课
      days_per_week: baseDaysPerWeek,
    },
    intensive: {
      tier: 'intensive' as const,
      daily_minutes: 75,  // 固定75分钟=3节课
      days_per_week: Math.min(6, baseDaysPerWeek + 1),
    }
  };

  // 计算每档的实际数据
  const results: any = {};

  for (const [tierName, config] of Object.entries(tiers)) {
    const mpw = minutesPerWeek(config.daily_minutes, config.days_per_week);
    const weeks = weeksNeeded(totalMinutes, mpw);
    const lessons = totalLessonsRequired(totalMinutes);
    const finishDate = finishDateEst(weeks);

    const diagnosis = diagnoseFeasibility({
      ...intake,
      daily_minutes_pref: config.daily_minutes,
      study_days_per_week: config.days_per_week,
    }, weeks, totalMinutes);

    // 生成默认的月度里程碑 - 传递tier参数以生成差异化内容
    const monthlyMilestones = generateMonthlyMilestones(recommendedTrack, weeks, tierName);

    results[tierName] = {
      tier: tierName,
      track: recommendedTrack,
      ui_label_current: '英语基础', // 默认值，可由AI覆盖
      ui_label_target: getTrackTargetLabel(recommendedTrack), // 默认值，可由AI覆盖
      can_do_examples: generateTrackExamples(recommendedTrack, getTierLevel(tierName)), // 默认值，可由AI覆盖
      daily_minutes: config.daily_minutes,
      days_per_week: config.days_per_week,
      weeks,
      finish_date_est: finishDate,
      lessons_total: lessons,
      diagnosis: diagnosis.color,
      diagnosis_tips: diagnosis.tips,
      monthly_milestones_one_line: monthlyMilestones,
    };
  }

  return results;
}

/**
 * 端到端验证 - 对比前后端计算结果
 */
export function validateCalculationConsistency(
  frontendData: Partial<PlanOption>,
  backendData: PlanOption
): boolean {
  const fields = ['daily_minutes', 'days_per_week', 'weeks', 'lessons_total', 'finish_date_est'] as const;

  for (const field of fields) {
    if (frontendData[field] !== backendData[field]) {
      console.warn(`计算不一致: ${field} 前端=${frontendData[field]} 后端=${backendData[field]}`);
      return false;
    }
  }

  return true;
}

/**
 * 生成月度里程碑描述 - 支持基于实际时长的差异化里程碑
 */
export function generateMonthlyMilestones(track: string, weeks: number, tier: string = 'standard'): string[] {
  // 计算基于周数的里程碑数量
  const milestoneCount = calculateMilestoneCount(weeks);

  const targetLabel = getTrackTargetLabel(track);

  // 生成指定数量的里程碑
  const milestones = [];
  for (let i = 1; i <= milestoneCount; i++) {
    milestones.push(generateMilestoneText(i, targetLabel, milestoneCount, tier));
  }
  return milestones;
}

/**
 * 计算基于周数的里程碑数量
 */
export function calculateMilestoneCount(weeks: number): number {
  if (weeks <= 4) return 1;      // 短期学习：1个月里程碑
  if (weeks <= 8) return 2;      // 中期学习：2个月里程碑
  if (weeks <= 12) return 3;     // 较长期学习：3个月里程碑
  return Math.min(4, Math.ceil(weeks / 4)); // 长期学习：4个月里程碑或每4周一个里程碑
}

/**
 * 生成单个里程碑文本 - 基于不同强度和进度的差异化目标
 */
export function generateMilestoneText(monthNum: number, targetLabel: string, totalMonths: number = 4, tier: string = 'standard'): string {
  // 根据方案强度设置不同的目标和进度
  if (tier === 'light') {
    // 轻量方案：基础目标，进度较慢
    const lightMilestones = [
      `掌握${targetLabel}的基础词汇和简单表达`,
      `能够进行基本的${targetLabel}交流`,
      `提升${targetLabel}的理解能力`,
      `达到日常${targetLabel}的应用水平`,
      `扩展${targetLabel}的使用场景`,
      `巩固${targetLabel}的基础技能`
    ];
    return `第${monthNum}月：${lightMilestones[Math.min(monthNum - 1, lightMilestones.length - 1)]}`;

  } else if (tier === 'intensive') {
    // 进阶方案：高目标，快速进度
    const intensiveMilestones = [
      `快速掌握${targetLabel}核心表达`,
      `实现流利的${targetLabel}交流`,
      `达到专业级${targetLabel}应用`,
      `精通${targetLabel}的高级技巧`,
      `实现${targetLabel}的熟练运用`
    ];
    return `第${monthNum}月：${intensiveMilestones[Math.min(monthNum - 1, intensiveMilestones.length - 1)]}`;

  } else {
    // 标准方案：平衡的目标和进度
    const standardMilestones = [
      `系统学习${targetLabel}基础知识`,
      `建立有效的${targetLabel}交流能力`,
      `提升${targetLabel}的综合应用`,
      `达到熟练的${targetLabel}水平`,
      `扩展${targetLabel}的实际应用`,
      `完善${targetLabel}的表达技巧`
    ];
    return `第${monthNum}月：${standardMilestones[Math.min(monthNum - 1, standardMilestones.length - 1)]}`;
  }
}

/**
 * 生成学习计划对比表格（用于调试）
 */
// 获取轨道目标标签
function getTrackTargetLabel(track: string): string {
  switch (track) {
    case 'work': return '职场熟练';
    case 'travel': return '旅行交流';
    case 'study': return '学术研究';
    case 'daily': return '日常对话';
    case 'exam': return '考试通过';
    default: return '英语提升';
  }
}

// 获取档位对应的学习强度描述（不再区分能力水平）
function getTierLevel(tier: string): string {
  switch (tier) {
    case 'light': return '轻松';
    case 'standard': return '稳健';
    case 'intensive': return '高效';
    default: return '轻松';
  }
}

// 生成轨道对应的示例（相同目标，不同学习体验）
function generateTrackExamples(track: string, intensity: string): string[] {
  const targetExamples = {
    work: [
      '能够进行有效的商务沟通和职场交流',
      '能够处理日常工作中的英语邮件和会议',
      '能够在商务场合进行专业表达和讨论',
      '能够应对职场中的常见英语沟通需求'
    ],
    travel: [
      '能够自如地进行国外旅行和日常交流',
      '能够处理旅行中的各种实用场景',
      '能够与当地人进行友好自然的对话',
      '能够应对旅行中的突发情况和需求'
    ],
    study: [
      '能够理解学术讲座和参与课堂讨论',
      '能够阅读学术文献和撰写研究报告',
      '能够在学术环境中进行有效交流',
      '能够处理学习和研究中的英语需求'
    ],
    daily: [
      '能够与外国朋友进行流畅自然的对话',
      '能够理解和讨论各种日常话题',
      '能够在社交场合自如表达观点',
      '能够处理日常生活中的英语交流需求'
    ],
    exam: [
      '能够在考试中准确理解题目和材料',
      '能够运用有效的应试技巧和策略',
      '能够在规定时间内完成高质量答案',
      '能够应对考试中的各种挑战和要求'
    ]
  };

  const intensityModifiers = {
    轻松: [
      '在轻松的学习节奏下逐步达成目标',
      '享受学习过程，压力较小但稳步前进',
      '适合时间有限但希望持续进步的学员'
    ],
    稳健: [
      '在均衡的学习节奏下有效达成目标',
      '保持稳定的学习进度和效果',
      '适合希望平衡学习效果和时间投入的学员'
    ],
    高效: [
      '在紧凑的学习节奏下快速达成目标',
      '高强度学习，短期内看到明显进步',
      '适合希望快速提升英语能力的学员'
    ]
  };

  const baseExamples = targetExamples[track as keyof typeof targetExamples] || targetExamples.daily;
  const modifiers = intensityModifiers[intensity as keyof typeof intensityModifiers] || intensityModifiers.稳健;

  // 返回目标示例 + 学习体验描述
  return [...baseExamples.slice(0, 3), ...modifiers];
}

export function generatePlanComparisonTable(
  intake: Intake,
  plans: PlanOption[]
): string {
  const headers = ['档位', '每天(分钟)', '每周(天)', '周数', '总课时', '预计完成'];
  const rows = plans.map(plan => [
    plan.tier,
    plan.daily_minutes.toString(),
    plan.days_per_week.toString(),
    plan.weeks.toString(),
    plan.lessons_total.toString(),
    plan.finish_date_est,
  ]);

  return [headers, ...rows].map(row => row.join(' | ')).join('\n');
}