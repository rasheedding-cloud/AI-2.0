/**
 * QuickPlacement v1.1 - 核心评估逻辑
 * 三信号融合：Scene(0.6) + Objective(0.3) + Self(0.1)
 * 楼梯连续性规则 + 微档输出 (A2-/A2/A2+/B1-/B1)
 */

import { SCENE_ANCHORS, OBJECTIVES, Band, Track } from './qb_bank';

// 评估相关类型定义
export type LanguageLocale = 'zh' | 'en' | 'ar';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

export interface QuickPlacementRequestV1_1 {
  locale: LanguageLocale;
  user_answers: number[];  // 用户答案（长度2，仅计分题）
  scene_tags: string[];    // 场景锚点标签
  objective_score?: number;  // 客观题得分（0-2分）
  self_assessed_level?: CefrLevel | 'Pre-A';  // 自评水平
  track_hint?: Track;      // 轨道提示
}

export interface QuickPlacementResponseV1_1 {
  // v1 兼容字段
  mapped_start: CefrLevel;
  confidence: number;
  breakdown: {
    objective_score: {
      correct: number;
      total: number;
      accuracy: number;
    };
    self_assessment?: CefrLevel;
    fusion_weights: {
      objective: number;
      self_assessment: number;
    };
  };
  diagnostic: {
    stronger_skills: string[];
    weaker_skills: string[];
    recommended_focus: string[];
  };
  metadata: {
    question_count: number;
    locale: LanguageLocale;
    version: 'v1.1';
    processing_time_ms?: number;
  };

  // v1.1 新增字段
  mapped_start_band?: Band;       // 微档输出
  band_distribution?: Record<Band, number>; // 概率分布
  flags?: string[];               // 警告标记
  evidence_phrases?: string[];     // 证据短语
  rationale?: string;              // 推理说明
  shadow_only?: boolean;           // 影子模式标记
}

// 1) 楼梯连续性：A1→A2→B1- 逐级通过 + 微档细分
export function scoreScene(sceneTags: string[]) {
  const hits = {A1:0, A2:0, B1m:0}; // B1- 用 B1m 表示
  for (const id of sceneTags) {
    if (id.startsWith("a1_")) hits.A1++;
    else if (id.startsWith("a2_")) hits.A2++;
    else if (id.startsWith("b1m_")) hits.B1m++;
  }

  const total = {A1:4, A2:6, B1m:6};
  const passA1 = hits.A1 >= 3;
  const passA2 = passA1 && hits.A2 >= 4;      // ≥3/4 of A2 (6*0.67≈4)
  const passB1m= passA2 && hits.B1m >= 4;     // ≥2/3 of B1- (6*0.67≈4)

  // 微档初分布（直觉化而非硬档）
  const P: Record<Band, number> = { "A2-":0.2, "A2":0.2, "A2+":0.2, "B1-":0.2, "B1":0.2 };

  if (!passA1) {
    P["A2-"]=0.6; P["A2"]=0.25; P["A2+"]=0.1;
    return {hits,total,passA1,passA2,passB1m,P};
  }

  if (passA1 && !passA2) {
    P["A2-"]=0.35; P["A2"]=0.45; P["A2+"]=0.15;
    return {hits,total,passA1,passA2,passB1m,P};
  }

  // A2 通过
  const a2Rate = hits.A2/total.A2;
  if (a2Rate >= 0.9 && hits.B1m <= 1) { // 稳态 A2+
    P["A2+"]=0.55; P["A2"]=0.25; P["B1-"]=0.15;
  } else if (passB1m) {
    P["B1-"]=0.55; P["A2+"]=0.25; P["B1"]=0.1;
  } else {
    P["A2"]=0.4; P["A2+"]=0.35; P["B1-"]=0.2;
  }

  return {hits,total,passA1,passA2,passB1m,P};
}

// 2) 客观题倾向（仅 0–2/3 题计分）
export function mapObjectiveScore(objScore: number): Record<Band, number> {
  const clamp = Math.max(0, Math.min(2, objScore|0));
  const base: Record<Band, number> = { "A2-":0.2,"A2":0.2,"A2+":0.2,"B1-":0.2,"B1":0.2 };

  if (clamp === 0) {
    base["A2-"]=0.45; base["A2"]=0.35;
  } else if (clamp === 1) {
    base["A2"]=0.35; base["A2+"]=0.35;
  } else if (clamp === 2) {
    base["A2+"]=0.4; base["B1-"]=0.35;
  }

  return base;
}

// 3) 自评先验（温和）
export function mapSelfPrior(level?: string|null): Record<Band, number> {
  const m: Record<Band, number> = { "A2-":0.25,"A2":0.25,"A2+":0.25,"B1-":0.15,"B1":0.10 };

  if (!level) return m;
  if (level==="Pre-A"||level==="A1") {
    m["A2-"]=0.45; m["A2"]=0.3; m["A2+"]=0.15;
  }
  if (level==="A2") {
    m["A2"]=0.35; m["A2+"]=0.30; m["B1-"]=0.2;
  }
  if (level==="B1"||level==="B2") {
    m["A2+"]=0.3; m["B1-"]=0.4; m["B1"]=0.2;
  }

  return m;
}

// 4) 融合（有客观题：0.6/0.3/0.1；无客观题：0.8/0.2）
export function fuse(Ps:Record<Band,number>, Po:Record<Band,number>, Pp:Record<Band,number>, hasObj:boolean) {
  const w = hasObj ? {s:0.6,o:0.3,p:0.1} : {s:0.8,o:0,p:0.2};
  const bands: Band[] = ["A2-","A2","A2+","B1-","B1"];
  const sum = (x:number,y:number)=>x+y;
  const P: Record<Band,number> = Object.fromEntries(bands.map(b=>[b,0])) as any;

  for (const b of bands) P[b] = w.s*Ps[b] + w.o*Po[b] + w.p*Pp[b];

  const Z = bands.map(b=>P[b]).reduce(sum,0) || 1;
  for (const b of bands) P[b] = P[b]/Z;

  return P;
}

// 5) Flags
export function deriveFlags(ctx:{scene:any,objScore?:number,selfLevel?:string,mapped:Band}) {
  const flags:string[]=[];
  const totalSelected = (ctx.scene?.hits?.A1||0)+(ctx.scene?.hits?.A2||0)+(ctx.scene?.hits?.B1m||0);

  if (totalSelected < 6 || ctx.objScore==null) flags.push("insufficient_data");
  if ((ctx.scene?.passA2 && !ctx.scene?.passB1m) && (ctx.objScore===0)) flags.push("conflict_obj_scene");
  if (ctx.selfLevel && ["Pre-A","A1"].includes(ctx.selfLevel) && (ctx.mapped==="B1-"||ctx.mapped==="B1")) flags.push("self_gap_gt1band");

  return flags;
}

// 6) 证据收集
export function buildEvidence({sceneTags}: {sceneTags: string[]}) {
  const evidence: string[] = [];
  const maxEvidence = 6;

  for (const tag of sceneTags) {
    if (evidence.length >= maxEvidence) break;

    const anchor = SCENE_ANCHORS.find(a => a.id === tag);
    if (anchor) {
      evidence.push(anchor.zh);
    }
  }

  return evidence;
}

// 7) 微档到CEFR映射
export function microBandToCefr(band: Band): CefrLevel {
  if (band === 'A2-' || band === 'A2' || band === 'A2+') return 'A2';
  if (band === 'B1-' || band === 'B1') return 'B1';
  return 'A2'; // 默认值
}

// 8) 计算置信度
export function calculateConfidence(P: Record<Band, number>): number {
  const maxProb = Math.max(...Object.values(P));
  const secondMax = Object.values(P)
    .sort((a, b) => b - a)[1];

  // 置信度 = 最高概率 - 第二高概率
  return Math.min(0.95, maxProb + 0.1 * (maxProb - secondMax));
}

// 9) 主评估函数
export function quickPlacementV1_1(request: QuickPlacementRequestV1_1): QuickPlacementResponseV1_1 {
  const startTime = Date.now();

  // 1. 场景锚点评分
  const scene = scoreScene(request.scene_tags || []);

  // 2. 客观题映射
  const objScore = request.objective_score ?? 0;
  const P_obj = mapObjectiveScore(objScore);

  // 3. 自评先验
  const P_self = mapSelfPrior(request.self_assessed_level);

  // 4. 三信号融合
  const hasObj = request.objective_score !== undefined;
  const P_fused = fuse(scene.P, P_obj, P_self, hasObj);

  // 5. 确定最终结果
  const bands: Band[] = ["A2-","A2","A2+","B1-","B1"];
  const mapped = bands.reduce((a, b) => P_fused[a] > P_fused[b] ? a : b);
  const mappedCefr = microBandToCefr(mapped);

  // 6. 计算置信度
  const confidence = calculateConfidence(P_fused);

  // 7. 生成flags
  const flags = deriveFlags({
    scene,
    objScore: request.objective_score,
    selfLevel: request.self_assessed_level,
    mapped
  });

  // 8. 收集证据
  const evidence = buildEvidence({sceneTags: request.scene_tags || []});

  // 9. 生成推理说明
  const totalAnchors = (request.scene_tags || []).length;
  const objText = request.objective_score !== undefined ? `客观题得分(${request.objective_score}/2)` : '无客观题';
  const selfText = request.self_assessed_level ? `自评(${request.self_assessed_level})` : '无自评';
  const rationale = `基于场景锚点分析(${totalAnchors}个锚点)和${objText}结合${selfText}`;

  // 10. 计算客观题准确率
  const objectiveCorrect = request.objective_score ?? 0;
  const objectiveTotal = 2; // v1.1固定2题

  // 11. 诊断信息（简化版）
  const strongerSkills: string[] = [];
  const weakerSkills: string[] = [];
  const recommendedFocus: string[] = [];

  if (objScore === 2) {
    strongerSkills.push('客观题表现');
  } else if (objScore === 0) {
    weakerSkills.push('客观题需要提升');
    recommendedFocus.push('基础听力与阅读');
  }

  if (scene.passB1m) {
    strongerSkills.push('场景应用能力');
  } else if (!scene.passA1) {
    weakerSkills.push('基础场景能力');
    recommendedFocus.push('日常英语表达');
  }

  return {
    // v1 兼容字段
    mapped_start: mappedCefr,
    confidence,
    breakdown: {
      objective_score: {
        correct: objectiveCorrect,
        total: objectiveTotal,
        accuracy: objectiveCorrect / objectiveTotal
      },
      self_assessment: request.self_assessed_level as CefrLevel,
      fusion_weights: hasObj ? {
        objective: 0.3,
        self_assessment: 0.1
      } : {
        objective: 0,
        self_assessment: 0.2
      }
    },
    diagnostic: {
      stronger_skills: strongerSkills,
      weaker_skills: weakerSkills,
      recommended_focus: recommendedFocus
    },
    metadata: {
      question_count: 2,
      locale: request.locale,
      version: 'v1.1',
      processing_time_ms: Date.now() - startTime
    },

    // v1.1 新增字段
    mapped_start_band: mapped,
    band_distribution: P_fused,
    flags,
    evidence_phrases: evidence,
    rationale,
    shadow_only: false // 默认不是影子模式
  };
}

// 10. 影子模式对比函数
export function shadowModeComparison(request: QuickPlacementRequestV1_1, v1Result: any, v1_1Result: QuickPlacementResponseV1_1) {
  return {
    v1_result: v1Result,
    v1_1_result: v1_1Result,
    comparison: {
      level_match: v1Result.mapped_start === v1_1Result.mapped_start,
      confidence_diff: Math.abs(v1Result.confidence - v1_1Result.confidence),
      band_diff: v1_1Result.mapped_start_band ?
        `v1: ${v1Result.mapped_start} vs v1.1: ${v1_1Result.mapped_start_band}` :
        null,
      flags_new: v1_1Result.flags?.length || 0,
      evidence_count: v1_1Result.evidence_phrases?.length || 0
    }
  };
}