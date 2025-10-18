/**
 * QuickPlacement v1.1 - 题库与场景锚点系统
 * 支持三语种场景锚定（work/travel/study/daily），仅2题计分
 * 防泄题设计：题干与选项纯文本，选项随机，答案仅服务端保存
 */

import {
  validateQBankContract,
  validateObjectives,
  validateSceneAnchors,
  type ObjectiveItem,
  type SceneAnchor
} from './qb_schema';

export type Track = "work"|"travel"|"study"|"daily";
export type Skill = "l"|"s"|"r"|"w";  // 听/说/读/写
export type Band = "A2-"|"A2"|"A2+"|"B1-"|"B1";

// 为了向后兼容，保留旧接口定义
export interface SceneAnchorLegacy {
  id: string;
  band_hint: "A1"|"A2"|"B1-";
  tracks: Track[];
  skill: Skill;
  zh: string;
  en: string;
  ar: string; // RTL
}

// 16个场景锚点（混排A1/A2/B1-；避免关键词暴露层级）
export const SCENE_ANCHORS: SceneAnchor[] = [
  // A1（4个）
  { id:"a1_confirm_single_step", band_hint:"A1", tracks:["work","daily"], skill:"s",
    zh:"能确认一个单步任务（时间/动作）", en:"Confirm a single-step task (time/action)", ar:"تأكيد مهمة خطوة واحدة (الوقت/الإجراء)" },
  { id:"a1_3_4_sentence_msg", band_hint:"A1", tracks:["work","daily","study"], skill:"w",
    zh:"能写3–4句简短确认消息", en:"Write a 3–4 sentence confirmation message", ar:"كتابة رسالة تأكيد من 3–4 جمل" },
  { id:"a1_spelling_names_time", band_hint:"A1", tracks:["work","travel"], skill:"s",
    zh:"能拼写姓名和时间并复述", en:"Spell names/times and repeat back", ar:"تهجئة الأسماء/الأوقات وإعادة الصياغة" },
  { id:"a1_basic_greeting_info", band_hint:"A1", tracks:["daily","travel"], skill:"s",
    zh:"能礼貌问候并给出基本信息", en:"Greet politely and give basic info", ar:"تحية مهذبة وتقديم معلومات أساسية" },

  // A2（6个）
  { id:"a2_clarify_3step_task", band_hint:"A2", tracks:["work","study"], skill:"s",
    zh:"能澄清≤3步任务并复述要点", en:"Clarify ≤3-step task and recap key points", ar:"توضيح مهمة بثلاث خطوات أو أقل وتلخيص النقاط" },
  { id:"a2_short_plan_45s", band_hint:"A2", tracks:["work","study","daily"], skill:"s",
    zh:"能在30–45秒说明今日计划", en:"Explain today's plan in 30–45s", ar:"شرح خطة اليوم خلال 30–45 ثانية" },
  { id:"a2_polite_rephrase", band_hint:"A2", tracks:["work","daily"], skill:"s",
    zh:"能礼貌请求对方重述并确认", en:"Politely ask to rephrase and confirm", ar:"طلب إعادة الصياغة بأدب والتأكيد" },
  { id:"a2_read_service_notice", band_hint:"A2", tracks:["travel","daily"], skill:"r",
    zh:"能读懂服务/公告并抓取时间地点", en:"Read a notice and extract time/place", ar:"قراءة إشعار واستخراج الوقت/المكان" },
  { id:"a2_write_4_5_confirm", band_hint:"A2", tracks:["work","study","daily"], skill:"w",
    zh:"能写4–5句确认（含时间/责任/下一步）", en:"Write 4–5 sentence confirmation (time/owner/next)", ar:"كتابة تأكيد من 4–5 جمل (الوقت/المسؤول/الخطوة التالية)" },
  { id:"a2_handle_counter_issue", band_hint:"A2", tracks:["travel","daily"], skill:"s",
    zh:"能在柜台说明问题并提出请求", en:"Describe an issue at a counter and request help", ar:"شرح مشكلة عند شباك الخدمة وطلب المساعدة" },

  // B1-（6个）
  { id:"b1m_standup_60_90s", band_hint:"B1-", tracks:["work","study"], skill:"s",
    zh:"能做60–90秒结构化更新（背景→状态→下一步）", en:"Do a 60–90s structured update (context→status→next)", ar:"تقديم تحديث من 60–90 ثانية (خلفية→حالة→الخطوة التالية)" },
  { id:"b1m_compare_options_reason", band_hint:"B1-", tracks:["work","daily"], skill:"s",
    zh:"能比较两个方案并给出理由/建议", en:"Compare two options and give reasons/advice", ar:"مقارنة خيارين مع ذكر الأسباب/النصيحة" },
  { id:"b1m_email_6_8_confirm", band_hint:"B1-", tracks:["work","study"], skill:"w",
    zh:"能写6–8句确认/说明邮件（含理由与下一步）", en:"Write a 6–8 sentence confirmation/explanatory email", ar:"كتابة بريد من 6–8 جمل (تأكيد/توضيح)" },
  { id:"b1m_handle_complaint_simple", band_hint:"B1-", tracks:["travel","daily"], skill:"s",
    zh:"能用结构化方式处理简单投诉", en:"Handle a simple complaint in a structured way", ar:"التعامل مع شكوى بسيطة بشكل منظم" },
  { id:"b1m_read_short_report", band_hint:"B1-", tracks:["work","study"], skill:"r",
    zh:"能从短报告中提取问题与下一步", en:"Extract problems and next steps from a short report", ar:"استخراج المشكلات والخطوات التالية من تقرير قصير" },
  { id:"b1m_reasoned_suggestion", band_hint:"B1-", tracks:["work","study","daily"], skill:"s",
    zh:"能提出建议并给出1–2个理由", en:"Make a suggestion with 1–2 reasons", ar:"تقديم اقتراح مع سبب أو سببين" },
];

// 客观题：仅2题计分（scored:true）。听力用TTS生成20–30s音频，语速标注。
export const OBJECTIVES = {
  listening_q1: {
    id: "listening_q1",
    scored: true,
    level_hint: "A2", // 110–130 wpm
    transcript_en: "Hi Omar, the client meeting moved from Tuesday 2pm to Wednesday 10am. Please prepare the slides and confirm with Sara.",
    listening_speed_wpm: {
      A2: { min: 110, max: 130 },
      "B1-": { min: 120, max: 140 }
    },
    options: {
      a: { zh:"会议改到周二下午2点", en:"Meeting moved to Tuesday 2pm", ar:"تم نقل الاجتماع إلى الثلاثاء 2 مساءً" },
      b: { zh:"会议改到周三上午10点", en:"Meeting moved to Wednesday 10am", ar:"تم نقل الاجتماع إلى الأربعاء 10 صباحًا" }, // correct
      c: { zh:"会议取消", en:"Meeting is canceled", ar:"تم إلغاء الاجتماع" },
      d: { zh:"需要重新选地点", en:"Location needs to change", ar:"يجب تغيير المكان" }
    },
    correct: "b"
  },
  reading_q1: {
    id: "reading_q1",
    scored: true,
    level_hint: "A2+",
    passage_en: "Team update: Ahmed will send the draft by 5pm. Nora reviews in the morning. If approved, we share the final version on Friday.",
    question_en: "When will the final version be shared?",
    options: {
      a: { zh:"周四", en:"Thursday", ar:"الخميس" },
      b: { zh:"周五", en:"Friday", ar:"الجمعة" }, // correct
      c: { zh:"今天下午", en:"Today 5pm", ar:"اليوم ٥ مساءً" },
      d: { zh:"明天上午", en:"Tomorrow morning", ar:"غدًا صباحًا" }
    },
    correct: "b"
  }
};

// 题目接口（兼容现有系统）
export interface Question {
  id: string;
  content: {
    text: string;
    audio_url?: string;
    options: string[];
    answer: number;
  };
  translations: {
    zh: { text: string; options: string[]; };
    ar: { text: string; options: string[]; };
  };
  cefr_map: { A1: number; A2: number; B1: number; B2: number; };
  metadata: {
    scene: 'daily' | 'work' | 'travel' | 'academic';
    domain: string;
    skill: string;
    scored: boolean;
    listening_speed_wpm?: {
      A2: { min: number; max: number };
      'B1-': { min: number; max: number };
    };
    difficulty_score: number;
  };
}

// 防泄题渲染：转换为现有Question格式
export function convertToLegacyQuestions(): Question[] {
  const questions: Question[] = [];

  // 听力题
  questions.push({
    id: OBJECTIVES.listening_q1.id,
    content: {
      text: "听下面的内容并选择正确答案",
      audio_url: "/api/audio/listening_q1", // TTS生成
      options: [
        OBJECTIVES.listening_q1.options.a.zh,
        OBJECTIVES.listening_q1.options.b.zh,
        OBJECTIVES.listening_q1.options.c.zh,
        OBJECTIVES.listening_q1.options.d.zh
      ],
      answer: 1 // b选项
    },
    translations: {
      zh: {
        text: "听下面的内容并选择正确答案",
        options: [
          OBJECTIVES.listening_q1.options.a.zh,
          OBJECTIVES.listening_q1.options.b.zh,
          OBJECTIVES.listening_q1.options.c.zh,
          OBJECTIVES.listening_q1.options.d.zh
        ]
      },
      ar: {
        text: "استمع إلى المحتوى التالي واختر الإجابة الصحيحة",
        options: [
          OBJECTIVES.listening_q1.options.a.ar,
          OBJECTIVES.listening_q1.options.b.ar,
          OBJECTIVES.listening_q1.options.c.ar,
          OBJECTIVES.listening_q1.options.d.ar
        ]
      }
    },
    cefr_map: { A1: 0, A2: 1, B1: 1, B2: 0 },
    metadata: {
      scene: 'work',
      domain: 'communication',
      skill: 'listening',
      scored: true,
      listening_speed_wpm: OBJECTIVES.listening_q1.listening_speed_wpm,
      difficulty_score: 2
    }
  });

  // 阅读题
  questions.push({
    id: OBJECTIVES.reading_q1.id,
    content: {
      text: `读以下内容：${OBJECTIVES.reading_q1.passage_en}\n\n问题：${OBJECTIVES.reading_q1.question_en}`,
      options: [
        OBJECTIVES.reading_q1.options.a.zh,
        OBJECTIVES.reading_q1.options.b.zh,
        OBJECTIVES.reading_q1.options.c.zh,
        OBJECTIVES.reading_q1.options.d.zh
      ],
      answer: 1 // b选项
    },
    translations: {
      zh: {
        text: `读以下内容：${OBJECTIVES.reading_q1.passage_en}\n\n问题：${OBJECTIVES.reading_q1.question_en}`,
        options: [
          OBJECTIVES.reading_q1.options.a.zh,
          OBJECTIVES.reading_q1.options.b.zh,
          OBJECTIVES.reading_q1.options.c.zh,
          OBJECTIVES.reading_q1.options.d.zh
        ]
      },
      ar: {
        text: `اقرأ المحتوى التالي: ${OBJECTIVES.reading_q1.passage_en}\n\nالسؤال: ${OBJECTIVES.reading_q1.question_en}`,
        options: [
          OBJECTIVES.reading_q1.options.a.ar,
          OBJECTIVES.reading_q1.options.b.ar,
          OBJECTIVES.reading_q1.options.c.ar,
          OBJECTIVES.reading_q1.options.d.ar
        ]
      }
    },
    cefr_map: { A1: 0, A2: 1, B1: 1, B2: 0 },
    metadata: {
      scene: 'work',
      domain: 'communication',
      skill: 'reading',
      scored: true,
      difficulty_score: 2
    }
  });

  return questions;
}

// 获取场景锚点的本地化文本
export function getLocalizedSceneAnchor(anchorId: string, locale: 'zh' | 'en' | 'ar'): string | null {
  const anchor = SCENE_ANCHORS.find(a => a.id === anchorId);
  if (!anchor) return null;

  return anchor[locale];
}

// 获取所有场景锚点
export function getAllSceneAnchors(): SceneAnchor[] {
  return SCENE_ANCHORS;
}

// 根据轨道筛选场景锚点
export function filterAnchorsByTrack(anchors: SceneAnchor[], track: Track): SceneAnchor[] {
  return anchors.filter(anchor => anchor.tracks.includes(track));
}

// 根据技能筛选场景锚点
export function filterAnchorsBySkill(anchors: SceneAnchor[], skill: Skill): SceneAnchor[] {
  return anchors.filter(anchor => anchor.skill === skill);
}

// 获取计分题目（仅2题）
export function getScoredQuestions(): Question[] {
  return convertToLegacyQuestions().filter(q => q.metadata.scored);
}

// 随机化选项顺序（防泄题）
export function randomizeOptions(options: string[]): string[] {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 获取随机化的题目（前端渲染用）
export function getQuestionsForFrontend(locale: 'zh' | 'en' | 'ar'): Array<{
  id: string;
  text: string;
  audio_url?: string;
  options: string[];
  type: 'listening' | 'reading';
}> {
  const questions = convertToLegacyQuestions();

  return questions.map(q => {
    const localizedText = locale === 'zh' ? q.translations.zh.text : q.translations.ar.text;
    const localizedOptions = locale === 'zh' ? q.translations.zh.options : q.translations.ar.options;

    return {
      id: q.id,
      text: localizedText,
      audio_url: q.content.audio_url,
      options: randomizeOptions(localizedOptions), // 随机化选项顺序
      type: q.metadata.skill === 'listening' ? 'listening' : 'reading' as const
    };
  });
}

// 验证答案（服务端使用）
export function validateAnswer(questionId: string, userAnswer: string): boolean {
  const question = convertToLegacyQuestions().find(q => q.id === questionId);
  if (!question) return false;

  const correctOption = question.content.options[question.content.answer];
  return correctOption === userAnswer;
}

// 获取本地化题库（兼容现有系统）
export function getLocalizedQuestionBank(locale: 'zh' | 'en' | 'ar'): QuestionLocale[] {
  const questions = convertToLegacyQuestions();

  return questions.map(q => {
    const localizedText = locale === 'zh' ? q.content.text :
                         locale === 'en' ? q.content.text :
                         q.translations.ar.text;

    const localizedOptions = locale === 'zh' ? q.translations.zh.options :
                             locale === 'en' ? q.content.options :
                             q.translations.ar.options;

    // 确保选项数组存在
    if (!localizedOptions || !Array.isArray(localizedOptions)) {
      throw new Error(`Localized options not found for question ${q.id} in locale ${locale}`);
    }

    return {
      id: q.id,
      text: localizedText,
      audio_url: q.content.audio_url,
      options: randomizeOptions(localizedOptions), // 随机化选项顺序
      type: q.metadata.skill === 'listening' ? 'listening' : 'reading' as const
    };
  });
}

// 本地化题目接口
export interface QuestionLocale {
  id: string;
  text: string;
  audio_url?: string;
  options: string[];
  type: 'listening' | 'reading';
}

// ============================================================================
// 运行时契约校验 - 启动时验证数据完整性
// ============================================================================
console.log('🔍 开始校验QuickPlacement题库契约...');

try {
  // 校验客观题
  const validatedObjectives = validateObjectives(OBJECTIVES);
  console.log(`✅ 客观题校验通过: ${validatedObjectives.length} 题`);

  // 校验场景锚点
  const validatedAnchors = validateSceneAnchors(SCENE_ANCHORS);
  console.log(`✅ 场景锚点校验通过: ${validatedAnchors.length} 个锚点`);

  // 详细统计
  const stats = {
    objectives: {
      total: validatedObjectives.length,
      scored: validatedObjectives.filter(o => o.scored).length,
      listening: validatedObjectives.filter(o => o.transcript_en).length,
      reading: validatedObjectives.filter(o => o.passage_en).length
    },
    anchors: {
      total: validatedAnchors.length,
      A1: validatedAnchors.filter(a => a.band_hint === 'A1').length,
      A2: validatedAnchors.filter(a => a.band_hint === 'A2').length,
      'B1-': validatedAnchors.filter(a => a.band_hint === 'B1-').length
    }
  };

  console.log('📊 题库统计:', stats);
  console.log('🎉 QuickPlacement题库契约校验完成');

} catch (error) {
  console.error('❌ QuickPlacement题库契约校验失败:');
  console.error(error);

  // 在开发环境中抛出错误，在生产环境中记录警告
  if (process.env.NODE_ENV === 'development') {
    throw error;
  } else {
    console.warn('⚠️ 题库契约校验失败，但继续运行生产环境');
  }
}