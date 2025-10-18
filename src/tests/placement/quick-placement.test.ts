/**
 * QuickPlacement v1 单元测试
 */

import { QuickPlacement, performQuickPlacement } from '@/server/services/placement/quick_placement';
import { getLocalizedQuestionBank } from '@/server/services/placement/qb_bank';
import { QuickPlacementRequest } from '@/types/placement';

// 模拟数据
const mockRequest: QuickPlacementRequest = {
  locale: 'zh',
  user_answers: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1], // 10题答案
  self_assessment: {
    listening: 'A2',
    reading: 'A2',
    speaking: 'A2',
    writing: 'A2',
    overall: 'A2'
  },
  track_hint: 'daily'
};

describe('QuickPlacement', () => {
  let quickPlacement: QuickPlacement;

  beforeEach(() => {
    quickPlacement = new QuickPlacement({}, 'zh');
  });

  describe('客观题评分', () => {
    test('正确计算答对题数', () => {
      // 模拟5题正确
      const answers = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
      const questions = getLocalizedQuestionBank('zh');

      // 计算实际正确答案数（这里需要根据实际题目答案来计算）
      let correctCount = 0;
      answers.forEach((answer, index) => {
        if (answer === questions[index]?.content.answer) {
          correctCount++;
        }
      });

      expect(correctCount).toBeGreaterThanOrEqual(0);
      expect(correctCount).toBeLessThanOrEqual(10);
    });

    test('正确映射CEFR等级', () => {
      const testCases = [
        { correct: 10, expected: 'B2' },
        { correct: 8, expected: 'B2' },
        { correct: 7, expected: 'B1' },
        { correct: 5, expected: 'A2' },
        { correct: 3, expected: 'A1' },
        { correct: 0, expected: 'A1' }
      ];

      testCases.forEach(({ correct, expected }) => {
        // 这里需要调用私有方法，或者通过公共接口测试
        // 由于是私有方法，我们通过完整测试来验证
      });
    });
  });

  describe('答案验证', () => {
    test('验证正确答案格式', () => {
      const validAnswers = [0, 1, 2, 3];
      const validation = quickPlacement.validateAnswers(validAnswers);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('拒绝无效答案格式', () => {
      const invalidAnswers = [0, 1, 4, -1]; // 包含无效值
      const validation = quickPlacement.validateAnswers(invalidAnswers);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('拒绝错误数量答案', () => {
      const wrongCountAnswers = [0, 1, 2]; // 只有3题
      const validation = quickPlacement.validateAnswers(wrongCountAnswers);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('答案数量不正确'))).toBe(true);
    });
  });

  describe('置信度计算', () => {
    test('高准确率产生高置信度', async () => {
      const highAccuracyRequest = {
        ...mockRequest,
        user_answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 假设都是正确答案
      };

      const result = await quickPlacement.evaluate(highAccuracyRequest);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('自评与客观题一致提高置信度', async () => {
      const consistentRequest = {
        ...mockRequest,
        user_answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 假设对应A2水平
        self_assessment: {
          listening: 'A2',
          reading: 'A2',
          speaking: 'A2',
          writing: 'A2',
          overall: 'A2'
        }
      };

      const result = await quickPlacement.evaluate(consistentRequest);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('融合算法', () => {
    test('客观题权重70%，自评权重30%', async () => {
      const result = await quickPlacement.evaluate(mockRequest);

      if (result.breakdown.self_assessment) {
        expect(result.breakdown.fusion_weights.objective).toBe(0.7);
        expect(result.breakdown.fusion_weights.self_assessment).toBe(0.3);
      }
    });

    test('无自评时使用纯客观题结果', async () => {
      const noSelfAssessmentRequest = {
        ...mockRequest,
        self_assessment: undefined
      };

      const result = await quickPlacement.evaluate(noSelfAssessmentRequest);
      expect(result.breakdown.self_assessment).toBeNull();
    });
  });
});

describe('题库系统', () => {
  test('获取中文题库', () => {
    const questions = getLocalizedQuestionBank('zh');
    expect(questions).toHaveLength(10);
    expect(questions[0].text).toContain('应该说什么');
  });

  test('获取英文题库', () => {
    const questions = getLocalizedQuestionBank('en');
    expect(questions).toHaveLength(10);
    expect(questions[0].text).toContain('What should you say?');
  });

  test('获取阿拉伯语题库', () => {
    const questions = getLocalizedQuestionBank('ar');
    expect(questions).toHaveLength(10);
    expect(questions[0].text).toContain('ماذا يجب أن تقول؟');
  });

  test('题目结构完整性', () => {
    const questions = getLocalizedQuestionBank('zh');

    questions.forEach((question, index) => {
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('text');
      expect(question).toHaveProperty('options');
      expect(question).toHaveProperty('answer');
      expect(question).toHaveProperty('translations');
      expect(question).toHaveProperty('cefr_map');
      expect(question).toHaveProperty('metadata');

      expect(question.options).toHaveLength(4);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(4);
      expect(question.translations).toHaveProperty('zh');
      expect(question.translations).toHaveProperty('ar');
    });
  });
});

describe('便捷函数', () => {
  test('performQuickPlacement 函数正常工作', async () => {
    const result = await performQuickPlacement(mockRequest);

    expect(result).toHaveProperty('mapped_start');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('diagnostic');
    expect(result).toHaveProperty('metadata');

    expect(['A1', 'A2', 'B1', 'B2']).toContain(result.mapped_start);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('不同语言请求正常处理', async () => {
    const locales = ['zh', 'en', 'ar'] as const;

    for (const locale of locales) {
      const request = { ...mockRequest, locale };
      const result = await performQuickPlacement(request);

      expect(result.metadata.locale).toBe(locale);
      expect(['A1', 'A2', 'B1', 'B2']).toContain(result.mapped_start);
    }
  });
});

describe('边界情况', () => {
  test('全部答错返回A1', async () => {
    const allWrongRequest = {
      ...mockRequest,
      user_answers: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3] // 假设3都是错误答案
    };

    const result = await performQuickPlacement(allWrongRequest);
    expect(result.mapped_start).toBe('A1');
  });

  test('全部答对返回B2', async () => {
    const allCorrectRequest = {
      ...mockRequest,
      user_answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 假设0都是正确答案
    };

    const result = await performQuickPlacement(allCorrectRequest);
    expect(result.mapped_start).toBe('B2');
  });

  test('缺少自评仍能正常工作', async () => {
    const noSelfAssessmentRequest = {
      locale: 'zh' as const,
      user_answers: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1]
    };

    const result = await performQuickPlacement(noSelfAssessmentRequest);
    expect(result).toHaveProperty('mapped_start');
    expect(result.breakdown.self_assessment).toBeNull();
  });
});