/**
 * QuickPlacement v1 - 进度条组件
 */

import React from 'react';

type Step = 'questions' | 'self_assessment';

interface QuickPlacementProgressProps {
  currentStep: Step;
  progressPercentage: number;
  timeRemainingSeconds: number;
  locale: 'zh' | 'en' | 'ar';
}

const translations = {
  zh: {
    steps: {
      questions: '客观题测试',
      self_assessment: '自我评估'
    },
    timeRemaining: '剩余时间',
    completed: '已完成'
  },
  en: {
    steps: {
      questions: 'Objective Test',
      self_assessment: 'Self-Assessment'
    },
    timeRemaining: 'Time Remaining',
    completed: 'Completed'
  },
  ar: {
    steps: {
      questions: 'الاختبار الموضوعي',
      self_assessment: 'التقييم الذاتي'
    },
    timeRemaining: 'الوقت المتبقي',
    completed: 'مكتمل'
  }
};

export function QuickPlacementProgress({
  currentStep,
  progressPercentage,
  timeRemainingSeconds,
  locale
}: QuickPlacementProgressProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeRemainingSeconds <= 30;
  const timeColor = isTimeLow ? 'text-red-600' : 'text-gray-600';

  // 步骤定义
  const steps = [
    { key: 'questions', label: t.steps.questions },
    { key: 'self_assessment', label: t.steps.self_assessment }
  ];

  // 计算当前步骤索引
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className={`mb-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* 步骤指示器 */}
      <div className=\"flex items-center justify-center mb-4\">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <React.Fragment key={step.key}>
              {/* 步骤圆圈 */}
              <div className=\"flex flex-col items-center\">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 13l4 4L19 7\" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-xs mt-1 ${
                  isCurrent ? 'text-blue-600 font-medium' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 进度条 */}
      <div className=\"mb-4\">
        <div className=\"flex justify-between text-sm text-gray-600 mb-2\">
          <span>{locale === 'zh' ? '测试进度' : locale === 'en' ? 'Test Progress' : 'تقدم الاختبار'}</span>
          <span>{progressPercentage}% {t.completed}</span>
        </div>
        <div className=\"w-full bg-gray-200 rounded-full h-2 overflow-hidden\">
          <div
            className=\"bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out\"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* 时间显示 */}
      {currentStep === 'questions' && (
        <div className=\"flex justify-center items-center space-x-2\">
          <svg className={`w-5 h-5 ${timeColor}`} fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\" />
          </svg>
          <span className={`text-sm font-medium ${timeColor}`}>
            {t.timeRemaining}: {formatTime(timeRemainingSeconds)}
          </span>
          {isTimeLow && (
            <span className=\"text-xs text-red-600 font-medium animate-pulse\">
              {locale === 'zh' ? '时间不多了！' : locale === 'en' ? 'Time is running out!' : 'الوقت ينفد!'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default QuickPlacementProgress;