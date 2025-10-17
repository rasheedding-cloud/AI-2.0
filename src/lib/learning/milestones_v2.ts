import type { Band } from '@/types';
import { BAND_PROGRESS_MINUTES } from '@/lib/calc/time';
import { gateByCap } from '@/lib/learning/gates';

// 能力档位定义
export type Band = "Pre-A"|"A1-"|"A1"|"A1+"|"A2-"|"A2"|"A2+"|"B1-"|"B1"|"B1+"|"B2"|"B2+"|"C1";

// 计划上下文
export interface PlanContext {
  startBand: Band;
  targetBand: Band;
  totalWeeks: number;
  minutesPerWeek: number;      // daily_minutes * days_per_week
  track: "work"|"travel"|"study"|"daily"|"exam";
  monthCaps: Band[];           // 已有动态cap序列（长度=months_total，可按周展开）
  startDateISO?: string;
}

// 里程碑类型
export type MilestoneType = "upgrade"|"gate"|"integrate"|"recover";

// 里程碑定义
export interface Milestone {
  index: number;
  startWeek: number;
  endWeek: number;
  cap: Band;                   // 该段上限
  type: MilestoneType;
  focus: string[];             // 3–5 点
  assessment_gate: any;        // 由 gateByCap(cap) 生成
  deliverable: { title: string; checklist: string[] }; // 场景化可观察成果
}

// 功能开关
export const MILESTONE_V2_FEATURES = {
  FEATURE_MILESTONES_V2: process.env.FEATURE_MILESTONES_V2 === 'true',
  MILESTONES_SHADOW: process.env.MILESTONES_SHADOW === 'true',
} as const;

/**
 * 计算总学习分钟数（从起点到目标）
 */
function computeTotalMinutes(startBand: Band, targetBand: Band): number {
  if (startBand === targetBand) {
    return Math.max(1800, BAND_PROGRESS_MINUTES[startBand] ? Math.floor(BAND_PROGRESS_MINUTES[startBand] * 0.5) : 3600);
  }

  const bandOrder = ['Pre-A', 'A1-', 'A1', 'A1+', 'A2-', 'A2', 'A2+', 'B1-', 'B1', 'B1+', 'B2', 'B2+', 'C1'];
  const startIndex = bandOrder.indexOf(startBand);
  const targetIndex = bandOrder.indexOf(targetBand);

  if (startIndex === -1 || targetIndex === -1) return 0;

  const startMinutes = BAND_PROGRESS_MINUTES[startBand] || 0;
  const targetMinutes = BAND_PROGRESS_MINUTES[targetBand] || 0;

  return Math.max(1800, targetMinutes - startMinutes > 0 ? targetMinutes - startMinutes : Math.abs(targetMinutes - startMinutes) * 0.5);
}

/**
 * 将月份cap序列展开为周序列
 */
function expandMonthCapsToWeeks(monthCaps: Band[], totalWeeks: number): Band[] {
  const weeksPerMonth = Math.ceil(totalWeeks / monthCaps.length);
  const weeklyCaps: Band[] = [];

  for (let i = 0; i < totalWeeks; i++) {
    const monthIndex = Math.min(Math.floor(i / weeksPerMonth), monthCaps.length - 1);
    weeklyCaps.push(monthCaps[monthIndex]);
  }

  return weeklyCaps;
}

/**
 * 推导cap变化周（Band锚点）
 */
function deriveCapChangeWeeks(monthCaps: Band[], totalWeeks: number): number[] {
  const weeklyCaps = expandMonthCapsToWeeks(monthCaps, totalWeeks);
  const changeWeeks: number[] = [];

  for (let i = 1; i < weeklyCaps.length; i++) {
    if (weeklyCaps[i] !== weeklyCaps[i-1]) {
      changeWeeks.push(i + 1); // 变化发生在第i+1周
    }
  }

  return changeWeeks;
}

/**
 * 根据周数获取对应的cap
 */
function capAtWeek(monthCaps: Band[], week: number): Band {
  const weeksPerMonth = Math.ceil(monthCaps.length / 4); // 假设平均每月4周
  const monthIndex = Math.min(Math.floor((week - 1) / weeksPerMonth), monthCaps.length - 1);
  return monthCaps[monthIndex];
}

/**
 * 合并锚点数组
 */
function mergeAnchors(anchorArrays: number[][], totalWeeks: number): number[] {
  const allAnchors = anchorArrays.flat().filter(w => w > 0 && w <= totalWeeks);
  return [...new Set(allAnchors)].sort((a, b) => a - b);
}

/**
 * 去重并分散锚点（确保最小间隔）
 */
function dedupeAndSpread(anchors: number[], minGapWeeks: number): number[] {
  if (anchors.length <= 1) return anchors;

  const result = [anchors[0]];
  let lastAdded = anchors[0];

  for (let i = 1; i < anchors.length; i++) {
    const current = anchors[i];
    if (current - lastAdded >= minGapWeeks) {
      result.push(current);
      lastAdded = current;
    }
  }

  return result;
}

/**
 * 将锚点转换为段落
 */
function toSegments(anchors: number[], totalWeeks: number): Array<{start: number, end: number}> {
  const segments: Array<{start: number, end: number}> = [];
  let start = 1;

  for (const anchor of anchors) {
    if (anchor > start) {
      segments.push({ start, end: anchor - 1 });
    }
    start = anchor;
  }

  if (start <= totalWeeks) {
    segments.push({ start, end: totalWeeks });
  }

  return segments;
}

/**
 * 分类里程碑类型
 */
function classifyType(segment: {start: number, end: number}, cap: Band, weekCap: Band): MilestoneType {
  const isCapChange = cap !== weekCap;
  const isLastSegment = segment.end >= segment.start + 2; // 假设这是最后一段

  if (isCapChange) return "upgrade";
  if (isLastSegment) return "gate";
  return "integrate"; // 简化逻辑，暂不处理recover类型
}

/**
 * 根据轨道和cap生成焦点
 */
function focusByTrackAndCap(track: string, cap: Band): string[] {
  const baseFocus = {
    work: {
      'A2-': ['基础商务问候', '简单信息确认', '日常工作交流'],
      'A2': ['邮件读写', '电话沟通', '会议基础参与'],
      'A2+': ['产品介绍', '客户沟通', '简单商务谈判'],
      'B1-': ['会议发言', '工作报告', '团队协作'],
      'B1': ['项目管理', '商务谈判', '跨部门沟通']
    },
    travel: {
      'A2-': ['基础问候', '简单问路', '点餐购物'],
      'A2': ['酒店入住', '交通问询', '紧急求助'],
      'A2+': ['景点介绍', '文化交流', '复杂问路'],
      'B1-': ['深度对话', '当地生活', '文化探讨'],
      'B1': ['商务旅行', '社交活动', '文化交流']
    },
    study: {
      'A2-': ['课堂基础', '简单提问', '作业理解'],
      'A2': ['学术词汇', '课堂讨论', '基础写作'],
      'A2+': ['研究方法', '学术交流', '文献阅读'],
      'B1-': ['学术演讲', '研究报告', '批判思维'],
      'B1': ['学术写作', '研究项目', '学术发表']
    },
    daily: {
      'A2-': ['日常问候', '简单介绍', '基础对话'],
      'A2': ['兴趣爱好', '日常计划', '情感表达'],
      'A2+': ['观点讨论', '故事讲述', '深入交流'],
      'B1-': ['抽象话题', '社会问题', '文化讨论'],
      'B1': ['深度对话', '复杂观点', '逻辑辩论']
    },
    exam: {
      'A2-': ['基础词汇', '简单语法', '听力理解'],
      'A2': ['阅读理解', '写作基础', '口语表达'],
      'A2+': ['复杂语法', '学术词汇', '逻辑推理'],
      'B1-': ['快速阅读', '深度写作', '流利口语'],
      'B1': ['高级技巧', '应试策略', '综合能力']
    }
  };

  return baseFocus[track as keyof typeof baseFocus]?.[cap as keyof typeof baseFocus.work] || ['基础技能', '日常应用', '交流能力'];
}

/**
 * 根据轨道和cap生成可观察成果
 */
function deliverableByTrackAndCap(track: string, cap: Band, type: MilestoneType): {title: string, checklist: string[]} {
  const templates = {
    work: {
      'A2-': {
        title: '完成基础商务问候与信息确认',
        checklist: ['进行商务自我介绍', '确认时间和地点信息', '发送3-4句确认消息']
      },
      'A2': {
        title: '处理日常工作邮件与电话沟通',
        checklist: ['收发工作邮件', '进行电话沟通', '确认工作安排']
      },
      'A2+': {
        title: '完成产品介绍与客户沟通',
        checklist: ['介绍产品特点', '回答客户问题', '处理简单异议']
      },
      'B1-': {
        title: '参与会议讨论与工作汇报',
        checklist: ['在会议中发言', '做简单工作汇报', '参与团队讨论']
      },
      'B1': {
        title: '完成60-90秒结构化更新与商务沟通',
        checklist: ['进行结构化口头更新', '比较两个方案', '写6-8句确认邮件']
      }
    },
    travel: {
      'A2-': {
        title: '完成旅行基础对话与服务咨询',
        checklist: ['进行基础问候', '询问方向信息', '点餐和购物']
      },
      'A2': {
        title: '处理酒店入住与交通问询',
        checklist: ['办理酒店入住', '询问交通信息', '处理简单问题']
      },
      'A2+': {
        title: '完成景点介绍与文化交流对话',
        checklist: ['介绍当地景点', '进行文化交流', '处理复杂问路']
      },
      'B1-': {
        title: '进行深度旅行对话与当地生活交流',
        checklist: ['讨论当地文化', '分享旅行体验', '进行深度对话']
      },
      'B1': {
        title: '完成商务旅行与社交活动交流',
        checklist: ['参与商务会议', '进行社交活动', '处理复杂情境']
      }
    },
    study: {
      'A2-': {
        title: '完成课堂基础参与与作业理解',
        checklist: ['参与课堂互动', '理解作业要求', '进行基础提问']
      },
      'A2': {
        title: '参与学术讨论与基础研究活动',
        checklist: ['参与课堂讨论', '阅读基础文献', '完成简单研究']
      },
      'A2+': {
        title: '完成学术交流与研究方法应用',
        checklist: ['使用研究方法', '进行学术交流', '阅读学术文献']
      },
      'B1-': {
        title: '完成学术演讲与研究报告展示',
        checklist: ['进行学术演讲', '展示研究成果', '回答学术问题']
      },
      'B1': {
        title: '完成1分钟微展示与观点表达',
        checklist: ['结构化展示观点', '给出理由和证据', '完成学习邮件']
      }
    },
    daily: {
      'A2-': {
        title: '完成日常对话与自我介绍',
        checklist: ['进行日常问候', '做简单自我介绍', '讨论天气等话题']
      },
      'A2': {
        title: '讨论兴趣爱好与日常计划',
        checklist: ['讨论兴趣爱好', '制定日常计划', '表达情感和想法']
      },
      'A2+': {
        title: '进行观点讨论与故事讲述',
        checklist: ['表达个人观点', '讲述个人故事', '进行深入交流']
      },
      'B1-': {
        title: '讨论抽象话题与社会问题',
        checklist: ['讨论社会问题', '表达抽象概念', '进行文化讨论']
      },
      'B1': {
        title: '进行深度对话与逻辑辩论',
        checklist: ['进行深度对话', '表达复杂观点', '参与逻辑辩论']
      }
    },
    exam: {
      'A2-': {
        title: '掌握基础词汇与语法应用',
        checklist: ['掌握基础词汇', '应用简单语法', '理解听力内容']
      },
      'A2': {
        title: '完成阅读理解与基础写作',
        checklist: ['理解阅读材料', '完成基础写作', '进行口语表达']
      },
      'A2+': {
        title: '应用复杂语法与学术词汇',
        checklist: ['使用复杂语法', '运用学术词汇', '进行逻辑推理']
      },
      'B1-': {
        title: '完成快速阅读与深度写作',
        checklist: ['快速阅读理解', '进行深度写作', '流利口语表达']
      },
      'B1': {
        title: '掌握高级技巧与应试策略',
        checklist: ['运用高级技巧', '制定应试策略', '展示综合能力']
      }
    }
  };

  const trackTemplates = templates[track as keyof typeof templates];
  const defaultTemplate = {
    title: '完成基础语言应用任务',
    checklist: ['理解任务要求', '完成语言表达', '检查语言准确性']
  };

  return trackTemplates?.[cap as keyof typeof trackTemplates] || defaultTemplate;
}

/**
 * 构建里程碑V2 - 主要入口函数
 */
export function buildMilestonesV2(ctx: PlanContext): Milestone[] {
  // 1) 计算总学时
  const totalMinutes = computeTotalMinutes(ctx.startBand, ctx.targetBand);
  const totalHours = Math.ceil(totalMinutes / 60);

  // 2) 学时锚点（H_BLOCK 26小时，根据 minutesPerWeek 算出大约多少周）
  const H_BLOCK = 26;
  const approxBlocks = Math.max(2, Math.round(totalHours / H_BLOCK));

  // 3) 生成"周级锚点"
  const weeksPerBlock = Math.max(2, Math.round((H_BLOCK * 60) / ctx.minutesPerWeek));
  const hourAnchors = Array.from({length: approxBlocks}, (_,i)=> (i+1)*weeksPerBlock);

  // 4) Band 锚点：当月cap变化的周
  const capAnchors = deriveCapChangeWeeks(ctx.monthCaps, ctx.totalWeeks);

  // 5) Gate 锚点：每个cap区段末尾放 gate
  const gateAnchors = capAnchors.map(w => Math.max(1, w-1));

  // 6) 合并、去重、排序、去过近
  let anchors = mergeAnchors([hourAnchors, capAnchors, gateAnchors], ctx.totalWeeks);
  const minGapWeeks = Math.max(2, Math.floor(ctx.totalWeeks/10));
  anchors = dedupeAndSpread(anchors, minGapWeeks);

  // 7) 拼装里程碑段落
  const segments = toSegments(anchors, ctx.totalWeeks);

  return segments.map((seg, idx) => {
    const cap = capAtWeek(ctx.monthCaps, seg.end);
    const weekCap = capAtWeek(ctx.monthCaps, seg.start);
    const type = classifyType(seg, cap, weekCap);

    return {
      index: idx + 1,
      startWeek: seg.start,
      endWeek: seg.end,
      cap,
      type,
      focus: focusByTrackAndCap(ctx.track, cap),
      assessment_gate: gateByCap(cap),
      deliverable: deliverableByTrackAndCap(ctx.track, cap, type)
    };
  });
}

/**
 * 影子模式对比
 */
export function compareMilestoneVersions(v1: any[], v2: Milestone[]): {
  hasDifferences: boolean;
  differences: string[];
  metrics: {
    v1_count: number;
    v2_count: number;
    avg_weeks_per_stage_v2: number;
  };
} {
  const differences: string[] = [];

  if (v1.length !== v2.length) {
    differences.push(`里程碑数量不同: V1=${v1.length}, V2=${v2.length}`);
  }

  const avgWeeksPerStageV2 = v2.length > 0
    ? v2.reduce((sum, m) => sum + (m.endWeek - m.startWeek + 1), 0) / v2.length
    : 0;

  return {
    hasDifferences: differences.length > 0,
    differences,
    metrics: {
      v1_count: v1.length,
      v2_count: v2.length,
      avg_weeks_per_stage_v2: Math.round(avgWeeksPerStageV2 * 10) / 10
    }
  };
}