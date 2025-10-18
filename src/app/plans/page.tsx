'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Users, Target, AlertTriangle, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { generateThreeTiers } from '@/lib/calc/time';

interface PlanOption {
  tier: 'light' | 'standard' | 'intensive';
  track: 'work' | 'travel' | 'study' | 'daily' | 'exam';
  ui_label_current: string;
  ui_label_target: string;
  can_do_examples: string[];
  daily_minutes: number;
  days_per_week: number;
  weeks: number;
  finish_date_est: string;
  lessons_total: number;
  diagnosis: 'green' | 'yellow' | 'red';
  diagnosis_tips: string[];
  monthly_milestones_one_line: string[];
}

export default function PlansPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);

  useEffect(() => {
    // 真实API调用
    const loadPlans = async () => {
      // 从localStorage获取用户信息
      const userDataStr = localStorage.getItem('userIntake');
      if (!userDataStr) {
        setError('未找到用户信息，请重新填写');
        router.push('/wizard');
        setIsLoading(false);
        return;
      }

      const userData = JSON.parse(userDataStr);

      try {
        setIsLoading(true);

        // 调用真实API
        const response = await fetch('/api/generate-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intake: userData })
        });

        const data = await response.json();

        if (data.success) {
          console.log('API返回的方案数据:', data.data);

          // 记录每个方案的关键计算数据
          data.data.forEach((plan: PlanOption, index: number) => {
            console.log(`方案 ${index + 1} (${plan.tier}):`, {
              每日分钟: plan.daily_minutes,
              每周天数: plan.days_per_week,
              周数: plan.weeks,
              总课时: plan.lessons_total,
              完成时间: plan.finish_date_est,
              诊断: plan.diagnosis,
              里程碑数量: plan.monthly_milestones_one_line?.length || 0,
              里程碑内容: plan.monthly_milestones_one_line
            });
          });

          setPlans(data.data);
        } else {
          throw new Error(data.error || 'API调用失败');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('API调用错误:', err);

        // 如果API调用失败，使用数学计算生成降级数据
        console.log('API调用失败，使用数学计算生成降级方案...');

        try {
          // 使用数学计算生成三档方案
          const calculatedTiers = await generateThreeTiers(userData);
          const track = userData.track_override || 'daily';
          const trackTarget = getTrackTargetLabel(track);

          const fallbackPlans: PlanOption[] = [
            {
              ...calculatedTiers.light,
              track: track,
              ui_label_current: '英语基础',
              ui_label_target: trackTarget,
              can_do_examples: generateTrackExamples(track, '轻松'),
              diagnosis: calculatedTiers.light.diagnosis,
              diagnosis_tips: calculatedTiers.light.diagnosis_tips,
              monthly_milestones_one_line: calculatedTiers.light.monthly_milestones_one_line.length > 0
                ? calculatedTiers.light.monthly_milestones_one_line
                : [`第1月：建立${trackTarget}的基础`, `第2月：提升${trackTarget}的技能`, `第3月：巩固${trackTarget}的能力`, `第4月：达到${trackTarget}的目标`]
            },
            {
              ...calculatedTiers.standard,
              track: track,
              ui_label_current: '英语基础',
              ui_label_target: trackTarget,
              can_do_examples: generateTrackExamples(track, '稳健'),
              diagnosis: calculatedTiers.standard.diagnosis,
              diagnosis_tips: calculatedTiers.standard.diagnosis_tips,
              monthly_milestones_one_line: calculatedTiers.standard.monthly_milestones_one_line.length > 0
                ? calculatedTiers.standard.monthly_milestones_one_line
                : [`第1月：建立${trackTarget}的基础`, `第2月：提升${trackTarget}的技能`, `第3月：巩固${trackTarget}的能力`, `第4月：达到${trackTarget}的目标`]
            },
            {
              ...calculatedTiers.intensive,
              track: track,
              ui_label_current: '英语基础',
              ui_label_target: trackTarget,
              can_do_examples: generateTrackExamples(track, '高效'),
              diagnosis: calculatedTiers.intensive.diagnosis,
              diagnosis_tips: calculatedTiers.intensive.diagnosis_tips,
              monthly_milestones_one_line: calculatedTiers.intensive.monthly_milestones_one_line.length > 0
                ? calculatedTiers.intensive.monthly_milestones_one_line
                : [`第1月：建立${trackTarget}的基础`, `第2月：提升${trackTarget}的技能`, `第3月：巩固${trackTarget}的能力`, `第4月：达到${trackTarget}的目标`]
            }
          ];

          console.log('数学计算生成的降级方案:', fallbackPlans);
          setPlans(fallbackPlans);
        } catch (calcError) {
          console.error('数学计算也失败了:', calcError);
          // 设置错误信息而不是抛出错误
          setError('生成学习方案失败，请重新填写信息或刷新页面重试');
        }
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [router]);

  const handleSelectPlan = (plan: PlanOption) => {
    setSelectedPlan(plan);
  };

  const handleConfirm = () => {
    if (selectedPlan) {
      // 保存选择的方案到localStorage供后续页面使用
      localStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
      // 跳转到月度计划页面
      router.push(`/plan/${selectedPlan.tier}`);
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'light': return '轻量方案';
      case 'standard': return '标准方案';
      case 'intensive': return '进阶方案';
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'light': return 'from-green-500 to-emerald-600';
      case 'standard': return 'from-blue-500 to-indigo-600';
      case 'intensive': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getDiagnosisIcon = (diagnosis: string) => {
    switch (diagnosis) {
      case 'green': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'yellow': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'red': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getDiagnosisText = (diagnosis: string) => {
    switch (diagnosis) {
      case 'green': return '推荐';
      case 'yellow': return '需努力';
      case 'red': return '较困难';
      default: return '';
    }
  };

  const getTrackLabel = (track: string) => {
    switch (track) {
      case 'work': return '职场英语';
      case 'travel': return '旅行英语';
      case 'study': return '学术英语';
      case 'daily': return '日常英语';
      case 'exam': return '考试英语';
      default: return '英语学习';
    }
  };

  const getTrackTargetLabel = (track: string) => {
    switch (track) {
      case 'work': return '职场英语';
      case 'travel': return '旅行英语';
      case 'study': return '学术英语';
      case 'daily': return '日常英语';
      case 'exam': return '考试英语';
      default: return '英语提升';
    }
  };

  const generateTrackExamples = (track: string, intensity: string): string[] => {
    const targetExamples = {
      work: [
        '能够听懂职场大多数对话并做出简单回应',
        '能够处理基本的职场邮件和信息确认',
        '能够在会议中进行简单的自我介绍和意见表达',
        '能够应对日常工作中的基础英语沟通场景'
      ],
      travel: [
        '能够自如地进行国外旅行和日常交流',
        '能够处理旅行中的各种实用场景',
        '能够与当地人进行友好自然的对话',
        '能够应对旅行中的突发情况和需求'
      ],
      study: [
        '能够理解学术讲座和参与课堂讨论',
        '能够阅读学术文献和撰写研究报告',
        '能够在学术环境中进行有效交流',
        '能够处理学习和研究中的英语需求'
      ],
      daily: [
        '能够与外国朋友进行流畅自然的对话',
        '能够理解和讨论各种日常话题',
        '能够在社交场合自如表达观点',
        '能够处理日常生活中的英语交流需求'
      ],
      exam: [
        '能够在考试中准确理解题目和材料',
        '能够运用有效的应试技巧和策略',
        '能够在规定时间内完成高质量答案',
        '能够应对考试中的各种挑战和要求'
      ]
    };

    const intensityModifiers = {
      轻松: [
        '在轻松的学习节奏下逐步达成目标',
        '享受学习过程，压力较小但稳步前进',
        '适合时间有限但希望持续进步的学员'
      ],
      稳健: [
        '在均衡的学习节奏下有效达成目标',
        '保持稳定的学习进度和效果',
        '适合希望平衡学习效果和时间投入的学员'
      ],
      高效: [
        '在紧凑的学习节奏下快速达成目标',
        '高强度学习，短期内看到明显进步',
        '适合希望快速提升英语能力的学员'
      ]
    };

    const baseExamples = targetExamples[track as keyof typeof targetExamples] || targetExamples.daily;
    const modifiers = intensityModifiers[intensity as keyof typeof intensityModifiers] || intensityModifiers.稳健;

    // 返回目标示例 + 学习体验描述，确保至少3个元素
    const result = [...baseExamples.slice(0, 3), ...modifiers];
    return result.slice(0, 6); // 限制最多6个元素，符合新的schema限制
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-4 text-lg text-gray-600">正在为您生成个性化学习方案...</div>
          <div className="mt-2 text-sm text-gray-500">这可能需要几秒钟时间</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">生成失败</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              重新生成
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/wizard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                学习方案生成完成
              </div>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            为您定制的三档学习方案
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            基于您的学习需求，我们生成了三种不同强度的学习方案。请选择最适合您的方案开始学习之旅。
          </p>
        </div>

        {/* 方案卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer ${
                selectedPlan?.tier === plan.tier
                  ? 'ring-4 ring-blue-500 shadow-xl transform -translate-y-2'
                  : 'hover:transform hover:-translate-y-1'
              }`}
              onClick={() => handleSelectPlan(plan)}
            >
              {/* 方案标签 */}
              <div className={`bg-gradient-to-r ${getTierColor(plan.tier)} text-white p-4`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {getTierLabel(plan.tier)}
                  </span>
                  {getDiagnosisIcon(plan.diagnosis)}
                </div>
                <div className="text-sm opacity-90 mt-1">
                  {getDiagnosisText(plan.diagnosis)}
                </div>
              </div>

              {/* 方案内容 */}
              <div className="p-6">
                {/* 学习轨道 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Target className="w-4 h-4" />
                    学习轨道：{getTrackLabel(plan.track)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {plan.ui_label_current || '英语基础'}
                    </span>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <span className="text-2xl font-bold text-blue-600">
                      {plan.ui_label_target || getTrackTargetLabel(plan.track)}
                    </span>
                  </div>
                </div>

                {/* 学习成果 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">学习完成后您将能：</h4>
                  <ul className="space-y-2">
                    {plan.can_do_examples.map((example, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 学习安排 */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      每日学习
                    </div>
                    <span className="font-semibold">{plan.daily_minutes} 分钟</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      每周学习
                    </div>
                    <span className="font-semibold">{plan.days_per_week} 天</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      学习周期
                    </div>
                    <span className="font-semibold">{plan.weeks} 周</span>
                  </div>
                </div>

                {/* 完成时间 */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-blue-800 mb-1">预计完成时间</div>
                  <div className="text-xl font-bold text-blue-900">
                    {plan.finish_date_est}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    共 {plan.lessons_total} 节课程
                  </div>
                </div>

                {/* 月度里程碑 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">月度里程碑</h4>
                  <div className="space-y-2">
                    {plan.monthly_milestones_one_line.map((milestone, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-600 font-medium">M{idx + 1}:</span>
                        <span>{milestone}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 诊断建议 */}
                {plan.diagnosis_tips.length > 0 && (
                  <div className={`p-3 rounded-lg ${
                    plan.diagnosis === 'green' ? 'bg-green-50' :
                    plan.diagnosis === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-sm">建议</span>
                    </div>
                    <ul className="space-y-1">
                      {plan.diagnosis_tips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-gray-600">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 选中指示器 */}
              {selectedPlan?.tier === plan.tier && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-full p-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/wizard')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            重新填写信息
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!selectedPlan}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-8 py-3"
          >
            {selectedPlan ? `确认选择${getTierLabel(selectedPlan.tier)}` : '请选择一个方案'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>💡 选择最适合您时间和目标的方案，您可以随时调整学习计划</p>
        </div>
      </div>
    </div>
  );
}