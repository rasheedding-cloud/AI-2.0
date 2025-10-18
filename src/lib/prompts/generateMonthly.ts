import { PlanOption, Intake } from '@/types';

export const createGenerateMonthlyPrompt = (
  chosenPlan: PlanOption,
  intake: Intake
): string => {
  const {
    tier,
    track,
    daily_minutes,
    days_per_week,
    weeks,
    finish_date_est,
  } = chosenPlan;

  const { goal_free_text, cultural_mode } = intake;

  // 根据周数计算月数（每4周为1个月，最少1个月，最多12个月）
  const monthsTotal = Math.max(1, Math.min(12, Math.ceil(weeks / 4)));

  return `请基于选定的学习方案，生成${weeks}周详细的月度计划：

## 学员信息 - 关键数据
- **学员起点水平**：${intake.self_assessed_level || '未提供'}
- **学习目标**：${goal_free_text}
- **目标水平推算**：根据"${goal_free_text}"，这对应${goal_free_text.includes('母语') ? 'C1-C2' : goal_free_text.includes('职场') ? 'B2-C1' : goal_free_text.includes('学术') ? 'B2-C1' : 'B1-B2'}水平

## 选定方案信息
- **方案等级**：${tier}
- **学习轨道**：${track}
- **学习强度**：每日${daily_minutes}分钟，每周${days_per_week}天
- **总周期**：${weeks}周 (${monthsTotal}个月)
- **预计完成**：${finish_date_est}
- **文化模式**：${cultural_mode}

## 🚨 重要：基于学习时长的动态递进要求

### 学习强度与递进速度关系
- **轻量方案(tier=light)**：每月递进0.5-1个微档（学习强度低）
- **标准方案(tier=standard)**：每月递进1-1.5个微档（学习强度中等）
- **进阶方案(tier=intensive)**：每月递进1.5-2个微档（学习强度高）

### B2起点学员的动态递进计算
1. **总档位差**：目标C1-C2减去起点B2 = 约3-4个档位
2. **月均递进**：总档位差 ÷ ${monthsTotal}个月
3. **强度调整**：根据${tier}方案调整递进速度
4. **实际示例**：
   - 轻量(${monthsTotal}个月)：B2→B2+→C1-→...
   - 标准(${monthsTotal}个月)：B2→C1-→C1→...
   - 进阶(${monthsTotal}个月)：B2→C1→C1+→...

### 🚨 绝不倒退原则
- 绝对禁止B2+→B1-这类严重倒退
- 递进速度基于学习强度，不是固定值
- 短期高强度学习可能每月提升2档
- 长期低强度学习可能每月提升0.5档

## 输出要求
请返回严格的JSON格式，必须生成${monthsTotal}个月的数据：

\`\`\`json
{
  "months_total": ${monthsTotal},
  "milestones": [
${Array.from({ length: monthsTotal }, (_, i) => {
  const monthNum = i + 1;
  const isMonth1or2 = monthNum <= 2;
  const targetBand = "DYNAMIC"; // 必须根据学员起点和目标动态计算，绝不能硬编码！

  return `    {
      "month": ${monthNum},
      "max_target_band": "${targetBand}",
      "focus": ["重点1", "重点2", "重点3", "重点4"],
      "assessment_gate": {
        "accuracy": 0.8,
        "task_steps": ${isMonth1or2 ? 3 : 4},
        "fluency_pauses": 2
      }
    }${monthNum < monthsTotal ? ',' : ''}`;
}).join('\n')}
  ]
}
\`\`\`

TASK: Produce a MonthlyPlan with DYNAMIC caps based on start_band × target_band × total weeks.

## 动态月度上限规则

### 难度递进逻辑 - 修复版本
- **起点推导**：从学员self_assessed_level获取start_band (完整范围Pre-A..C1)
- **目标推导**：从学习目标推算target_band (日常≈B1, 职场≈B2, 学术≈C1, 母语≈C2)
- **第1月上限**：start_band + 1-2微档 (绝对不能低于学员起点！)
- **后续月份**：每月递进≤2微档，永不超过target_band
- **预热机制**：允许≤10%时间使用下一级词块内容（仅短语，无段落）
- **周增长限制**：每周增长≤1微档，超限内容必须重写

### 🎯 基于CEFR标准的科学递进计算

#### CEFR学习时长标准
- **A1**: 100-200小时 → A2: 200-400小时 → B1: 400-600小时
- **B2**: 600-800小时 → C1: 800-1200小时 → C2: 1200-2000小时

#### 学员水平定位计算
1. **当前学习总时长**: ${daily_minutes}分钟 × ${days_per_week}天/周 × ${weeks}周 = ${daily_minutes * days_per_week * weeks}分钟 = ${Math.round((daily_minutes * days_per_week * weeks) / 60)}小时
2. **起点水平推算**: 学员自评${intake.self_assessed_level} ≈ ${intake.self_assessed_level === 'B2' ? '600-800小时' : intake.self_assessed_level === 'B1' ? '400-600小时' : intake.self_assessed_level === 'A2' ? '200-400小时' : '基础水平'}
3. **目标水平推算**: "${goal_free_text}" ≈ ${goal_free_text.includes('母语') ? 'C1-C2 (800-2000小时)' : goal_free_text.includes('职场') ? 'B2-C1 (600-1200小时)' : goal_free_text.includes('学术') ? 'B2-C1 (600-1200小时)' : 'B1-B2 (400-800小时)'}

#### 实际递进预期
- **180节课 = 75小时总学习时间**
- **起点B2(600-800小时) + 75小时 = B2+水平 (≈700-875小时)**
- **最终目标C1-C2**: 需要达到800-1200小时
- **合理递进**: B2→B2+ (当前水平保持和微幅提升)

#### 🚨 关键要求
- **绝不倒退**: B2起点学员绝不能出现A2内容！
- **时长匹配**: 75小时的学习应该达到B2+水平，不是C1
- **现实预期**: 75小时不足以达到C1水平，需要更多学习时间

### 评估闸口动态规则
- **If current month cap < B1-** use A2 gate {accuracy:0.8, task_steps:3, fluency_pauses:2}
- **Else use B1 gate** {accuracy:0.8, task_steps:4, fluency_pauses:2}

## 传统参考规则（向后兼容）

### 第1月
- **核心目标**：建立基础交流能力
- **重点领域**：根据${track}轨道确定核心技能
- **严格限制**：基于动态上限，绝对不允许越级

### 第2月
- **核心目标**：提升交流流畅度
- **允许预热**：≤10%词块级下一级内容（无段落级）

### 第3月
- **核心目标**：开始接触复杂内容
- **重点突破**：段落级目标内容开始引入

### 第4月
- **核心目标**：达到目标水平
- **综合应用**：所有技能的整合运用

## 学习轨道重点

### Work (职场)
- Month 1: 基础职场词汇、简单邮件格式
- Month 2: 电话沟通、会议基础表达
- Month 3: 汇报技巧、商务谈判基础
- Month 4: 演讲技能、跨文化沟通

### Travel (旅行)
- Month 1: 基础问路、点餐、购物对话
- Month 2: 交通询问、酒店服务、紧急情况
- Month 3: 深度交流、文化体验、地道表达
- Month 4: 自助旅行、问题解决、文化交流

### Study (学术)
- Month 1: 课堂用语、基础学术词汇
- Month 2: 作业讨论、小组合作、简单演讲
- Month 3: 研究讨论、学术写作基础
- Month 4: 学术报告、批判性思维、学术交流

### Daily (日常)
- Month 1: 自我介绍、兴趣爱好、日常活动
- Month 2: 天气讨论、计划安排、情感表达
- Month 3: 观点分享、故事讲述、深入交流
- Month 4: 社交技巧、文化理解、流畅对话

### Exam (考试)
- Month 1: 考试词汇、基础题型技巧
- Month 2: 听力技巧、阅读策略、写作基础
- Month 3: 口语技巧、综合应用、模拟测试
- Month 4: 冲刺技巧、心理调节、考试策略

## 评估闸口说明
- **accuracy**: 任务完成准确率要求
- **task_steps**: 任务复杂度（步骤数量）
- **fluency_pauses**: 允许的思考停顿次数

请根据选定的${tier}方案和${track}轨道，生成详细的${weeks}周月度计划。确保每月重点明确、循序渐进，并严格遵守难度递进规则。

**重要提示**：assessment_gate中的数值将根据max_target_band由后端动态计算，当前提供的数值仅为占位符。请重点关注max_target_band的正确设置和focus内容的合理性。`;
};