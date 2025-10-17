/**
 * CEFR特征映射常量
 * 用于Goal→CEFR Assessor v2的等级判定
 * 便于日后调参和维护
 */

// CEFR微档定义
export const CEFR_BANDS = {
  'A2-': { score: 1, label: '基础生存级', description: '最简单的日常交流' },
  'A2': { score: 2, label: '基础级', description: '日常生存交流' },
  'A2+': { score: 3, label: '基础进阶级', description: '扩展日常交流' },
  'B1-': { score: 4, label: '门槛级', description: '独立交流入门' },
  'B1': { score: 5, label: '中级', description: '独立交流' }
} as const;

export type CefrBand = keyof typeof CEFR_BANDS;

// 学习轨道定义
export const TRACKS = {
  'work': { label: '职场', weight: 1.2 },
  'travel': { label: '旅行', weight: 0.8 },
  'study': { label: '学术', weight: 1.4 },
  'daily': { label: '日常', weight: 0.6 },
  'exam': { label: '考试', weight: 1.6 }
} as const;

export type Track = keyof typeof TRACKS;

// CEFR能力要素权重配置
export const CEFR_DIMENSIONS = {
  // 交际功能复杂度
  communicative_function: {
    weight: 0.25,
    levels: {
      'A2-': ['简单问候', '基本信息交换'],
      'A2': ['日常需求表达', '简单描述'],
      'A2+': ['计划安排', '观点表达'],
      'B1-': ['多步骤交流', '问题解决'],
      'B1': ['抽象话题讨论', '观点论证']
    }
  },

  // 话语长度与组织
  discourse_organization: {
    weight: 0.20,
    levels: {
      'A2-': ['单句', '简短回答'],
      'A2': ['连贯句群', '简单叙述'],
      'A2+': ['段落表达', '逻辑连接'],
      'B1-': ['结构化叙述', '观点展开'],
      'B1': ['复杂论述', '逻辑论证']
    }
  },

  // 任务步骤复杂度
  task_complexity: {
    weight: 0.20,
    levels: {
      'A2-': ['单步任务'],
      'A2': ['2-3步任务'],
      'A2+': ['3-4步任务', '简单问题解决'],
      'B1-': ['多步骤任务', '信息整合'],
      'B1': ['复杂任务规划', '突发应对']
    }
  },

  // 受众与语域
  audience_register: {
    weight: 0.15,
    levels: {
      'A2-': ['熟人非正式'],
      'A2': ['日常正式'],
      'A2+': ['半正式场合'],
      'B1-': ['专业场合入门'],
      'B1': ['正式专业场合']
    }
  },

  // 准确性敏感度
  accuracy_sensitivity: {
    weight: 0.10,
    levels: {
      'A2-': ['大意理解即可'],
      'A2': ['基本准确'],
      'A2+': ['语法准确性要求'],
      'B1-': ['表达精确性'],
      'B1': ['专业术语准确性']
    }
  },

  // 文体要求
  stylistic_requirements: {
    weight: 0.10,
    levels: {
      'A2-': ['口语体'],
      'A2': ['基础书面体'],
      'A2+': ['格式化文本'],
      'B1-': ['商务写作入门'],
      'B1': ['专业文体']
    }
  }
} as const;

// 高风险行业关键词（用于domain_risk标记）
export const HIGH_RISK_DOMAINS = [
  'medical', 'healthcare', 'legal', 'finance', 'banking',
  'aviation', 'engineering', 'pharmaceutical', 'insurance',
  'audit', 'compliance', 'regulatory', 'safety'
];

// 语言检测配置
export const LANGUAGE_DETECTION = {
  // 关键词映射用于快速语言识别
  keywords: {
    'zh': ['的', '是', '我', '你', '他', '学习', '工作', '旅行', '考试'],
    'en': ['the', 'and', 'is', 'are', 'learn', 'work', 'travel', 'exam'],
    'ar': ['في', 'من', 'إلى', 'التعلم', 'العمل', 'السفر', 'الامتحان']
  },

  // 脚本特征
  scripts: {
    'zh': /[\u4e00-\u9fff]/,
    'en': /[a-zA-Z]/,
    'ar': /[\u0600-\u06ff]/
  }
};

// 模糊性标记类型
export const AMBIGUITY_FLAGS = {
  MIXED_INTENTS: 'mixed_intents',           // 混合意图
  INSUFFICIENT_DETAIL: 'insufficient_detail', // 细节不足
  LARGE_GAP_SELF_ASSESS: 'large_gap_self_assess', // 自评差距大
  UNCLEAR_TIMEFRAME: 'unclear_timeframe',   // 时间不明确
  MULTIPLE_DOMAINS: 'multiple_domains'       // 多领域
} as const;

export type AmbiguityFlag = typeof AMBIGUITY_FLAGS[keyof typeof AMBIGUITY_FLAGS];

// 默认配置
export const DEFAULT_CONFIG = {
  confidence_threshold: 0.7,      // 置信度阈值
  safety_margin: 0.0,             // 安全边际
  max_alternatives: 2,            // 最大备选方案数
  shadow_log_enabled: true        // 影子日志开关
} as const;

// 提示词模板
export const ASSESSMENT_PROMPT_TEMPLATE = `
你是一位CEFR英语能力评估专家。请根据学员目标描述，精准判定所需的CEFR微档等级。

学员信息：
- 学习目标：{goal_text}
- 当前自评：{self_assessed_level}
- 身份：{identity}
- 母语：{native_language}
- 文化模式：{cultural_mode}

评估要求：
1. 识别核心学习轨道（work/travel/study/daily/exam）
2. 基于交际功能、话语组织、任务复杂度等维度综合评分
3. 输出主要目标微档（A2-到B1）
4. 提供2个备选方案（保守/进取）
5. 给出置信度和详细理由

避免机械关键词匹配，重点关注实际交际需求复杂度。

输出格式：严格JSON
{
  "ui_target_label": "目标标签",
  "track_scores": [...],
  "target_band_primary": "主要微档",
  "alternatives": [...],
  "confidence_primary": 置信度,
  "rationale": "详细理由",
  "evidence_phrases": ["证据短语"],
  "ambiguity_flags": ["标记"],
  "domain_risk": "风险等级",
  "safety_margin": 0.0,
  "normalization": {...}
}
`;

// Few-shot示例
export const FEW_SHOT_EXAMPLES = [
  {
    input: {
      goal_text: "职场60-90秒口头更新工作进展，以及6-8句确认邮件",
      self_assessed_level: "A2",
      identity: "working_adult"
    },
    output: {
      ui_target_label: "职场汇报",
      track_scores: [
        {track: "work", score: 0.85},
        {track: "daily", score: 0.15}
      ],
      target_band_primary: "B1-",
      alternatives: [
        {band: "A2+", confidence: 0.8, label: "保守目标"},
        {band: "B1", confidence: 0.6, label: "进取目标"}
      ],
      confidence_primary: 0.82,
      rationale: "需要结构化口头汇报和专业邮件写作能力，涉及多步骤信息组织",
      evidence_phrases: ["60-90秒口头更新", "6-8句确认邮件", "工作进展"],
      ambiguity_flags: [],
      domain_risk: "low",
      safety_margin: 0.0
    }
  },
  {
    input: {
      goal_text: "旅行中处理投诉、退改签、问询等，不超过3步任务",
      self_assessed_level: "A2",
      identity: "working_adult"
    },
    output: {
      ui_target_label: "旅行交流",
      track_scores: [
        {track: "travel", score: 0.90},
        {track: "daily", score: 0.10}
      ],
      target_band_primary: "A2+",
      alternatives: [
        {band: "A2", confidence: 0.85, label: "保守目标"},
        {band: "B1-", confidence: 0.65, label: "进取目标"}
      ],
      confidence_primary: 0.88,
      rationale: "处理旅行中的实际问题，需要3步以内的任务执行能力",
      evidence_phrases: ["投诉", "退改签", "问询", "3步任务"],
      ambiguity_flags: [],
      domain_risk: "low",
      safety_margin: 0.0
    }
  },
  {
    input: {
      goal_text: "学习：1分钟小展示，能够回答提问并给出理由",
      self_assessed_level: "A2",
      identity: "university"
    },
    output: {
      ui_target_label: "学术展示",
      track_scores: [
        {track: "study", score: 0.80},
        {track: "daily", score: 0.20}
      ],
      target_band_primary: "B1-",
      alternatives: [
        {band: "A2+", confidence: 0.75, label: "保守目标"},
        {band: "B1", confidence: 0.55, label: "进取目标"}
      ],
      confidence_primary: 0.78,
      rationale: "需要简短展示能力和即兴问答，涉及观点表达和论证",
      evidence_phrases: ["1分钟展示", "回答提问", "给出理由"],
      ambiguity_flags: [],
      domain_risk: "low",
      safety_margin: 0.0
    }
  },
  {
    input: {
      goal_text: "开会时做自我介绍，确认会议时间地点",
      self_assessed_level: "A1",
      identity: "working_adult"
    },
    output: {
      ui_target_label: "基础职场",
      track_scores: [
        {track: "work", score: 0.40},
        {track: "daily", score: 0.60}
      ],
      target_band_primary: "A2",
      alternatives: [
        {band: "A2-", confidence: 0.9, label: "保守目标"},
        {band: "A2+", confidence: 0.4, label: "进取目标"}
      ],
      confidence_primary: 0.85,
      rationale: "虽然涉及会议场景，但实际需求为基础自我介绍和信息确认，复杂度较低",
      evidence_phrases: ["自我介绍", "确认时间地点"],
      ambiguity_flags: ["mixed_intents"],
      domain_risk: "low",
      safety_margin: 0.0
    }
  }
];