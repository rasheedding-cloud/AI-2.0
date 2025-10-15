import { Metadata } from 'next';
import { IntakeWizardExample } from '@/components/IntakeWizardExample';

export const metadata: Metadata = {
  title: '学习方案定制 - 信息采集',
  description: '通过简单几步，为您定制个性化的英语学习方案',
};

export default function IntakePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            定制您的专属学习方案
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            通过了解您的基本情况和学习目标，我们将为您制定最合适的英语学习计划
          </p>
        </div>

        <IntakeWizardExample />
      </div>
    </div>
  );
}