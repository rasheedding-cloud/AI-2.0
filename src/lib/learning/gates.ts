import type { Band } from './caps';

export type GateLabel = "A2-gate" | "B1-gate";

export interface Gate {
  accuracy: number;        // 0~1
  task_steps: number;      // 最大步骤
  fluency_pauses: number;  // 允许明显停顿次数
  learner_examples: string[]; // 面向学员的例子（短句）
  quick_checks: string[];     // 自测清单（可打勾）
  speaking_task?: {
    duration_sec: number;
    structure: string[];
  }; // 口头任务
  writing_task?: {
    sentences: number;
    must_include: string[];
  };  // 写作任务
  gate_label: GateLabel;
}

/**
 * 根据CEFR能力上限生成对应的评估门限
 * @param cap 当月能力上限 (A2-, A2, A2+, B1-, B1)
 * @returns 对应的评估门限
 */
export function gateByCap(cap: Band): Gate {
  const isA2 = ["A2-", "A2", "A2+"].includes(cap);

  if (isA2) {
    return {
      gate_label: "A2-gate",
      accuracy: 0.8,
      task_steps: 3,
      fluency_pauses: 2,
      learner_examples: [
        "能澄清≤3步的任务（时间/对象/动作）",
        "能用 because/so/then 说出简单理由",
        "能口头30–45秒说明今天要做什么"
      ],
      quick_checks: [
        "听懂并复述一个三步任务",
        "能写4–5句确认信息（含时间/责任/下一步）",
        "口头表达时明显停顿≤2次"
      ],
      speaking_task: {
        duration_sec: 45,
        structure: ["任务", "要点", "下一步"]
      },
      writing_task: {
        sentences: 5,
        must_include: ["时间", "对象/责任", "下一步"]
      }
    };
  }

  // B1- / B1
  return {
    gate_label: "B1-gate",
    accuracy: 0.8,
    task_steps: 4,
    fluency_pauses: 2,
    learner_examples: [
      "能做60–90秒结构化更新（背景→状态→下一步）",
      "能比较两个方案并给理由/建议",
      "能写6–8句确认/说明邮件（含理由与下一步）"
    ],
    quick_checks: [
      "能在1–2分钟内清晰表达并包含理由",
      "处理≤4步任务并确认对方理解",
      "口头表达明显停顿≤2次"
    ],
    speaking_task: {
      duration_sec: 90,
      structure: ["背景", "状态", "问题/风险", "下一步"]
    },
    writing_task: {
      sentences: 7,
      must_include: ["背景", "理由", "下一步"]
    }
  };
}

/**
 * 生成友好的门限说明文字
 * @param gate 评估门限
 * @param language 语言 (zh, en, ar)
 * @returns 友好的说明文字
 */
export function generateGateDescription(gate: Gate, language: 'zh' | 'en' | 'ar' = 'zh'): string {
  if (language === 'en') {
    if (gate.gate_label === 'A2-gate') {
      return `This month you need to clearly complete tasks of ≤3 steps, use because/so/then to give simple reasons, and speak for 30-45 seconds about your plan. No more than 2 obvious pauses, with about 80% accuracy (2 mistakes max in 10 sentences).`;
    } else {
      return `This month you need to make 60-90 second structured updates (background→status→next steps), compare two options with reasons, and write 6-8 sentence confirmation emails. No more than 2 obvious pauses, with about 80% accuracy.`;
    }
  }

  if (language === 'ar') {
    if (gate.gate_label === 'A2-gate') {
      return `هذا الشهر تحتاج إلى إكمال مهام لا تزيد عن 3 خطوات بوضوح، استخدام because/so/then لإعطاء أسباب بسيطة، والتحدث لمدة 30-45 ثانية عن خطتك. لا يزيد عن توقفين واضحين، بدقة حوالي 80% (خطأان كحد أقصى في 10 جمل).`;
    } else {
      return `هذا الشهر تحتاج إلى تقديم تحديثات منظمة مدتها 60-90 ثانية (الخلفية→الحالة→الخطوات التالية)، ومقارنة خيارين مع الأسباب، وكتابة رسائل تأكيد من 6-8 جمل. لا يزيد عن توقفين واضحين، بدقة حوالي 80%.`;
    }
  }

  // Chinese (default)
  if (gate.gate_label === 'A2-gate') {
    return `本月你需要能清楚完成≤3步的小任务，用 because/so/then 说出简单理由，口头30–45秒说明计划。明显停顿不超过2次，整体正确率约80%（10句中最多错2句）。`;
  } else {
    return `本月你需要能做60–90秒结构化更新（背景→状态→下一步），比较两个方案并给出理由，并能写6–8句确认类邮件。明显停顿≤2次，整体正确率约80%。`;
  }
}

/**
 * 将Gate转换为前端显示格式（兼容现有assessment_gate）
 * @param gate 评估门限
 * @returns 兼容的assessment_gate格式
 */
export function gateToAssessmentGate(gate: Gate): {
  accuracy: number;
  task_steps: number;
  fluency_pauses: number;
} {
  return {
    accuracy: gate.accuracy,
    task_steps: gate.task_steps,
    fluency_pauses: gate.fluency_pauses,
  };
}

/**
 * 记录门限应用日志
 * @param cap 能力上限
 * @param month 月份
 * @param source 数据来源
 * @param shadowDiff 影子模式差异（如果有）
 */
export function logGateApplication(
  cap: Band,
  month: number,
  source: 'backend' | 'llm' | 'shadow',
  shadowDiff?: any
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event: 'gate_override_applied',
    data: {
      cap,
      month,
      source,
      ...(shadowDiff && { shadow_diff: shadowDiff })
    }
  };

  console.log('🚪 [Gate] Applied:', logData);

  // 这里可以扩展到其他日志系统
  // 例如: analytics.track('gate_override_applied', logData.data);
}

/**
 * 对比LLM生成的门限与后端计算的门限
 * @param llmGate LLM生成的门限
 * @param backendGate 后端计算的门限
 * @returns 差异对象
 */
export function compareGates(llmGate: any, backendGate: Gate): {
  hasDiff: boolean;
  diff: any;
} {
  const diff = {
    accuracy: {
      llm: llmGate?.accuracy,
      backend: backendGate.accuracy,
      diff: (llmGate?.accuracy || 0) - backendGate.accuracy
    },
    task_steps: {
      llm: llmGate?.task_steps,
      backend: backendGate.task_steps,
      diff: (llmGate?.task_steps || 0) - backendGate.task_steps
    },
    fluency_pauses: {
      llm: llmGate?.fluency_pauses,
      backend: backendGate.fluency_pauses,
      diff: (llmGate?.fluency_pauses || 0) - backendGate.fluency_pauses
    }
  };

  const hasDiff =
    Math.abs(diff.accuracy.diff) > 0.01 ||
    Math.abs(diff.task_steps.diff) > 0 ||
    Math.abs(diff.fluency_pauses.diff) > 0;

  return { hasDiff, diff };
}