/**
 * QuickPlacement v1 - 主组件
 * 3分钟可选快测，支持三语种和自评融合
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Question, QuickPlacementRequest, QuickPlacementResponse } from '@/types/placement';
import { QuickPlacementIntro } from './QuickPlacementIntro';
import { QuickPlacementQuestions } from './QuickPlacementQuestions';
import { QuickPlacementSelfAssessment } from './QuickPlacementSelfAssessment';
import { QuickPlacementResults } from './QuickPlacementResults';
import { QuickPlacementProgress } from './QuickPlacementProgress';

type Step = 'intro' | 'questions' | 'self_assessment' | 'results';

export interface QuickPlacementProps {
  locale?: 'zh' | 'en' | 'ar';
  trackHint?: 'daily' | 'work' | 'travel' | 'academic';
  onComplete?: (result: QuickPlacementResponse) => void;
  onSkip?: () => void;
  className?: string;
}

export function QuickPlacement({
  locale = 'zh',
  trackHint,
  onComplete,
  onSkip,
  className = ''
}: QuickPlacementProps) {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selfAssessment, setSelfAssessment] = useState<any>(null);
  const [result, setResult] = useState<QuickPlacementResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(180); // 3分钟

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentStep === 'questions' && timeRemainingSeconds > 0) {
      interval = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            // 时间到，自动提交
            handleSubmitQuestions();
            return 0;
          }
          return prev - 1;
        });
        setTimeSpentSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, timeRemainingSeconds]);

  // 加载题库
  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/placement/questions?locale=${locale}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '加载题库失败');
      }

      setQuestions(data.data.questions);
      setCurrentStep('questions');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  // 开始测试
  const handleStart = useCallback(() => {
    loadQuestions();
  }, [loadQuestions]);

  // 跳过测试
  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  // 提交答案
  const handleSubmitQuestions = useCallback(async () => {
    if (userAnswers.length < questions.length) {
      // 补充未答题目的默认值（选择第一个选项）
      const completedAnswers = [...userAnswers];
      for (let i = completedAnswers.length; i < questions.length; i++) {
        completedAnswers.push(0);
      }
      setUserAnswers(completedAnswers);
      await submitEvaluation(completedAnswers);
    } else {
      await submitEvaluation(userAnswers);
    }
  }, [userAnswers, questions]);

  // 提交评估
  const submitEvaluation = useCallback(async (answers: number[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const requestData: QuickPlacementRequest = {
        locale,
        user_answers: answers,
        self_assessment: selfAssessment,
        track_hint: trackHint,
        metadata: {
          time_spent_seconds: timeSpentSeconds,
          device_type: 'desktop' // 可以通过User-Agent检测
        }
      };

      const response = await fetch('/api/placement/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '评估失败');
      }

      // 检查是否是影子模式结果
      if (data.data.new_result) {
        setResult(data.data.new_result);
      } else {
        setResult(data.data);
      }

      setCurrentStep('results');

      if (onComplete) {
        onComplete(data.data.new_result || data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '评估失败');
    } finally {
      setIsLoading(false);
    }
  }, [locale, selfAssessment, trackHint, timeSpentSeconds, onComplete]);

  // 处理答案更新
  const handleAnswerChange = useCallback((questionIndex: number, answerIndex: number) => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = answerIndex;
      return newAnswers;
    });
  }, []);

  // 处理自评更新
  const handleSelfAssessmentChange = useCallback((assessment: any) => {
    setSelfAssessment(assessment);
  }, []);

  // 直接进入自评（跳过客观题）
  const handleGoToSelfAssessment = useCallback(() => {
    setCurrentStep('self_assessment');
  }, []);

  // 重新开始
  const handleRestart = useCallback(() => {
    setCurrentStep('intro');
    setQuestions([]);
    setUserAnswers([]);
    setSelfAssessment(null);
    setResult(null);
    setError(null);
    setTimeSpentSeconds(0);
    setTimeRemainingSeconds(180);
  }, []);

  // 计算进度百分比
  const getProgressPercentage = useCallback(() => {
    switch (currentStep) {
      case 'intro':
        return 0;
      case 'questions':
        return Math.round((userAnswers.length / questions.length) * 50); // 50%用于客观题
      case 'self_assessment':
        return 70; // 20%用于自评
      case 'results':
        return 100;
      default:
        return 0;
    }
  }, [currentStep, userAnswers.length, questions.length]);

  const isRTL = locale === 'ar';

  return (
    <div className={`quick-placement ${isRTL ? 'rtl' : 'ltr'} ${className}`}>
      {/* 进度条 */}
      {currentStep !== 'intro' && currentStep !== 'results' && (
        <QuickPlacementProgress
          currentStep={currentStep}
          progressPercentage={getProgressPercentage()}
          timeRemainingSeconds={timeRemainingSeconds}
          locale={locale}
        />
      )}

      {/* 错误显示 */}
      {error && (
        <div className=\"mb-4 p-4 bg-red-50 border border-red-200 rounded-lg\">
          <p className=\"text-red-800\">{error}</p>
          <button
            onClick={handleRestart}
            className=\"mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700\"
          >
            重新开始
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className=\"flex justify-center items-center py-8\">
          <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600\"></div>
          <span className=\"ml-2\">加载中...</span>
        </div>
      )}

      {/* 步骤渲染 */}
      {!isLoading && !error && (
        <>
          {currentStep === 'intro' && (
            <QuickPlacementIntro
              locale={locale}
              onStart={handleStart}
              onSkip={handleSkip}
              onGoToSelfAssessment={handleGoToSelfAssessment}
            />
          )}

          {currentStep === 'questions' && (
            <QuickPlacementQuestions
              questions={questions}
              userAnswers={userAnswers}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleSubmitQuestions}
              timeRemainingSeconds={timeRemainingSeconds}
              locale={locale}
            />
          )}

          {currentStep === 'self_assessment' && (
            <QuickPlacementSelfAssessment
              assessment={selfAssessment}
              onChange={handleSelfAssessmentChange}
              onSubmit={() => submitEvaluation(userAnswers)}
              onBack={() => setCurrentStep('questions')}
              locale={locale}
            />
          )}

          {currentStep === 'results' && result && (
            <QuickPlacementResults
              result={result}
              onRestart={handleRestart}
              locale={locale}
            />
          )}
        </>
      )}
    </div>
  );
}

export default QuickPlacement;