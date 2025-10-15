'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WizardStepProps } from '@/types/intake';

const SUGGESTED_GOALS = [
  '提高职场英语沟通能力，能够流利地进行商务会议和邮件往来',
  '通过英语考试（如雅思、托福、四六级等），获得理想成绩',
  '提升日常口语交流能力，能够自信地与外国朋友交流',
  '扩大词汇量，提高阅读理解能力，能够阅读英文原版书籍',
  '准备出国留学或工作，需要全面提升英语能力',
  '兴趣爱好，希望能够无字幕观看美剧、电影和YouTube视频',
];

export const GoalStep: React.FC<WizardStepProps> = ({
  value,
  onChange,
  onNext,
  onPrevious,
  errors,
  isFirstStep,
  isLastStep,
}) => {
  const [goal, setGoal] = useState(value || '');
  const [charCount, setCharCount] = useState(value?.length || 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasError = errors.some(e => e.field === 'learningGoal');

  useEffect(() => {
    // 自动调整文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [goal]);

  const handleGoalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= 500) {
      setGoal(newValue);
      setCharCount(newValue.length);
      onChange(newValue);
    }
  };

  const handleSuggestedGoalClick = (suggestedGoal: string) => {
    setGoal(suggestedGoal);
    setCharCount(suggestedGoal.length);
    onChange(suggestedGoal);
  };

  const handleSubmit = () => {
    if (goal.trim().length >= 10) {
      onNext();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="space-y-6">
        {/* 主要输入区域 */}
        <div>
          <label htmlFor="learning-goal" className="block text-sm font-medium text-gray-700 mb-2">
            请描述您的英语学习目标
          </label>
          <div className="relative">
            <textarea
              id="learning-goal"
              ref={textareaRef}
              value={goal}
              onChange={handleGoalChange}
              onKeyDown={handleKeyDown}
              placeholder="例如：我想在6个月内能够用英语进行日常对话，看懂英文电影..."
              className={`
                w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200
                ${hasError ? 'border-red-300' : 'border-gray-300'}
              `}
              rows={4}
              maxLength={500}
              aria-describedby="goal-help goal-error char-count"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {charCount}/500
            </div>
          </div>

          {/* 错误信息 */}
          {hasError && (
            <div id="goal-error" className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {errors.find(e => e.field === 'learningGoal')?.message}
              </p>
            </div>
          )}

          {/* 帮助信息 */}
          <div id="goal-help" className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              请详细描述您的学习目标，至少10个字符。按 Ctrl+Enter 可快速提交。
            </span>
          </div>
        </div>

        {/* 建议目标 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            💡 常见学习目标参考
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {SUGGESTED_GOALS.map((suggestedGoal, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestedGoalClick(suggestedGoal)}
                className="p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 group"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-4 h-4 border-2 border-gray-400 rounded-full group-hover:border-blue-500 transition-colors duration-200" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {suggestedGoal}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 目标重要度提醒 */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                为什么学习目标很重要？
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                明确的学习目标有助于我们为您制定个性化的学习计划，选择合适的学习内容，并设置合理的学习进度。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="mt-8 flex justify-between">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            上一步
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={goal.trim().length < 10}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${goal.trim().length >= 10
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          下一步
        </button>
      </div>
    </div>
  );
};