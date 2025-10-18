/**
 * QuickPlacement v1 - 自评组件
 */

import React from 'react';

interface QuickPlacementSelfAssessmentProps {
  assessment: any;
  onChange: (assessment: any) => void;
  onSubmit: () => void;
  onBack: () => void;
  locale: 'zh' | 'en' | 'ar';
}

const translations = {
  zh: {
    title: '自我评估',
    subtitle: '请评估您在各个技能上的英语水平',
    skills: {
      listening: '听力',
      reading: '阅读',
      speaking: '口语',
      writing: '写作',
      overall: '整体水平'
    },
    levels: {
      A1: 'A1 - 基础水平',
      A2: 'A2 - 日常交流',
      B1: 'B1 - 职场应用',
      B2: 'B2 - 流利交流'
    },
    descriptions: {
      A1: '能理解并使用熟悉的日常表达和非常简单的短语',
      A2: '能理解独立生活场景中常用表达和句子',
      B1: '能理解工作、学习、休闲等场景中的要点',
      B2: '能以流利、自发的方式进行互动，理解复杂文本'
    },
    submit: '完成评估',
    back: '返回',
    optional: '（可选）'
  },
  en: {
    title: 'Self-Assessment',
    subtitle: 'Please assess your English proficiency in each skill area',
    skills: {
      listening: 'Listening',
      reading: 'Reading',
      speaking: 'Speaking',
      writing: 'Writing',
      overall: 'Overall'
    },
    levels: {
      A1: 'A1 - Basic',
      A2: 'A2 - Daily Communication',
      B1: 'B1 - Professional Use',
      B2: 'B2 - Fluent Communication'
    },
    descriptions: {
      A1: 'Can understand and use familiar everyday expressions and very simple phrases',
      A2: 'Can understand sentences and frequently used expressions related to areas of most immediate relevance',
      B1: 'Can understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure',
      B2: 'Can interact with a degree of fluency and spontaneity that makes regular interaction with native speakers quite possible'
    },
    submit: 'Complete Assessment',
    back: 'Back',
    optional: '(Optional)'
  },
  ar: {
    title: 'التقييم الذاتي',
    subtitle: 'يرجى تقييم مستواك في اللغة الإنجليزية في كل مهارة',
    skills: {
      listening: 'الاستماع',
      reading: 'القراءة',
      speaking: 'التحدث',
      writing: 'الكتابة',
      overall: 'المستوى العام'
    },
    levels: {
      A1: 'A1 - أساسي',
      A2: 'A2 - التواصل اليومي',
      B1: 'B1 - الاستخدام المهني',
      B2: 'B2 - التواصل الوثيق'
    },
    descriptions: {
      A1: 'يمكن فهم واستخدام التعبيرات المألوفة والعبارات البسيطة جدًا',
      A2: 'يمكن فهم الجمل والتعبيرات شائعة الاستخدام المتعلقة بالمناطق الأكثر صلة',
      B1: 'يمكن فهم النقاط الرئيسية للمدخلات القياسية الواضحة في المواضيع المألوفة',
      B2: 'يمكن التفاعل بدرجة من الطلاقة والعفوية تجعل التفاعل المنتظم مع الناطقين الأصليين ممكنًا تمامًا'
    },
    submit: 'إكمال التقييم',
    back: 'العودة',
    optional: '(اختياري)'
  }
};

const CEFR_LEVELS: Array<'A1' | 'A2' | 'B1' | 'B2'> = ['A1', 'A2', 'B1', 'B2'];

export function QuickPlacementSelfAssessment({
  assessment,
  onChange,
  onSubmit,
  onBack,
  locale
}: QuickPlacementSelfAssessmentProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  // 初始化评估数据
  const currentAssessment = assessment || {
    listening: 'A2',
    reading: 'A2',
    speaking: 'A2',
    writing: 'A2',
    overall: 'A2'
  };

  // 处理技能水平变化
  const handleSkillChange = (skill: keyof typeof currentAssessment, level: 'A1' | 'A2' | 'B1' | 'B2') => {
    const newAssessment = {
      ...currentAssessment,
      [skill]: level
    };

    // 如果更新了单项技能，自动调整整体水平为平均值
    if (skill !== 'overall') {
      const skills = ['listening', 'reading', 'speaking', 'writing'] as const;
      const levels = skills.map(s => CEFR_LEVELS.indexOf(newAssessment[s] as 'A1' | 'A2' | 'B1' | 'B2'));
      const averageIndex = Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length);
      newAssessment.overall = CEFR_LEVELS[Math.max(0, Math.min(CEFR_LEVELS.length - 1, averageIndex))];
    }

    onChange(newAssessment);
  };

  // 获取水平描述
  const getLevelDescription = (level: 'A1' | 'A2' | 'B1' | 'B2') => {
    return t.descriptions[level];
  };

  // 获取水平的颜色主题
  const getLevelColor = (level: 'A1' | 'A2' | 'B1' | 'B2') => {
    const colors = {
      A1: 'bg-green-100 text-green-800 border-green-200',
      A2: 'bg-blue-100 text-blue-800 border-blue-200',
      B1: 'bg-purple-100 text-purple-800 border-purple-200',
      B2: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[level];
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* 标题区域 */}
      <div className=\"text-center mb-8\">
        <h1 className=\"text-3xl font-bold text-gray-900 mb-2\">
          {t.title} {t.optional}
        </h1>
        <p className=\"text-xl text-gray-600 mb-4\">
          {t.subtitle}
        </p>
        <div className=\"w-24 h-1 bg-green-600 mx-auto rounded-full\"></div>
      </div>

      {/* 说明文字 */}
      <div className=\"bg-green-50 border border-green-200 rounded-lg p-6 mb-8\">
        <p className=\"text-gray-800 leading-relaxed\">
          {locale === 'zh'
            ? '自我评估将帮助我们更好地了解您的英语水平。请根据您的实际情况，选择最符合的等级。这将与客观题测试结果进行智能融合，得出更准确的评估结果。'
            : locale === 'en'
            ? 'Self-assessment helps us better understand your English proficiency. Please select the level that best matches your actual situation. This will be intelligently fused with the objective test results for a more accurate assessment.'
            : 'يساعد التقييم الذاتي على فهم مستواك في اللغة الإنجليزية بشكل أفضل. يرجى اختيار المستوى الذي يتطابق مع حالتك الفعلية. سيتم دمج هذا مع نتائج الاختبار الموضوعي للحصول على تقييم أكثر دقة.'
          }
        </p>
      </div>

      {/* 技能评估表单 */}
      <div className=\"space-y-6 mb-8\">
        {Object.entries(t.skills).map(([skillKey, skillName]) => {
          const skill = skillKey as keyof typeof currentAssessment;
          const currentLevel = currentAssessment[skill] as 'A1' | 'A2' | 'B1' | 'B2';

          return (
            <div key={skill} className=\"bg-white border border-gray-200 rounded-lg shadow-sm p-6\">
              <div className=\"flex items-center justify-between mb-4\">
                <h3 className=\"text-lg font-semibold text-gray-900\">
                  {skillName}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getLevelColor(currentLevel)}`}>
                  {t.levels[currentLevel]}
                </span>
              </div>

              {/* 水平描述 */}
              <div className={`mb-4 p-3 rounded-lg ${getLevelColor(currentLevel)}`}>
                <p className=\"text-sm\">{getLevelDescription(currentLevel)}</p>
              </div>

              {/* 级别选择 */}
              <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3\">
                {CEFR_LEVELS.map((level) => {
                  const isSelected = currentLevel === level;
                  const isRTL = locale === 'ar';

                  return (
                    <button
                      key={level}
                      onClick={() => handleSkillChange(skill, level)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className=\"font-semibold mb-1\">{level}</div>
                      <div className=\"text-xs text-gray-500\">
                        {level === 'A1' && (locale === 'zh' ? '基础' : locale === 'en' ? 'Basic' : 'أساسي')}
                        {level === 'A2' && (locale === 'zh' ? '日常' : locale === 'en' ? 'Daily' : 'يومي')}
                        {level === 'B1' && (locale === 'zh' ? '职场' : locale === 'en' ? 'Professional' : 'مهني')}
                        {level === 'B2' && (locale === 'zh' ? '流利' : locale === 'en' ? 'Fluent' : 'وثيق')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部按钮 */}
      <div className=\"flex justify-between items-center\">
        <button
          onClick={onBack}
          className=\"px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg\"
        >
          {t.back}
        </button>

        <button
          onClick={onSubmit}
          className=\"px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg\"
        >
          {t.submit}
        </button>
      </div>
    </div>
  );
}

export default QuickPlacementSelfAssessment;