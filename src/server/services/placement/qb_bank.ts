/**
 * QuickPlacement v1 - 题库系统
 * 支持三语种场景锚定（日常/职场/旅行/学术），共10题客观题
 * 每题包含：题干、音频URL、选项、答案、翻译、CEFR映射
 */

export type QuestionLocale = 'zh' | 'en' | 'ar';
export type QuestionBank = Record<QuestionLocale, Question[]>;

export interface Question {
  id: string;
  // 原始语言（英文）内容
  content: {
    text: string;        // 题目文本
    audio_url?: string;  // 音频URL（可选）
    options: string[];   // 选项
    answer: number;      // 正确答案索引
  };
  // 多语言翻译
  translations: {
    zh: {
      text: string;
      options: string[];
    };
    ar: {
      text: string;
      options: string[];
    };
  };
  // CEFR映射
  cefr_map: {
    A1: number;  // 答对A1题数
    A2: number;  // 答对A2题数
    B1: number;  // 答对B1题数
    B2: number;  // 答对B2题数
  };
  // 题目元数据
  metadata: {
    scene: 'daily' | 'work' | 'travel' | 'academic';  // 场景锚定
    domain: string;    // 细分领域
    skill: string;     // 技能类型：listening/reading/vocabulary
  };
}

// 题库定义 - 10道题目覆盖不同场景和难度
const QUESTIONS: Question[] = [
  // A1级别 - 日常场景
  {
    id: 'q001',
    content: {
      text: "Listen: 'Good morning! How are you today?' What should you say?",
      options: ["I'm fine, thank you.", "My name is John.", "I want to go home.", "I don't know."],
      answer: 0
    },
    translations: {
      zh: {
        text: "听：'Good morning! How are you today?' 你应该说什么？",
        options: ["我很好，谢谢。", "我叫约翰。", "我想回家。", "我不知道。"]
      },
      ar: {
        text: "استمع: 'Good morning! How are you today?' ماذا يجب أن تقول؟",
        options: ["أنا بخير، شكرًا.", "اسمي جون.", "أريد أن أذهب إلى المنزل.", "لا أعرف."]
      }
    },
    cefr_map: { A1: 1, A2: 1, B1: 1, B2: 1 },
    metadata: {
      scene: 'daily',
      domain: 'greetings',
      skill: 'listening'
    }
  },

  // A1级别 - 数字理解
  {
    id: 'q002',
    content: {
      text: "Read the sign: 'Exit 15' What number is this?",
      options: ["5", "13", "15", "50"],
      answer: 2
    },
    translations: {
      zh: {
        text: "读标志：'Exit 15' 这是数字几？",
        options: ["5", "13", "15", "50"]
      },
      ar: {
        text: "اقترح اللافتة: 'Exit 15' ما هو هذا الرقم؟",
        options: ["5", "13", "15", "50"]
      }
    },
    cefr_map: { A1: 1, A2: 1, B1: 1, B2: 1 },
    metadata: {
      scene: 'travel',
      domain: 'navigation',
      skill: 'reading'
    }
  },

  // A2级别 - 旅行场景
  {
    id: 'q003',
    content: {
      text: "Listen: 'The train leaves at 8:30 PM.' When does the train leave?",
      options: ["Morning", "Afternoon", "Evening", "Night"],
      answer: 2
    },
    translations: {
      zh: {
        text: "听：'The train leaves at 8:30 PM.' 火车什么时候离开？",
        options: ["早上", "下午", "晚上", "深夜"]
      },
      ar: {
        text: "استمع: 'The train leaves at 8:30 PM.' متى يغادر القطار؟",
        options: ["الصباح", "بعد الظهر", "المساء", "الليل"]
      }
    },
    cefr_map: { A1: 0, A2: 1, B1: 1, B2: 1 },
    metadata: {
      scene: 'travel',
      domain: 'transportation',
      skill: 'listening'
    }
  },

  // A2级别 - 职场场景
  {
    id: 'q004',
    content: {
      text: "Read: 'Please submit your report by Friday.' What is the deadline?",
      options: ["Monday", "Wednesday", "Friday", "Sunday"],
      answer: 2
    },
    translations: {
      zh: {
        text: "读：'Please submit your report by Friday.' 截止日期是什么时候？",
        options: ["周一", "周三", "周五", "周日"]
      },
      ar: {
        text: "اقترح: 'Please submit your report by Friday.' ما هو الموعد النهائي؟",
        options: ["الإثنين", "الأربعاء", "الجمعة", "الأحد"]
      }
    },
    cefr_map: { A1: 0, A2: 1, B1: 1, B2: 1 },
    metadata: {
      scene: 'work',
      domain: 'office',
      skill: 'reading'
    }
  },

  // B1级别 - 学术场景
  {
    id: 'q005',
    content: {
      text: "Listen: 'The research indicates significant correlation between variables.' What is the main topic?",
      options: ["Weather", "Research findings", "Shopping", "Cooking"],
      answer: 1
    },
    translations: {
      zh: {
        text: "听：'The research indicates significant correlation between variables.' 主要话题是什么？",
        options: ["天气", "研究发现", "购物", "烹饪"]
      },
      ar: {
        text: "استمع: 'The research indicates significant correlation between variables.' ما هو الموضوع الرئيسي؟",
        options: ["الطقس", "النتائج البحثية", "التسوق", "الطبخ"]
      }
    },
    cefr_map: { A1: 0, A2: 0, B1: 1, B2: 1 },
    metadata: {
      scene: 'academic',
      domain: 'research',
      skill: 'listening'
    }
  },

  // B1级别 - 职场场景
  {
    id: 'q006',
    content: {
      text: "Read: 'We need to optimize our workflow to increase productivity.' What should be improved?",
      options: ["Break time", "Work process", "Office decor", "Lunch menu"],
      answer: 1
    },
    translations: {
      zh: {
        text: "读：'We need to optimize our workflow to increase productivity.' 需要改进什么？",
        options: ["休息时间", "工作流程", "办公室装饰", "午餐菜单"]
      },
      ar: {
        text: "اقترح: 'We need to optimize our workflow to increase productivity.' ما الذي يجب تحسينه؟",
        options: ["وقت الراحة", "سير العمل", "ديكور المكتب", "قائمة الغداء"]
      }
    },
    cefr_map: { A1: 0, A2: 0, B1: 1, B2: 1 },
    metadata: {
      scene: 'work',
      domain: 'management',
      skill: 'reading'
    }
  },

  // B2级别 - 旅行场景
  {
    id: 'q007',
    content: {
      text: "Listen: 'The itinerary has been modified due to unforeseen circumstances.' What happened to the plan?",
      options: ["It was cancelled", "It was changed", "It was successful", "It was delayed"],
      answer: 1
    },
    translations: {
      zh: {
        text: "听：'The itinerary has been modified due to unforeseen circumstances.' 计划发生了什么？",
        options: ["被取消了", "被修改了", "很成功", "被延迟了"]
      },
      ar: {
        text: "استمع: 'The itinerary has been modified due to unforeseen circumstances.' ماذا حدث للخطة؟",
        options: ["تم إلغاؤها", "تم تعديلها", "كانت ناجحة", "تم تأخيرها"]
      }
    },
    cefr_map: { A1: 0, A2: 0, B1: 0, B2: 1 },
    metadata: {
      scene: 'travel',
      domain: 'planning',
      skill: 'listening'
    }
  },

  // B2级别 - 学术场景
  {
    id: 'q008',
    content: {
      text: "Read: 'The hypothesis was validated through comprehensive empirical analysis.' What does 'empirical' mean?",
      options: ["Theoretical", "Based on observation", "Ancient", "Simple"],
      answer: 1
    },
    translations: {
      zh: {
        text: "读：'The hypothesis was validated through comprehensive empirical analysis.' 'empirical'是什么意思？",
        options: ["理论的", "基于观察的", "古代的", "简单的"]
      },
      ar: {
        text: "اقترح: 'The hypothesis was validated through comprehensive empirical analysis.' ماذا تعني كلمة 'empirical'؟",
        options: ["نظري", "مبني على الملاحظة", "قديم", "بسيط"]
      }
    },
    cefr_map: { A1: 0, A2: 0, B1: 0, B2: 1 },
    metadata: {
      scene: 'academic',
      domain: 'terminology',
      skill: 'reading'
    }
  },

  // B2级别 - 职场场景
  {
    id: 'q009',
    content: {
      text: "Listen: 'We need to leverage our competitive advantages to penetrate new markets.' What is the business goal?",
      options: ["Reduce costs", "Enter new markets", "Hire more staff", "Upgrade technology"],
      answer: 1
    },
    translations: {
      zh: {
        text: "听：'We need to leverage our competitive advantages to penetrate new markets.' 商业目标是什么？",
        options: ["降低成本", "进入新市场", "招聘更多员工", "升级技术"]
      },
      ar: {
        text: "استمع: 'We need to leverage our competitive advantages to penetrate new markets.' ما هو الهدف التجاري؟",
        options: ["تقليل التكاليف", "دخول أسواق جديدة", "توظيف المزيد من الموظفين", "ترقية التكنولوجيا"]
      }
    },
    cefr_map: { A1: 0, A2: 0, B1: 0, B2: 1 },
    metadata: {
      scene: 'work',
      domain: 'strategy',
      skill: 'listening'
    }
  },

  // B1级别 - 日常生活复杂场景
  {
    id: 'q010',
    content: {
      text: "Read: 'Despite the traffic jam, I managed to arrive just in time for the appointment.' What was the situation?",
      options: ["Easy journey", "Heavy traffic but on time", "Missed appointment", "No traffic"],
      answer: 1
    },
    translations: {
      zh: {
        text: "读：'Despite the traffic jam, I managed to arrive just in time for the appointment.' 情况如何？",
        options: ["旅途顺利", "交通拥堵但准时到达", "错过了预约", "没有交通"]
      },
      ar: {
        text: "اقترح: 'Despite the traffic jam, I managed to arrive just in time for the appointment.' ما كانت الحالة؟",
        options: ["رحلة سهلة", "ازدحام مروري ولكن في الوقت المحدد", "فوت الموعد", "لا يوجد ازدحام"]
      }
    },
    cefr_map: { A1: 0, A2: 0, B1: 1, B2: 1 },
    metadata: {
      scene: 'daily',
      domain: 'problem_solving',
      skill: 'reading'
    }
  }
];

/**
 * 获取本地化题库
 */
export function getLocalizedQuestionBank(locale: QuestionLocale): Question[] {
  return QUESTIONS.map(question => {
    if (locale === 'en') {
      return {
        ...question,
        // 英文直接使用原始内容
        text: question.content.text,
        options: question.content.options,
        answer: question.content.answer
      };
    } else {
      return {
        ...question,
        // 使用对应语言的翻译
        text: question.translations[locale].text,
        options: question.translations[locale].options,
        answer: question.content.answer // 答案索引不变
      };
    }
  });
}

/**
 * 获取题库统计信息
 */
export function getQuestionBankStats() {
  const stats = {
    total_questions: QUESTIONS.length,
    by_scene: {
      daily: 0,
      work: 0,
      travel: 0,
      academic: 0
    },
    by_skill: {
      listening: 0,
      reading: 0,
      vocabulary: 0
    },
    by_difficulty: {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0
    }
  };

  QUESTIONS.forEach(question => {
    // 统计场景
    stats.by_scene[question.metadata.scene]++;

    // 统计技能
    stats.by_skill[question.metadata.skill]++;

    // 统计难度（基于CEFR映射）
    Object.entries(question.cefr_map).forEach(([level, count]) => {
      if (count > 0) {
        stats.by_difficulty[level as keyof typeof stats.by_difficulty]++;
      }
    });
  });

  return stats;
}

/**
 * 根据场景筛选题目
 */
export function filterQuestionsByScene(questions: Question[], scene: Question['metadata']['scene']): Question[] {
  return questions.filter(q => q.metadata.scene === scene);
}

/**
 * 根据技能筛选题目
 */
export function filterQuestionsBySkill(questions: Question[], skill: Question['metadata']['skill']): Question[] {
  return questions.filter(q => q.metadata.skill === skill);
}