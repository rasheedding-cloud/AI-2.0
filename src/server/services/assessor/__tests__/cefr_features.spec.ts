/**
 * CEFR特征映射测试
 */

import {
  CEFR_BANDS,
  TRACKS,
  CEFR_DIMENSIONS,
  HIGH_RISK_DOMAINS,
  LANGUAGE_DETECTION,
  AMBIGUITY_FLAGS,
  DEFAULT_CONFIG
} from '../cefr_features';

describe('CEFR Features', () => {
  describe('CEFR_BANDS', () => {
    test('应该包含所有需要的微档', () => {
      const expectedBands = ['A2-', 'A2', 'A2+', 'B1-', 'B1'];
      const actualBands = Object.keys(CEFR_BANDS);

      expectedBands.forEach(band => {
        expect(actualBands).toContain(band);
      });
    });

    test('微档应该有递增的分数', () => {
      const bands = Object.keys(CEFR_BANDS) as Array<keyof typeof CEFR_BANDS>;

      for (let i = 1; i < bands.length; i++) {
        const prevScore = CEFR_BANDS[bands[i - 1]].score;
        const currScore = CEFR_BANDS[bands[i]].score;
        expect(currScore).toBeGreaterThan(prevScore);
      }
    });
  });

  describe('TRACKS', () => {
    test('应该包含所有学习轨道', () => {
      const expectedTracks = ['work', 'travel', 'study', 'daily', 'exam'];
      const actualTracks = Object.keys(TRACKS);

      expectedTracks.forEach(track => {
        expect(actualTracks).toContain(track);
      });
    });

    test('每个轨道应该有权重', () => {
      Object.values(TRACKS).forEach(track => {
        expect(track.weight).toBeGreaterThan(0);
        expect(typeof track.weight).toBe('number');
      });
    });
  });

  describe('CEFR_DIMENSIONS', () => {
    test('每个维度应该有权重', () => {
      Object.values(CEFR_DIMENSIONS).forEach(dimension => {
        expect(dimension.weight).toBeGreaterThan(0);
        expect(dimension.weight).toBeLessThanOrEqual(1);
      });
    });

    test('维度权重总和应该等于1', () => {
      const totalWeight = Object.values(CEFR_DIMENSIONS)
        .reduce((sum, dimension) => sum + dimension.weight, 0);

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    test('每个维度应该有所有微档的级别定义', () => {
      const bands = Object.keys(CEFR_BANDS);

      Object.values(CEFR_DIMENSIONS).forEach(dimension => {
        bands.forEach(band => {
          expect(dimension.levels).toHaveProperty(band);
          expect(Array.isArray(dimension.levels[band])).toBe(true);
        });
      });
    });
  });

  describe('HIGH_RISK_DOMAINS', () => {
    test('应该包含高风险行业关键词', () => {
      expect(HIGH_RISK_DOMAINS.length).toBeGreaterThan(0);
      expect(HIGH_RISK_DOMAINS).toContain('medical');
      expect(HIGH_RISK_DOMAINS).toContain('legal');
      expect(HIGH_RISK_DOMAINS).toContain('finance');
    });
  });

  describe('LANGUAGE_DETECTION', () => {
    test('应该包含多语言关键词', () => {
      expect(Object.keys(LANGUAGE_DETECTION.keywords)).toContain('zh');
      expect(Object.keys(LANGUAGE_DETECTION.keywords)).toContain('en');
      expect(Object.keys(LANGUAGE_DETECTION.keywords)).toContain('ar');
    });

    test('应该包含脚本特征', () => {
      expect(Object.keys(LANGUAGE_DETECTION.scripts)).toContain('zh');
      expect(Object.keys(LANGUAGE_DETECTION.scripts)).toContain('en');
      expect(Object.keys(LANGUAGE_DETECTION.scripts)).toContain('ar');
    });

    test('中文脚本应该能匹配中文字符', () => {
      const chineseText = '学习英语';
      expect(LANGUAGE_DETECTION.scripts.zh.test(chineseText)).toBe(true);
    });

    test('英文脚本应该能匹配英文字符', () => {
      const englishText = 'learn English';
      expect(LANGUAGE_DETECTION.scripts.en.test(englishText)).toBe(true);
    });
  });

  describe('AMBIGUITY_FLAGS', () => {
    test('应该包含所有模糊性标记类型', () => {
      const expectedFlags = [
        'mixed_intents',
        'insufficient_detail',
        'large_gap_self_assess',
        'unclear_timeframe',
        'multiple_domains'
      ];

      expectedFlags.forEach(flag => {
        expect(Object.values(AMBIGUITY_FLAGS)).toContain(flag);
      });
    });
  });

  describe('DEFAULT_CONFIG', () => {
    test('应该有合理的默认配置', () => {
      expect(DEFAULT_CONFIG.confidence_threshold).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.confidence_threshold).toBeLessThanOrEqual(1);
      expect(DEFAULT_CONFIG.safety_margin).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_CONFIG.max_alternatives).toBeGreaterThan(0);
      expect(typeof DEFAULT_CONFIG.shadow_log_enabled).toBe('boolean');
    });
  });
});