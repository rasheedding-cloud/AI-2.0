/**
 * 阶段性里程碑生成器
 * 使用Gemini AI分析学习计划，生成合理的阶段性目标
 */

import { LLMAdapter } from '@/lib/llm/adapter';

export interface MilestonePhase {
  phase_number: number;
  phase_name: string;
  target_level: string;
  focus_areas: string[];
  estimated_duration_weeks: number;
  key_achievements: string[];
  difficulty_band: string;
}

export interface PhaseMilestonePlan {
  total_phases: number;
  total_weeks: number;
  start_level: string;
  target_level: string;
  phases: MilestonePhase[];
}

/**
 * 生成阶段性里程碑计划
 */
export async function generatePhaseMilestones({
  startLevel,
  targetLevel,
  totalWeeks,
  track,
  goalDescription,
  tier
}: {
  startLevel: string;
  targetLevel: string;
  totalWeeks: number;
  track: string;
  goalDescription: string;
  tier: 'light' | 'standard' | 'intensive';
}, llmAdapter?: LLMAdapter): Promise<PhaseMilestonePlan> {

  // 如果没有提供适配器，创建默认的
  if (!llmAdapter) {
    const { createLLMAdapter } = await import('@/lib/llm/adapter');
    llmAdapter = createLLMAdapter();
  }

  // 确定阶段性数量
  const phaseCount = totalWeeks <= 16 ? Math.ceil(totalWeeks / 4) : 4;

  const prompt = `请为英语学习计划生成合理的阶段性里程碑。

**学习计划信息：**
- 起始水平：${startLevel}
- 目标水平：${targetLevel}
- 总周期：${totalWeeks}周
- 学习轨道：${track}
- 学习强度：${tier}
- 学员目标：${goalDescription}

**阶段性数量：**${phaseCount}个阶段

**英语CEFR标准参考：**
- A1 (90-120小时): 基础日常英语，简单问候和自我介绍
- A2 (180-200小时): 独立生活英语，处理日常事务
- B1 (350-400小时): 职场英语交流，基础工作沟通
- B2 (500-600小时): 专业流利英语，深度工作交流
- C1 (700-800小时): 接近母语英语，复杂专业讨论

**请返回严格的JSON格式：**
{
  "total_phases": ${phaseCount},
  "total_weeks": ${totalWeeks},
  "start_level": "${startLevel}",
  "target_level": "${targetLevel}",
  "phases": [
    {
      "phase_number": 1,
      "phase_name": "阶段名称",
      "target_level": "此阶段要达到的CEFR等级",
      "focus_areas": ["重点1", "重点2", "重点3"],
      "estimated_duration_weeks": 数字,
      "key_achievements": ["能达成什么1", "能达成什么2", "能达成什么3"],
      "difficulty_band": "对应的难度等级"
    }
  ]
}

**设计原则：**
1. 阶段之间要有明确的递进关系
2. 每个阶段的目标要具体可衡量
3. 重点领域要匹配学习轨道(${track})
4. 最终阶段要体现目标水平(${targetLevel})
5. 各阶段时长分配要合理，体现循序渐进
6. 语言要积极正面，体现学习成就感

请生成4个阶段的详细学习里程碑，确保每个阶段都有清晰的目标和成果。`;

  try {
    const result = await llmAdapter.chat({
      system: "你是一位专业的英语学习规划专家，擅长设计科学合理的学习阶段性目标。",
      prompt: prompt,
      temperature: 0.2
    });

    // 解析JSON结果
    let plan: PhaseMilestonePlan;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (error) {
      console.error('解析Gemini里程碑结果失败:', error);
      return generateFallbackMilestones({
        startLevel,
        targetLevel,
        totalWeeks,
        track,
        phaseCount
      });
    }

    // 验证结果的合理性
    if (!plan.phases || plan.phases.length !== phaseCount) {
      console.warn('Gemini返回的阶段性数量不正确，使用回退方案');
      return generateFallbackMilestones({
        startLevel,
        targetLevel,
        totalWeeks,
        track,
        phaseCount
      });
    }

    // 确保总周数匹配
    const actualTotalWeeks = plan.phases.reduce((sum, phase) => sum + (phase.estimated_duration_weeks || 0), 0);
    if (Math.abs(actualTotalWeeks - totalWeeks) > 2) {
      // 调整各阶段的周数
      const ratio = totalWeeks / actualTotalWeeks;
      plan.phases.forEach(phase => {
        phase.estimated_duration_weeks = Math.round((phase.estimated_duration_weeks || 0) * ratio);
      });
      plan.total_weeks = totalWeeks;
    }

    return plan;

  } catch (error) {
    console.error('生成阶段性里程碑失败:', error);
    return generateFallbackMilestones({
      startLevel,
      targetLevel,
      totalWeeks,
      track,
      phaseCount
    });
  }
}

/**
 * 回退的里程碑生成逻辑
 */
function generateFallbackMilestones({
  startLevel,
  targetLevel,
  totalWeeks,
  track,
  phaseCount
}: {
  startLevel: string;
  targetLevel: string;
  totalWeeks: number;
  track: string;
  phaseCount: number;
}): PhaseMilestonePlan {

  const weeksPerPhase = Math.floor(totalWeeks / phaseCount);
  const remainderWeeks = totalWeeks % phaseCount;

  const trackLabels = {
    work: '职场英语',
    travel: '旅行英语',
    study: '学术英语',
    daily: '日常英语',
    exam: '考试英语'
  };

  const trackLabel = trackLabels[track as keyof typeof trackLabels] || '英语提升';

  const phases: MilestonePhase[] = [];

  for (let i = 1; i <= phaseCount; i++) {
    const weeksForThisPhase = weeksPerPhase + (i <= remainderWeeks ? 1 : 0);
    const progress = i / phaseCount;

    let phaseName = '';
    let targetLevel = '';
    let focusAreas: string[] = [];
    let keyAchievements: string[] = [];

    if (i === 1) {
      phaseName = `基础建立阶段`;
      targetLevel = startLevel;
      focusAreas = [
        `建立${trackLabel}基础词汇`,
        `掌握基本表达方式`,
        `培养学习习惯`
      ];
      keyAchievements = [
        `能够进行基础的${trackLabel}交流`,
        `掌握核心词汇和表达`,
        `建立学习信心`
      ];
    } else if (i === phaseCount) {
      phaseName = `目标达成阶段`;
      targetLevel = targetLevel;
      focusAreas = [
        `深化${trackLabel}应用能力`,
        `提升表达流利度`,
        `巩固综合技能`
      ];
      keyAchievements = [
        `达到${targetLevel}水平的${trackLabel}能力`,
        `能够自信应对相关场景`,
        `实现学习目标`
      ];
    } else {
      phaseName = `能力提升阶段${i-1}`;
      // 插值计算中间阶段的目标等级
      targetLevel = `${targetLevel}-`; // 简化处理
      focusAreas = [
        `扩展${trackLabel}词汇量`,
        `提升应用复杂度`,
        `增强交流能力`
      ];
      keyAchievements = [
        `在${trackLabel}场景中更加自如`,
        `掌握更复杂的表达方式`,
        `提升理解和使用能力`
      ];
    }

    phases.push({
      phase_number: i,
      phase_name: phaseName,
      target_level: targetLevel,
      focus_areas: focusAreas,
      estimated_duration_weeks: weeksForThisPhase,
      key_achievements: keyAchievements,
      difficulty_band: targetLevel
    });
  }

  return {
    total_phases: phaseCount,
    total_weeks: totalWeeks,
    start_level: startLevel,
    target_level: targetLevel,
    phases
  };
}

/**
 * 将阶段性里程碑转换为显示用的里程碑文本
 */
export function convertPhasesToMilestoneText(phases: MilestonePhase[]): string[] {
  return phases.map(phase => {
    const focusText = phase.focus_areas.slice(0, 2).join('、');
    return `阶段${phase.phase_number}：${phase.phase_name} - ${focusText}`;
  });
}