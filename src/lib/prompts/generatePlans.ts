import { Intake } from '@/types';

export const createGeneratePlansPrompt = (intake: Intake): string => {
  const {
    gender,
    identity,
    native_language,
    goal_free_text,
    zero_base,
    self_assessed_level,
    deadline_date,
    daily_minutes_pref,
    study_days_per_week,
    cultural_mode,
    track_override,
  } = intake;

  return `请为以下学员生成三档学习方案（轻量/标准/进阶）：

## 学员信息
- **性别**：${gender}
- **身份**：${identity}
- **母语**：${native_language}
- **学习目标**：${goal_free_text}
- **基础情况**：${zero_base ? '零基础' : self_assessed_level ? `自评水平：${self_assessed_level}` : '未提供'}
- **时间安排**：每日${daily_minutes_pref || '未指定'}分钟，每周${study_days_per_week || 5}天
- **目标期限**：${deadline_date || '无限制'}
- **文化模式**：${cultural_mode}
- **指定轨道**：${track_override || '自动检测'}

## 输出要求
请返回严格的JSON格式，包含以下结构：

\`\`\`json
{
  "plans": [
    {
      "tier": "light|standard|intensive",
      "track": "work|travel|study|daily|exam",
      "ui_label_current": "当前能力描述",
      "ui_label_target": "目标能力描述",
      "can_do_examples": ["你能做...", "你能做...", "你能做..."],
      "daily_minutes": 25-180,
      "days_per_week": 3-6,
      "weeks": 总周数,
      "finish_date_est": "YYYY-MM",
      "lessons_total": 总课程数,
      "diagnosis": "green|yellow|red",
      "diagnosis_tips": ["建议1", "建议2", "建议3"],
      "monthly_milestones_one_line": ["第1月里程碑描述", "第2月里程碑描述", ...]
    }
  ]
}
\`\`\`

## 重要提醒
⚠️ **monthly_milestones_one_line数组应该基于实际学习月数生成**：
- 短期学习（≤4周）：生成1个月里程碑
- 中期学习（≤8周）：生成2个月里程碑
- 较长期学习（≤12周）：生成3个月里程碑
- 长期学习（>12周）：生成4个月里程碑
- 每个里程碑代表约4周的学习进展

## 三档方案说明
1. **轻量 (light)**：适合时间较少的学员，每天25-60分钟
2. **标准 (standard)**：适合常规学习的学员，每天60-90分钟
3. **进阶 (intensive)**：适合快速提升的学员，每天90-180分钟

## 诊断规则
- **绿色 (green)**：学习计划完全可行
- **黄色 (yellow)**：需要适当调整（增加时间/降低目标）
- **红色 (red)**：目标过高，需要大幅调整

## 计算规则（必须严格遵循）
⚠️ **严禁使用硬编码的周数，必须根据以下公式计算：**

### 基础计算常量
- **每课时时长**：25分钟
- **基础学习需求**：
  - 零基础 → 职场沟通：需要约240小时（240*60=14400分钟）
  - 有基础 → 职场熟练：需要约180小时（180*60=10800分钟）
  - 有基础 → 商务精通：需要约120小时（120*60=7200分钟）

### 周数计算公式
**必须使用这个公式计算周数：**
\`\`\`
总周数 = Math.ceil(总分钟需求 / (每日分钟数 × 每周天数))
\`\`\`

### 三档方案的时间配置
1. **轻量 (light)**：
   - 每日：${Math.max(25, (daily_minutes_pref || 60) * 0.7)}分钟
   - 每周：${Math.max(3, (study_days_per_week || 5) - 1)}天
2. **标准 (standard)**：
   - 每日：${daily_minutes_pref || 60}分钟
   - 每周：${study_days_per_week || 5}天
3. **进阶 (intensive)**：
   - 每日：${Math.min(180, (daily_minutes_pref || 60) * 1.5)}分钟
   - 每周：${Math.min(6, (study_days_per_week || 5) + 1)}天

### 课程数计算
**必须使用这个公式计算总课程数：**
\`\`\`
总课程数 = Math.ceil(总分钟需求 / 25)
\`\`\`

### 完成时间计算
**完成月份 = 当前月份 + 计算周数**

### 示例计算过程
假设：每日60分钟，每周5天，零基础学员
1. 总需求：14400分钟
2. 每周学习：60 × 5 = 300分钟
3. 计算周数：Math.ceil(14400 / 300) = 48周
4. 总课程数：Math.ceil(14400 / 25) = 576课

- 根据母语和学习目标自动检测最适合的学习轨道
- 如有deadline，计算所需周数是否足够
- **每月里程碑要体现渐进式提升**：第1月基础 → 第2月提升 → 第3月进阶 → 第4月精通

## 月度里程碑示例
根据实际学习时长生成里程碑：

**轻量方案（如33周/8个月）：**
- 第1月：掌握基础词汇和简单对话
- 第2月：提升日常交流能力
- 第3月：学会基础专业表达
- 第4月：巩固基础沟通能力
- 第5月：扩展词汇和表达范围
- 第6月：提升专业场景应用
- 第7月：强化综合技能训练
- 第8月：达到预期学习目标

**标准方案（如18周/4.5个月）：**
- 第1月：掌握基础词汇和简单对话
- 第2月：提升日常交流能力
- 第3月：学会专业领域表达
- 第4月：达到流利应用水平

**进阶方案（如10周/2.5个月）：**
- 第1月：快速掌握基础词汇和对话
- 第2月：快速提升应用能力
- 第3月：达成预期目标

## 注意事项
1. **禁止使用CEFR术语**：不要出现A1、A2、B1等术语
2. **目标要具体**：每项"你能做..."要具体可衡量
3. **时间要现实**：确保学习计划在指定时间内可完成
4. **文化要合规**：内容要符合${cultural_mode}文化模式
5. **根据实际周数生成里程碑**：体现不同方案的时长差异

请基于以上信息生成三档个性化的学习方案，确保每个方案的里程碑数量反映其实际学习时长。

## 🔴 计算验证要求（必须执行）
在生成JSON之前，请先展示你的计算过程：

**学员基础：** ${zero_base ? '零基础' : self_assessed_level || '未知'}
**总需求分钟数：** ${zero_base ? '14400' : self_assessed_level && ['B2', 'C1'].includes(self_assessed_level) ? '7200' : '10800'}

**轻量方案计算：**
- 每日：${Math.max(25, (daily_minutes_pref || 60) * 0.7)}分钟
- 每周：${Math.max(3, (study_days_per_week || 5) - 1)}天
- 每周总计：${Math.max(25, (daily_minutes_pref || 60) * 0.7) * Math.max(3, (study_days_per_week || 5) - 1)}分钟
- 计算周数：Math.ceil(${zero_base ? '14400' : self_assessed_level && ['B2', 'C1'].includes(self_assessed_level) ? '7200' : '10800'} / ${Math.max(25, (daily_minutes_pref || 60) * 0.7) * Math.max(3, (study_days_per_week || 5) - 1)}) = ${Math.ceil((zero_base ? 14400 : self_assessed_level && ['B2', 'C1'].includes(self_assessed_level) ? 7200 : 10800) / (Math.max(25, (daily_minutes_pref || 60) * 0.7) * Math.max(3, (study_days_per_week || 5) - 1)))}周

**标准方案计算：**
- 每日：${daily_minutes_pref || 60}分钟
- 每周：${study_days_per_week || 5}天
- 每周总计：${(daily_minutes_pref || 60) * (study_days_per_week || 5)}分钟
- 计算周数：Math.ceil(${zero_base ? '14400' : self_assessed_level && ['B2', 'C1'].includes(self_assessed_level) ? '7200' : '10800'} / ${(daily_minutes_pref || 60) * (study_days_per_week || 5)}) = ${Math.ceil((zero_base ? 14400 : self_assessed_level && ['B2', 'C1'].includes(self_assessed_level) ? 7200 : 10800) / ((daily_minutes_pref || 60) * (study_days_per_week || 5)))}周

**进阶方案计算：**
- 每日：${Math.min(180, (daily_minutes_pref || 60) * 1.5)}分钟
- 每周：${Math.min(6, (study_days_per_week || 5) + 1)}天
- 每周总计：${Math.min(180, (daily_minutes_pref || 60) * 1.5) * Math.min(6, (study_days_per_week || 5) + 1)}分钟
- 计算周数：Math.ceil(${zero_base ? '14400' : self_assessed_level && ['B2', 'C1'].includes(self_assessed_level) ? '7200' : '10800'} / ${Math.min(180, (daily_minutes_pref || 60) * 1.5) * Math.min(6, (study_days_per_week || 5) + 1)}) = ${Math.ceil((zero_base ? 14400 : self_assessed_level && ['B2', 'C1'].includes(self_assessed_level) ? 7200 : 10800) / (Math.min(180, (daily_minutes_pref || 60) * 1.5) * Math.min(6, (study_days_per_week || 5) + 1)))}周

**请确认你理解了这些计算结果，然后在JSON中使用这些计算出的准确周数，严禁使用16或其他硬编码值！**`;
};

export const QUICK_TEST_PROMPT_TEMPLATE = `请为英语学习者生成7道快速测试题，用于评估当前英语水平：

## 测试要求
1. **纯文本格式**：不要使用加粗、斜体等格式
2. **难度递进**：从简单到复杂，覆盖不同水平
3. **实用性强**：题目贴近实际使用场景
4. **文化中性**：避免敏感话题，适合中文文化环境

## 题目类型
- 词汇理解：选择正确的词汇填空
- 语法应用：选择正确的语法结构
- 阅读理解：基于短文回答问题
- 情景对话：选择合适的表达方式

## 输出格式
\`\`\`json
{
  "questions": [
    {
      "id": 1,
      "type": "vocabulary|grammar|reading|dialogue",
      "question": "题目内容（纯文本）",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correct_answer": "A|B|C|D",
      "explanation": "答案解释"
    }
  ],
  "answer_key": {
    "1": "A",
    "2": "B",
    "3": "C",
    "4": "D",
    "5": "A",
    "6": "B",
    "7": "C"
  }
}
\`\`\`

## 难度分布
- 题目1-2：基础水平（Pre-A, A1-）
- 题目3-4：初级水平（A1, A1+）
- 题目5-6：中级水平（A2-, A2, A2+）
- 题目7：中高级水平（B1-）

请确保题目不包含任何格式提示，避免泄露答案。`;