'use client';

import React from 'react';
import { IntakeWizard } from './IntakeWizard';
import { IntakeFormData } from '@/types/intake';

export const IntakeWizardExample: React.FC = () => {
  const handleComplete = async (data: IntakeFormData) => {
    console.log('Intake completed:', data);

    // 这里可以调用API保存数据
    try {
      const response = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit intake data');
      }

      const result = await response.json();
      console.log('Submission successful:', result);

      // 可以跳转到学习计划页面或其他页面
      // window.location.href = '/learning-plan';

    } catch (error) {
      console.error('Error submitting intake:', error);
      throw error;
    }
  };

  const handleSave = async (data: Partial<IntakeFormData>) => {
    console.log('Auto-saving data:', data);

    // 这里可以调用API保存草稿
    try {
      await fetch('/api/intake/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const initialData: Partial<IntakeFormData> = {
    gender: undefined,
    identity: undefined,
    nativeLanguage: '',
    learningGoal: '',
    schedule: {
      dailyHours: 1,
      weeklyDays: 5,
    },
    isBeginner: undefined,
    wantsQuickTest: false,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <IntakeWizard
        onComplete={handleComplete}
        onSave={handleSave}
        initialData={initialData}
        className="py-4"
      />
    </div>
  );
};