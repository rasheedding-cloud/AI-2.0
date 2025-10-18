/**
 * QuickPlacement 题库合同测试
 * 验证题库数据结构和契约合规性
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  validateQBankContract,
  ObjectiveItemSchema,
  SceneAnchorSchema,
  QB_CONFIG_SCHEMA
} from '../qb_schema';

// 模拟导入题库数据（在实际环境中会从 qb_bank.ts 导入）
import { OBJECTIVES, SCENE_ANCHORS } from '../qb_bank';

describe('QuickPlacement 题库合同测试', () => {
  describe('OBJECTIVES 契约测试', () => {
    it('应该至少有2题计分题目', () => {
      const objectives = Object.values(OBJECTIVES);
      const scoredCount = objectives.filter(item => item.scored === true).length;

      expect(scoredCount).toBeGreaterThanOrEqual(
        QB_CONFIG_SCHEMA.OBJECTIVES.MIN_SCORED_COUNT,
        `计分题目数量不足: ${scoredCount} < ${QB_CONFIG_SCHEMA.OBJECTIVES.MIN_SCORED_COUNT}`
      );
    });

    it('每题应该恰好有4个选项(a/b/c/d)', () => {
      Object.values(OBJECTIVES).forEach((item, index) => {
        const options = Object.keys(item.options);
        expect(options).toHaveLength(4);
        expect(options).toContain('a');
        expect(options).toContain('b');
        expect(options).toContain('c');
        expect(options).toContain('d');

        // 选项文本非空
        Object.values(item.options).forEach((option, optIndex) => {
          expect(option.zh).toBeTruthy();
          expect(option.zh).not.toBe('');
          expect(option.en).toBeTruthy();
          expect(option.en).not.toBe('');
          expect(option.ar).toBeTruthy();
          expect(option.ar).not.toBe('');
        });
      });
    });

    it('听力题应该包含transcript_en', () => {
      Object.values(OBJECTIVES).forEach((item, index) => {
        if (item.id.startsWith('listening')) {
          expect(item.transcript_en).toBeTruthy();
          expect(item.transcript_en).not.toBe('');
          expect(typeof item.transcript_en).toBe('string');
        }
      });
    });

    it('阅读题应该包含passage_en和question_en', () => {
      Object.values(OBJECTIVES).forEach((item, index) => {
        if (item.id.startsWith('reading')) {
          expect(item.passage_en).toBeTruthy();
          expect(item.passage_en).not.toBe('');
          expect(item.question_en).toBeTruthy();
          expect(item.question_en).not.toBe('');
        }
      });
    });

    it('正确答案必须在a/b/c/d范围内', () => {
      Object.values(OBJECTIVES).forEach((item, index) => {
        expect(['a', 'b', 'c', 'd']).toContain(item.correct);
        expect(typeof item.correct).toBe('string');
      });
    });

    it('应该通过完整的ObjectiveItemSchema校验', () => {
      Object.values(OBJECTIVES).forEach((item, index) => {
        expect(() => ObjectiveItemSchema.parse(item)).not.toThrow();
        const validated = ObjectiveItemSchema.parse(item);
        expect(validated).toBeDefined();
        expect(validated.id).toBe(item.id);
      });
    });

    it('题目类型分布应该合理', () => {
      const objectives = Object.values(OBJECTIVES);
      const listeningCount = objectives.filter(item => item.transcript_en).length;
      const readingCount = objectives.filter(item => item.passage_en).length;

      expect(listeningCount + readingCount).toBe(objectives.length);
      expect(listeningCount).toBeGreaterThan(0);
      expect(readingCount).toBeGreaterThan(0);
    });
  });

  describe('SCENE_ANCHORS 契约测试', () => {
    it('应该有足够的A1场景锚点(>=4)', () => {
      const a1Count = SCENE_ANCHORS.filter(anchor => anchor.band_hint === 'A1').length;
      expect(a1Count).toBeGreaterThanOrEqual(
        QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_A1_COUNT,
        `A1场景锚点数量不足: ${a1Count} < ${QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_A1_COUNT}`
      );
    });

    it('应该有足够的A2场景锚点(>=6)', () => {
      const a2Count = SCENE_ANCHORS.filter(anchor => anchor.band_hint === 'A2').length;
      expect(a2Count).toBeGreaterThanOrEqual(
        QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_A2_COUNT,
        `A2场景锚点数量不足: ${a2Count} < ${QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_A2_COUNT}`
      );
    });

    it('应该有足够的B1-场景锚点(>=6)', () => {
      const b1MinusCount = SCENE_ANCHORS.filter(anchor => anchor.band_hint === 'B1-').length;
      expect(b1MinusCount).toBeGreaterThanOrEqual(
        QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_B1_MINUS_COUNT,
        `B1-场景锚点数量不足: ${b1MinusCount} < ${QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_B1_MINUS_COUNT}`
      );
    });

    it('每条锚点应该包含完整的三语种描述', () => {
      SCENE_ANCHORS.forEach((anchor, index) => {
        // 中文
        expect(anchor.zh).toBeTruthy();
        expect(anchor.zh).not.toBe('');
        expect(typeof anchor.zh).toBe('string');

        // 英文
        expect(anchor.en).toBeTruthy();
        expect(anchor.en).not.toBe('');
        expect(typeof anchor.en).toBe('string');

        // 阿拉伯语
        expect(anchor.ar).toBeTruthy();
        expect(anchor.ar).not.toBe('');
        expect(typeof anchor.ar).toBe('string');
      });
    });

    it('技能类型应该在l/s/r/w范围内', () => {
      SCENE_ANCHORS.forEach((anchor, index) => {
        expect(['l', 's', 'r', 'w']).toContain(anchor.skill);
        expect(typeof anchor.skill).toBe('string');
      });
    });

    it('轨道标签应该在有效范围内', () => {
      SCENE_ANCHORS.forEach((anchor, index) => {
        anchor.tracks.forEach(track => {
          expect(['work', 'travel', 'study', 'daily']).toContain(track);
        });
        expect(Array.isArray(anchor.tracks)).toBe(true);
        expect(anchor.tracks.length).toBeGreaterThan(0);
      });
    });

    it('应该通过完整的SceneAnchorSchema校验', () => {
      SCENE_ANCHORS.forEach((anchor, index) => {
        expect(() => SceneAnchorSchema.parse(anchor)).not.toThrow();
        const validated = SceneAnchorSchema.parse(anchor);
        expect(validated).toBeDefined();
        expect(validated.id).toBe(anchor.id);
      });
    });

    it('锚点ID应该唯一且有意义', () => {
      const ids = SCENE_ANCHORS.map(anchor => anchor.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids).toHaveLength(uniqueIds.length, '锚点ID必须唯一');

      // ID格式验证
      ids.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id).not.toBe('');
        expect(id).toMatch(/^[a-z0-9_]+$/, `锚点ID格式无效: ${id}`);
      });
    });

    it('难度提示应该在有效范围内', () => {
      SCENE_ANCHORS.forEach((anchor, index) => {
        expect(['A1', 'A2', 'B1-']).toContain(anchor.band_hint);
        expect(typeof anchor.band_hint).toBe('string');
      });
    });
  });

  describe('题库契约完整性测试', () => {
    it('完整的题库契约应该通过校验', () => {
      const result = validateQBankContract(OBJECTIVES, SCENE_ANCHORS);

      expect(result.errors).toHaveLength(0);
      expect(result.objectives).toBeDefined();
      expect(result.sceneAnchors).toBeDefined();
      expect(result.objectives.length).toBe(Object.keys(OBJECTIVES).length);
      expect(result.sceneAnchors.length).toBe(SCENE_ANCHORS.length);
    });

    it('题库统计数据应该准确', () => {
      const objectives = Object.values(OBJECTIVES);
      const anchors = SCENE_ANCHORS;

      const stats = {
        objectives: {
          total: objectives.length,
          scored: objectives.filter(o => o.scored).length,
          listening: objectives.filter(o => o.transcript_en).length,
          reading: objectives.filter(o => o.passage_en).length
        },
        anchors: {
          total: anchors.length,
          A1: anchors.filter(a => a.band_hint === 'A1').length,
          A2: anchors.filter(a => a.band_hint === 'A2').length,
          'B1-': anchors.filter(a => a.band_hint === 'B1-').length
        }
      };

      // 验证统计准确性
      expect(stats.objectives.total).toBeGreaterThan(0);
      expect(stats.objectives.scored).toBeGreaterThanOrEqual(2);
      expect(stats.anchors.total).toBeGreaterThan(0);
      expect(stats.anchors.A1 + stats.anchors.A2 + stats.anchors['B1-']).toBe(stats.anchors.total);

      console.log('📊 题库统计:', stats);
    });

    it('多语言覆盖应该完整', () => {
      // 检查客观题多语言覆盖
      Object.values(OBJECTIVES).forEach(item => {
        Object.values(item.options).forEach(option => {
          expect(option.zh).toBeTruthy();
          expect(option.en).toBeTruthy();
          expect(option.ar).toBeTruthy();

          // 检查非空和有效长度
          expect(option.zh.trim()).not.toBe('');
          expect(option.en.trim()).not.toBe('');
          expect(option.ar.trim()).not.toBe('');
        });
      });

      // 检查场景锚点多语言覆盖
      SCENE_ANCHORS.forEach(anchor => {
        expect(anchor.zh.trim()).not.toBe('');
        expect(anchor.en.trim()).not.toBe('');
        expect(anchor.ar.trim()).not.toBe('');
      });
    });
  });

  describe('边界条件和异常情况测试', () => {
    it('应该能检测缺失的必需字段', () => {
      const invalidObjective = {
        id: "test_invalid",
        // 缺少 required 字段
        options: { a: { zh: "test" } }
      };

      expect(() => ObjectiveItemSchema.parse(invalidObjective)).toThrow();
    });

    it('应该能检测错误的选项格式', () => {
      const invalidObjective = {
        id: "test_invalid",
        scored: true,
        options: {
          a: { zh: "test", en: "test", ar: "test" },
          b: { zh: "test", en: "test", ar: "test" }
          // 缺少 c, d
        }
      };

      expect(() => ObjectiveItemSchema.parse(invalidObjective)).toThrow();
    });

    it('应该能检测错误的难度提示', () => {
      const invalidAnchor = {
        id: "test_invalid",
        band_hint: "INVALID", // 错误的难度提示
        tracks: ["work"],
        skill: "s",
        zh: "test",
        en: "test",
        ar: "test"
      };

      expect(() => SceneAnchorSchema.parse(invalidAnchor)).toThrow();
    });
  });

  describe('防泄题规则测试', () => {
    it('正确答案不应该出现在选项文本中', () => {
      Object.values(OBJECTIVES).forEach(item => {
        const correctAnswer = item.correct;
        const correctOption = item.options[correctAnswer];

        // 确保正确答案选项不包含明显的答案标识
        expect(correctOption.zh.toLowerCase()).not.toContain('正确');
        expect(correctOption.zh.toLowerCase()).not.toContain('答案');
        expect(correctOption.en.toLowerCase()).not.toContain('correct');
        expect(correctOption.en.toLowerCase()).not.toContain('answer');
        expect(correctOption.ar).not.toContain('صحيح');
        expect(correctOption.ar).not.toContain('إجابة');
      });
    });

    it('题目ID不应该泄露答案信息', () => {
      Object.values(OBJECTIVES).forEach(item => {
        const id = item.id.toLowerCase();
        const correctAnswer = item.correct;

        // 确保ID中不包含正确答案标识
        expect(id).not.toContain(correctAnswer);
        expect(id).not.toContain('answer');
        expect(id).not.toContain('correct');
      });
    });
  });
});