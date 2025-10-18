import { MonthlyPlan, PlanOption, Intake } from '@/types';

export const createGenerateSyllabusPrompt = (
  monthlyPlan: MonthlyPlan,
  chosenPlan: PlanOption,
  intake: Intake
): string => {
  const { daily_minutes, days_per_week, track } = chosenPlan;
  const { cultural_mode, goal_free_text } = intake;
  const firstMonthMilestone = monthlyPlan.milestones[0];

  // 简化课程数量计算，确保合理的课程数量
  const lessonsPerDay = Math.max(1, Math.min(3, Math.ceil(daily_minutes / 30)));
  const isTravel = track === 'travel';
  const isWork = track === 'work';
  const isStudy = track === 'study';
  const isDaily = track === 'daily';
  const isExam = track === 'exam';

  // 根据轨道和学员水平定制化主题
  const getWeekThemes = () => {
    if (isTravel) {
      return [
        '深度文化交流与地道表达',
        '旅行中的复杂场景应对',
        '跨文化沟通技巧',
        '自主旅行问题解决'
      ];
    } else if (isWork) {
      return [
        '高级商务谈判技巧',
        '跨文化团队管理',
        '商务演讲与汇报',
        '战略决策沟通'
      ];
    } else if (isStudy) {
      return [
        '学术演讲与辩论',
        '研究方法与论文写作',
        '学术交流与批判性思维',
        '国际学术合作'
      ];
    } else if (isExam) {
      return [
        '高级应试策略与技巧',
        '复杂题型分析与解答',
        '模拟考试与评估',
        '应试心理调节'
      ];
    } else {
      return [
        '深度社交与情感表达',
        '观点辩论与说服技巧',
        '文化理解与包容',
        '流畅对话与思维表达'
      ];
    }
  };

  const weekThemes = getWeekThemes();

  return `生成首月（第1月）的详细课程大纲，返回简洁的JSON格式：

## 🚨 学员水平信息 - 关键！
- **学员起点水平**：${intake.self_assessed_level || '未提供'}
- **第1月难度上限**：${firstMonthMilestone.max_target_band}
- **绝对不能倒退**：如果学员是B2，课程难度应该是B2或B2+，绝不能是A2！

## 基础信息
- 学习轨道：${track}
- 每日${daily_minutes}分钟，每周${days_per_week}天
- 文化模式：${cultural_mode}
- 学习目标：${goal_free_text}

## 课程结构要求
- 每周5天（周一至周五）
- 每天${lessonsPerDay}节课（每节25-30分钟）
- 总共4周课程
- 难度严格控制在${firstMonthMilestone.max_target_band}以下

## 每周主题
${weekThemes.map((theme, index) => `Week ${index + 1}: ${theme}`).join('\n')}

## 输出格式
返回严格的JSON：

\`\`\`json
{
  "weeks": [
    {
      "week": 1,
      "focus": "${weekThemes[0]}",
      "days": [
        {
          "day": 1,
          "lessons": [
            {
              "index": 1,
              "difficulty_band": "${firstMonthMilestone.max_target_band}", // 动态设置，基于学员起点！
              "theme": "课程主题",
              "objective": "学习目标",
              "today_you_can": "今天你能...",
              "keywords": ["关键词1", "关键词2"],
              "patterns": ["句型1", "句型2"],
              "teacher_guide": {
                "ask": "教师提问",
                "say": "教师讲解",
                "tip": "教学提示"
              },
              "caps": {
                "grammar_allow": ["允许语法1"],
                "grammar_forbid": ["禁止语法1"],
                "listening_wpm_max": 90,
                "max_sentences": 4
              },
              "max_task_steps": 2
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

## 设计原则
1. **难度控制**：所有内容不超过${firstMonthMilestone.max_target_band}
2. **实用性**：贴近${track}实际应用场景
3. **渐进性**：每周难度递增，内容连贯
4. **文化合规**：适合${cultural_mode}文化环境

请生成4周的完整课程大纲，确保格式正确、内容实用。`;
};