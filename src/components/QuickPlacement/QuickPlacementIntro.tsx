/**
 * QuickPlacement v1 - 介绍页面组件
 */

import React from 'react';

interface QuickPlacementIntroProps {
  locale: 'zh' | 'en' | 'ar';
  onStart: () => void;
  onSkip: () => void;
  onGoToSelfAssessment: () => void;
}

const translations = {
  zh: {
    title: '3分钟英语水平快测',
    subtitle: '快速评估您的英语水平，获得个性化学习建议',
    description: '通过10道精心设计的题目，我们将帮助您确定最适合的英语学习起点。',
    features: [
      '✓ 场景化题目，贴近实际应用',
      '✓ 客观题评分，准确可靠',
      '✓ 可选自评，智能融合',
      '✓ 只需3分钟，快速便捷'
    ],
    startButton: '开始测试',
    selfAssessmentButton: '直接自评',
    skipButton: '跳过测试',
    note: '测试结果仅供参考，正式学习将以更详细的评估为准。'
  },
  en: {
    title: '3-Minute English Placement Test',
    subtitle: 'Quickly assess your English level and get personalized learning recommendations',
    description: 'Through 10 carefully designed questions, we\'ll help you determine the most suitable starting point for your English learning journey.',
    features: [
      '✓ Scenario-based questions for real-world application',
      '✓ Objective scoring for accurate results',
      '✓ Optional self-assessment with intelligent fusion',
      '✓ Only 3 minutes, quick and convenient'
    ],
    startButton: 'Start Test',
    selfAssessmentButton: 'Self-Assessment Only',
    skipButton: 'Skip Test',
    note: 'Test results are for reference only. Formal learning will be based on more detailed assessments.'
  },
  ar: {
    title: 'اختبار تحديد المستوى الإنجليزي في 3 دقائق',
    subtitle: 'قيم بسرعة مستواك في اللغة الإنجليزية واحصل على توصيات تعليمية مخصصة',
    description: 'من خلال 10 أسئلة مصممة بعناية، سنساعدك على تحديد نقطة البداية الأنسب لرحلة تعلم اللغة الإنجليزية.',
    features: [
      '✓ أسئلة قائمة على السيناريوهات للتطبيق في العالم الحقيقي',
      '✓ تقييم موضوعي لنتائج دقيقة',
      '✓ تقييم ذاتي اختياري مع دمج ذكي',
      '✓ فقط 3 دقائق، سريع ومريح'
    ],
    startButton: 'ابدأ الاختبار',
    selfAssessmentButton: 'التقييم الذاتي فقط',
    skipButton: 'تخطي الاختبار',
    note: 'نتائج الاختبار للمرجعية فقط. التعلم الرسمي سيستند إلى تقييمات أكثر تفصيلاً.'
  }
};

export function QuickPlacementIntro({
  locale,
  onStart,
  onSkip,
  onGoToSelfAssessment
}: QuickPlacementIntroProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  return (
    <div className={`max-w-2xl mx-auto p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* 标题区域 */}
      <div className=\"text-center mb-8\">
        <h1 className=\"text-3xl font-bold text-gray-900 mb-2\">
          {t.title}
        </h1>
        <p className=\"text-xl text-gray-600 mb-4\">
          {t.subtitle}
        </p>
        <div className=\"w-24 h-1 bg-blue-600 mx-auto rounded-full\"></div>
      </div>

      {/* 描述 */}
      <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8\">
        <p className=\"text-gray-800 leading-relaxed\">
          {t.description}
        </p>
      </div>

      {/* 特点列表 */}
      <div className=\"bg-gray-50 rounded-lg p-6 mb-8\">
        <h2 className=\"text-lg font-semibold text-gray-900 mb-4\">
          {locale === 'zh' ? '测试特点' : locale === 'en' ? 'Test Features' : 'مميزات الاختبار'}
        </h2>
        <ul className=\"space-y-3\">
          {t.features.map((feature, index) => (
            <li key={index} className=\"text-gray-700 flex items-start\">
              <span className=\"mr-2\">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 按钮区域 */}
      <div className=\"flex flex-col sm:flex-row gap-4 justify-center mb-6\">
        <button
          onClick={onStart}
          className=\"px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg\"
        >
          {t.startButton}
        </button>

        <button
          onClick={onGoToSelfAssessment}
          className=\"px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg\"
        >
          {t.selfAssessmentButton}
        </button>

        <button
          onClick={onSkip}
          className=\"px-8 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg\"
        >
          {t.skipButton}
        </button>
      </div>

      {/* 注意事项 */}
      <div className=\"text-center\">
        <p className=\"text-sm text-gray-500 italic\">
          {t.note}
        </p>
      </div>

      {/* 时间指示器 */}
      <div className=\"flex justify-center items-center mt-8 space-x-4 text-gray-600\">
        <div className=\"flex items-center\">
          <svg className=\"w-5 h-5 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\" />
          </svg>
          <span className=\"text-sm\">{locale === 'zh' ? '预计时间：3分钟' : locale === 'en' ? 'Estimated time: 3 minutes' : 'الوقت المقدر: 3 دقائق'}</span>
        </div>

        <div className=\"flex items-center\">
          <svg className=\"w-5 h-5 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z\" />
          </svg>
          <span className=\"text-sm\">{locale === 'zh' ? '题目数量：10题' : locale === 'en' ? 'Questions: 10' : 'الأسئلة: 10'}</span>
        </div>
      </div>
    </div>
  );
}

export default QuickPlacementIntro;