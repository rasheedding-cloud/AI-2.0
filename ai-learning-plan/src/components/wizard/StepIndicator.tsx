import React from 'react';
import { StepConfig } from '@/types/intake';
import { STEPS } from '@/constants/intake';

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  completedSteps,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* 步骤圆圈 */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${isCompleted
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCurrent
                        ? 'border-blue-600 bg-white text-blue-600'
                        : 'border-gray-300 bg-white text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`
                      text-xs font-medium transition-colors duration-300
                      ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}
                    `}
                  >
                    {step.title}
                  </div>
                </div>
              </div>

              {/* 连接线 */}
              {index < STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-colors duration-300
                    ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 当前步骤描述 */}
      <div className="mt-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {STEPS[currentStep - 1]?.title}
        </h2>
        <p className="text-sm text-gray-600">
          {STEPS[currentStep - 1]?.description}
        </p>
      </div>
    </div>
  );
};