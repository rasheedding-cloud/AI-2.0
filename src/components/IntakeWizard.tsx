'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IntakeFormData, ValidationError } from '@/types/intake';
import { StepIndicator } from './wizard/StepIndicator';
import { GenderStep } from './wizard/GenderStep';
import { IdentityStep } from './wizard/IdentityStep';
import { NativeLanguageStep } from './wizard/NativeLanguageStep';
import { GoalStep } from './wizard/GoalStep';
import { ScheduleStep } from './wizard/ScheduleStep';
import { FoundationStep } from './wizard/FoundationStep';
import { validateStep, validateIntakeData } from '@/utils/validation';
import { STEPS } from '@/constants/intake';

interface IntakeWizardProps {
  onComplete?: (data: IntakeFormData) => void;
  onSave?: (data: Partial<IntakeFormData>) => void;
  initialData?: Partial<IntakeFormData>;
  className?: string;
}

export const IntakeWizard: React.FC<IntakeWizardProps> = ({
  onComplete,
  onSave,
  initialData = {},
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<IntakeFormData>>(initialData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // 自动保存功能
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        onSave?.(formData);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, onSave]);

  // 键盘导航支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowLeft' && currentStep > 1) {
          e.preventDefault();
          handlePrevious();
        } else if (e.key === 'ArrowRight' && currentStep < STEPS.length) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const validateCurrentStep = useCallback(() => {
    const stepErrors = validateStep(currentStep, formData);
    setErrors(stepErrors);
    return stepErrors.length === 0;
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;

    const newCompletedSteps = [...completedSteps];
    if (!newCompletedSteps.includes(currentStep)) {
      newCompletedSteps.push(currentStep);
      setCompletedSteps(newCompletedSteps);
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      setErrors([]);
    } else {
      // 完成所有步骤
      handleComplete();
    }
  }, [currentStep, completedSteps, validateCurrentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors([]);
    }
  }, [currentStep]);

  const handleStepChange = useCallback((step: number) => {
    // 只允许跳转到已完成或下一步
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
      setErrors([]);
    }
  }, [currentStep, completedSteps]);

  const handleFieldChange = useCallback((field: keyof IntakeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);

    // 最终验证
    const finalErrors = validateIntakeData(formData as IntakeFormData);
    if (finalErrors.length > 0) {
      setErrors(finalErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onComplete?.(formData as IntakeFormData);
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to complete intake:', error);
      setErrors([{ field: 'general', message: '提交失败，请重试' }]);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onComplete]);

  const renderCurrentStep = () => {
    const commonProps = {
      value: formData,
      onChange: handleFieldChange,
      onNext: handleNext,
      onPrevious: handlePrevious,
      errors,
      isFirstStep: currentStep === 1,
      isLastStep: currentStep === STEPS.length,
    };

    switch (currentStep) {
      case 1:
        return <GenderStep {...commonProps} />;
      case 2:
        return <IdentityStep {...commonProps} />;
      case 3:
        return <NativeLanguageStep {...commonProps} />;
      case 4:
        return <GoalStep {...commonProps} />;
      case 5:
        return <ScheduleStep {...commonProps} />;
      case 6:
        return <FoundationStep {...commonProps} />;
      default:
        return null;
    }
  };

  const renderSummary = () => {
    const data = formData as IntakeFormData;

    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            信息采集完成！
          </h2>
          <p className="text-gray-600">
            我们已经成功收集您的学习信息，正在为您制定个性化学习计划。
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 您的学习信息摘要
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-blue-100">
              <span className="text-gray-600">性别</span>
              <span className="font-medium text-gray-900">
                {data.gender === 'male' ? '男性' : data.gender === 'female' ? '女性' : '其他'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-blue-100">
              <span className="text-gray-600">身份</span>
              <span className="font-medium text-gray-900">
                {data.identity === 'professional' ? '职场人士' :
                 data.identity === 'university' ? '大学生' : '高中生'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-blue-100">
              <span className="text-gray-600">母语</span>
              <span className="font-medium text-gray-900">{data.nativeLanguage}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-blue-100">
              <span className="text-gray-600">学习目标</span>
              <span className="font-medium text-gray-900 max-w-md text-right">
                {data.learningGoal?.substring(0, 50)}...
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-blue-100">
              <span className="text-gray-600">学习安排</span>
              <span className="font-medium text-gray-900">
                每天{data.schedule?.dailyHours}小时，每周{data.schedule?.weeklyDays}天
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">英语基础</span>
              <span className="font-medium text-gray-900">
                {data.isBeginner ? '零基础/初学者' : '有一定基础'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowSummary(false)}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            返回修改
          </button>
          <button
            onClick={() => onComplete?.(data)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            开始学习
          </button>
        </div>
      </div>
    );
  };

  if (showSummary) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="container mx-auto py-8">
          {renderSummary()}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="container mx-auto py-8">
        {/* 进度指示器 */}
        <div className="mb-8">
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* 步骤导航 */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => handleStepChange(step.id)}
                disabled={step.id > currentStep + 1 && !completedSteps.includes(step.id - 1)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : completedSteps.includes(step.id)
                      ? 'text-green-600 hover:bg-green-50'
                      : step.id <= currentStep + 1
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                步骤 {step.id}
              </button>
            ))}
          </div>
        </div>

        {/* 当前步骤内容 */}
        <div className="transition-all duration-300 ease-in-out">
          {renderCurrentStep()}
        </div>

        {/* 全局错误提示 */}
        {errors.some(e => e.field === 'general') && (
          <div className="fixed top-4 right-4 max-w-sm p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-900">错误</h4>
                <p className="text-sm text-red-700 mt-1">
                  {errors.find(e => e.field === 'general')?.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 提交状态 */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">正在提交...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};