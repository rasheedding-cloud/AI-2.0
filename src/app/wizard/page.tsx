'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, ArrowRight, CheckCircle, User, Target, Clock, BookOpen, AlertTriangle, Lightbulb } from 'lucide-react';
import { recommendLearningTrack, generateTrackTargetDescription, type LearningTrack } from '@/lib/trackRecommendation';

interface FormData {
  gender: string;
  identity: string;
  native_language: string;
  goal_free_text: string;
  daily_minutes_pref: number;
  study_days_per_week: number;
  zero_base: boolean;
  deadline_date: string;
  self_assessed_level: string;
  cultural_mode: string;
  track_override?: string;
}

export default function WizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    gender: '',
    identity: '',
    native_language: '',
    goal_free_text: '',
    daily_minutes_pref: 60,
    study_days_per_week: 5,
    zero_base: false,
    deadline_date: '',
    self_assessed_level: '',
    cultural_mode: 'gcc',
    track_override: '' // 不设置默认，让系统根据目标智能推荐
  });

  // 缓存推荐的轨道，避免重复计算
  const [recommendedTrack, setRecommendedTrack] = useState<LearningTrack | null>(null);

  // 使用useEffect来智能推荐轨道，避免重复计算
  useEffect(() => {
    if (formData.goal_free_text && formData.goal_free_text.length >= 10) {
      const track = recommendLearningTrack(formData as any);
      setRecommendedTrack(track);
    } else {
      setRecommendedTrack(null);
    }
  }, [formData.goal_free_text]);

  const steps = [
    { title: '性别', icon: <User className="w-5 h-5" /> },
    { title: '身份', icon: <User className="w-5 h-5" /> },
    { title: '母语', icon: <BookOpen className="w-5 h-5" /> },
    { title: '学习目标', icon: <Target className="w-5 h-5" /> },
    { title: '学习轨道', icon: <Target className="w-5 h-5" /> },
    { title: '时间安排', icon: <Clock className="w-5 h-5" /> },
    { title: '基础评估', icon: <CheckCircle className="w-5 h-5" /> }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    } else {
      router.push('/');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.gender || !formData.identity || !formData.native_language) {
      setError('请完成所有必填信息');
      return false;
    }
    if (formData.goal_free_text.length < 10) {
      setError('学习目标至少需要10个字符');
      return false;
    }
    if (!formData.zero_base && !formData.self_assessed_level) {
      setError('请选择您的英语水平');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 构建完整的Intake数据
      const completeIntake = {
        gender: formData.gender,
        identity: formData.identity,
        native_language: formData.native_language,
        goal_free_text: formData.goal_free_text,
        zero_base: formData.zero_base,
        self_assessed_level: formData.self_assessed_level || null,
        deadline_date: formData.deadline_date || null,
        daily_minutes_pref: formData.daily_minutes_pref,
        study_days_per_week: formData.study_days_per_week,
        cultural_mode: formData.cultural_mode,
        track_override: formData.track_override
      };

      console.log('完整提交数据:', completeIntake);

      // 保存到localStorage供后续页面使用
      localStorage.setItem('userIntake', JSON.stringify(completeIntake));

      // 预加载方案数据以验证API可用性
      const response = await fetch('/api/generate-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake: completeIntake })
      });

      const data = await response.json();

      if (data.success) {
        console.log('方案生成成功:', data);
        // 保存生成的方案数据
        localStorage.setItem('generatedPlans', JSON.stringify(data.data));
        // 跳转到方案展示页面
        router.push('/plans');
      } else {
        console.error('方案生成失败:', data.error);
        // 即使API失败，也跳转到方案页面（使用降级数据）
        router.push('/plans');
      }
    } catch (error) {
      console.error('提交表单时发生错误:', error);
      setError('提交失败，请重试');

      // 即使网络错误，也尝试跳转（使用降级数据）
      setTimeout(() => {
        router.push('/plans');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTrackLabel = (track: LearningTrack) => {
    switch (track) {
      case 'work': return '职场发展';
      case 'travel': return '旅行交流';
      case 'study': return '学习考试';
      case 'daily': return '日常对话';
      case 'exam': return '考试认证';
      default: return '日常对话';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // 性别
        return (
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">请选择您的性别</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['male', 'female', 'prefer_not_to_say'].map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, gender: option })}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    formData.gender === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-medium">
                    {option === 'male' ? '男性' : option === 'female' ? '女性' : '不愿透露'}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        );

      case 1: // 身份
        return (
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">请选择您的身份</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['working_adult', 'university', 'high_school'].map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, identity: option })}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    formData.identity === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-medium">
                    {option === 'working_adult' ? '职场人士' :
                     option === 'university' ? '大学生' : '高中生'}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        );

      case 2: // 母语
        return (
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">请选择您的母语</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { value: 'zh', label: '中文', cultural: 'gcc' },
                { value: 'ar', label: '阿拉伯语', cultural: 'sa' },
                { value: 'other', label: '其他', cultural: 'gcc' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({
                    ...formData,
                    native_language: option.value,
                    cultural_mode: option.cultural
                  })}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    formData.native_language === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </Card>
        );

      case 3: // 学习目标
        return (
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">请描述您的学习目标</h3>
            <div className="max-w-2xl mx-auto">
              <textarea
                value={formData.goal_free_text}
                onChange={(e) => setFormData({ ...formData, goal_free_text: e.target.value })}
                placeholder="请简单描述您学习英语的目标，比如：为了工作需要提升商务英语能力，希望能在3个月内进行日常对话..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={10}
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-500 mt-2">
                {formData.goal_free_text.length}/500
              </div>

              {/* 智能轨道推荐 */}
              {formData.goal_free_text.length >= 10 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">智能轨道推荐</h4>
                  </div>
                  <div className="text-blue-800">
                    <p className="text-sm mb-2">根据您的学习目标，我们为您推荐：</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {getTrackLabel(recommendedTrack || 'daily')}
                      </span>
                      <span className="text-sm text-blue-600">
                        - {generateTrackTargetDescription(recommendedTrack || 'daily')}
                      </span>
                    </div>
                    <p className="text-xs mt-2 text-blue-700">
                      💡 您可以在下一步手动选择或调整推荐的学习轨道
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );

      case 4: // 学习轨道
        {
          return (
            <Card className="p-8">
              <h3 className="text-2xl font-bold text-center mb-8">请选择您的学习轨道</h3>

              {/* 推荐提示 */}
              {recommendedTrack && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 text-green-800">
                    <Lightbulb className="w-5 h-5" />
                    <span className="font-medium">基于您的学习目标，我们推荐：{getTrackLabel(recommendedTrack)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {[
                  { value: 'work', label: '职场发展', desc: '适用于工作场景，商务英语、会议沟通等' },
                  { value: 'travel', label: '旅行交流', desc: '适用于旅行场景，问路、点餐、购物等' },
                  { value: 'study', label: '学习考试', desc: '适用于学术场景，留学、考试、课程学习等' },
                  { value: 'daily', label: '日常对话', desc: '适用于生活场景，日常交流、兴趣爱好等' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, track_override: option.value })}
                    className={`p-6 rounded-lg border-2 transition-all text-left relative ${
                      formData.track_override === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* 推荐标签 */}
                    {recommendedTrack === option.value && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        推荐
                      </div>
                    )}

                    <div className="text-lg font-medium mb-2">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
            </Card>
          );
        }

      case 5: // 时间安排
        return (
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">请设置您的学习时间安排</h3>
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每日学习时间（分钟）
                </label>
                <select
                  value={formData.daily_minutes_pref}
                  onChange={(e) => setFormData({ ...formData, daily_minutes_pref: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30分钟</option>
                  <option value={45}>45分钟</option>
                  <option value={60}>60分钟</option>
                  <option value={90}>90分钟</option>
                  <option value={120}>120分钟</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每周学习天数
                </label>
                <select
                  value={formData.study_days_per_week}
                  onChange={(e) => setFormData({ ...formData, study_days_per_week: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3天</option>
                  <option value={4}>4天</option>
                  <option value={5}>5天</option>
                  <option value={6}>6天</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标完成时间（可选）
                </label>
                <Input
                  type="date"
                  value={formData.deadline_date}
                  onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </Card>
        );

      case 6: // 基础评估
        return (
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8">英语基础评估</h3>
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  您是否有英语基础？
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, zero_base: false })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !formData.zero_base
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    有基础
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, zero_base: true })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.zero_base
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    零基础
                  </button>
                </div>
              </div>

              {!formData.zero_base && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    请评估您当前的英语水平
                  </label>
                  <select
                    value={formData.self_assessed_level}
                    onChange={(e) => setFormData({ ...formData, self_assessed_level: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择</option>
                    <option value="A1">初级 (A1)</option>
                    <option value="A2">基础级 (A2)</option>
                    <option value="B1">中级 (B1)</option>
                    <option value="B2">中高级 (B2)</option>
                  </select>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 我们会根据您的基础情况，为您定制最适合的学习难度和进度
                </p>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.gender !== '';
      case 1:
        return formData.identity !== '';
      case 2:
        return formData.native_language !== '';
      case 3:
        return formData.goal_free_text.length >= 10;
      case 4:
        return formData.track_override !== '';
      case 5:
        return true;
      case 6:
        return formData.zero_base !== null && formData.zero_base !== undefined &&
               (formData.zero_base === true || formData.self_assessed_level !== '');
      default:
        return false;
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-4 text-lg text-gray-600">正在生成您的个性化学习方案...</div>
          <div className="mt-2 text-sm text-gray-500">这可能需要几秒钟时间</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                步骤 {currentStep + 1} / {steps.length}
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        </div>
      )}

      {/* 步骤指示器 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="ml-2 text-sm font-medium">
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-4 transition-all ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            上一步
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isStepValid() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === steps.length - 1 ? '提交' : '下一步'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}