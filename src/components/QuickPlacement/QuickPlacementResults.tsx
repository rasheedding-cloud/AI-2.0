/**
 * QuickPlacement v1 - 结果展示组件
 */

import React from 'react';
import { QuickPlacementResponse } from '@/types/placement';

interface QuickPlacementResultsProps {
  result: QuickPlacementResponse;
  onRestart: () => void;
  locale: 'zh' | 'en' | 'ar';
}

const translations = {
  zh: {
    title: '测试完成！',
    subtitle: '您的英语水平评估结果',
    yourLevel: '建议起点',
    confidence: '评估置信度',
    objectiveScore: '客观题得分',
    correct: '正确',
    of: '/',
    total: '总题数',
    selfAssessment: '自评水平',
    notProvided: '未提供',
    strongerSkills: '较强技能',
    weakerSkills: '较弱技能',
    recommendedFocus: '建议重点',
    restart: '重新测试',
    continue: '继续学习',
    fusionWeights: '权重分配',
    objective: '客观题',
    selfAssessmentText: '自评',
    diagnostic: '能力诊断',
    metadata: '测试信息',
    // v1.1 友好标签
    suggestedStart: '起点建议',
    'A2-': '基础-起步',
    'A2': '基础',
    'A2+': '基础+',
    'B1-': '进阶-起步',
    'B1': '进阶',
    disclaimer: '这只是起点估计，您仍会获得个性化学习方案',
    // v1.1 温和提示
    flags: {
      insufficient_data: '建议多选您熟悉的场景，再完成2题小测，结果会更准。',
      conflict_obj_scene: '您的自述较强，但小测较弱，建议从较稳妥的起点开始，首周再复核。',
      self_gap_gt1band: '您的自我感受与小测差距较大，先从建议起点开始，我们会动态调整。'
    }
  },
  en: {
    title: 'Test Complete!',
    subtitle: 'Your English proficiency assessment results',
    yourLevel: 'Recommended Starting Point',
    confidence: 'Assessment Confidence',
    objectiveScore: 'Objective Score',
    correct: 'Correct',
    of: 'of',
    total: 'Total',
    selfAssessment: 'Self-Assessment',
    notProvided: 'Not provided',
    strongerSkills: 'Stronger Skills',
    weakerSkills: 'Weaker Skills',
    recommendedFocus: 'Recommended Focus',
    restart: 'Restart Test',
    continue: 'Continue Learning',
    fusionWeights: 'Weight Distribution',
    objective: 'Objective',
    selfAssessmentText: 'Self-Assessment',
    diagnostic: 'Skill Diagnostic',
    metadata: 'Test Information',
    // v1.1 友好标签
    suggestedStart: 'Starting Point Recommendation',
    'A2-': 'Basic-Start',
    'A2': 'Basic',
    'A2+': 'Basic+',
    'B1-': 'Intermediate-Start',
    'B1': 'Intermediate',
    disclaimer: 'This is just a starting point estimate, you will still receive a personalized plan',
    // v1.1 温和提示
    flags: {
      insufficient_data: 'Please select more scenes you are familiar with, and complete the 2-question test for better accuracy.',
      conflict_obj_scene: 'Your self-description is strong but test results are weaker. We recommend starting from a more conservative point and reviewing in the first week.',
      self_gap_gt1band: 'Your self-perception differs significantly from test results. Start from the recommended point and we will adjust dynamically.'
    }
  },
  ar: {
    title: 'اكتمل الاختبار!',
    subtitle: 'نتائج تقييم إتقانك للغة الإنجليزية',
    yourLevel: 'نقطة البداية المقترحة',
    confidence: 'مستوى الثقة',
    objectiveScore: 'درجة الاختبار الموضوعي',
    correct: 'صحيح',
    of: 'من',
    total: 'الإجمالي',
    selfAssessment: 'التقييم الذاتي',
    notProvided: 'لم يتم توفيره',
    strongerSkills: 'المهارات الأقوى',
    weakerSkills: 'المهارات الأضعف',
    recommendedFocus: 'التركيز الموصى به',
    restart: 'إعادة الاختبار',
    continue: 'متابعة التعلم',
    fusionWeights: 'توزيع الأوزان',
    objective: 'موضوعي',
    selfAssessmentText: 'ذاتي',
    diagnostic: 'تشخيص المهارات',
    metadata: 'معلومات الاختبار',
    // v1.1 友好标签
    suggestedStart: 'توصية نقطة البداية',
    'A2-': 'أساسي-بداية',
    'A2': 'أساسي',
    'A2+': 'أساسي+',
    'B1-': 'متوسط-بداية',
    'B1': 'متوسط',
    disclaimer: 'هذا مجرد تقدير لنقطة البداية، ستحصل على خطة شخصية',
    // v1.1 温和提示
    flags: {
      insufficient_data: 'يرجى اختيار المزيد من المشاهد التي تعرفها، وإكمال اختبار السؤالين للحصول على نتائج أكثر دقة.',
      conflict_obj_scene: 'وصفك الذاتي قوي ولكن نتائج الاختبار ضعيفة. نوصي بالبدء من نقطة أكثر تحفظًا ومراجعتها في الأسبوع الأول.',
      self_gap_gt1band: 'إدراكك الذاتي يختلف بشكل كبير عن نتائج الاختبار. ابدأ من النقطة المقترحة وسنقوم بالتعديل ديناميكيًا.'
    }
  }
};

// v1.1 微档颜色映射
const MICRO_BAND_COLORS = {
  'A2-': 'bg-green-500',
  'A2': 'bg-blue-500',
  'A2+': 'bg-indigo-500',
  'B1-': 'bg-purple-500',
  'B1': 'bg-orange-500'
};

// v1 向后兼容的颜色映射
const LEVEL_COLORS = {
  A1: 'bg-green-500',
  A2: 'bg-blue-500',
  B1: 'bg-purple-500',
  B2: 'bg-orange-500'
};

// v1.1 微档描述（友好文案，无CEFR术语）
const MICRO_BAND_DESCRIPTIONS = {
  zh: {
    'A2-': '基础 - 开始建立英语学习基础',
    'A2': '进阶-起步 - 能够进行日常基础交流',
    'A2+': '进阶 - 在熟悉场景中表达自如',
    'B1-': '高级-起步 - 能够处理专业场景沟通',
    'B1': '高级 - 在工作中有效使用英语'
  },
  en: {
    'A2-': 'Basic - Starting to build English foundation',
    'A2': 'Intermediate-Start - Can handle basic daily communication',
    'A2+': 'Intermediate - Express yourself confidently in familiar situations',
    'B1-': 'Advanced-Start - Can handle professional communication scenarios',
    'B1': 'Advanced - Use English effectively in professional contexts'
  },
  ar: {
    'A2-': 'أساسي - بدء بناء أساس اللغة الإنجليزية',
    'A2': 'متوسط-بداية - يمكن التعامل مع التواصل اليومي الأساسي',
    'A2+': 'متوسط - التعبير عن نفسك بثقة في المواقف المألوفة',
    'B1-': 'متقدم-بداية - يمكن التعامل مع سيناريوهات التواصل المهنية',
    'B1': 'متقدم - استخدام اللغة الإنجليزية بفعالية في السياقات المهنية'
  }
};

// v1 向后兼容的CEFR描述
const LEVEL_DESCRIPTIONS = {
  zh: {
    A1: '基础水平 - 能够使用简单的英语进行基本交流',
    A2: '日常交流 - 能够在熟悉场景中进行独立交流',
    B1: '职场应用 - 能够在工作场景中进行有效沟通',
    B2: '流利交流 - 能够自如地进行复杂话题讨论'
  },
  en: {
    A1: 'Basic - Can use simple English for basic communication',
    A2: 'Daily Communication - Can communicate independently in familiar situations',
    B1: 'Professional Use - Can communicate effectively in work scenarios',
    B2: 'Fluent Communication - Can discuss complex topics with ease'
  },
  ar: {
    A1: 'أساسي - يمكن استخدام الإنجليزية البسيطة للتواصل الأساسي',
    A2: 'التواصل اليومي - يمكن التواصل بشكل مستقل في المواقف المألوفة',
    B1: 'الاستخدام المهني - يمكن التواصل بفعالية في سيناريوهات العمل',
    B2: 'التواصل الوثيق - يمكن مناقشة المواضيع المعقدة بسهولة'
  }
};

export function QuickPlacementResults({
  result,
  onRestart,
  locale
}: QuickPlacementResultsProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const confidencePercentage = Math.round(result.confidence * 100);
  const accuracyPercentage = Math.round(result.breakdown.objective_score.accuracy * 100);

  // v1.1 检查是否有微档数据
  const hasV1_1Data = result.mapped_start_band && result.band_distribution;
  const displayBand = hasV1_1Data ? result.mapped_start_band : result.mapped_start;
  const isMicroBand = hasV1_1Data && ['A2-', 'A2', 'A2+', 'B1-', 'B1'].includes(displayBand);

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* 成功标志和标题 */}
      <div className=\"text-center mb-8\">
        <div className=\"inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4\">
          <svg className=\"w-8 h-8 text-green-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
          </svg>
        </div>
        <h1 className=\"text-3xl font-bold text-gray-900 mb-2\">
          {t.title}
        </h1>
        <p className=\"text-xl text-gray-600 mb-4\">
          {t.subtitle}
        </p>
        <div className=\"w-24 h-1 bg-green-600 mx-auto rounded-full\"></div>
      </div>

      {/* 主要结果卡片 */}
      <div className=\"bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl shadow-lg p-8 mb-8\">
        <div className=\"text-center mb-6\">
          <h2 className=\"text-2xl font-semibold text-gray-900 mb-4\">
            {t.yourLevel}
          </h2>

          {/* 等级显示 */}
          <div className=\"inline-flex items-center justify-center mb-4\">
            <div className={`w-20 h-20 ${LEVEL_COLORS[result.mapped_start]} rounded-full flex items-center justify-center shadow-lg`}>
              <span className=\"text-2xl font-bold text-white\">{result.mapped_start}</span>
            </div>
          </div>

          {/* 等级描述 */}
          <p className=\"text-lg text-gray-700 mb-4 max-w-2xl mx-auto\">
            {LEVEL_DESCRIPTIONS[locale][result.mapped_start]}
          </p>

          {/* 置信度 */}
          <div className=\"flex items-center justify-center space-x-4\">
            <span className=\"text-gray-600\">{t.confidence}:</span>
            <div className=\"flex items-center\">
              <div className=\"w-32 bg-gray-200 rounded-full h-2 mr-3\">
                <div
                  className=\"bg-blue-600 h-2 rounded-full transition-all duration-500\"
                  style={{ width: `${confidencePercentage}%` }}
                ></div>
              </div>
              <span className=\"font-semibold text-gray-800\">{confidencePercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className=\"grid md:grid-cols-2 gap-8 mb-8\">
        {/* 客观题得分 */}
        <div className=\"bg-white border border-gray-200 rounded-lg shadow-sm p-6\">
          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">{t.objectiveScore}</h3>
          <div className=\"space-y-3\">
            <div className=\"flex justify-between items-center\">
              <span className=\"text-gray-600\">{locale === 'zh' ? '正确率' : locale === 'en' ? 'Accuracy' : 'الدقة'}:</span>
              <span className=\"font-semibold text-gray-800\">{accuracyPercentage}%</span>
            </div>
            <div className=\"flex justify-between items-center\">
              <span className=\"text-gray-600\">{t.correct}:</span>
              <span className=\"font-semibold text-gray-800\">{result.breakdown.objective_score.correct} {t.of} {result.breakdown.objective_score.total}</span>
            </div>
            <div className=\"w-full bg-gray-200 rounded-full h-2 mt-2\">
              <div
                className=\"bg-green-500 h-2 rounded-full transition-all duration-500\"
                style={{ width: `${accuracyPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 自评结果 */}
        <div className=\"bg-white border border-gray-200 rounded-lg shadow-sm p-6\">
          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">{t.selfAssessment}</h3>
          <div className=\"text-center py-4\">
            {result.breakdown.self_assessment ? (
              <>
                <div className={`inline-flex items-center justify-center w-16 h-16 ${LEVEL_COLORS[result.breakdown.self_assessment]} rounded-full mb-3`}>
                  <span className=\"text-xl font-bold text-white\">{result.breakdown.self_assessment}</span>
                </div>
                <p className=\"text-gray-700\">{LEVEL_DESCRIPTIONS[locale][result.breakdown.self_assessment]}</p>
              </>
            ) : (
              <p className=\"text-gray-500 italic\">{t.notProvided}</p>
            )}
          </div>
        </div>
      </div>

      {/* 融合权重 */}
      {result.breakdown.fusion_weights.self_assessment > 0 && (
        <div className=\"bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8\">
          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">{t.fusionWeights}</h3>
          <div className=\"space-y-3\">
            <div>
              <div className=\"flex justify-between items-center mb-1\">
                <span className=\"text-gray-600\">{t.objective}:</span>
                <span className=\"font-semibold text-gray-800\">{Math.round(result.breakdown.fusion_weights.objective * 100)}%</span>
              </div>
              <div className=\"w-full bg-gray-200 rounded-full h-2\">
                <div
                  className=\"bg-blue-500 h-2 rounded-full transition-all duration-500\"
                  style={{ width: `${result.breakdown.fusion_weights.objective * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className=\"flex justify-between items-center mb-1\">
                <span className=\"text-gray-600\">{t.selfAssessmentText}:</span>
                <span className=\"font-semibold text-gray-800\">{Math.round(result.breakdown.fusion_weights.self_assessment * 100)}%</span>
              </div>
              <div className=\"w-full bg-gray-200 rounded-full h-2\">
                <div
                  className=\"bg-green-500 h-2 rounded-full transition-all duration-500\"
                  style={{ width: `${result.breakdown.fusion_weights.self_assessment * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 能力诊断 */}
      <div className=\"bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8\">
        <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">{t.diagnostic}</h3>
        <div className=\"grid md:grid-cols-3 gap-6\">
          {/* 较强技能 */}
          <div>
            <h4 className=\"font-medium text-green-800 mb-2 flex items-center\">
              <svg className=\"w-5 h-5 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z\" />
              </svg>
              {t.strongerSkills}
            </h4>
            <ul className=\"space-y-1 text-sm text-gray-700\">
              {result.diagnostic.stronger_skills.length > 0 ? (
                result.diagnostic.stronger_skills.map((skill, index) => (
                  <li key={index} className=\"flex items-center\">
                    <span className=\"w-2 h-2 bg-green-500 rounded-full mr-2\"></span>
                    {skill}
                  </li>
                ))
              ) : (
                <li className=\"text-gray-500 italic\">{locale === 'zh' ? '无明显优势' : locale === 'en' ? 'No significant strengths' : 'لا توجد مزايا واضحة'}</li>
              )}
            </ul>
          </div>

          {/* 较弱技能 */}
          <div>
            <h4 className=\"font-medium text-orange-800 mb-2 flex items-center\">
              <svg className=\"w-5 h-5 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z\" />
              </svg>
              {t.weakerSkills}
            </h4>
            <ul className=\"space-y-1 text-sm text-gray-700\">
              {result.diagnostic.weaker_skills.length > 0 ? (
                result.diagnostic.weaker_skills.map((skill, index) => (
                  <li key={index} className=\"flex items-center\">
                    <span className=\"w-2 h-2 bg-orange-500 rounded-full mr-2\"></span>
                    {skill}
                  </li>
                ))
              ) : (
                <li className=\"text-gray-500 italic\">{locale === 'zh' ? '无明显弱项' : locale === 'en' ? 'No significant weaknesses' : 'لا توجد نقاط ضعف واضحة'}</li>
              )}
            </ul>
          </div>

          {/* 建议重点 */}
          <div>
            <h4 className=\"font-medium text-blue-800 mb-2 flex items-center\">
              <svg className=\"w-5 h-5 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13 10V3L4 14h7v7l9-11h-7z\" />
              </svg>
              {t.recommendedFocus}
            </h4>
            <ul className=\"space-y-1 text-sm text-gray-700\">
              {result.diagnostic.recommended_focus.map((focus, index) => (
                <li key={index} className=\"flex items-center\">
                  <span className=\"w-2 h-2 bg-blue-500 rounded-full mr-2\"></span>
                  {focus}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* v1.1 友好标签和提示 */}
      {hasV1_1Data && (
        <>
          {/* 友好的微档标签 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t.suggestedStart}
            </h3>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 ${MICRO_BAND_COLORS[result.mapped_start_band!]} rounded-full mb-3`}>
                <span className="text-xl font-bold text-white">
                  {t[result.mapped_start_band! as keyof typeof t]}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{t.disclaimer}</p>
            </div>
          </div>

          {/* Flags 提示 */}
          {result.flags && result.flags.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                温和提示
              </h3>
              <div className="space-y-2">
                {result.flags.map((flag, index) => (
                  <div key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-yellow-800 text-sm">
                      {t.flags[flag as keyof typeof t.flags]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 证据短语 */}
          {result.evidence_phrases && result.evidence_phrases.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                基于以下场景评估
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.evidence_phrases.map((phrase, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 操作按钮 */}
      <div className=\"flex flex-col sm:flex-row gap-4 justify-center\">
        <button
          onClick={onRestart}
          className=\"px-8 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg\"
        >
          {t.restart}
        </button>
        <button
          className=\"px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg\"
        >
          {t.continue}
        </button>
      </div>
    </div>
  );
}

export default QuickPlacementResults;