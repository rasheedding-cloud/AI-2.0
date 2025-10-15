'use client';

import React from 'react';
import { Identity, WizardStepProps } from '@/types/intake';
import { IDENTITY_OPTIONS } from '@/constants/intake';

export const IdentityStep: React.FC<WizardStepProps> = ({
  value,
  onChange,
  onNext,
  onPrevious,
  errors,
  isFirstStep,
  isLastStep,
}) => {
  const selectedIdentity = value as Identity;
  const hasError = errors.some(e => e.field === 'identity');

  const handleIdentitySelect = (identity: Identity) => {
    onChange(identity);
    setTimeout(() => onNext(), 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent, identity: Identity) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleIdentitySelect(identity);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {IDENTITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleIdentitySelect(option.value)}
              onKeyDown={(e) => handleKeyPress(e, option.value)}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left
                ${selectedIdentity === option.value
                  ? 'border-blue-600 bg-blue-50 shadow-lg transform scale-102'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${hasError ? 'border-red-300' : ''}
              `}
              aria-label={`选择${option.label}`}
              aria-pressed={selectedIdentity === option.value}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <span className="text-3xl" role="img" aria-hidden="true">
                    {option.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {option.description}
                  </p>
                </div>

                {selectedIdentity === option.value && (
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
          ))}
        </div>

        {hasError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {errors.find(e => e.field === 'identity')?.message}
            </p>
          </div>
        )}

        {/* 选择提示 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🎯 根据您的身份，我们将为您定制更合适的学习计划
          </p>
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
          onClick={onNext}
          disabled={!selectedIdentity}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${selectedIdentity
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