export type Language = 'zh' | 'en' | 'ar';
export type CulturalMode = 'sa' | 'scc' | 'none';

export interface Translation {
  common: {
    start: string;
    next: string;
    back: string;
    skip: string;
    loading: string;
    error: string;
    retry: string;
  };
  home: {
    title: string;
    subtitle: string;
    description: string;
    features: {
      personalized: {
        title: string;
        description: string;
      };
      adaptive: {
        title: string;
        description: string;
      };
      intelligent: {
        title: string;
        description: string;
      };
      comprehensive: {
        title: string;
        description: string;
      };
    };
    startButton: string;
    culturalMode: {
      title: string;
      sa: string;
      scc: string;
      none: string;
    };
  };
  languageSelector: {
    title: string;
    chinese: string;
    english: string;
    arabic: string;
  };
}

export const translations: Record<Language, Translation> = {
  zh: {
    common: {
      start: '开始',
      next: '下一步',
      back: '返回',
      skip: '跳过',
      loading: '加载中...',
      error: '出错了',
      retry: '重试'
    },
    home: {
      title: 'AI定制学习方案',
      subtitle: '个性化智能学习体验',
      description: '基于人工智能技术，为您量身定制专属学习计划，让学习更高效、更有趣。',
      features: {
        personalized: {
          title: '个性化定制',
          description: '根据您的学习目标、兴趣和能力，生成专属学习计划'
        },
        adaptive: {
          title: '自适应调整',
          description: '实时跟踪学习进度，动态调整学习内容和难度'
        },
        intelligent: {
          title: '智能推荐',
          description: 'AI驱动的学习资源推荐，精准匹配学习需求'
        },
        comprehensive: {
          title: '全方位评估',
          description: '多维度能力评估，全面了解学习状况'
        }
      },
      startButton: '开始定制学习方案',
      culturalMode: {
        title: '文化模式',
        sa: '沙特阿拉伯',
        scc: '中华文化',
        none: '无特定文化背景'
      }
    },
    languageSelector: {
      title: '语言选择',
      chinese: '中文',
      english: 'English',
      arabic: 'العربية'
    }
  },
  en: {
    common: {
      start: 'Start',
      next: 'Next',
      back: 'Back',
      skip: 'Skip',
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry'
    },
    home: {
      title: 'AI Custom Learning Plan',
      subtitle: 'Personalized Intelligent Learning Experience',
      description: 'Based on artificial intelligence technology, create exclusive learning plans tailored for you, making learning more efficient and enjoyable.',
      features: {
        personalized: {
          title: 'Personalized Customization',
          description: 'Generate exclusive learning plans based on your learning goals, interests, and abilities'
        },
        adaptive: {
          title: 'Adaptive Adjustment',
          description: 'Real-time tracking of learning progress with dynamic adjustment of content and difficulty'
        },
        intelligent: {
          title: 'Intelligent Recommendation',
          description: 'AI-driven learning resource recommendations that precisely match learning needs'
        },
        comprehensive: {
          title: 'Comprehensive Assessment',
          description: 'Multi-dimensional capability assessment for a complete understanding of learning status'
        }
      },
      startButton: 'Start Custom Learning Plan',
      culturalMode: {
        title: 'Cultural Mode',
        sa: 'Saudi Arabian',
        scc: 'Chinese Culture',
        none: 'No Specific Cultural Background'
      }
    },
    languageSelector: {
      title: 'Language Selection',
      chinese: '中文',
      english: 'English',
      arabic: 'العربية'
    }
  },
  ar: {
    common: {
      start: 'ابدأ',
      next: 'التالي',
      back: 'العودة',
      skip: 'تخطي',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      retry: 'إعادة المحاولة'
    },
    home: {
      title: 'خطة التعلم المخصصة بالذكاء الاصطناعي',
      subtitle: 'تجربة تعلم ذكية وشخصية',
      description: 'بناءً على تقنيات الذكاء الاصطناعي، أنشئ خطط تعلم حصرية مصممة خصيصًا لك، مما يجعل التعلم أكثر كفاءة ومتعة.',
      features: {
        personalized: {
          title: 'تخصيص شخصي',
          description: 'توليد خطط تعلم حصرية بناءً على أهدافك التعليمية واهتماماتك وقدراتك'
        },
        adaptive: {
          title: 'تعديل تكيفي',
          description: 'تتبع التقدم التعليمي في الوقت الفعلي مع تعديل ديناميكي للمحتوى والصعوبة'
        },
        intelligent: {
          title: 'توصية ذكية',
          description: 'توصيات موارد التعلم المدفوعة بالذكاء الاصطناعي التي تتطابق بدقة مع احتياجات التعلم'
        },
        comprehensive: {
          title: 'تقييم شامل',
          description: 'تقييم القدرات متعددة الأبعاد لفهم كامل لحالة التعلم'
        }
      },
      startButton: 'ابدأ خطة التعلم المخصصة',
      culturalMode: {
        title: 'الوضع الثقافي',
        sa: 'السعودية',
        scc: 'الثقافة الصينية',
        none: 'لا يوجد خلفية ثقافية محددة'
      }
    },
    languageSelector: {
      title: 'اختيار اللغة',
      chinese: '中文',
      english: 'English',
      arabic: 'العربية'
    }
  }
};

export const defaultLanguage: Language = 'zh';
export const supportedLanguages: Language[] = ['zh', 'en', 'ar'];

export const isRTL = (language: Language): boolean => {
  return language === 'ar';
};

export const getDirection = (language: Language): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr';
};