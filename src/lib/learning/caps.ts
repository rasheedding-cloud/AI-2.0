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

// 辅助函数：从用户学习目标推断目标难度
export function inferTargetBandFromIntake(intake: any): Band {
  const goalText = (intake.goal_free_text || "").toLowerCase();
  const track = intake.track_override || '';
  console.log('目标推断开始:', { goalText, track });

  // 优先处理考试和留学目标，特别是雅思考试 - 这是最重要的逻辑
  if (track === 'exam' || goalText.includes('考试') || goalText.includes('备考') || goalText.includes('雅思') || goalText.includes('托福')) {
    // 雅思考试目标分析 - 修正逻辑
    // 雅思分数对应：8.0 = C1, 7.0 = B2+, 6.5 = B2, 6.0 = B1+, 5.5 = B1, 5.0 = B1-, 4.5 = A2+
    if (goalText.includes('英国') || goalText.includes('高校') || goalText.includes('大学') || goalText.includes('留学') ||
        goalText.includes('uk') || goalText.includes('university') || goalText.includes('britain')) {
      // 英国高校通常要求雅思6.0-7.0分，对应B1+到B2+水平
      if (goalText.includes('7.0') || goalText.includes('7.0分')) {
        return "B2+"; // 雅思7.0分对应B2+水平
      } else if (goalText.includes('6.5') || goalText.includes('6.5分')) {
        return "B2"; // 雅思6.5分对应B2水平
      } else if (goalText.includes('6.0') || goalText.includes('6.0分')) {
        return "B1+"; // 雅思6.0分对应B1+水平
      } else if (goalText.includes('5.5') || goalText.includes('5.5分')) {
        return "B1"; // 雅思5.5分对应B1水平
      } else if (goalText.includes('5.0')) {
        return "B1-"; // 雅思5.0分对应B1-水平
      } else {
        return "B2"; // 默认英国留学目标为B2（雅思6.5分）
      }
    } else {
      // 一般考试目标
      if (goalText.includes('8.0') || goalText.includes('8.0分')) {
        return "C1"; // 雅思8.0分对应C1水平
      } else if (goalText.includes('7.0') || goalText.includes('7.0分')) {
        return "B2+"; // 雅思7.0分对应B2+水平
      } else if (goalText.includes('6.5') || goalText.includes('6.5分')) {
        return "B2"; // 雅思6.5分对应B2水平
      } else if (goalText.includes('6.0') || goalText.includes('6.0分')) {
        return "B1+"; // 雅思6.0分对应B1+水平
      } else if (goalText.includes('5.5') || goalText.includes('5.5分')) {
        return "B1"; // 雅思5.5分对应B1水平
      } else if (goalText.includes('5.0')) {
        return "B1-"; // 雅思5.0分对应B1-水平
      } else if (goalText.includes('4.5')) {
        return "A2+"; // 雅思4.5分对应A2+水平
      } else {
        return "B1+"; // 默认考试目标为B1+
      }
    }
  }

  // 修正：降低默认目标难度，避免1920课时的问题
  // 优先处理具体的轨道类型，避免关键词冲突
  if (track === 'travel' || goalText.includes('旅行') || goalText.includes('旅游') || goalText.includes('出国') || goalText.includes('酒店')) {
    // 旅行目标的难度等级判断 - 修正为更合理的目标
    if (goalText.includes('基础') || goalText.includes('简单') || goalText.includes('基本') || goalText.includes('零基础')) {
      return "A2"; // 基础旅游英语，降低到A2
    } else if (goalText.includes('自由行') || goalText.includes('深入') || goalText.includes('流畅')) {
      return "A2+"; // 深度旅游，降低到A2+
    } else {
      return "A2"; // 默认旅游英语目标为A2
    }
  }

  if (track === 'work' || goalText.includes('工作') || goalText.includes('职场') || goalText.includes('商务') || goalText.includes('职业')) {
    // 职场熟练应该对应B2+水平
    if (goalText.includes('熟练') || goalText.includes('精通') || goalText.includes('流利') || goalText.includes('专业')) {
      return "B2+"; // 职场熟练需要B2+水平
    } else if (goalText.includes('基础') || goalText.includes('入门') || goalText.includes('简单')) {
      return "B1"; // 基础职场英语需要B1水平
    } else if (goalText.includes('中层') || goalText.includes('管理') || goalText.includes('高层') || goalText.includes('传达') || goalText.includes('执行') || goalText.includes('汇报') || goalText.includes('决策')) {
      console.log('管理层关键词匹配，目标设为B2+');
      return "B2+"; // 管理层级沟通需要B2+水平
    } else {
      console.log('默认职场目标设为B2');
      return "B2"; // 默认职场目标为B2水平
    }
  }

  if (track === 'study' || goalText.includes('学术') || goalText.includes('留学') || goalText.includes('研究')) {
    return "A2+"; // 学术目标需要达到A2+即可
  }

  // 日常交流目标
  if (track === 'daily' || goalText.includes('日常') || goalText.includes('交流') || goalText.includes('朋友') || goalText.includes('美剧') || goalText.includes('电影')) {
    // 日常交流目标的难度等级判断
    if (goalText.includes('简单') || goalText.includes('基础') || goalText.includes('基本')) {
      return "A2"; // 基础日常交流
    } else if (goalText.includes('流利') || goalText.includes('深入') || goalText.includes('无障碍')) {
      return "A2+"; // 流利交流需要A2+
    } else {
      return "A2"; // 默认日常交流目标为A2
    }
  }

  // 默认目标是A2（避免过高的课时要求）
  return "A2";
}