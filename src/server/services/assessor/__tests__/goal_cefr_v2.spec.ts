/**
 * Goal→CEFR Assessor v2 测试
 */

import { assessGoalCEFRv2, GoalAssessInput, GoalAssessOutput } from '../goal_cefr_v2';
import { LLMAdapter } from '@/lib/llm/adapter';

// Mock LLM Adapter
class MockLLMAdapter implements LLMAdapter {
  constructor(private responses: Record<string, any>) {}

  async chat<TOut = string>(opts: {
    system?: string;
    prompt: string;
    temperature?: number;
  }): Promise<TOut> {
    // 根据prompt返回不同的mock响应
    const prompt = opts.prompt.toLowerCase();

    if (prompt.includes('职场') && prompt.includes('口头更新')) {
      return this.responses.workPresentation as TOut;
    } else if (prompt.includes('旅行') && prompt.includes('投诉')) {
      return this.responses.travelComplaint as TOut;
    } else if (prompt.includes('学习') && prompt.includes('展示')) {
      return this.responses.studyPresentation as TOut;
    } else if (prompt.includes('会议') && prompt.includes('自我介绍')) {
      return this.responses.meetingIntro as TOut;
    }

    // 默认响应
    return this.responses.default as TOut;
  }
}

describe('Goal→CEFR Assessor v2', () => {
  let mockAdapter: MockLLMAdapter;
  let mockResponses: Record<string, any>;

  beforeEach(() => {
    mockResponses = {
      workPresentation: JSON.stringify({
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
        evidence_phrases: ["口头更新", "确认邮件", "工作进展"],
        ambiguity_flags: [],
        domain_risk: "low",
        safety_margin: 0.0
      }),

      travelComplaint: JSON.stringify({
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
      }),

      studyPresentation: JSON.stringify({
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
        evidence_phrases: ["展示", "回答提问", "给出理由"],
        ambiguity_flags: [],
        domain_risk: "low",
        safety_margin: 0.0
      }),

      meetingIntro: JSON.stringify({
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
      }),

      default: JSON.stringify({
        ui_target_label: "通用英语提升",
        track_scores: [
          {track: "daily", score: 0.6},
          {track: "work", score: 0.4}
        ],
        target_band_primary: "A2",
        alternatives: [
          {band: "A2-", confidence: 0.9, label: "保守目标"},
          {band: "A2+", confidence: 0.5, label: "进取目标"}
        ],
        confidence_primary: 0.7,
        rationale: "基于目标描述的通用评估结果",
        evidence_phrases: ["目标分析"],
        ambiguity_flags: ["insufficient_detail"],
        domain_risk: "low",
        safety_margin: 0.0
      })
    };

    mockAdapter = new MockLLMAdapter(mockResponses);
  });

  describe('职场汇报场景', () => {
    test('应该正确识别B1-级别', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "职场60-90秒口头更新工作进展，以及6-8句确认邮件",
        self_assessed_level: "A2",
        identity: "working_adult",
        native_language: "zh",
        cultural_mode: "none"
      };

      const result = await assessGoalCEFRv2(input, mockAdapter);

      expect(result.target_band_primary).toBe("B1-");
      expect(result.track_scores[0].track).toBe("work");
      expect(result.track_scores[0].score).toBeGreaterThan(0.8);
      expect(result.confidence_primary).toBeGreaterThan(0.8);
      expect(result.rationale).toContain("口头汇报");
      expect(result.evidence_phrases).toContain("口头更新");
    });

    test('应该生成合理的备选方案', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "职场60-90秒口头更新工作进展",
        self_assessed_level: "A2",
        identity: "working_adult"
      };

      const result = await assessGoalCEFRv2(input, mockAdapter);

      expect(result.alternatives).toHaveLength(2);
      expect(result.alternatives[0].band).toBe("A2+");
      expect(result.alternatives[0].label).toBe("保守目标");
      expect(result.alternatives[1].band).toBe("B1");
      expect(result.alternatives[1].label).toBe("进取目标");
    });
  });

  describe('旅行交流场景', () => {
    test('应该正确识别A2+级别', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "旅行中处理投诉、退改签、问询等，不超过3步任务",
        self_assessed_level: "A2",
        identity: "working_adult"
      };

      const result = await assessGoalCEFRv2(input, mockAdapter);

      expect(result.target_band_primary).toBe("A2+");
      expect(result.track_scores[0].track).toBe("travel");
      expect(result.evidence_phrases).toContain("投诉");
      expect(result.evidence_phrases).toContain("3步任务");
    });
  });

  describe('学术展示场景', () => {
    test('应该正确识别B1-级别', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "学习：1分钟小展示，能够回答提问并给出理由",
        self_assessed_level: "A2",
        identity: "university"
      };

      const result = await assessGoalCEFRv2(input, mockAdapter);

      expect(result.target_band_primary).toBe("B1-");
      expect(result.track_scores[0].track).toBe("study");
      expect(result.rationale).toContain("展示");
      expect(result.evidence_phrases).toContain("给出理由");
    });
  });

  describe('防误触发场景', () => {
    test('会议自我介绍应该评为A2而非B1-', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "开会时做自我介绍，确认会议时间地点",
        self_assessed_level: "A1",
        identity: "working_adult"
      };

      const result = await assessGoalCEFRv2(input, mockAdapter);

      expect(result.target_band_primary).toBe("A2");
      expect(result.ambiguity_flags).toContain("mixed_intents");
      expect(result.rationale).toContain("复杂度较低");
    });
  });

  describe('多语言支持', () => {
    test('应该正确检测中文输入', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "我想学习英语，为了工作能够和外国客户交流",
        self_assessed_level: "A2",
        identity: "working_adult",
        native_language: "zh"
      };

      const result = await assessGoalCEFRv2(input, mockAdapter);

      expect(result.normalization.detected_langs).toContain('zh');
      expect(result.normalization.normalized_goal_en).toBeDefined();
    });

    test('应该正确处理英文输入', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "I want to learn English for business meetings",
        self_assessed_level: "A2",
        identity: "working_adult",
        native_language: "other"
      };

      const result = await assessGoalCEFRv2(input, mockAdapter);

      expect(result.normalization.detected_langs).toContain('en');
    });
  });

  describe('自评差距检测', () => {
    test('应该标记自评差距大的情况', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "雅思考试，目标英国高校申请",
        self_assessed_level: "A1", // 与目标B1差距大
        identity: "university"
      };

      // 使用特殊的mock响应来测试自评差距
      const specialMock = new MockLLMAdapter({
        ...mockResponses,
        special: JSON.stringify({
          ui_target_label: "雅思备考",
          track_scores: [{track: "exam", score: 0.9}],
          target_band_primary: "B1-",
          alternatives: [],
          confidence_primary: 0.85,
          rationale: "雅思备考需要较高英语水平",
          evidence_phrases: ["雅思考试"],
          ambiguity_flags: [],
          domain_risk: "low",
          safety_margin: 0.0
        })
      });

      const result = await assessGoalCEFRv2(input, specialMock);

      expect(result.ambiguity_flags).toContain("large_gap_self_assess");
    });
  });

  describe('域风险检测', () => {
    test('应该标记高风险领域', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "医疗行业的国际会议报告和法律文件翻译",
        self_assessed_level: "B1",
        identity: "working_adult"
      };

      const result = await assessGoalCEFRv2(input, mockAdapter);

      expect(result.domain_risk).toBe("high");
    });
  });

  describe('稳定性测试', () => {
    test('相同输入多次评估结果应该稳定', async () => {
      const input: GoalAssessInput = {
        learner_goal_free_text: "职场邮件写作和会议交流",
        self_assessed_level: "A2",
        identity: "working_adult"
      };

      const results = await Promise.all([
        assessGoalCEFRv2(input, mockAdapter),
        assessGoalCEFRv2(input, mockAdapter),
        assessGoalCEFRv2(input, mockAdapter)
      ]);

      // 所有结果应该相同
      expect(results[0].target_band_primary).toBe(results[1].target_band_primary);
      expect(results[1].target_band_primary).toBe(results[2].target_band_primary);
      expect(results[0].confidence_primary).toBe(results[1].confidence_primary);
      expect(results[1].confidence_primary).toBe(results[2].confidence_primary);
    });
  });

  describe('错误处理', () => {
    test('LLM调用失败时应该返回降级结果', async () => {
      const failingMock = {
        chat: jest.fn().mockRejectedValue(new Error('LLM failed'))
      };

      const input: GoalAssessInput = {
        learner_goal_free_text: "测试输入",
        self_assessed_level: "A2"
      };

      const result = await assessGoalCEFRv2(input, failingMock as any);

      expect(result.target_band_primary).toBe("A2");
      expect(result.confidence_primary).toBe(0.5);
      expect(result.ambiguity_flags).toContain("insufficient_detail");
    });
  });
});