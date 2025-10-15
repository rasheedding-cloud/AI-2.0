'use client';

import React, { useState, useEffect } from 'react';
import { Schedule, WizardStepProps } from '@/types/intake';

const DAILY_HOURS_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];
const WEEKLY_DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const ScheduleStep: React.FC<WizardStepProps> = ({
  value,
  onChange,
  onNext,
  onPrevious,
  errors,
  isFirstStep,
  isLastStep,
}) => {
  const [schedule, setSchedule] = useState<Schedule>(
    value || { dailyHours: 1, weeklyDays: 5 }
  );
  const [customDailyHours, setCustomDailyHours] = useState('');
  const [customWeeklyDays, setCustomWeeklyDays] = useState('');
  const hasError = errors.some(e => e.field === 'schedule');

  useEffect(() => {
    onChange(schedule);
  }, [schedule, onChange]);

  const handleDailyHoursChange = (hours: number) => {
    setSchedule(prev => ({ ...prev, dailyHours: hours }));
    setCustomDailyHours('');
  };

  const handleCustomDailyHoursChange = (value: string) => {
    setCustomDailyHours(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0.5 && numValue <= 12) {
      setSchedule(prev => ({ ...prev, dailyHours: numValue }));
    }
  };

  const handleWeeklyDaysChange = (days: number) => {
    setSchedule(prev => ({ ...prev, weeklyDays: days }));
    setCustomWeeklyDays('');
  };

  const handleCustomWeeklyDaysChange = (value: string) => {
    setCustomWeeklyDays(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 7) {
      setSchedule(prev => ({ ...prev, weeklyDays: numValue }));
    }
  };

  const handleSubmit = () => {
    if (schedule.dailyHours >= 0.5 && schedule.dailyHours <= 12 &&
        schedule.weeklyDays >= 1 && schedule.weeklyDays <= 7) {
      onNext();
    }
  };

  const totalWeeklyHours = (schedule.dailyHours * schedule.weeklyDays).toFixed(1);

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="space-y-8">
        {/* 每日学习时长 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            每日学习时长
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {DAILY_HOURS_OPTIONS.map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => handleDailyHoursChange(hours)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${schedule.dailyHours === hours && !customDailyHours
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {hours === 0.5 ? '30分钟' : `${hours}小时`}
              </button>
            ))}
          </div>

          {/* 自定义输入 */}
          <div className="mt-4 flex items-center space-x-3">
            <span className="text-sm text-gray-600">自定义：</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={customDailyHours}
                onChange={(e) => handleCustomDailyHoursChange(e.target.value)}
                placeholder="输入小时数"
                min="0.5"
                max="12"
                step="0.5"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-600">小时</span>
            </div>
          </div>
        </div>

        {/* 每周学习天数 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            每周学习天数
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {WEEKLY_DAYS_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => handleWeeklyDaysChange(days)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${schedule.weeklyDays === days && !customWeeklyDays
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {days}天
              </button>
            ))}
          </div>

          {/* 自定义输入 */}
          <div className="mt-4 flex items-center space-x-3">
            <span className="text-sm text-gray-600">自定义：</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={customWeeklyDays}
                onChange={(e) => handleCustomWeeklyDaysChange(e.target.value)}
                placeholder="输入天数"
                min="1"
                max="7"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-600">天</span>
            </div>
          </div>
        </div>

        {/* 学习计划总结 */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📅 您的学习计划
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-700">每日学习时长</span>
              <span className="text-sm font-bold text-blue-600">
                {schedule.dailyHours === 0.5 ? '30分钟' : `${schedule.dailyHours}小时`}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-700">每周学习天数</span>
              <span className="text-sm font-bold text-blue-600">{schedule.weeklyDays}天</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
              <span className="text-sm font-medium text-blue-900">每周总学习时长</span>
              <span className="text-lg font-bold text-blue-600">{totalWeeklyHours}小时</span>
            </div>
          </div>

          {/* 学习建议 */}
          <div className="mt-4 p-3 bg-white/70 rounded-lg">
            <p className="text-sm text-gray-700">
              {totalWeeklyHours < 3 && '💪 建议增加学习时间，获得更好的学习效果'}
              {totalWeeklyHours >= 3 && totalWeeklyHours < 7 && '👍 很好的学习安排，保持这个节奏'}
              {totalWeeklyHours >= 7 && totalWeeklyHours < 14 && '🔥 充足的学习时间，进步会很快'}
              {totalWeeklyHours >= 14 && '⚡ 超级努力的学习者！请注意劳逸结合'}
            </p>
          </div>
        </div>

        {/* 错误信息 */}
        {hasError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {errors.find(e => e.field === 'schedule')?.message}
            </p>
          </div>
        )}

        {/* 提示信息 */}
        <div className="text-center text-sm text-gray-500">
          <p>⏰ 合理的时间安排是学习成功的关键。建议每天保持固定的学习时间，养成良好的学习习惯。</p>
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
          disabled={schedule.dailyHours < 0.5 || schedule.dailyHours > 12 ||
                   schedule.weeklyDays < 1 || schedule.weeklyDays > 7}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${schedule.dailyHours >= 0.5 && schedule.dailyHours <= 12 &&
              schedule.weeklyDays >= 1 && schedule.weeklyDays <= 7
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