/**
 * QuickPlacement v1.1 单元测试
 * 测试三信号融合、楼梯规则和微档输出
 */

import {
  quickPlacementV1_1,
  scoreScene,
  mapObjectiveScore,
  mapSelfPrior,
  fuse,
  deriveFlags,
  buildEvidence,
  microBandToCefr
} from '@/server/services/placement/quick_placement';
import { QuickPlacementRequest } from '@/types/placement';

// 模拟数据
const mockRequest: QuickPlacementRequest = {
  locale: 'zh',
  user_answers: [0, 1, 2],
  scene_tags: ['greeting_basic', 'greeting_formal', 'shopping_direction', 'shopping_price', 'travel_navigation'],
  objective_score: 2,
  self_assessed_level: 'A2',
  track_hint: 'daily'
};

describe('QuickPlacement v1.1', () => {
  describe('场景锚点评分', () => {
    test('楼梯规则 - A1通过条件', () => {
      const result = scoreScene(['greeting_basic', 'daily_time', 'daily_number', 'greeting_formal']);

      expect(result.ladder_status.A1_passed).toBe(true);
      expect(result.ladder_status.A2_passed).toBe(true); // A1通过且有A2锚点
      expect(result.ladder_status.B1_passed).toBe(false); // B1条件不满足
    });

    test('楼梯规则 - A1未通过', () => {
      const result = scoreScene(['greeting_basic']);

      expect(result.ladder_status.A1_passed).toBe(false);
      expect(result.P_scene['A2-']).toBeGreaterThan(0.5);
    });

    test('微档细分 - A2+条件', () => {
      const result = scoreScene([
        'greeting_basic', 'daily_time', 'daily_number',  // A1锚点
        'greeting_formal', 'shopping_direction', 'shopping_price', 'travel_navigation', // A2锚点
        'travel_booking' // B1锚点
      ]);

      expect(result.ladder_status.A2_passed).toBe(true);
      expect(result.ladder_status.B1_passed).toBe(false); // B1锚点不足

      // 应该偏向A2/A2+
      expect(result.P_scene['A2'] + result.P_scene['A2+']).toBeGreaterThan(0.7);
    });

    test('B1通过条件', () => {
      const result = scoreScene([
        'greeting_basic', 'daily_time', 'daily_number',  // A1锚点
        'greeting_formal', 'shopping_direction', 'shopping_price', 'travel_navigation', // A2锚点
        'travel_booking', 'work_email', 'work_meeting' // B1锚点
      ]);

      expect(result.ladder_status.B1_passed).toBe(true);
      expect(result.P_scene['B1-']).toBeGreaterThan(0.5);
    });

    test('证据收集', () => {
      const sceneTags = ['greeting_formal', 'travel_booking', 'work_email', 'academic_reading'];
      const result = scoreScene(sceneTags);

      expect(result.evidence).toContain('greeting_formal');
      expect(result.evidence).toContain('travel_booking');
      expect(result.evidence).toContain('work_email');
      expect(result.evidence).toContain('academic_reading');
    });
  });

  describe('客观题映射', () => {
    test('0分映射', () => {
      const result = mapObjectiveScore(0);

      expect(result['A2-']).toBeGreaterThan(result['A2']);
      expect(result['B1-']).toBe(0);
      expect(result['B1']).toBe(0);
    });

    test('3分映射', () => {
      const result = mapObjectiveScore(3);

      expect(result['B1-']).toBeGreaterThan(0.4);
      expect(result['B1']).toBeGreaterThan(0.1);
      expect(result['A2-']).toBe(0);
    });

    test('概率分布总和为1', () => {
      for (let score = 0; score <= 3; score++) {
        const result = mapObjectiveScore(score);
        const total = Object.values(result).reduce((sum, val) => sum + val, 0);
        expect(total).toBeCloseTo(1, 0.01);
      }
    });
  });

  describe('自评先验', () => {
    test('A1自评偏向A2-', () => {
      const result = mapSelfPrior('A1');

      expect(result['A2-']).toBeGreaterThan(0.5);
      expect(result['B1-']).toBe(0);
      expect(result['B1']).toBe(0);
    });

    test('B1自评偏向B1-', () => {
      const result = mapSelfPrior('B1');

      expect(result['B1-']).toBeGreaterThan(0.4);
      expect(result['B1']).toBeGreaterThan(0.1);
      expect(result['A2-']).toBe(0);
    });

    test('无自评返回均匀分布', () => {
      const result = mapSelfPrior(null);

      Object.values(result).forEach(val => {
        expect(val).toBe(0.2);
      });
    });
  });

  describe('三信号融合', () => {
    const mockScene = {
      P_scene: { 'A2-': 0.2, 'A2': 0.4, 'A2+': 0.3, 'B1-': 0.1, 'B1': 0 },
      ladder_status: { A1_passed: true, A2_passed: true, B1_passed: false },
      evidence: []
    };

    const mockObj = { 'A2-': 0.1, 'A2': 0.2, 'A2+': 0.3, 'B1-': 0.3, 'B1': 0.1 };
    const mockSelf = { 'A2-': 0.2, 'A2': 0.5, 'A2+': 0.2, 'B1-': 0.1, 'B1': 0 };

    test('有客观题时权重为Scene(0.6) + Obj(0.3) + Self(0.1)', () => {
      const result = fuse(mockScene.P_scene, mockObj, mockSelf, true);

      // 验证权重应用
      expect(result['A2']).toBeCloseTo(0.6 * 0.4 + 0.3 * 0.2 + 0.1 * 0.5, 0.01);
      expect(result['A2+']).toBeCloseTo(0.6 * 0.3 + 0.3 * 0.3 + 0.1 * 0.2, 0.01);
    });

    test('无客观题时权重为Scene(0.8) + Self(0.2)', () => {
      const result = fuse(mockScene.P_scene, mockObj, mockSelf, false);

      // 验证权重应用
      expect(result['A2']).toBeCloseTo(0.8 * 0.4 + 0.2 * 0.5, 0.01);
      expect(result['A2+']).toBeCloseTo(0.8 * 0.3 + 0.2 * 0.2, 0.01);
    });

    test('概率分布归一化', () => {
      const result = fuse(mockScene.P_scene, mockObj, mockSelf, true);
      const total = Object.values(result).reduce((sum, val) => sum + val, 0);
      expect(total).toBeCloseTo(1, 0.01);
    });
  });

  describe('Flags生成', () => {
    test('insufficient_data flag', () => {
      const scene = scoreScene(['greeting_basic']); // 只有1个锚点
      const flags = deriveFlags({
        scene,
        objScore: 1,
        selfLevel: 'A2',
        P: { 'A2-': 0.3, 'A2': 0.4, 'A2+': 0.2, 'B1-': 0.1, 'B1': 0 },
        mapped: 'A2'
      });

      expect(flags).toContain('insufficient_data');
    });

    test('conflict_obj_scene flag', () => {
      const scene = scoreScene(['travel_booking', 'work_email', 'work_meeting']); // 偏向B1的场景
      const flags = deriveFlags({
        scene,
        objScore: 0, // 客观题0分
        selfLevel: 'A2',
        P: { 'A2-': 0.2, 'A2': 0.2, 'A2+': 0.3, 'B1-': 0.3, 'B1': 0 },
        mapped: 'B1-'
      });

      expect(flags).toContain('conflict_obj_scene');
    });

    test('self_gap_gt1band flag', () => {
      const scene = scoreScene(['greeting_basic', 'greeting_formal', 'shopping_direction']);
      const flags = deriveFlags({
        scene,
        objScore: 2,
        selfLevel: 'B1', // 自评B1，但结果A2+
        P: { 'A2-': 0.1, 'A2': 0.2, 'A2+': 0.6, 'B1-': 0.1, 'B1': 0 },
        mapped: 'A2+'
      });

      expect(flags).toContain('self_gap_gt1band');
    });
  });

  describe('证据短语生成', () => {
    test('优先锚点选择', () => {
      const sceneTags = ['greeting_formal', 'travel_booking', 'work_email', 'shopping_direction', 'daily_time'];
      const evidence = buildEvidence({ sceneTags });

      expect(evidence).toContain('正式问候');
      expect(evidence).toContain('旅行预订');
      expect(evidence).toContain('工作邮件');
      expect(evidence).toContain('购物问路');
      expect(evidence.length).toBeLessThanOrEqual(6);
    });

    test('空场景处理', () => {
      const evidence = buildEvidence({ sceneTags: [] });

      expect(Array.isArray(evidence)).toBe(true);
      expect(evidence.length).toBe(0);
    });
  });

  describe('微档到CEFR映射', () => {
    test('A2系列映射到A2', () => {
      expect(microBandToCefr('A2-')).toBe('A2');
      expect(microBandToCefr('A2')).toBe('A2');
      expect(microBandToCefr('A2+')).toBe('A2');
    });

    test('B1系列映射到B1', () => {
      expect(microBandToCefr('B1-')).toBe('B1');
      expect(microBandToCefr('B1')).toBe('B1');
    });
  });

  describe('主评估函数', () => {
    test('完整流程测试', () => {
      const request: QuickPlacementRequest = {
        locale: 'zh',
        user_answers: [0, 1, 2],
        scene_tags: ['greeting_basic', 'greeting_formal', 'shopping_direction', 'shopping_price'],
        objective_score: 2,
        self_assessed_level: 'A2',
        track_hint: 'daily'
      };

      const result = quickPlacementV1_1(request);

      // 验证基本字段
      expect(result).toHaveProperty('mapped_start');
      expect(result).toHaveProperty('mapped_start_band');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('band_distribution');
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('evidence_phrases');
      expect(result).toHaveProperty('rationale');

      // 验证微档输出
      expect(['A2-', 'A2', 'A2+', 'B1-', 'B1']).toContain(result.mapped_start_band!);

      // 验证向后兼容
      expect(['A1', 'A2', 'B1', 'B2']).toContain(result.mapped_start);
    });

    test('影子模式标记', () => {
      const request: QuickPlacementRequest = {
        locale: 'zh',
        user_answers: [0, 1, 2],
        objective_score: 1,
        self_assessed_level: 'A2'
      };

      const result = quickPlacementV1_1(request);

      // 在影子模式下应该有标记
      expect(result).toHaveProperty('shadow_only');
    });
  });

  describe('边界情况测试', () => {
    test('空请求处理', () => {
      const request: QuickPlacementRequest = {
        locale: 'zh',
        user_answers: []
      };

      const result = quickPlacementV1_1(request);

      expect(result.mapped_start_band).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('极端自评差距', () => {
      const request: QuickPlacementRequest = {
        locale: 'zh',
        user_answers: [0, 0, 0],
        scene_tags: ['greeting_basic'],
        objective_score: 0,
        self_assessed_level: 'B2' // 高自评，但客观题0分
      };

      const result = quickPlacementV1_1(request);

      expect(result.flags).toContain('self_gap_gt1band');
      expect(result.flags).toContain('insufficient_data');
    });

    test('无场景锚点', () => {
      const request: QuickPlacementRequest = {
        locale: 'zh',
        user_answers: [1, 1, 1],
        objective_score: 1,
        self_assessed_level: 'A2'
      };

      const result = quickPlacementV1_1(request);

      expect(result.flags).toContain('insufficient_data');
      // 默认应该偏向A2-
      expect(result.mapped_start_band).toBe('A2-');
    });
  });
});