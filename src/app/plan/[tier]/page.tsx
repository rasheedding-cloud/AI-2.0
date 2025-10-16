'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, ArrowRight, Calendar, Target, TrendingUp, BookOpen, ChevronDown, ChevronUp, CheckCircle, Clock, Download } from 'lucide-react';

interface MonthlyMilestone {
  month: number;
  focus: string[];
  assessment_gate: {
    accuracy: number;
    task_steps: number;
    fluency_pauses: number;
  };
}

interface MonthlyPlan {
  months_total: number;
  milestones: MonthlyMilestone[];
}

interface Lesson {
  index: number;
  theme: string;
  objective: string;
  today_you_can: string;
  keywords: string[];
  patterns: string[];
}

interface WeekPlan {
  week: number;
  focus: string;
  days: {
    day: number;
    lessons: Lesson[];
  }[];
}

interface FirstMonthSyllabus {
  weeks: WeekPlan[];
}

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan | null>(null);
  const [syllabus, setSyllabus] = useState<FirstMonthSyllabus | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const tier = params.tier as string;

  // 动态生成模拟数据
  const generateMockMonthlyPlan = (plan: any): MonthlyPlan => {
    // 根据方案计算月数（默认2个月，对应8周）
    const monthsTotal = Math.max(1, Math.min(12, Math.ceil((plan?.weeks || 8) / 4)));

    const milestones = [];
    for (let month = 1; month <= monthsTotal; month++) {
      let focus: string[];

      if (plan?.track === 'work') {
        focus = month === 1 ?
          ['建立基础职场词汇', '掌握简单对话技巧', '学习基本邮件格式', '培养英语思维习惯'] :
          month === 2 ?
          ['提升商务词汇量', '熟练运用时态', '改进发音语调', '增加口语流利度'] :
          ['掌握高级商务技能', '完善职场沟通能力', '增强跨文化交流', '建立专业形象'];
      } else if (plan?.track === 'travel') {
        focus = month === 1 ?
          ['基础旅行问候', '学习问路指路', '掌握点餐用语', '了解交通表达'] :
          month === 2 ?
          ['提升对话流利度', '学习复杂场景', '增强文化理解', '练习应急表达'] :
          ['完善旅行技能', '深度文化交流', '自如应对各种情况', '享受旅行体验'];
      } else {
        focus = month === 1 ?
          ['建立基础词汇', '掌握简单对话', '学习基本语法', '培养学习习惯'] :
          month === 2 ?
          ['提升词汇量', '熟练运用时态', '改进表达能力', '增加交流信心'] :
          ['掌握高级技能', '完善沟通能力', '增强语言流利度', '建立长期学习习惯'];
      }

      milestones.push({
        month,
        focus,
        assessment_gate: {
          accuracy: month === 1 ? 0.85 : month === 2 ? 0.80 : 0.75,
          task_steps: month === 1 ? 3 : month === 2 ? 4 : 5,
          fluency_pauses: month === 1 ? 2 : month === 2 ? 3 : 4
        }
      });
    }

    return {
      months_total: monthsTotal,
      milestones
    };
  };

  const mockSyllabus: FirstMonthSyllabus = {
    weeks: [
      {
        week: 1,
        focus: '基础职场自我介绍和问候',
        days: [
          {
            day: 1,
            lessons: [
              {
                index: 1,
                theme: '工作场合的自我介绍',
                objective: '学会在工作中进行基本的自我介绍',
                today_you_can: '能够自信地介绍自己的姓名、职位和工作内容',
                keywords: ['introduce', 'position', 'responsibility', 'company'],
                patterns: ['My name is...', 'I work as...', 'I am responsible for...']
              },
              {
                index: 2,
                theme: '职场基本问候语',
                objective: '掌握工作场合的基本问候礼仪',
                today_you_can: '能够在不同场合使用恰当的问候语',
                keywords: ['greeting', 'nice to meet', 'how are you', 'good morning'],
                patterns: ['Nice to meet you', 'How is your day going?', 'Good morning/afternoon']
              }
            ]
          },
          {
            day: 2,
            lessons: [
              {
                index: 3,
                theme: '询问工作内容',
                objective: '学会询问他人的工作职责',
                today_you_can: '能够询问同事的工作内容并进行简单交流',
                keywords: ['what do you do', 'responsibility', 'department', 'team'],
                patterns: ['What do you do at work?', 'Which department do you work in?']
              }
            ]
          },
          {
            day: 3,
            lessons: [
              {
                index: 4,
                theme: '描述日常工作',
                objective: '能够简单描述自己的日常工作',
                today_you_can: '能够用简单的句子描述日常的工作任务',
                keywords: ['daily work', 'task', 'meeting', 'report'],
                patterns: ['I usually start my day with...', 'My main responsibility is...']
              }
            ]
          },
          {
            day: 4,
            lessons: [
              {
                index: 5,
                theme: '工作时间和安排',
                objective: '学会讨论工作时间和日程安排',
                today_you_can: '能够表达工作时间安排和会议时间',
                keywords: ['schedule', 'meeting time', 'deadline', 'working hours'],
                patterns: ['I work from... to...', "Let's schedule a meeting for..."]
              }
            ]
          },
          {
            day: 5,
            lessons: [
              {
                index: 6,
                theme: '一周工作回顾',
                objective: '能够简单回顾一周的工作内容',
                today_you_can: '能够总结一周的工作成果和下周计划',
                keywords: ['week', 'accomplish', 'plan', 'review'],
                patterns: ['This week I accomplished...', 'Next week I plan to...']
              }
            ]
          }
        ]
      },
      {
        week: 2,
        focus: '办公室日常沟通和会议基础',
        days: [
          {
            day: 1,
            lessons: [
              {
                index: 7,
                theme: '请求帮助',
                objective: '学会在工作中请求帮助',
                today_you_can: '能够礼貌地请求同事的帮助',
                keywords: ['help', 'assist', 'support', 'could you'],
                patterns: ['Could you help me with...', 'I need some assistance with...']
              }
            ]
          },
          {
            day: 2,
            lessons: [
              {
                index: 8,
                theme: '提供帮助',
                objective: '学会主动提供帮助',
                today_you_can: '能够主动为同事提供帮助',
                keywords: ['offer help', 'assist', 'support', 'let me'],
                patterns: ['Let me help you with...', 'I can assist you with...']
              }
            ]
          },
          {
            day: 3,
            lessons: [
              {
                index: 9,
                theme: '会议邀请',
                objective: '学会邀请同事参加会议',
                today_you_can: '能够发送会议邀请和提醒',
                keywords: ['meeting', 'invitation', 'attend', 'schedule'],
                patterns: ['We have a meeting scheduled for...', 'Could you attend the meeting?']
              }
            ]
          },
          {
            day: 4,
            lessons: [
              {
                index: 10,
                theme: '会议准备',
                objective: '学会准备会议内容',
                today_you_can: '能够为会议做基本的准备工作',
                keywords: ['prepare', 'agenda', 'material', 'presentation'],
                patterns: ['I need to prepare for...', 'The meeting agenda includes...']
              }
            ]
          },
          {
            day: 5,
            lessons: [
              {
                index: 11,
                theme: '会议参与',
                objective: '学会积极参与会议讨论',
                today_you_can: '能够在会议中表达基本观点',
                keywords: ['participate', 'opinion', 'suggestion', 'discuss'],
                patterns: ['I think...', 'In my opinion...', 'I suggest...']
              }
            ]
          }
        ]
      }
    ]
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // 从localStorage获取之前保存的数据
        const savedPlan = localStorage.getItem('selectedPlan');
        const userIntake = localStorage.getItem('userIntake');

        if (!savedPlan || !userIntake) {
          console.error('缺少必要的数据，跳转到方案选择页面');
          router.push('/plans');
          return;
        }

        const planData = JSON.parse(savedPlan);
        const intakeData = JSON.parse(userIntake);

        // 保存选中的方案数据
        setSelectedPlan(planData);

        console.log('加载方案详情:', { planData, intakeData });

        // 清除可能存在的旧缓存数据，确保使用最新的月度计划
        const expectedMonths = Math.max(1, Math.min(12, Math.ceil((planData?.weeks || 8) / 4)));
        const cachedMonthlyPlan = localStorage.getItem('monthlyPlan');
        if (cachedMonthlyPlan) {
          try {
            const cachedData = JSON.parse(cachedMonthlyPlan);
            if (cachedData.months_total !== expectedMonths) {
              console.log('清除缓存的不同月份数据:', {
                cached: cachedData.months_total,
                expected: expectedMonths
              });
              localStorage.removeItem('monthlyPlan');
              localStorage.removeItem('syllabus');
            }
          } catch (e) {
            console.warn('解析缓存的月度计划失败，清除缓存');
            localStorage.removeItem('monthlyPlan');
            localStorage.removeItem('syllabus');
          }
        }

        // 调用API生成月度计划
        console.log('正在生成月度计划...');
        const monthlyResponse = await fetch('/api/generate-monthly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chosenPlan: planData,
            intake: intakeData
          })
        });

        if (!monthlyResponse.ok) {
          throw new Error(`月度计划生成失败: ${monthlyResponse.status}`);
        }

        const monthlyResult = await monthlyResponse.json();
        if (!monthlyResult.success) {
          throw new Error(`月度计划API错误: ${monthlyResult.error}`);
        }

        console.log('月度计划生成成功:', monthlyResult.data);
        setMonthlyPlan(monthlyResult.data);

        // 调用API生成首月课程大纲
        console.log('正在生成首月课程大纲...');
        const syllabusResponse = await fetch('/api/generate-syllabus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monthlyPlan: monthlyResult.data,
            chosenPlan: planData,
            intake: intakeData
          })
        });

        if (!syllabusResponse.ok) {
          throw new Error(`课程大纲生成失败: ${syllabusResponse.status}`);
        }

        const syllabusResult = await syllabusResponse.json();
        if (!syllabusResult.success) {
          throw new Error(`课程大纲API错误: ${syllabusResult.error}`);
        }

        console.log('课程大纲生成成功:', syllabusResult.data);
        setSyllabus(syllabusResult.data);

        // 保存数据供导出使用
        localStorage.setItem('monthlyPlan', JSON.stringify(monthlyResult.data));
        localStorage.setItem('syllabus', JSON.stringify(syllabusResult.data));
        localStorage.setItem('userIntake', JSON.stringify(intakeData)); // 确保用户信息也被保存

        setIsLoading(false);
      } catch (error) {
        console.error('加载方案详情失败:', error);

        // 如果API调用失败，使用默认数据作为降级方案
        console.warn('API调用失败，使用默认数据作为降级方案');

        // 根据选中的方案动态生成模拟数据
        const dynamicMockPlan = generateMockMonthlyPlan(planData);
        console.log('动态生成的模拟月度计划:', dynamicMockPlan);

        // 使用动态生成的数据作为后备
        setMonthlyPlan(dynamicMockPlan);
        setSyllabus(mockSyllabus);

        // 保存动态生成的数据供导出使用
        localStorage.setItem('monthlyPlan', JSON.stringify(dynamicMockPlan));
        localStorage.setItem('syllabus', JSON.stringify(mockSyllabus));

        setIsLoading(false);
      }
    };

    loadData();
  }, [tier, router]);

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const toggleDay = (key: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedDays(newExpanded);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-4 text-lg text-gray-600">正在生成详细学习计划...</div>
        </div>
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
              onClick={() => router.push('/plans')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回方案选择
            </Button>

            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(tier)} text-white text-sm font-medium`}>
                {getTierLabel(tier)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            您的{selectedPlan?.weeks || '定制'}周学习计划
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            基于您选择的{getTierLabel(tier)}，我们为您制定了详细的{selectedPlan?.weeks || '定制'}周学习计划，包括月度目标和首月课程安排。
          </p>
        </div>

        {/* 月度计划 */}
        {monthlyPlan && (
          <Card className="mb-12 overflow-hidden">
            <div className={`bg-gradient-to-r ${getTierColor(tier)} text-white p-6`}>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{selectedPlan?.weeks || '定制'}周月度里程碑</h2>
              </div>
              <p className="text-blue-100">
                每月都有明确的学习目标和评估标准，确保您的学习进度可衡量
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {monthlyPlan.milestones.map((milestone, index) => (
                  <div key={index} className="relative">
                    <div className="text-center mb-4">
                      <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${getTierColor(tier)} flex items-center justify-center text-white font-bold text-xl mb-3`}>
                        M{milestone.month}
                      </div>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">学习重点</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {milestone.focus.map((focus, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{focus}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-2">评估标准</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>准确率</span>
                          <span className="font-medium">{(milestone.assessment_gate.accuracy * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>任务步骤</span>
                          <span className="font-medium">{milestone.assessment_gate.task_steps}步</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>停顿次数</span>
                          <span className="font-medium">{milestone.assessment_gate.fluency_pauses}次</span>
                        </div>
                      </div>
                    </div>

                    {index < monthlyPlan.milestones.length - 1 && (
                      <div className="absolute top-20 right-0 hidden lg:block">
                        <ArrowRight className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 首月课程大纲 */}
        {syllabus && (
          <Card className="mb-12 overflow-hidden">
            <div className={`bg-gradient-to-r ${getTierColor(tier)} text-white p-6`}>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6" />
                <h2 className="text-2xl font-bold">首月课程大纲</h2>
              </div>
              <p className="text-blue-100">
                第1周的详细课程安排，每天包含主题、目标和核心学习内容
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {syllabus.weeks.map((week) => (
                  <div key={week.week} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleWeek(week.week)}
                      className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getTierColor(tier)} flex items-center justify-center text-white font-bold`}>
                          W{week.week}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">
                            第{week.week}周：{week.focus}
                          </div>
                          <div className="text-sm text-gray-600">
                            {week.days.length}天，{week.days.reduce((total, day) => total + day.lessons.length, 0)}节课
                          </div>
                        </div>
                      </div>
                      {expandedWeeks.has(week.week) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedWeeks.has(week.week) && (
                      <div className="border-t border-gray-200">
                        {week.days.map((day) => {
                          const dayKey = `week-${week.week}-day-${day.day}`;
                          return (
                            <div key={day.day} className="border-b border-gray-100 last:border-b-0">
                              <button
                                onClick={() => toggleDay(dayKey)}
                                className="w-full px-6 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                    D{day.day}
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900">
                                      第{day.day}天
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {day.lessons.length}节课
                                    </div>
                                  </div>
                                </div>
                                {expandedDays.has(dayKey) ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </button>

                              {expandedDays.has(dayKey) && (
                                <div className="px-6 pb-4 bg-gray-50">
                                  {day.lessons.map((lesson) => (
                                    <div key={lesson.index} className="mb-6 last:mb-0">
                                      <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-xs mt-1">
                                          L{lesson.index}
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-semibold text-gray-900 mb-1">
                                            {lesson.theme}
                                          </div>
                                          <div className="text-sm text-gray-600 mb-3">
                                            {lesson.objective}
                                          </div>
                                          <div className="bg-white rounded-lg p-4">
                                            <div className="mb-3">
                                              <div className="text-xs font-medium text-gray-700 mb-1">今天你能：</div>
                                              <div className="text-sm text-blue-600 font-medium">
                                                {lesson.today_you_can}
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <div className="text-xs font-medium text-gray-700 mb-1">关键词：</div>
                                                <div className="flex flex-wrap gap-1">
                                                  {lesson.keywords.map((keyword, idx) => (
                                                    <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                      {keyword}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-xs font-medium text-gray-700 mb-1">句型：</div>
                                                <div className="space-y-1">
                                                  {lesson.patterns.map((pattern, idx) => (
                                                    <div key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                                                      {pattern}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/plans')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            重新选择方案
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/export')}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            导出学习方案
          </Button>

          <Button
            onClick={() => router.push(`/plan/${tier}/month1`)}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-8 py-3"
          >
            查看详细课程内容
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>💡 这是您{getTierLabel(tier)}的{selectedPlan?.weeks || '定制'}周详细学习计划，点击课程标题查看更多内容</p>
        </div>
      </div>
    </div>
  );
}