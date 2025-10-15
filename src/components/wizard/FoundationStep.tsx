'use client';

import React, { useState } from 'react';
import { WizardStepProps } from '@/types/intake';

export const FoundationStep: React.FC<WizardStepProps> = ({
  value,
  onChange,
  onNext,
  onPrevious,
  errors,
  isFirstStep,
  isLastStep,
}) => {
  const [isBeginner, setIsBeginner] = useState(value?.isBeginner ?? undefined);
  const [wantsQuickTest, setWantsQuickTest] = useState(value?.wantsQuickTest ?? false);
  const hasError = errors.some(e => e.field === 'isBeginner');

  const handleBeginnerSelect = (beginner: boolean) => {
    setIsBeginner(beginner);
    const updatedValue = { ...value, isBeginner: beginner, wantsQuickTest };
    onChange(updatedValue);
  };

  const handleQuickTestToggle = (checked: boolean) => {
    setWantsQuickTest(checked);
    const updatedValue = { ...value, isBeginner, wantsQuickTest: checked };
    onChange(updatedValue);
  };

  const handleSubmit = () => {
    if (isBeginner !== undefined) {
      onNext();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="space-y-8">
        {/* 英语基础选择 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            您的英语基础如何？
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 零基础选项 */}
            <button
              type="button"
              onClick={() => handleBeginnerSelect(true)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left
                ${isBeginner === true
                  ? 'border-blue-600 bg-blue-50 shadow-lg transform scale-102'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${hasError ? 'border-red-300' : ''}
              `}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🌱</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    零基础/初学者
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 几乎没有英语基础</li>
                    <li>• 只认识简单的单词</li>
                    <li>• 难以进行基本对话</li>
                    <li>• 需要从音标和基础语法开始</li>
                  </ul>
                </div>
                {isBeginner === true && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>

            {/* 有基础选项 */}
            <button
              type="button"
              onClick={() => handleBeginnerSelect(false)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left
                ${isBeginner === false
                  ? 'border-blue-600 bg-blue-50 shadow-lg transform scale-102'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${hasError ? 'border-red-300' : ''}
              `}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    有一定基础
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 掌握基本词汇和语法</li>
                    <li>• 能进行简单的英语对话</li>
                    <li>• 能读懂简单的英文文章</li>
                    <li>• 希望进一步提升综合能力</li>
                  </ul>
                </div>
                {isBeginner === false && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          </div>

          {hasError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {errors.find(e => e.field === 'isBeginner')?.message}
              </p>
            </div>
          )}
        </div>

        {/* 快速测试选项 */}
        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                是否进行快速水平测试？
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                通过一个简单的5分钟测试，我们可以更准确地了解您当前的英语水平，为您制定更精确的学习计划。测试包含词汇、语法和阅读理解。
              </p>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsQuickTest}
                  onChange={(e) => handleQuickTestToggle(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  我愿意参加快速水平测试（约5分钟）
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 学习建议 */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                为什么需要了解您的英语基础？
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                了解您的基础有助于我们：1) 选择合适的学习起点；2) 制定匹配的难度曲线；3) 推荐针对性的学习内容；4) 设置合理的学习目标。
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
          disabled={isBeginner === undefined}
          className={`
            px-8 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isBeginner !== undefined
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isLastStep ? '完成设置' : '下一步'}
        </button>
      </div>
    </div>
  );
};