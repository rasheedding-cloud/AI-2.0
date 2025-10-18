'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Globe, GraduationCap, Target, Users } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('zh');

  const handleStart = () => {
    router.push('/wizard');
  };

  const features = [
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: currentLang === 'zh' ? '个性化定制' : 'Personalized Learning',
      description: currentLang === 'zh'
        ? '基于AI技术，为您量身定制专属学习计划'
        : 'AI-powered personalized learning plans tailored to your needs'
    },
    {
      icon: <GraduationCap className="w-8 h-8 text-green-600" />,
      title: currentLang === 'zh' ? '科学进阶' : 'Scientific Progression',
      description: currentLang === 'zh'
        ? '16周渐进式学习，难度递进科学合理'
        : '16-week progressive learning with scientifically designed difficulty curves'
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: currentLang === 'zh' ? '文化适配' : 'Cultural Adaptation',
      description: currentLang === 'zh'
        ? '多文化背景支持，学习内容更贴近实际'
        : 'Multi-cultural support with content adapted to your background'
    }
  ];

  const stats = [
    { number: '95%', label: currentLang === 'zh' ? '学习效果提升' : 'Learning Improvement' },
    { number: '16周', label: currentLang === 'zh' ? '平均学习周期' : 'Average Duration' },
    { number: '3档', label: currentLang === 'zh' ? '方案选择' : 'Plan Options' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                {currentLang === 'zh' ? 'AI定制学习方案' : 'AI Learning Plan'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentLang(currentLang === 'zh' ? 'en' : 'zh')}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {currentLang === 'zh' ? 'EN' : '中文'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {currentLang === 'zh'
              ? '开启您的个性化英语学习之旅'
              : 'Start Your Personalized English Learning Journey'
            }
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {currentLang === 'zh'
              ? '基于先进的人工智能技术，我们为您量身定制专属的学习方案，让英语学习更高效、更有趣、更适合您。'
              : 'Powered by advanced AI technology, we create personalized learning plans that make English learning more efficient, enjoyable, and tailored to you.'
            }
          </p>

          <Button
            size="lg"
            onClick={handleStart}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg"
          >
            {currentLang === 'zh' ? '开始定制学习方案' : 'Start Custom Learning Plan'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {currentLang === 'zh' ? '为什么选择我们' : 'Why Choose Us'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            {currentLang === 'zh'
              ? '准备好开始您的学习之旅了吗？'
              : 'Ready to Start Your Learning Journey?'
            }
          </h2>

          <p className="text-xl text-blue-100 mb-8">
            {currentLang === 'zh'
              ? '只需几分钟，我们就能为您生成专属的英语学习方案'
              : 'In just a few minutes, we can generate your personalized English learning plan'
            }
          </p>

          <Button
            size="lg"
            onClick={handleStart}
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
          >
            {currentLang === 'zh' ? '立即开始' : 'Get Started Now'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6" />
            <span className="text-lg font-semibold">
              {currentLang === 'zh' ? 'AI定制学习方案' : 'AI Learning Plan'}
            </span>
          </div>

          <p className="text-gray-400">
            {currentLang === 'zh'
              ? '© 2024 AI Learning Plan. 保留所有权利。'
              : '© 2024 AI Learning Plan. All rights reserved.'
            }
          </p>
        </div>
      </footer>
    </div>
  );
}