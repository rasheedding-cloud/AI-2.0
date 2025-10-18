/**
 * QuickPlacement v1 - 题目显示组件
 */

import React, { useState } from 'react';
import { Question } from '@/types/placement';

interface QuickPlacementQuestionsProps {
  questions: Question[];
  userAnswers: number[];
  onAnswerChange: (questionIndex: number, answerIndex: number) => void;
  onSubmit: () => void;
  timeRemainingSeconds: number;
  locale: 'zh' | 'en' | 'ar';
}

const translations = {
  zh: {
    question: '题目',
    of: '/',
    submit: '提交答案',
    timeRemaining: '剩余时间',
    minutes: '分钟',
    seconds: '秒',
    listening: '听音题',
    reading: '阅读题',
    progress: '答题进度',
    unanswered: '未回答',
    answered: '已回答'
  },
  en: {
    question: 'Question',
    of: 'of',
    submit: 'Submit Answers',
    timeRemaining: 'Time Remaining',
    minutes: 'minutes',
    seconds: 'seconds',
    listening: 'Listening',
    reading: 'Reading',
    progress: 'Progress',
    unanswered: 'Unanswered',
    answered: 'Answered'
  },
  ar: {
    question: 'السؤال',
    of: 'من',
    submit: 'إرسال الإجابات',
    timeRemaining: 'الوقت المتبقي',
    minutes: 'دقائق',
    seconds: 'ثوانٍ',
    listening: 'الاستماع',
    reading: 'القراءة',
    progress: 'التقدم',
    unanswered: 'لم يتم الإجابة',
    answered: 'تم الإجابة'
  }
};

export function QuickPlacementQuestions({
  questions,
  userAnswers,
  onAnswerChange,
  onSubmit,
  timeRemainingSeconds,
  locale
}: QuickPlacementQuestionsProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = userAnswers.filter(a => a !== undefined).length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return {
      minutes,
      seconds: remainingSeconds
    };
  };

  const timeLeft = formatTime(timeRemainingSeconds);
  const isTimeLow = timeRemainingSeconds <= 30; // 最后30秒警告

  // 处理答案选择
  const handleAnswerSelect = (answerIndex: number) => {
    onAnswerChange(currentQuestionIndex, answerIndex);

    // 自动进入下一题
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  };

  // 处理上一题/下一题导航
  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // 处理提交
  const handleSubmit = () => {
    // 如果还有未回答的题目，自动补充默认答案
    if (userAnswers.length < questions.length) {
      const completedAnswers = [...userAnswers];
      for (let i = completedAnswers.length; i < questions.length; i++) {
        completedAnswers[i] = 0; // 选择第一个选项作为默认答案
      }
    }
    onSubmit();
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* 头部信息 */}
      <div className=\"flex justify-between items-center mb-6\">
        {/* 题目进度 */}
        <div className=\"text-lg font-semibold text-gray-800\">
          {t.question} {currentQuestionIndex + 1} {t.of} {questions.length}
        </div>

        {/* 剩余时间 */}
        <div className={`flex items-center px-3 py-1 rounded-full ${
          isTimeLow ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
        }`}>
          <svg className=\"w-4 h-4 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\" />
          </svg>
          <span className=\"font-mono text-sm\">
            {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className=\"mb-6\">
        <div className=\"flex justify-between text-sm text-gray-600 mb-2\">
          <span>{t.progress}</span>
          <span>{answeredCount}/{questions.length} {answeredCount === questions.length ? t.answered : t.unanswered}</span>
        </div>
        <div className=\"w-full bg-gray-200 rounded-full h-2\">
          <div
            className=\"bg-blue-600 h-2 rounded-full transition-all duration-300\"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 题目导航 */}
      <div className=\"flex flex-wrap gap-2 mb-6 justify-center\">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => goToQuestion(index)}
            className={`w-10 h-10 rounded-full font-medium transition-colors ${
              index === currentQuestionIndex
                ? 'bg-blue-600 text-white'
                : userAnswers[index] !== undefined
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* 当前题目 */}
      {currentQuestion && (
        <div className=\"bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6\">
          {/* 题目类型和场景 */}
          <div className=\"flex items-center justify-between mb-4\">
            <div className=\"flex items-center space-x-4\">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentQuestion.metadata.skill === 'listening'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentQuestion.metadata.skill === 'listening' ? t.listening : t.reading}
              </span>
              <span className=\"text-sm text-gray-500\">
                {locale === 'zh' ? '场景：' : locale === 'en' ? 'Scene: ' : 'المشهد: '}
                {currentQuestion.metadata.scene}
              </span>
            </div>
          </div>

          {/* 音频播放器（如果是听音题） */}
          {currentQuestion.metadata.skill === 'listening' && (
            <div className=\"mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200\">
              <div className=\"flex items-center space-x-4\">
                <button className=\"p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors\">
                  <svg className=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z\" />
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />
                  </svg>
                </button>
                <div>
                  <p className=\"text-sm font-medium text-purple-800\">
                    {locale === 'zh' ? '点击播放音频' : locale === 'en' ? 'Click to play audio' : 'انقر لتشغيل الصوت'}
                  </p>
                  <p className=\"text-xs text-purple-600\">
                    {locale === 'zh' ? '请仔细听音频内容' : locale === 'en' ? 'Listen carefully to the audio' : 'استمع بعناية إلى الصوت'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 题目文本 */}
          <div className=\"mb-6\">
            <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">
              {currentQuestion.text}
            </h3>
          </div>

          {/* 选项 */}
          <div className=\"space-y-3\">
            {currentQuestion.options.map((option, optionIndex) => {
              const isSelected = userAnswers[currentQuestionIndex] === optionIndex;
              const isCurrent = currentQuestionIndex === questions.length - 1 && userAnswers[currentQuestionIndex] === undefined;

              return (
                <button
                  key={optionIndex}
                  onClick={() => handleAnswerSelect(optionIndex)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className=\"flex items-center\">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className=\"w-2 h-2 bg-white rounded-full\"></div>
                      )}
                    </div>
                    <span className=\"flex-1\">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部按钮 */}
      <div className=\"flex justify-between items-center\">
        <div className=\"flex space-x-4\">
          {/* 上一题按钮 */}
          <button
            onClick={() => goToQuestion(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className=\"px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors\"
          >
            {locale === 'zh' ? '上一题' : locale === 'en' ? 'Previous' : 'السابق'}
          </button>

          {/* 下一题按钮 */}
          <button
            onClick={() => goToQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className=\"px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors\"
          >
            {locale === 'zh' ? '下一题' : locale === 'en' ? 'Next' : 'التالي'}
          </button>
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          className=\"px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg\"
        >
          {isLastQuestion ? t.submit : `${locale === 'zh' ? '完成测试' : locale === 'en' ? 'Finish Test' : 'إنهاء الاختبار'}`}
        </button>
      </div>
    </div>
  );
}

export default QuickPlacementQuestions;