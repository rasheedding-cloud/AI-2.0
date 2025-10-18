/**
 * QuickPlacement 题库契约 Schema
 * 使用 Zod 进行运行时校验和类型推断
 */

import { z } from "zod";

// 选项多语言文本 Schema
export const OptionSchema = z.object({
  zh: z.string().min(1, "中文选项文本不能为空"),
  en: z.string().min(1, "英文选项文本不能为空"),
  ar: z.string().min(1, "阿拉伯语选项文本不能为空")
});

// 客观题目 Schema
export const ObjectiveItemSchema = z.object({
  id: z.string().min(1, "题目ID不能为空"),
  scored: z.boolean().default(true, "默认为计分题目"),
  level_hint: z.enum(["A1", "A2", "A2+", "B1-"]).optional("难度级别提示"),
  transcript_en: z.string().optional("听力题英文转录"),
  passage_en: z.string().optional("阅读题英文段落"),
  question_en: z.string().optional("阅读题英文问题"),
  listening_speed_wpm: z.object({
    A2: z.object({ min: z.number(), max: z.number() }),
    "B1-": z.object({ min: z.number(), max: z.number() })
  }).optional("听力速度范围"),
  options: z.record(z.enum(["a", "b", "c", "d"]), OptionSchema).refine(
    (options) => Object.keys(options).length === 4,
    { message: "必须恰好有4个选项(a/b/c/d)" }
  ),
  correct: z.enum(["a", "b", "c", "d"], "正确答案必须是a/b/c/d之一")
}).refine(
  (obj) => {
    // 听力题需要 transcript_en，阅读题需要 passage_en + question_en
    const hasListening = !!obj.transcript_en;
    const hasReading = !!obj.passage_en && !!obj.question_en;
    return hasListening || hasReading;
  },
  {
    message: "听力题必须提供 transcript_en，阅读题必须提供 passage_en 和 question_en"
  }
);

// 场景锚点 Schema
export const SceneAnchorSchema = z.object({
  id: z.string().min(1, "场景锚点ID不能为空"),
  band_hint: z.enum(["A1", "A2", "B1-"], "难度提示必须是A1/A2/B1-之一"),
  tracks: z.array(z.enum(["work", "travel", "study", "daily"])).min(1, "至少需要一个轨道标签"),
  skill: z.enum(["l", "s", "r", "w"], "技能类型必须是l/s/r/w之一"),
  zh: z.string().min(1, "中文描述不能为空"),
  en: z.string().min(1, "英文描述不能为空"),
  ar: z.string().min(1, "阿拉伯语描述不能为空")
});

// 题库配置约束
export const QB_CONFIG_SCHEMA = {
  OBJECTIVES: {
    MIN_SCORED_COUNT: 2,
    TOTAL_COUNT: 2,
    VALID_SKILLS: ["listening", "reading"],
    VALID_CORRECT_ANSWERS: ["a", "b", "c", "d"]
  },
  SCENE_ANCHORS: {
    MIN_A1_COUNT: 4,
    MIN_A2_COUNT: 6,
    MIN_B1_MINUS_COUNT: 6,
    VALID_SKILLS: ["l", "s", "r", "w"],
    VALID_TRACKS: ["work", "travel", "study", "daily"],
    VALID_BAND_HINTS: ["A1", "A2", "B1-"]
  }
};

// 导出类型
export type ObjectiveItem = z.infer<typeof ObjectiveItemSchema>;
export type SceneAnchor = z.infer<typeof SceneAnchorSchema>;
export type Option = z.infer<typeof OptionSchema>;

// 运行时校验函数
export function validateObjectives(objectives: Record<string, any>): ObjectiveItem[] {
  const results: ObjectiveItem[] = [];
  const errors: string[] = [];

  Object.values(objectives).forEach((item, index) => {
    try {
      const validated = ObjectiveItemSchema.parse(item);
      results.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`OBJECTIVES[${index}]: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      } else {
        errors.push(`OBJECTIVES[${index}]: ${error}`);
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(`题库校验失败:\n${errors.join('\n')}`);
  }

  // 额外的业务规则校验
  const scoredCount = results.filter(item => item.scored).length;
  if (scoredCount < QB_CONFIG_SCHEMA.OBJECTIVES.MIN_SCORED_COUNT) {
    throw new Error(`计分题目数量不足: ${scoredCount} < ${QB_CONFIG_SCHEMA.OBJECTIVES.MIN_SCORED_COUNT}`);
  }

  return results;
}

export function validateSceneAnchors(anchors: any[]): SceneAnchor[] {
  const results: SceneAnchor[] = [];
  const errors: string[] = [];

  anchors.forEach((item, index) => {
    try {
      const validated = SceneAnchorSchema.parse(item);
      results.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`SCENE_ANCHORS[${index}]: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      } else {
        errors.push(`SCENE_ANCHORS[${index}]: ${error}`);
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(`场景锚点校验失败:\n${errors.join('\n')}`);
  }

  // 数量约束校验
  const a1Count = results.filter(item => item.band_hint === "A1").length;
  const a2Count = results.filter(item => item.band_hint === "A2").length;
  const b1MinusCount = results.filter(item => item.band_hint === "B1-").length;

  if (a1Count < QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_A1_COUNT) {
    throw new Error(`A1场景锚点数量不足: ${a1Count} < ${QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_A1_COUNT}`);
  }
  if (a2Count < QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_A2_COUNT) {
    throw new Error(`A2场景锚点数量不足: ${a2Count} < ${QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_A2_COUNT}`);
  }
  if (b1MinusCount < QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_B1_MINUS_COUNT) {
    throw new Error(`B1-场景锚点数量不足: ${b1MinusCount} < ${QB_CONFIG_SCHEMA.SCENE_ANCHORS.MIN_B1_MINUS_COUNT}`);
  }

  return results;
}

// 契约校验工具函数
export function validateQBankContract(objectives: Record<string, any>, sceneAnchors: any[]): {
  objectives: ObjectiveItem[];
  sceneAnchors: SceneAnchor[];
  errors: string[];
} {
  const errors: string[] = [];
  let validatedObjectives: ObjectiveItem[] = [];
  let validatedSceneAnchors: SceneAnchor[] = [];

  try {
    validatedObjectives = validateObjectives(objectives);
  } catch (error) {
    errors.push(`客观题校验失败: ${error}`);
  }

  try {
    validatedSceneAnchors = validateSceneAnchors(sceneAnchors);
  } catch (error) {
    errors.push(`场景锚点校验失败: ${error}`);
  }

  return {
    objectives: validatedObjectives,
    sceneAnchors: validatedSceneAnchors,
    errors
  };
}