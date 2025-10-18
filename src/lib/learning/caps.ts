export const ORDER = ["Pre-A", "A1-", "A1", "A1+", "A2-", "A2", "A2+", "B1-", "B1", "B1+", "B2", "B2+", "C1"] as const;
export type Band = typeof ORDER[number];

const idx = (b: Band) => Math.max(0, ORDER.indexOf(b));

export function clampBand(band: Band, cap: Band): Band {
  return ORDER[Math.min(idx(band), idx(cap))] as Band;
}

export function computeMonth1Cap(startBand: Band, targetBand: Band): Band {
  // 首月最多 +2 微档，且不超过目标
  const capIdx = Math.min(idx(startBand) + 2, idx(targetBand));
  return ORDER[capIdx] as Band;
}

export function hotfixClamp(
  monthlyPlan: any,
  month1: any,
  startBand: Band,
  targetBand: Band
) {
  const m1Cap = computeMonth1Cap(startBand, targetBand);

  // 写回 M1 上限
  monthlyPlan.milestones = monthlyPlan.milestones.map((m: any) =>
    m.month === 1 ? { ...m, max_target_band: m1Cap } : m
  );

  // 限制首月每课难度，并按低档收紧 CAPS
  month1.weeks.forEach((w: any) =>
    w.days.forEach((d: any) =>
      d.lessons.forEach((lsn: any) => {
        lsn.difficulty_band = clampBand(lsn.difficulty_band as Band, m1Cap) as any;

        // 若 ≤ A1+ 则进一步收紧
        if (idx(lsn.difficulty_band as Band) <= idx("A1+")) {
          lsn.caps = {
            grammar_allow: ["present simple", "and/but/so"],
            grammar_forbid: ["clauses", "passive"],
            listening_wpm_max: 105,
            max_sentences: 2
          };
          lsn.max_task_steps = 2;
        }
      })
    )
  );

  return { monthlyPlan, month1 };
}

// 辅助函数：从快测或自评映射到起点微档
export function inferStartBand(intake: any): Band {
  const m = intake.quickTest?.mapped_start || intake.self_assessed_level || "A2";
  return (["Pre-A", "A1", "A2", "B1"].includes(m) ? m : "A2") as Band;
}

// 辅助函数：从目标标签映射到目标微档
export function inferTargetBand(plan: any): Band {
  const t = plan.ui_label_target || "";
  if (t.includes("自如") || t.includes("熟练") || t.includes("精通") || t.includes("流利")) return "B2+";
  if (t.includes("生存") || t.includes("基础") || t.includes("简单")) return "A2";
  return "B1"; // 默认目标是B1，而不是A2
}

// 辅助函数：从用户学习目标推断目标难度 - 集成Gemini API
export async function inferTargetBandFromIntake(intake: any): Promise<Band> {
  const goalText = intake.goal_free_text || "";
  const track = intake.track_override || '';
  console.log('目标推断开始:', { goalText, track });

  try {
    // 使用Gemini API进行智能推断
    const { assessTargetLevelFromGoal } = await import('@/server/services/assessor/goal_cefr_v2');
    const { createLLMAdapter } = await import('@/lib/llm/adapter');

    const llmAdapter = createLLMAdapter();
    const assessment = await assessTargetLevelFromGoal(
      goalText,
      intake.self_assessed_level,
      llmAdapter
    );

    console.log('Gemini推断结果:', assessment);

    // 验证推断结果的合理性
    const targetBand = assessment.targetBand;

    // 确保返回的是有效的Band类型
    if (ORDER.includes(targetBand as Band)) {
      console.log(`使用Gemini推断结果: ${targetBand} (置信度: ${assessment.confidence})`);
      return targetBand as Band;
    } else {
      console.warn(`Gemini返回了无效的等级: ${targetBand}，使用回退逻辑`);
      return fallbackInferTargetBand(intake);
    }

  } catch (error) {
    console.error('Gemini目标推断失败，使用回退逻辑:', error);
    return fallbackInferTargetBand(intake);
  }
}

// 回退推断逻辑 - 原有的规则系统
function fallbackInferTargetBand(intake: any): Band {
  const goalText = (intake.goal_free_text || "").toLowerCase();
  const track = intake.track_override || '';

  console.log('使用回退推断逻辑:', { goalText, track });

  // 优先处理考试和留学目标，特别是雅思考试
  if (track === 'exam' || goalText.includes('考试') || goalText.includes('备考') || goalText.includes('雅思') || goalText.includes('托福')) {
    if (goalText.includes('英国') || goalText.includes('高校') || goalText.includes('大学') || goalText.includes('留学') ||
        goalText.includes('uk') || goalText.includes('university') || goalText.includes('britain')) {
      if (goalText.includes('7.0') || goalText.includes('7.0分')) {
        return "B2+";
      } else if (goalText.includes('6.5') || goalText.includes('6.5分')) {
        return "B2";
      } else if (goalText.includes('6.0') || goalText.includes('6.0分')) {
        return "B1+";
      } else if (goalText.includes('5.5') || goalText.includes('5.5分')) {
        return "B1";
      } else {
        return "B2";
      }
    } else {
      if (goalText.includes('8.0') || goalText.includes('8.0分')) {
        return "C1";
      } else if (goalText.includes('7.0') || goalText.includes('7.0分')) {
        return "B2+";
      } else if (goalText.includes('6.5') || goalText.includes('6.5分')) {
        return "B2";
      } else if (goalText.includes('6.0') || goalText.includes('6.0分')) {
        return "B1+";
      } else {
        return "B1+";
      }
    }
  }

  // 旅行目标
  if (track === 'travel' || goalText.includes('旅行') || goalText.includes('旅游') || goalText.includes('出国') || goalText.includes('酒店')) {
    if (goalText.includes('基础') || goalText.includes('简单') || goalText.includes('基本') || goalText.includes('零基础')) {
      return "A2";
    } else if (goalText.includes('自由行') || goalText.includes('深入') || goalText.includes('流畅')) {
      return "A2+";
    } else {
      return "A2";
    }
  }

  // 职场目标
  if (track === 'work' || goalText.includes('工作') || goalText.includes('职场') || goalText.includes('商务') || goalText.includes('职业')) {
    if (goalText.includes('熟练') || goalText.includes('精通') || goalText.includes('流利') || goalText.includes('专业')) {
      return "B2+";
    } else if (goalText.includes('基础') || goalText.includes('入门') || goalText.includes('简单')) {
      return "B1";
    } else if (goalText.includes('中层') || goalText.includes('管理') || goalText.includes('高层') || goalText.includes('传达') || goalText.includes('执行') || goalText.includes('汇报') || goalText.includes('决策')) {
      return "B2+";
    } else {
      return "B2";
    }
  }

  // 学术目标
  if (track === 'study' || goalText.includes('学术') || goalText.includes('留学') || goalText.includes('研究')) {
    return "A2+";
  }

  // 日常交流目标
  if (track === 'daily' || goalText.includes('日常') || goalText.includes('交流') || goalText.includes('朋友') || goalText.includes('美剧') || goalText.includes('电影')) {
    if (goalText.includes('简单') || goalText.includes('基础') || goalText.includes('基本')) {
      return "A2";
    } else if (goalText.includes('流利') || goalText.includes('深入') || goalText.includes('无障碍')) {
      return "A2+";
    } else {
      return "A2";
    }
  }

  // 默认目标是A2
  return "A2";
}