'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, Calendar, BookOpen, CheckCircle, Clock, Users, Target, TrendingUp, Download, ChevronDown, ChevronUp, User } from 'lucide-react';

interface Lesson {
  index: number;
  difficulty_band: string;
  theme: string;
  objective: string;
  today_you_can: string;
  keywords: string[];
  patterns: string[];
  teacher_guide?: {
    ask: string;
    say: string;
    tip: string;
  };
  review_patterns?: string[];
  caps: {
    grammar_allow: string[];
    grammar_forbid: string[];
    listening_wpm_max: number;
    max_sentences: number;
  };
  max_task_steps: number;
}

interface DayLessons {
  day: number;
  lessons: Lesson[];
}

interface WeekPlan {
  week: number;
  focus: string;
  days: DayLessons[];
}

interface FirstMonthSyllabus {
  weeks: WeekPlan[];
}

export default function Month1DetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [syllabus, setSyllabus] = useState<FirstMonthSyllabus | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const tier = params.tier as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // 从localStorage获取数据
        const savedSyllabus = localStorage.getItem('syllabus');
        const savedMonthlyPlan = localStorage.getItem('monthlyPlan');
        const savedPlan = localStorage.getItem('selectedPlan');
        const userIntake = localStorage.getItem('userIntake');

        if (!savedSyllabus && !savedMonthlyPlan) {
          console.error('缺少课程数据，跳转到方案详情页面');
          router.push(`/plan/${tier}`);
          return;
        }

        let syllabusData: FirstMonthSyllabus;

        if (savedSyllabus) {
          syllabusData = JSON.parse(savedSyllabus);
        } else if (savedMonthlyPlan && savedPlan && userIntake) {
          // 如果没有课程大纲但有月度计划，尝试生成课程大纲
          console.log('正在生成首月课程大纲...');
          const monthlyPlanData = JSON.parse(savedMonthlyPlan);
          const planData = JSON.parse(savedPlan);
          const intakeData = JSON.parse(userIntake);

          const syllabusResponse = await fetch('/api/generate-syllabus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              monthlyPlan: monthlyPlanData,
              chosenPlan: planData,
              intake: intakeData
            })
          });

          if (syllabusResponse.ok) {
            const syllabusResult = await syllabusResponse.json();
            if (syllabusResult.success) {
              syllabusData = syllabusResult.data;
              localStorage.setItem('syllabus', JSON.stringify(syllabusData));
            }
          }
        }

        if (syllabusData) {
          setSyllabus(syllabusData);
        } else {
          // 使用默认数据
          const defaultSyllabus: FirstMonthSyllabus = {
            weeks: [
              {
                week: 1,
                focus: '基础职场英语入门',
                days: [
                  {
                    day: 1,
                    lessons: [
                      {
                        index: 1,
                        difficulty_band: 'A2',
                        theme: '职场自我介绍',
                        objective: '学会在工作中进行基本的自我介绍',
                        today_you_can: '能够自信地介绍自己的姓名、职位和工作内容',
                        keywords: ['introduce', 'position', 'company', 'responsibility'],
                        patterns: ['My name is...', 'I work as...', 'I am responsible for...'],
                        teacher_guide: {
                          ask: '请介绍一下你的职位和主要工作内容',
                          say: '自我介绍要简洁明了，突出重点信息',
                          tip: '语速适中，发音清晰'
                        },
                        caps: {
                          grammar_allow: ['简单现在时', 'be动词'],
                          grammar_forbid: ['复杂时态', '被动语态'],
                          listening_wpm_max: 90,
                          max_sentences: 4
                        },
                        max_task_steps: 2
                      }
                    ]
                  },
                  {
                    day: 2,
                    lessons: [
                      {
                        index: 2,
                        difficulty_band: 'A2',
                        theme: '职场问候礼仪',
                        objective: '掌握工作场合的基本问候表达',
                        today_you_can: '能够在不同场合使用恰当的问候语',
                        keywords: ['hello', 'good morning', 'nice to meet', 'how are you'],
                        patterns: ['Good morning!', 'Nice to meet you!', 'How are you today?'],
                        teacher_guide: {
                          ask: '遇到同事时应该如何问候？',
                          say: '问候要热情友好，根据时间选择合适的表达',
                          tip: '注意文化差异，保持礼貌'
                        },
                        caps: {
                          grammar_allow: ['简单疑问句', '感叹句'],
                          grammar_forbid: ['复杂从句'],
                          listening_wpm_max: 95,
                          max_sentences: 3
                        },
                        max_task_steps: 2
                      }
                    ]
                  }
                ]
              }
            ]
          };
          setSyllabus(defaultSyllabus);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('加载首月课程失败:', error);
        router.push(`/plan/${tier}`);
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

  const getDifficultyColor = (band: string) => {
    switch (band) {
      case 'A2': return 'bg-green-100 text-green-700';
      case 'A2+': return 'bg-blue-100 text-blue-700';
      case 'B1-': return 'bg-yellow-100 text-yellow-700';
      case 'B1': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-4 text-lg text-gray-600">正在加载首月课程内容...</div>
        </div>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">课程内容加载失败</div>
          <Button onClick={() => router.push(`/plan/${tier}`)}>
            返回方案详情
          </Button>
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
              onClick={() => router.push(`/plan/${tier}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回方案详情
            </Button>

            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(tier)} text-white text-sm font-medium`}>
                {getTierLabel(tier)} - 首月课程
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            首月详细课程大纲
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            基于您的{getTierLabel(tier)}，这是第一周的学习计划，包含每天的具体课程安排和学习目标。
          </p>
        </div>

        {/* 课程大纲 */}
        <Card className="mb-12 overflow-hidden">
          <div className={`bg-gradient-to-r ${getTierColor(tier)} text-white p-6`}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6" />
              <h2 className="text-2xl font-bold">第1月课程安排</h2>
            </div>
            <p className="text-blue-100">
              详细的首月学习计划，按周和天组织，包含具体的学习目标和课程内容
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
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getTierColor(tier)} flex items-center justify-center text-white font-bold text-lg`}>
                        W{week.week}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-lg">
                          第{week.week}周：{week.focus}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-4">
                          <span>{week.days.length}天</span>
                          <span>•</span>
                          <span>{week.days.reduce((total, day) => total + day.lessons.length, 0)}节课</span>
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
                              className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                  D{day.day}
                                </div>
                                <div className="text-left">
                                  <div className="font-medium text-gray-900">
                                    第{day.day}天
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {day.lessons.length}节课程
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
                                  <div key={lesson.index} className="mb-6 last:mb-0 bg-white rounded-lg p-6 shadow-sm">
                                    <div className="flex items-start gap-4 mb-4">
                                      <div className="flex-shrink-0">
                                        <div className={`w-8 h-8 rounded-full ${getDifficultyColor(lesson.difficulty_band)} flex items-center justify-center font-bold text-sm`}>
                                          L{lesson.index}
                                        </div>
                                        <div className={`ml-2 text-xs px-2 py-1 rounded ${getDifficultyColor(lesson.difficulty_band)}`}>
                                          {lesson.difficulty_band}
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-900 text-lg mb-2">
                                          {lesson.theme}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      {/* 学习目标 */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Target className="w-4 h-4 text-blue-600" />
                                          <span className="font-medium text-gray-700">学习目标</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{lesson.objective}</p>
                                      </div>

                                      {/* 今天你能 */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                          <span className="font-medium text-gray-700">今天你能</span>
                                        </div>
                                        <p className="text-sm text-blue-600 font-medium">{lesson.today_you_can}</p>
                                      </div>

                                      {/* 关键词 */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Users className="w-4 h-4 text-purple-600" />
                                          <span className="font-medium text-gray-700">关键词</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {lesson.keywords.map((keyword, idx) => (
                                            <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                              {keyword}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* 句型练习 */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <BookOpen className="w-4 h-4 text-orange-600" />
                                          <span className="font-medium text-gray-700">句型练习</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {lesson.patterns.map((pattern, idx) => (
                                            <div key={idx} className="text-xs bg-orange-50 text-orange-800 p-2 rounded font-mono border border-orange-200">
                                              {pattern}
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* 学习限制 */}
                                      <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Clock className="w-4 h-4 text-gray-600" />
                                          <span className="font-medium text-gray-700">学习限制</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                          <div>
                                            <div className="text-gray-500">听力速度</div>
                                            <div className="font-medium">{lesson.caps.listening_wpm_max} WPM</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">最大句长</div>
                                            <div className="font-medium">{lesson.caps.max_sentences}句</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">任务步骤</div>
                                            <div className="font-medium">{lesson.max_task_steps}步</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500">允许语法</div>
                                            <div className="font-medium">{lesson.caps.grammar_allow[0]}</div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 老师指导 */}
                                      {lesson.teacher_guide && (
                                        <div className="bg-blue-50 rounded-lg p-4">
                                          <div className="flex items-center gap-2 mb-3">
                                            <User className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-gray-700">老师指导</span>
                                          </div>
                                          <div className="space-y-2 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-700">提问：</span>
                                              <span className="text-gray-600"> {lesson.teacher_guide.ask}</span>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700">说明：</span>
                                              <span className="text-gray-600"> {lesson.teacher_guide.say}</span>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700">提示：</span>
                                              <span className="text-gray-600"> {lesson.teacher_guide.tip}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
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

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/plan/${tier}`)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回方案详情
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
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-8 py-3"
          >
            <Download className="w-4 h-4 mr-2" />
            打印课程大纲
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>💡 这是您{getTierLabel(tier)}首月的详细课程计划，每天包含具体的学习内容和目标</p>
          <p className="mt-1">点击课程标题查看更多详细内容，包括学习限制和老师指导</p>
        </div>
      </div>
    </div>
  );
}