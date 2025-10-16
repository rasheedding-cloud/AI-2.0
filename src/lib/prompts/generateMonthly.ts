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

## 选定方案信息
- **方案等级**：${tier}
- **学习轨道**：${track}
- **学习强度**：每日${daily_minutes}分钟，每周${days_per_week}天
- **总周期**：${weeks}周
- **对应月份**：${monthsTotal}个月
- **预计完成**：${finish_date_est}
- **学习目标**：${goal_free_text}
- **文化模式**：${cultural_mode}

## 输出要求
请返回严格的JSON格式，必须生成${monthsTotal}个月的数据：

\`\`\`json
{
  "months_total": ${monthsTotal},
  "milestones": [
${Array.from({ length: monthsTotal }, (_, i) => {
  const monthNum = i + 1;
  const isMonth1or2 = monthNum <= 2;
  const targetBand = isMonth1or2 ? "A2+" : monthNum === 3 ? "B1-" : "B1";
  const accuracy = monthNum === 1 ? 0.85 : monthNum === 2 ? 0.80 : monthNum === 3 ? 0.75 : 0.70;
  const taskSteps = monthNum === 1 ? 3 : monthNum === 2 ? 4 : monthNum === 3 ? 5 : 6;
  const fluencyPauses = monthNum === 1 ? 2 : monthNum === 2 ? 3 : monthNum === 3 ? 4 : 5;

  return `    {
      "month": ${monthNum},
      "max_target_band": "${targetBand}",
      "focus": ["重点1", "重点2", "重点3", "重点4"],
      "assessment_gate": {
        "accuracy": ${accuracy},
        "task_steps": ${taskSteps},
        "fluency_pauses": ${fluencyPauses}
      }
    }${monthNum < monthsTotal ? ',' : ''}`;
}).join('\n')}
  ]
}
\`\`\``

TASK: Produce a MonthlyPlan with DYNAMIC caps based on start_band × target_band × total weeks.

## 动态月度上限规则

### 难度递进逻辑
- **起点推导**：从快测或自评获取start_band (Pre-A..B1)
- **目标推导**：从UI标签获取target_band (生存≈A2, 自如≈B1)
- **第1月上限**：min(start_band + 2微档, target_band)
- **后续月份**：每月递进≤2微档，永不超过target_band
- **预热机制**：允许≤10%时间使用下一级词块内容（仅短语，无段落）
- **周增长限制**：每周增长≤1微档，超限内容必须重写

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

请根据选定的${tier}方案和${track}轨道，生成详细的${weeks}周月度计划。确保每月重点明确、循序渐进，并严格遵守难度递进规则。`;
};