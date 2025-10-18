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

  // 根据轨道定制化主题
  const getWeekThemes = () => {
    if (isTravel) {
      return [
        '旅行基础问候与自我介绍',
        '问路和方向指引',
        '餐厅点餐和食物询问',
        '酒店入住和住宿安排'
      ];
    } else if (isWork) {
      return [
        '商务问候与自我介绍',
        '公司和产品介绍',
        '询问产品信息',
        '表达合作意向'
      ];
    } else if (isStudy) {
      return [
        '课堂问候与自我介绍',
        '课程咨询与讨论',
        '学习小组合作',
        '简单演讲与表达'
      ];
    } else if (isExam) {
      return [
        '考试基础词汇与题型',
        '听力与阅读技巧',
        '写作与口语练习',
        '综合复习与应试'
      ];
    } else {
      return [
        '基础问候与自我介绍',
        '日常交流技能',
        '兴趣和爱好',
        '计划和安排'
      ];
    }
  };

  const weekThemes = getWeekThemes();

  return `生成首月（第1月）的详细课程大纲，返回简洁的JSON格式：

## 基础信息
- 学习轨道：${track}
- 每日${daily_minutes}分钟，每周${days_per_week}天
- 文化模式：${cultural_mode}
- 难度上限：${firstMonthMilestone.max_target_band}

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
              "difficulty_band": "A2",
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