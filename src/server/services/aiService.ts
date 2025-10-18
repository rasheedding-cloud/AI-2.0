import { createLLMAdapter, withRetry } from '@/lib/llm/adapter';
import {
  SYSTEM_PROMPT,
  createGeneratePlansPrompt,
  createGenerateMonthlyPrompt,
  createGenerateSyllabusPrompt,
  CULTURAL_COMPLIANCE_PROMPT,
  REPAIR_PROMPT,
  PromptHistory,
  PromptError,
  PROMPT_CONFIG
} from '@/lib/prompts';
import {
  intakeSchema,
  planOptionSchema,
  monthlyPlanSchema,
  firstMonthSyllabusSchema,
  validateAndParse,
  ValidationError
} from '@/lib/schema';
import {
  hotfixClamp,
  inferStartBand,
  inferTargetBand,
  inferTargetBandFromIntake
} from '@/lib/learning/caps';
import {
  gateByCap,
  gateToAssessmentGate,
  compareGates,
  logGateApplication
} from '@/lib/learning/gates';
import {
  isDynamicGatesEnabled,
  isShadowModeEnabled,
  withDynamicGates,
  logFeatureFlagUsage
} from '@/lib/features/dynamicGates';
import {
  buildMilestonesV2,
  compareMilestoneVersions,
  MILESTONE_V2_FEATURES,
  type PlanContext,
  type Milestone
} from '@/lib/learning/milestones_v2';
import {
  finalizePlanOption,
  generateThreeTiers,
  validateCalculationConsistency
} from '@/lib/calc/time';
import type {
  Intake,
  PlanOption,
  MonthlyPlan,
  FirstMonthSyllabus,
  APIResponse
} from '@/types';

class AIService {
  private adapter = createLLMAdapter();

  // 提取JSON的通用方法
  private extractJSONFromResponse(response: string): string {
    try {
      console.log('Raw response length:', response.length);
      console.log('Raw response preview:', response.substring(0, 300) + '...');

      // 如果响应包含markdown代码块，提取JSON内容
      let cleanedResponse = response;

      // 方法1: 标准的markdown代码块
      let jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n\s*```/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[1];
        console.log('Extracted JSON from standard markdown block');
      } else {
        // 方法2: 不带json标记的代码块
        jsonMatch = response.match(/```\s*\n([\s\S]*?)\n\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1];
          console.log('Extracted JSON from unmarked markdown block');
        } else {
          // 方法3: 带json标记但没有结束标记的代码块
          jsonMatch = response.match(/```json([\s\S]*)/);
          if (jsonMatch) {
            cleanedResponse = jsonMatch[1];
            console.log('Extracted JSON from incomplete json markdown block');
          } else {
            // 方法4: 普通代码块但没有结束标记
            jsonMatch = response.match(/```([\s\S]*)/);
            if (jsonMatch) {
              cleanedResponse = jsonMatch[1];
              console.log('Extracted JSON from incomplete markdown block');
            } else {
              // 方法5: 直接查找JSON结构
              const startIdx = response.indexOf('{');
              const endIdx = response.lastIndexOf('}');
              if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                cleanedResponse = response.substring(startIdx, endIdx + 1);
                console.log('Extracted JSON between first { and last }');
              } else {
                // 如果没有找到JSON结构，尝试移除markdown标记
                cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                console.log('Removed markdown markers, using cleaned response');
              }
            }
          }
        }
      }

      // 移除可能的BOM和空白字符
      cleanedResponse = cleanedResponse.replace(/^\uFEFF/, '').trim();

      console.log('Cleaned response length:', cleanedResponse.length);
      console.log('Cleaned response preview:', cleanedResponse.substring(0, 200) + '...');

      // 更强大的JSON修复逻辑
      return this.repairJSON(cleanedResponse);
    } catch (error) {
      console.warn('Error extracting JSON from response:', error);
      return response;
    }
  }

  // 专门的JSON修复方法
  private repairJSON(jsonString: string): string {
    if (!jsonString || typeof jsonString !== 'string') {
      return jsonString;
    }

    let repaired = jsonString.trim();

    // 如果JSON看起来完整，直接返回
    if (this.isValidJSONStructure(repaired)) {
      return repaired;
    }

    console.warn('JSON appears to be truncated or incomplete, attempting to fix...');

    // 方法1: 智能截断 - 找到最后一个完整的结构
    repaired = this.smartTruncateJSON(repaired);

    // 方法2: 如果截断后仍然无效，尝试结构修复
    if (!this.isValidJSONStructure(repaired)) {
      repaired = this.structuralRepairJSON(repaired);
    }

    // 方法3: 最后尝试激进的括号平衡
    if (!this.isValidJSONStructure(repaired)) {
      repaired = this.aggressiveRepairJSON(repaired);
    }

    console.log('JSON repair completed');
    return repaired;
  }

  // 检查JSON结构是否可能有效
  private isValidJSONStructure(str: string): boolean {
    const trimmed = str.trim();
    if (!trimmed) return false;

    // 基本结构检查
    const firstChar = trimmed[0];
    const lastChar = trimmed[trimmed.length - 1];

    // 检查是否以正确的括号开始和结束
    const validStartEnd =
      (firstChar === '{' && lastChar === '}') ||
      (firstChar === '[' && lastChar === ']');

    if (!validStartEnd) return false;

    // 检查基本的括号平衡
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        else if (char === '[') bracketCount++;
        else if (char === ']') bracketCount--;
      }
    }

    return braceCount === 0 && bracketCount === 0;
  }

  // 智能截断JSON
  private smartTruncateJSON(jsonString: string): string {
    let bestCandidate = jsonString;

    // 首先尝试基本的完整性检查
    if (this.isValidJSONStructure(jsonString)) {
      console.log('JSON structure is already valid, no truncation needed');
      return jsonString;
    }

    console.log('Attempting smart truncation...');

    // 寻找可能的截断点 - 从最安全的开始
    const candidates = [
      // 寻找完整的对象结束
      { pattern: /}\s*$/, pos: -1, priority: 1 },
      // 寻找完整的数组结束
      { pattern: /\]\s*$/, pos: -1, priority: 1 },
      // 寻找对象后的逗号
      { pattern: /},\s*$/, pos: -1, priority: 2 },
      // 寻找数组后的逗号
      { pattern: /\],\s*$/, pos: -1, priority: 2 },
      // 寻找完整的字符串结束
      { pattern: /"\s*$/, pos: -1, priority: 3 },
    ];

    // 计算每个模式的位置
    for (const candidate of candidates) {
      const match = jsonString.match(candidate.pattern);
      if (match) {
        candidate.pos = match.index! + match[0].length;
      }
    }

    // 找到最佳截断点
    let cutPoint = 0;
    let highestPriority = 0;

    for (const candidate of candidates) {
      if (candidate.pos > 0 && candidate.priority > highestPriority) {
        // 测试这个截断点是否能产生有效的JSON
        const testString = jsonString.substring(0, candidate.pos);
        if (this.isValidJSONStructure(testString)) {
          cutPoint = candidate.pos;
          highestPriority = candidate.priority;
          console.log(`Found valid truncation at position ${candidate.pos} with priority ${candidate.priority}`);
        }
      }
    }

    // 如果没有找到好的截断点，尝试更激进的方法
    if (cutPoint === 0) {
      console.log('No good truncation point found, trying aggressive approach...');

      // 从后往前找，尝试找到第一个能让JSON有效的位置
      for (let i = jsonString.length - 1; i >= 0; i--) {
        const testString = jsonString.substring(0, i + 1);
        if (this.isValidJSONStructure(testString)) {
          cutPoint = i + 1;
          console.log(`Found valid truncation via reverse search at position ${cutPoint}`);
          break;
        }
      }
    }

    if (cutPoint > 0) {
      bestCandidate = jsonString.substring(0, cutPoint);
      console.log(`Truncated JSON from ${jsonString.length} to ${bestCandidate.length} characters`);
    } else {
      console.log('Could not find valid truncation point, using aggressive repair');
    }

    return bestCandidate;
  }

  // 结构修复JSON
  private structuralRepairJSON(jsonString: string): string {
    let repaired = jsonString;

    // 移除末尾的不完整内容
    repaired = repaired.replace(/,[^,}]*$/, '');
    repaired = repaired.replace(/"[^"]*$/, '"');

    // 修复常见的JSON错误
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1'); // 移除多余的逗号
    repaired = repaired.replace(/,\s*,/g, ','); // 移除连续的逗号

    // 确保字符串被正确引用
    repaired = repaired.replace(/:\s*([^",\s{}[\]]+)/g, ': "$1"'); // 为未引用的值添加引号

    return repaired;
  }

  // 激进修复JSON
  private aggressiveRepairJSON(jsonString: string): string {
    let repaired = jsonString;
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let finalResponse = '';

    console.log('Starting aggressive JSON repair...');

    // 逐字符分析并修复
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];

      if (escapeNext) {
        finalResponse += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        finalResponse += char;
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        finalResponse += char;
        inString = !inString;
        continue;
      }

      if (!inString) {
        finalResponse += char;

        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        else if (char === '[') bracketCount++;
        else if (char === ']') bracketCount--;
      } else {
        finalResponse += char;
      }
    }

    // 检查是否在字符串中被截断
    if (inString) {
      console.log('JSON was truncated inside a string, closing string...');
      finalResponse += '"';
    }

    // 补充缺失的括号
    while (braceCount > 0) {
      finalResponse += '}';
      braceCount--;
      console.log(`Added closing brace, remaining: ${braceCount}`);
    }
    while (bracketCount > 0) {
      finalResponse += ']';
      bracketCount--;
      console.log(`Added closing bracket, remaining: ${bracketCount}`);
    }

    // 移除末尾可能的逗号和不完整的字符串
    finalResponse = finalResponse.replace(/,(\s*[}\]])/g, '$1');

    // 处理不完整的对象或数组
    finalResponse = finalResponse.replace(/,\s*$/g, ''); // 移除末尾逗号
    finalResponse = finalResponse.replace(/"\s*$/g, '"'); // 确保字符串正确结束

    // 处理不完整的键值对
    finalResponse = finalResponse.replace(/:\s*"([^"]*)$/g, ': "$1"'); // 补全字符串值
    finalResponse = finalResponse.replace(/:\s*(\d+)$/g, ': $1'); // 补全数字值
    finalResponse = finalResponse.replace(/:\s*(true|false)$/g, ': $1'); // 补全布尔值

    console.log(`Aggressive repair completed. Final length: ${finalResponse.length}`);

    return finalResponse;
  }

  // 修复方案数据中的月度里程碑 - 支持基于实际时长的差异化里程碑
  private fixPlanMilestones(plan: any): any {
    // 确保有ui_label_target，如果没有则根据track生成默认值
    const targetLabel = plan.ui_label_target || this.getDefaultTargetLabel(plan.track);

    // 计算基于周数的合理里程碑数量
    const weeks = plan.weeks || 16;
    const milestoneCount = this.calculateMilestoneCount(weeks);

    if (!plan.monthly_milestones_one_line || !Array.isArray(plan.monthly_milestones_one_line) || plan.monthly_milestones_one_line.length === 0) {
      // 如果没有里程碑数组或是空数组，根据实际周数创建默认里程碑
      plan.monthly_milestones_one_line = this.generateDefaultMilestones(milestoneCount, targetLabel, plan.tier);
    } else {
      // 如果已有里程碑，调整到合理的数量
      const existing = plan.monthly_milestones_one_line;

      if (existing.length < milestoneCount) {
        // 补充缺失的里程碑
        while (existing.length < milestoneCount) {
          const monthNum = existing.length + 1;
          existing.push(this.generateMilestoneText(monthNum, targetLabel, milestoneCount, plan.tier));
        }
      } else if (existing.length > milestoneCount) {
        // 截取多余的里程碑
        plan.monthly_milestones_one_line = existing.slice(0, milestoneCount);
      }
    }

    // 修复can_do_examples，确保符合schema要求
    if (!plan.can_do_examples || !Array.isArray(plan.can_do_examples) || plan.can_do_examples.length < 2) {
      plan.can_do_examples = this.generateValidCanDoExamples(plan.track || 'daily', plan.tier || 'standard');
    }

    // 确保can_do_examples长度在2-6之间
    if (plan.can_do_examples.length > 6) {
      plan.can_do_examples = plan.can_do_examples.slice(0, 6);
    }

    return plan;
  }

  // 计算基于周数的里程碑数量
  private calculateMilestoneCount(weeks: number): number {
    if (weeks <= 4) return 1;      // 短期学习：1个月里程碑
    if (weeks <= 8) return 2;      // 中期学习：2个月里程碑
    if (weeks <= 12) return 3;     // 较长期学习：3个月里程碑
    return 4;                      // 长期学习：4个月里程碑
  }

  // 生成默认里程碑
  private generateDefaultMilestones(count: number, targetLabel: string, tier: string): string[] {
    const milestones = [];
    for (let i = 1; i <= count; i++) {
      milestones.push(this.generateMilestoneText(i, targetLabel, count, tier));
    }
    return milestones;
  }

  // 生成单个里程碑文本
  private generateMilestoneText(monthNum: number, targetLabel: string, totalMonths: number, tier: string): string {
    // 根据方案强度和总月数调整里程碑描述
    const intensityPrefix = tier === 'intensive' ? '快速' : tier === 'light' ? '稳步' : '系统';

    if (totalMonths <= 3) {
      // 短期方案：更紧凑的描述
      const shortProgressTexts = [
        `${intensityPrefix}建立${targetLabel}基础`,
        `${intensityPrefix}提升${targetLabel}技能`,
        `${intensityPrefix}达成${targetLabel}目标`
      ];
      return `第${monthNum}月：${shortProgressTexts[monthNum - 1]}`;
    } else {
      // 长期方案：循序渐进的描述
      const progressTexts = [
        `${intensityPrefix}建立${targetLabel}的基础`,
        `${intensityPrefix}提升${targetLabel}的技能`,
        `${intensityPrefix}巩固${targetLabel}的能力`,
        `${intensityPrefix}达到${targetLabel}的目标`,
        `${intensityPrefix}扩展${targetLabel}的应用`,
        `${intensityPrefix}强化${targetLabel}的实战`,
        `${intensityPrefix}完善${targetLabel}的综合`,
        `${intensityPrefix}实现${targetLabel}的精通`
      ];
      return `第${monthNum}月：${progressTexts[Math.min(monthNum - 1, progressTexts.length - 1)]}`;
    }
  }

  // 获取默认的目标标签
  private getDefaultTargetLabel(track: string): string {
    switch (track) {
      case 'work': return '职场英语';
      case 'travel': return '旅行英语';
      case 'study': return '学术英语';
      case 'daily': return '日常英语';
      case 'exam': return '考试英语';
      default: return '英语提升';
    }
  }

  // 生成符合schema的can_do_examples
  private generateValidCanDoExamples(track: string, intensity: string): string[] {
    const trackExamples = {
      work: [
        '能够听懂职场大多数对话并做出简单回应',
        '能够处理基本的职场邮件和信息确认',
        '能够在会议中进行简单的自我介绍和意见表达',
        '能够应对日常工作中的基础英语沟通场景'
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

    const baseExamples = trackExamples[track as keyof typeof trackExamples] || trackExamples.daily;

    // 确保至少返回3个，最多6个示例
    return baseExamples.slice(0, Math.max(3, Math.min(6, baseExamples.length)));
  }

  // 应用动态门限到月度计划
  private applyDynamicGates(monthlyPlan: any, context: string = 'monthly_plan'): any {
    if (!isDynamicGatesEnabled()) {
      logFeatureFlagUsage('dynamic_gates_disabled', { context });
      return monthlyPlan;
    }

    const isShadow = isShadowModeEnabled();
    logFeatureFlagUsage('dynamic_gates_applying', { context, shadowMode: isShadow });

    // 复制原始数据避免修改
    const processedPlan = JSON.parse(JSON.stringify(monthlyPlan));

    if (processedPlan.milestones && Array.isArray(processedPlan.milestones)) {
      processedPlan.milestones.forEach((milestone: any, index: number) => {
        const monthNum = index + 1;
        const cap = milestone.max_target_band;

        if (cap) {
          // 生成基于cap的动态门限
          const dynamicGate = gateByCap(cap);

          // 在影子模式下记录差异
          if (isShadow && milestone.assessment_gate) {
            const comparison = compareGates(milestone.assessment_gate, dynamicGate);
            if (comparison.hasDiff) {
              logFeatureFlagUsage('gate_shadow_diff', {
                month: monthNum,
                cap,
                diff: comparison.diff
              });
            }
          }

          // 应用动态门限（生产模式或影子模式都记录）
          if (!isShadow) {
            // 保存原始LLM门限用于对比
            const originalGate = milestone.assessment_gate;

            // 应用动态门限
            milestone.assessment_gate = gateToAssessmentGate(dynamicGate);

            // 记录门限应用
            logGateApplication(cap, monthNum, 'backend', {
              original: originalGate,
              applied: milestone.assessment_gate,
              gate_label: dynamicGate.gate_label
            });
          } else {
            // 影子模式：保留原始门限，但记录动态门限
            logGateApplication(cap, monthNum, 'shadow', {
              original: milestone.assessment_gate,
              would_apply: gateToAssessmentGate(dynamicGate),
              gate_label: dynamicGate.gate_label
            });
          }
        } else {
          console.warn(`[Gate] No max_target_band found for month ${monthNum}, skipping dynamic gate`);
        }
      });
    }

    return processedPlan;
  }

  // 修复月度计划数据
  private fixMonthlyPlan(monthlyPlan: any): any {
    // 创建新的月度计划对象，只包含允许的字段
    let monthsTotal = monthlyPlan.months_total || 4;

    // 确保月数在合理范围内（1-12个月）
    monthsTotal = Math.max(1, Math.min(12, monthsTotal));

    const cleanedPlan: any = {
      months_total: monthsTotal,
      milestones: []
    };

    // 确保有里程碑数组
    if (!monthlyPlan.milestones || !Array.isArray(monthlyPlan.milestones)) {
      monthlyPlan.milestones = [];
    }

    // 如果里程碑不足指定月数，创建默认的里程碑
    while (monthlyPlan.milestones.length < monthsTotal) {
      const monthNum = monthlyPlan.milestones.length + 1;
      monthlyPlan.milestones.push({
        month: monthNum,
        max_target_band: this.getTargetBandForMonth(monthNum),
        focus: [
          `第${monthNum}月核心技能1`,
          `第${monthNum}月核心技能2`,
          `第${monthNum}月核心技能3`,
          `第${monthNum}月核心技能4`
        ],
        assessment_gate: {
          accuracy: this.getAccuracyForMonth(monthNum),
          task_steps: this.getTaskStepsForMonth(monthNum),
          fluency_pauses: this.getFluencyPausesForMonth(monthNum)
        }
      });
    }

    // 如果里程碑超过指定月数，截取到指定月数
    if (monthlyPlan.milestones.length > monthsTotal) {
      monthlyPlan.milestones = monthlyPlan.milestones.slice(0, monthsTotal);
    }

    // 确保每个月的月份编号正确并添加到清理后的计划中
    cleanedPlan.milestones = monthlyPlan.milestones.map((milestone: any, index: number) => ({
      month: index + 1,
      max_target_band: milestone.max_target_band || this.getTargetBandForMonth(index + 1),
      focus: Array.isArray(milestone.focus) && milestone.focus.length >= 3 ? milestone.focus.slice(0, 6) : [
        `第${index + 1}月核心技能1`,
        `第${index + 1}月核心技能2`,
        `第${index + 1}月核心技能3`,
        `第${index + 1}月核心技能4`
      ],
      assessment_gate: {
        accuracy: milestone.assessment_gate?.accuracy || this.getAccuracyForMonth(index + 1),
        task_steps: milestone.assessment_gate?.task_steps || this.getTaskStepsForMonth(index + 1),
        fluency_pauses: milestone.assessment_gate?.fluency_pauses || this.getFluencyPausesForMonth(index + 1)
      }
    }));

    return cleanedPlan;
  }

  // 根据月份获取目标难度等级
  private getTargetBandForMonth(monthNum: number): string {
    if (monthNum === 1) return "A2+";
    if (monthNum === 2) return "A2+";
    if (monthNum === 3) return "B1-";
    return "B1";
  }

  // 根据月份获取准确率要求
  private getAccuracyForMonth(monthNum: number): number {
    if (monthNum === 1) return 0.85;
    if (monthNum === 2) return 0.80;
    if (monthNum === 3) return 0.75;
    return 0.70;
  }

  // 根据月份获取任务步骤数
  private getTaskStepsForMonth(monthNum: number): number {
    if (monthNum === 1) return 3;
    if (monthNum === 2) return 4;
    if (monthNum === 3) return 5;
    return 6;
  }

  // 根据月份获取停顿次数
  private getFluencyPausesForMonth(monthNum: number): number {
    if (monthNum === 1) return 2;
    if (monthNum === 2) return 3;
    if (monthNum === 3) return 4;
    return 5;
  }

  // 生成三档学习方案
  async generatePlans(intake: Intake): Promise<APIResponse<PlanOption[]>> {
    const startTime = Date.now();
    const requestId = `plans_${Date.now()}`;

    try {
      // 验证输入数据
      const validatedIntake = validateAndParse(intakeSchema, intake);

      // 首先尝试使用数学计算生成三档方案
      let calculatedPlans: PlanOption[];
      try {
        console.log('使用数学计算生成三档方案...');
        const tieredPlans = await generateThreeTiers(validatedIntake);
        calculatedPlans = [tieredPlans.light, tieredPlans.standard, tieredPlans.intensive];
        console.log('数学计算方案生成成功:', calculatedPlans);
      } catch (calcError) {
        console.warn('数学计算方案生成失败，回退到AI生成:', calcError);

        // 回退到AI生成
        const prompt = createGeneratePlansPrompt(validatedIntake);
        const response = await withRetry(
          () => this.adapter.chat<string>({
            system: SYSTEM_PROMPT,
            prompt,
            temperature: PROMPT_CONFIG.DEFAULT_TEMPERATURE,
          }),
          3,
          2000
        );

        // 解析响应
        let parsedResponse: any;
        try {
          console.log('AI Raw Response:', response);
          const cleanedResponse = this.extractJSONFromResponse(response);
          parsedResponse = JSON.parse(cleanedResponse);
          console.log('AI Parsed Response:', parsedResponse);
        } catch (error) {
          console.error('JSON Parse Error:', error);
          console.error('Raw AI Response was:', response);
          throw new PromptError(
            'Invalid JSON response from AI',
            'generation',
            { response, error }
          );
        }

        // 验证计划数据
        if (!parsedResponse.plans || !Array.isArray(parsedResponse.plans)) {
          throw new ValidationError('Invalid plans structure in AI response');
        }

        // 修复每个方案的月度里程碑
        const fixedPlans = parsedResponse.plans.map((plan: any) => this.fixPlanMilestones(plan));
        calculatedPlans = fixedPlans.map((plan: any, index: number) => {
          try {
            console.log(`Validating AI plan ${index + 1}:`, plan);
            return validateAndParse(planOptionSchema, plan);
          } catch (error) {
            console.error(`Validation failed for AI plan ${index + 1}:`, error);
            console.error('Plan data:', plan);
            throw error;
          }
        });
      }

      // 后端统一复算：确保所有计算都通过finalizePlanOption
      const startBand = inferStartBand(validatedIntake);
      const targetBand = await inferTargetBandFromIntake(validatedIntake); // 从用户目标推断目标难度

      console.log('后端复算参数:', { startBand, targetBand });

      const finalizedPlans = calculatedPlans.map((plan: PlanOption) => {
        console.log(`后端复算方案 ${plan.tier}:`, {
          原始天数: plan.days_per_week,
          原始分钟: plan.daily_minutes,
          原始周数: plan.weeks
        });

        const finalizedPlan = finalizePlanOption(validatedIntake, plan, startBand, targetBand);

        console.log(`复算后方案 ${plan.tier}:`, {
          最终天数: finalizedPlan.days_per_week,
          最终分钟: finalizedPlan.daily_minutes,
          最终周数: finalizedPlan.weeks,
          总课时: finalizedPlan.lessons_total
        });

        return finalizedPlan;
      });

      // 验证计算一致性
      const inconsistencies: string[] = [];
      finalizedPlans.forEach((plan, index) => {
        const isConsistent = validateCalculationConsistency(
          calculatedPlans[index],
          plan
        );
        if (!isConsistent) {
          inconsistencies.push(`方案 ${plan.tier} 计算不一致`);
        }
      });

      if (inconsistencies.length > 0) {
        console.warn('发现计算不一致:', inconsistencies);
      } else {
        console.log('所有方案计算一致性验证通过');
      }

      // 记录历史
      PromptHistory.add({
        id: requestId,
        type: 'generate_plans',
        prompt: '数学计算+AI混合生成',
        response: JSON.stringify(finalizedPlans),
        success: true,
      });

      return {
        success: true,
        data: finalizedPlans,
      };

    } catch (error) {
      console.error('Error generating plans:', error);

      // 记录失败历史
      PromptHistory.add({
        id: requestId,
        type: 'generate_plans',
        prompt: '数学计算+AI混合生成',
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof ValidationError || error instanceof PromptError) {
        return {
          success: false,
          error: error.message,
          details: error.details,
        };
      }

      return {
        success: false,
        error: 'Failed to generate learning plans',
        details: error,
      };
    }
  }

  // 生成月度计划
  async generateMonthlyPlan(
    chosenPlan: PlanOption,
    intake: Intake
  ): Promise<APIResponse<MonthlyPlan>> {
    const startTime = Date.now();
    const requestId = `monthly_${Date.now()}`;

    try {
      // 修复传入的方案数据，确保有必需的字段
      const fixedPlan = this.fixPlanMilestones(chosenPlan);

      // 验证输入数据
      let validatedPlan: any;
      try {
        validatedPlan = validateAndParse(planOptionSchema, fixedPlan);
        console.log('方案验证成功:', {
          tier: validatedPlan.tier,
          track: validatedPlan.track,
          monthly_milestones_count: validatedPlan.monthly_milestones_one_line?.length || 0,
          milestones: validatedPlan.monthly_milestones_one_line
        });
      } catch (planError) {
        console.error('方案验证失败:', planError);
        console.error('方案数据:', JSON.stringify(fixedPlan, null, 2));
        throw planError;
      }

      const validatedIntake = validateAndParse(intakeSchema, intake);

      // 构建提示词
      const prompt = createGenerateMonthlyPrompt(validatedPlan, validatedIntake);

      // 调用AI
      const response = await withRetry(
        () => this.adapter.chat<string>({
          system: SYSTEM_PROMPT,
          prompt,
          temperature: PROMPT_CONFIG.DEFAULT_TEMPERATURE,
        }),
        3,
        2000
      );

      // 解析和验证响应
      let parsedResponse: any;
      try {
        console.log('Monthly Plan Raw Response:', response);

        // 提取JSON内容
        const cleanedResponse = this.extractJSONFromResponse(response);
        parsedResponse = JSON.parse(cleanedResponse);
        console.log('Monthly Plan Parsed Response:', parsedResponse);
      } catch (error) {
        console.error('Monthly Plan JSON Parse Error:', error);
        console.error('Raw AI Response was:', response);
        // 尝试修复JSON
        const repairedResponse = await this.repairResponse(response, 'MonthlyPlan');
        parsedResponse = JSON.parse(repairedResponse);
      }

      // 修复月度计划数据
      const fixedMonthlyPlan = this.fixMonthlyPlan(parsedResponse);

      // 应用动态门限
      const processedMonthlyPlan = this.applyDynamicGates(fixedMonthlyPlan, 'generate_monthly');

      // 应用里程碑v2系统（如果启用）
      let finalMonthlyPlan = processedMonthlyPlan;
      if (MILESTONE_V2_FEATURES.FEATURE_MILESTONES_V2) {
        finalMonthlyPlan = await this.applyMilestonesV2(processedMonthlyPlan, validatedPlan, validatedIntake);
      }

      const validatedMonthlyPlan = validateAndParse(monthlyPlanSchema, finalMonthlyPlan);

      // 记录历史
      PromptHistory.add({
        id: requestId,
        type: 'generate_monthly',
        prompt,
        response,
        success: true,
      });

      return {
        success: true,
        data: validatedMonthlyPlan,
      };

    } catch (error) {
      console.error('Error generating monthly plan:', error);

      // 记录失败历史
      PromptHistory.add({
        id: requestId,
        type: 'generate_monthly',
        prompt: createGenerateMonthlyPrompt(chosenPlan, intake),
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof ValidationError || error instanceof PromptError) {
        return {
          success: false,
          error: error.message,
          details: error.details,
        };
      }

      return {
        success: false,
        error: 'Failed to generate monthly plan',
        details: error,
      };
    }
  }

  // 生成首月课程大纲
  async generateFirstMonthSyllabus(
    monthlyPlan: MonthlyPlan,
    chosenPlan: PlanOption,
    intake: Intake
  ): Promise<APIResponse<FirstMonthSyllabus>> {
    const startTime = Date.now();
    const requestId = `syllabus_${Date.now()}`;

    try {
      console.log('开始生成首月课程大纲...');

      // 验证输入数据 - 先修复数据再验证
      const fixedChosenPlan = this.fixPlanMilestones(chosenPlan);
      const validatedPlan = validateAndParse(planOptionSchema, fixedChosenPlan);
      const validatedIntake = validateAndParse(intakeSchema, intake);

      // 修复月度计划数据，确保只包含月度计划该有的字段
      const fixedMonthlyPlan = this.fixMonthlyPlan(monthlyPlan);
      let validatedMonthlyPlan = validateAndParse(monthlyPlanSchema, fixedMonthlyPlan);

      console.log('数据验证完成，开始构建提示词...');

      // 构建提示词
      const prompt = createGenerateSyllabusPrompt(
        validatedMonthlyPlan,
        validatedPlan,
        validatedIntake
      );

      console.log('提示词构建完成，开始调用AI...');

      // 调用AI - 使用更短的超时时间，减少失败率
      const response = await withRetry(
        () => this.adapter.chat<string>({
          system: SYSTEM_PROMPT,
          prompt,
          temperature: 0.3, // 降低温度，提高稳定性
        }),
        2, // 减少重试次数
        8000 // 增加超时时间到8秒
      );

      console.log('AI响应获取成功，开始解析...');

      // 解析和验证响应
      let parsedResponse: any;
      try {
        console.log('Syllabus Raw Response length:', response.length);

        // 提取JSON内容
        const cleanedResponse = this.extractJSONFromResponse(response);
        parsedResponse = JSON.parse(cleanedResponse);
        console.log('Syllabus Parsed Response successfully');
      } catch (error) {
        console.error('Syllabus JSON Parse Error:', error);
        console.error('Raw AI Response preview:', response.substring(0, 500) + '...');

        // 直接使用降级方案，不再尝试修复JSON
        console.warn('使用降级方案生成课程大纲...');
        parsedResponse = this.createFallbackSyllabus(monthlyPlan, chosenPlan, validatedIntake);
      }

      let validatedSyllabus = validateAndParse(firstMonthSyllabusSchema, parsedResponse);
      console.log('课程大纲验证完成');

      // 热修Hook：难度封顶 + 轻量降级规则
      const startBand = inferStartBand(validatedIntake);
      const targetBand = await inferTargetBandFromIntake(validatedIntake);
      const fixed = hotfixClamp(validatedMonthlyPlan, validatedSyllabus, startBand, targetBand);

      // 更新月度计划和首月大纲
      validatedMonthlyPlan = fixed.monthlyPlan;
      validatedSyllabus = fixed.month1;

      console.log('难度控制完成');

      // 简化文化合规检查
      try {
        const complianceCheck = await this.checkCulturalCompliance(validatedSyllabus);
        if (!complianceCheck.compliant) {
          console.log('应用文化合规修复...');
          const fixedSyllabus = await this.applyCulturalFixes(validatedSyllabus, complianceCheck.issues);

          // 记录历史
          PromptHistory.add({
            id: requestId,
            type: 'generate_syllabus',
            prompt,
            response: JSON.stringify(fixedSyllabus),
            success: true,
          });

          return {
            success: true,
            data: fixedSyllabus,
          };
        }
      } catch (culturalError) {
        console.warn('文化合规检查失败，使用原始结果:', culturalError);
      }

      // 记录历史
      PromptHistory.add({
        id: requestId,
        type: 'generate_syllabus',
        prompt,
        response: JSON.stringify(validatedSyllabus),
        success: true,
      });

      console.log('课程大纲生成完成');
      return {
        success: true,
        data: validatedSyllabus,
      };

    } catch (error) {
      console.error('Error generating syllabus:', error);

      // 记录失败历史
      PromptHistory.add({
        id: requestId,
        type: 'generate_syllabus',
        prompt: createGenerateSyllabusPrompt(monthlyPlan, chosenPlan, intake),
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // 如果所有方法都失败，返回降级方案而不是错误
      console.warn('所有生成方法失败，返回降级课程大纲...');
      try {
        const fallbackSyllabus = this.createFallbackSyllabus(monthlyPlan, chosenPlan, intake);
        return {
          success: true,
          data: fallbackSyllabus,
        };
      } catch (fallbackError) {
        console.error('降级方案也失败:', fallbackError);

        if (error instanceof ValidationError || error instanceof PromptError) {
          return {
            success: false,
            error: error.message,
            details: error.details,
          };
        }

        return {
          success: false,
          error: 'Failed to generate syllabus',
          details: error,
        };
      }
    }
  }

  // 文化合规检查
  private async checkCulturalCompliance(content: any): Promise<{
    compliant: boolean;
    issues: string[];
  }> {
    try {
      const contentString = JSON.stringify(content, null, 2);

      const response = await withRetry(
        () => this.adapter.chat<string>({
          system: SYSTEM_PROMPT,
          prompt: `${CULTURAL_COMPLIANCE_PROMPT}\n\n检查内容：\n${contentString}`,
          temperature: 0.1,
        }),
        2,
        1000
      );

      // 简单的合规检查逻辑
      const sensitiveKeywords = [
        'alcohol', 'bar', 'pub', 'nightclub', 'gambling',
        'dating', 'romantic', 'political', 'religious'
      ];

      const issues: string[] = [];
      for (const keyword of sensitiveKeywords) {
        if (contentString.toLowerCase().includes(keyword)) {
          issues.push(`发现敏感词汇: ${keyword}`);
        }
      }

      return {
        compliant: issues.length === 0,
        issues,
      };

    } catch (error) {
      console.error('Error checking cultural compliance:', error);
      // 如果检查失败，默认认为合规
      return { compliant: true, issues: [] };
    }
  }

  // 应用文化修复
  private async applyCulturalFixes(
    content: FirstMonthSyllabus,
    issues: string[]
  ): Promise<FirstMonthSyllabus> {
    // 简单的修复逻辑 - 替换敏感词汇
    let fixedContent = JSON.stringify(content);

    const replacements = [
      { from: /bar|pub/gi, to: 'coffee shop' },
      { from: /nightclub/gi, to: 'community center' },
      { from: /dating/gi, to: 'meeting' },
      { from: /romantic/gi, to: 'friendly' },
      { from: /alcohol/gi, to: 'beverages' },
    ];

    for (const { from, to } of replacements) {
      fixedContent = fixedContent.replace(from, to);
    }

    try {
      return JSON.parse(fixedContent);
    } catch {
      // 如果修复失败，返回原内容
      return content;
    }
  }

  // 创建备用课程大纲 - 简化版本，减少复杂度
  private createFallbackSyllabus(monthlyPlan: any, chosenPlan: any, intake: any): any {
    const track = chosenPlan.track || 'work';
    const dailyMinutes = chosenPlan.daily_minutes || 60;
    const daysPerWeek = chosenPlan.days_per_week || 5;

    // 简化课程数量计算
    const lessonsPerDay = Math.max(1, Math.min(3, Math.ceil(dailyMinutes / 30)));

    // 根据轨道定制内容 - 确保有4周主题
    const getWeekThemes = () => {
      switch (track) {
        case 'travel':
          return [
            '旅行基础问候与自我介绍',
            '问路和方向指引',
            '餐厅点餐和食物询问',
            '酒店入住和住宿安排'
          ];
        case 'work':
          return [
            '商务问候与自我介绍',
            '公司和产品介绍',
            '询问产品信息',
            '表达合作意向'
          ];
        case 'study':
          return [
            '课堂问候与自我介绍',
            '课程咨询与讨论',
            '学习小组合作',
            '简单演讲与表达'
          ];
        case 'exam':
          return [
            '考试基础词汇与题型',
            '听力与阅读技巧',
            '写作与口语练习',
            '综合复习与应试'
          ];
        default:
          return [
            '基础问候与自我介绍',
            '日常交流技能',
            '兴趣和爱好',
            '计划和安排'
          ];
      }
    };

    const weekThemes = getWeekThemes();

    // 生成简化的周数据
    const generateSimpleWeekData = (weekNum: number, theme: string) => {
      const baseDifficulty = weekNum === 1 ? "A2" : weekNum === 2 ? "A2+" : weekNum === 3 ? "B1-" : "B1";

      const days = [];
      for (let dayNum = 1; dayNum <= Math.min(daysPerWeek, 5); dayNum++) {
        const dayLessons = [];
        for (let lessonNum = 1; lessonNum <= lessonsPerDay; lessonNum++) {
          const lessonIndex = (weekNum - 1) * daysPerWeek * lessonsPerDay + (dayNum - 1) * lessonsPerDay + lessonNum;

          dayLessons.push({
            index: lessonIndex,
            difficulty_band: baseDifficulty,
            theme: `${theme} - 第${lessonNum}课`,
            objective: `学习${theme}的核心内容`,
            today_you_can: `今天你能掌握${theme}的基本技能`,
            keywords: ["关键词1", "关键词2"],
            patterns: ["基本句型1", "基本句型2"],
            teacher_guide: {
              ask: `如何学习${theme}？`,
              say: `专注学习${theme}的核心概念`,
              tip: "多练习，多应用"
            },
            caps: {
              grammar_allow: ["简单现在时", "基础动词"],
              grammar_forbid: ["复杂时态", "被动语态"],
              listening_wpm_max: 90 + weekNum * 5,
              max_sentences: 4 + weekNum
            },
            max_task_steps: 2 + weekNum
          });
        }

        days.push({
          day: dayNum,
          lessons: dayLessons
        });
      }

      return {
        week: weekNum,
        focus: theme,
        days: days
      };
    };

    // 生成完整的4周数据
    return {
      weeks: [
        generateSimpleWeekData(1, weekThemes[0]),
        generateSimpleWeekData(2, weekThemes[1]),
        generateSimpleWeekData(3, weekThemes[2]),
        generateSimpleWeekData(4, weekThemes[3])
      ]
    };
  }

  // 修复AI响应
  private async repairResponse(
    originalResponse: string,
    targetSchema: string
  ): Promise<string> {
    try {
      const repairPrompt = REPAIR_PROMPT
        .replace('{schema_description}', targetSchema)
        .replace('{original_response}', originalResponse)
        .replace('{error_message}', 'Invalid JSON format or structure');

      const repairedResponse = await this.adapter.chat<string>({
        system: SYSTEM_PROMPT,
        prompt: repairPrompt,
        temperature: PROMPT_CONFIG.REPAIR_TEMPERATURE,
      });

      return repairedResponse;

    } catch (error) {
      console.error('Error repairing response:', error);
      throw new PromptError(
        'Failed to repair AI response',
        'repair',
        { originalResponse, targetSchema, error }
      );
    }
  }

  // 生成快速测试题目
  async generateQuickTest(culturalMode: string): Promise<APIResponse<any>> {
    const startTime = Date.now();
    const requestId = `quicktest_${Date.now()}`;

    try {
      const prompt = `请为英语学习者生成7道快速测试题，用于评估当前英语水平。

## 要求
1. **纯文本格式**：不要使用加粗、斜体等格式
2. **难度递进**：从简单到复杂
3. **文化合规**：适合${culturalMode}文化环境
4. **覆盖全面**：词汇、语法、阅读、对话

## 输出JSON格式
{
  "questions": [
    {
      "id": 1,
      "type": "vocabulary|grammar|reading|dialogue",
      "question": "题目内容",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "解释"
    }
  ],
  "answer_key": {"1": "A", "2": "B", ...}
}`;

      const response = await withRetry(
        () => this.adapter.chat<string>({
          system: SYSTEM_PROMPT,
          prompt,
          temperature: PROMPT_CONFIG.CREATIVE_TEMPERATURE,
        }),
        2,
        2000
      );

      let parsedResponse: any;
      try {
        console.log('Quick Test Raw Response:', response);

        // 提取JSON内容
        const cleanedResponse = this.extractJSONFromResponse(response);
        parsedResponse = JSON.parse(cleanedResponse);
        console.log('Quick Test Parsed Response:', parsedResponse);
      } catch (error) {
        console.error('Quick Test JSON Parse Error:', error);
        console.error('Raw AI Response was:', response);
        throw new PromptError(
          'Invalid JSON response from AI',
          'generation',
          { response, error }
        );
      }

      // 记录历史
      PromptHistory.add({
        id: requestId,
        type: 'generate_quicktest',
        prompt,
        response,
        success: true,
      });

      return {
        success: true,
        data: parsedResponse,
      };

    } catch (error) {
      console.error('Error generating quick test:', error);

      PromptHistory.add({
        id: requestId,
        type: 'generate_quicktest',
        prompt: '',
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to generate quick test',
        details: error,
      };
    }
  }

  // 应用里程碑v2系统
  private async applyMilestonesV2(monthlyPlan: any, chosenPlan: any, intake: any): Promise<any> {
    try {
      const isShadow = MILESTONE_V2_FEATURES.MILESTONES_SHADOW;

      // 构建计划上下文
      const context: PlanContext = {
        startBand: inferStartBand(intake),
        targetBand: await inferTargetBandFromIntake(intake),
        totalWeeks: chosenPlan.weeks,
        minutesPerWeek: chosenPlan.daily_minutes * chosenPlan.days_per_week,
        track: chosenPlan.track || 'daily',
        monthCaps: monthlyPlan.milestones?.map((m: any) => m.max_target_band) || [],
        startDateISO: new Date().toISOString()
      };

      console.log('里程碑v2 - 计划上下文:', context);

      // 生成v2里程碑
      const milestonesV2 = buildMilestonesV2(context);
      console.log('里程碑v2 - 生成的里程碑:', milestonesV2);

      // 影子模式对比
      if (isShadow && monthlyPlan.milestones) {
        const comparison = compareMilestoneVersions(monthlyPlan.milestones, milestonesV2);
        console.log('里程碑v2 - 影子模式对比:', comparison);

        // 影子模式下记录差异但使用原版
        logFeatureFlagUsage('milestone_v2_shadow_comparison', {
          context,
          comparison,
          v2_count: milestonesV2.length,
          v1_count: monthlyPlan.milestones.length
        });

        return monthlyPlan; // 影子模式返回原版
      }

      // 非影子模式，使用v2里程碑
      const enhancedPlan = {
        ...monthlyPlan,
        milestones: milestonesV2.map((milestone: Milestone) => ({
          month: Math.ceil(milestone.endWeek / 4), // 转换为月份显示
          max_target_band: milestone.cap,
          focus: milestone.focus,
          assessment_gate: milestone.assessment_gate,
          deliverable: milestone.deliverable,
          week_range: `${milestone.startWeek}-${milestone.endWeek}`, // 周范围
          type: milestone.type, // 里程碑类型
          index: milestone.index // 阶段编号
        }))
      };

      console.log('里程碑v2 - 增强计划完成:', {
        原里程碑数: monthlyPlan.milestones?.length || 0,
        新里程碑数: milestonesV2.length,
        总周数: context.totalWeeks,
        每周分钟: context.minutesPerWeek
      });

      return enhancedPlan;

    } catch (error) {
      console.error('里程碑v2应用失败:', error);
      return monthlyPlan; // 失败时回退到原版
    }
  }

  // 获取提示词历史统计
  getPromptStats() {
    return PromptHistory.getStats();
  }

  // 清空提示词历史
  clearPromptHistory() {
    PromptHistory.clear();
  }
}

// 单例实例
export const aiService = new AIService();