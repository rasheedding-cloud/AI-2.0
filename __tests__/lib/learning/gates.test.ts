import { describe, it, expect } from '@jest/globals';
import { gateByCap, gateToAssessmentGate, generateGateDescription, compareGates } from '@/lib/learning/gates';

describe('Dynamic Gates System', () => {
  describe('gateByCap', () => {
    it('should return A2-gate for A2- band', () => {
      const gate = gateByCap('A2-');
      expect(gate.gate_label).toBe('A2-gate');
      expect(gate.accuracy).toBe(0.8);
      expect(gate.task_steps).toBe(3);
      expect(gate.fluency_pauses).toBe(2);
    });

    it('should return A2-gate for A2 band', () => {
      const gate = gateByCap('A2');
      expect(gate.gate_label).toBe('A2-gate');
      expect(gate.accuracy).toBe(0.8);
      expect(gate.task_steps).toBe(3);
      expect(gate.fluency_pauses).toBe(2);
    });

    it('should return A2-gate for A2+ band', () => {
      const gate = gateByCap('A2+');
      expect(gate.gate_label).toBe('A2-gate');
      expect(gate.accuracy).toBe(0.8);
      expect(gate.task_steps).toBe(3);
      expect(gate.fluency_pauses).toBe(2);
    });

    it('should return B1-gate for B1- band', () => {
      const gate = gateByCap('B1-');
      expect(gate.gate_label).toBe('B1-gate');
      expect(gate.accuracy).toBe(0.8);
      expect(gate.task_steps).toBe(4);
      expect(gate.fluency_pauses).toBe(2);
    });

    it('should return B1-gate for B1 band', () => {
      const gate = gateByCap('B1');
      expect(gate.gate_label).toBe('B1-gate');
      expect(gate.accuracy).toBe(0.8);
      expect(gate.task_steps).toBe(4);
      expect(gate.fluency_pauses).toBe(2);
    });

    it('should have correct learner examples for A2-gate', () => {
      const gate = gateByCap('A2');
      expect(gate.learner_examples).toHaveLength(3);
      expect(gate.learner_examples[0]).toContain('≤3步的任务');
      expect(gate.learner_examples[1]).toContain('because/so/then');
      expect(gate.learner_examples[2]).toContain('30–45秒');
    });

    it('should have correct learner examples for B1-gate', () => {
      const gate = gateByCap('B1');
      expect(gate.learner_examples).toHaveLength(3);
      expect(gate.learner_examples[0]).toContain('60–90秒');
      expect(gate.learner_examples[1]).toContain('比较两个方案');
      expect(gate.learner_examples[2]).toContain('6–8句');
    });

    it('should have correct quick checks for A2-gate', () => {
      const gate = gateByCap('A2');
      expect(gate.quick_checks).toHaveLength(3);
      expect(gate.quick_checks[0]).toContain('三步任务');
      expect(gate.quick_checks[1]).toContain('4–5句');
      expect(gate.quick_checks[2]).toContain('≤2次');
    });

    it('should have correct quick checks for B1-gate', () => {
      const gate = gateByCap('B1');
      expect(gate.quick_checks).toHaveLength(3);
      expect(gate.quick_checks[0]).toContain('1–2分钟');
      expect(gate.quick_checks[1]).toContain('≤4步');
      expect(gate.quick_checks[2]).toContain('≤2次');
    });

    it('should have correct speaking task for A2-gate', () => {
      const gate = gateByCap('A2');
      expect(gate.speaking_task).toBeDefined();
      expect(gate.speaking_task?.duration_sec).toBe(45);
      expect(gate.speaking_task?.structure).toEqual(['任务', '要点', '下一步']);
    });

    it('should have correct speaking task for B1-gate', () => {
      const gate = gateByCap('B1');
      expect(gate.speaking_task).toBeDefined();
      expect(gate.speaking_task?.duration_sec).toBe(90);
      expect(gate.speaking_task?.structure).toEqual(['背景', '状态', '问题/风险', '下一步']);
    });

    it('should have correct writing task for A2-gate', () => {
      const gate = gateByCap('A2');
      expect(gate.writing_task).toBeDefined();
      expect(gate.writing_task?.sentences).toBe(5);
      expect(gate.writing_task?.must_include).toContain('时间');
      expect(gate.writing_task?.must_include).toContain('对象/责任');
      expect(gate.writing_task?.must_include).toContain('下一步');
    });

    it('should have correct writing task for B1-gate', () => {
      const gate = gateByCap('B1');
      expect(gate.writing_task).toBeDefined();
      expect(gate.writing_task?.sentences).toBe(7);
      expect(gate.writing_task?.must_include).toContain('背景');
      expect(gate.writing_task?.must_include).toContain('理由');
      expect(gate.writing_task?.must_include).toContain('下一步');
    });
  });

  describe('gateToAssessmentGate', () => {
    it('should convert gate to assessment gate format', () => {
      const gate = gateByCap('A2');
      const assessmentGate = gateToAssessmentGate(gate);

      expect(assessmentGate.accuracy).toBe(0.8);
      expect(assessmentGate.task_steps).toBe(3);
      expect(assessmentGate.fluency_pauses).toBe(2);
    });
  });

  describe('generateGateDescription', () => {
    it('should generate Chinese description for A2-gate', () => {
      const gate = gateByCap('A2');
      const description = generateGateDescription(gate, 'zh');

      expect(description).toContain('≤3步');
      expect(description).toContain('30–45秒');
      expect(description).toContain('80%');
      expect(description).toContain('10句中最多错2句');
    });

    it('should generate Chinese description for B1-gate', () => {
      const gate = gateByCap('B1');
      const description = generateGateDescription(gate, 'zh');

      expect(description).toContain('60–90秒');
      expect(description).toContain('结构化更新');
      expect(description).toContain('80%');
      expect(description).toContain('6–8句');
    });

    it('should generate English description for A2-gate', () => {
      const gate = gateByCap('A2');
      const description = generateGateDescription(gate, 'en');

      expect(description).toContain('≤3 steps');
      expect(description).toContain('30-45 seconds');
      expect(description).toContain('80% accuracy');
    });

    it('should generate Arabic description for A2-gate', () => {
      const gate = gateByCap('A2');
      const description = generateGateDescription(gate, 'ar');

      expect(description).toContain('≤3 خطوات');
      expect(description).toContain('30-45 ثانية');
      expect(description).toContain('80%');
    });
  });

  describe('compareGates', () => {
    it('should detect no difference when gates are identical', () => {
      const gate1 = gateByCap('A2');
      const gate2 = gateByCap('A2');
      const comparison = compareGates(gateToAssessmentGate(gate1), gate2);

      expect(comparison.hasDiff).toBe(false);
    });

    it('should detect difference when accuracy differs', () => {
      const gate1 = gateByCap('A2');
      const gate2 = gateByCap('B1');
      const comparison = compareGates(gateToAssessmentGate(gate1), gate2);

      expect(comparison.hasDiff).toBe(true);
      expect(comparison.diff.accuracy.diff).toBe(0); // Both are 0.8
      expect(comparison.diff.task_steps.diff).toBe(1); // B1 has 4, A2 has 3
    });

    it('should detect difference when task steps differ', () => {
      const llmGate = {
        accuracy: 0.8,
        task_steps: 5,
        fluency_pauses: 2
      };
      const backendGate = gateByCap('A2');
      const comparison = compareGates(llmGate, backendGate);

      expect(comparison.hasDiff).toBe(true);
      expect(comparison.diff.task_steps.diff).toBe(2); // 5 - 3 = 2
    });

    it('should detect difference when fluency pauses differ', () => {
      const llmGate = {
        accuracy: 0.8,
        task_steps: 3,
        fluency_pauses: 3
      };
      const backendGate = gateByCap('A2');
      const comparison = compareGates(llmGate, backendGate);

      expect(comparison.hasDiff).toBe(true);
      expect(comparison.diff.fluency_pauses.diff).toBe(1); // 3 - 2 = 1
    });
  });
});