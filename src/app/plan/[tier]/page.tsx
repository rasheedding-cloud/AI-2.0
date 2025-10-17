'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { DynamicGateInfo } from '@/components/ui/DynamicGateInfo';
import { ArrowLeft, ArrowRight, Calendar, Target, TrendingUp, BookOpen, ChevronDown, ChevronUp, CheckCircle, Clock, Download } from 'lucide-react';
import { inferStartBand, inferTargetBandFromIntake, ORDER, type Band } from '@/lib/learning/caps';
import { isDynamicGatesUIEnabled } from '@/lib/client/features';

interface MonthlyMilestone {
  month: number;
  max_target_band: string;
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
  difficulty_band: string; // CEFR微档级别，如 "A2", "B1-", "B1", "B1+", "B2-"
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

      // 根据月份动态设置能力上限
      let maxTargetBand = "A2+";
      if (month === 3) maxTargetBand = "B1-";
      else if (month === 4) maxTargetBand = "B1";
      else if (month > 4) maxTargetBand = "B1";

      milestones.push({
        month,
        max_target_band: maxTargetBand,
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

  // 计算课程难度的辅助函数
  const calculateLessonDifficulty = (
    weekNumber: number,
    lessonIndex: number,
    totalLessons: number,
    startBand: Band,
    targetBand: Band
  ): string => {
    // 计算总的学习进度（0到1）
    const overallProgress = (weekNumber - 1) * 20 + (lessonIndex - 1) * 5; // 假设每周20节课，每节课占5%进度

    // 获取起始和目标级别的索引
    const startIndex = ORDER.indexOf(startBand);
    const targetIndex = ORDER.indexOf(targetBand);

    // 计算当前应该达到的级别索引
    const totalSteps = targetIndex - startIndex;
    const currentStep = Math.floor((overallProgress / 100) * totalSteps);
    const currentIndex = Math.min(startIndex + currentStep, targetIndex);

    // 获取当前级别
    let currentBand = ORDER[currentIndex];

    // 在当前级别内进行微调（-、无、+）
    const progressWithinLevel = ((overallProgress / 100) * totalSteps) % 1;

    if (progressWithinLevel < 0.33) {
      return `${currentBand}-`;
    } else if (progressWithinLevel < 0.67) {
      return currentBand;
    } else {
      // 检查是否可以升级到+
      const plusBand = `${currentBand}+`;
      if (currentBand === 'A1' || currentBand === 'A2' || currentBand === 'B1' || currentBand === 'B2') {
        return plusBand;
      } else {
        return currentBand;
      }
    }
  };

  // 动态生成模拟课程大纲
  const generateMockSyllabus = (plan: any): FirstMonthSyllabus => {
    const track = plan?.track || 'work';
    const currentWeek = new Date().getDate() > 15 ? 3 : 1; // 如果月中，从第三周开始

    // 获取用户的起始和目标CEFR级别
    const startBand = inferStartBand(plan);
    const targetBand = inferTargetBandFromIntake(plan);

    // 从选中的方案数据中获取学习安排，而不是用户输入数据
    const dailyMinutes = plan?.daily_minutes || 60; // 默认60分钟
    const studyDaysPerWeek = plan?.days_per_week || 5; // 默认5天

    // 计算每天的课程数量：每节外教课25分钟，所以60分钟=2节课，90分钟=3节课
    const lessonsPerDay = Math.floor(dailyMinutes / 25);

    console.log('=== 课程大纲参数计算 ===');
    console.log('传入的方案数据:', plan);
    console.log('方案daily_minutes:', plan?.daily_minutes);
    console.log('方案days_per_week:', plan?.days_per_week);
    console.log('每日学习时间(分钟):', dailyMinutes);
    console.log('每周学习天数:', studyDaysPerWeek);
    console.log('计算得出每日课程数:', lessonsPerDay);

    const getTrackContent = () => {
      switch (track) {
        case 'exam':
          return {
            week1: {
              focus: '托福GRE基础词汇和语法',
              themes: [
                {
                  name: '考试词汇基础',
                  keywords: ['vocabulary', 'terms', 'definitions', 'synonyms'],
                  patterns: ['What does...mean?', 'Could you define...?', 'What\'s the synonym for...?', 'How do you spell...?']
                },
                {
                  name: '核心语法结构',
                  keywords: ['grammar', 'tense', 'structure', 'syntax'],
                  patterns: ['What is the tense of...?', 'Can you identify the subject...?', 'What type of clause is this?', 'Is this sentence correct?']
                },
                {
                  name: '阅读理解技巧',
                  keywords: ['comprehension', 'main idea', 'details', 'inference'],
                  patterns: ['The main idea is...', 'According to the passage...', 'What can we infer...?', 'The author suggests that...']
                },
                {
                  name: '逻辑推理入门',
                  keywords: ['reasoning', 'logic', 'analysis', 'conclusion'],
                  patterns: ['What is the logical connection...?', 'Based on this information...', 'What can we conclude...?', 'The reasoning behind this is...']
                }
              ]
            },
            week2: {
              focus: '托福听力与阅读专项训练',
              themes: [
                {
                  name: '听力对话理解',
                  keywords: ['conversation', 'dialogue', 'listening', 'understanding'],
                  patterns: ['What are they discussing...?', 'What is the man\'s opinion...?', 'What does the woman mean...?', 'What is the main topic...?']
                },
                {
                  name: '学术讲座听力',
                  keywords: ['lecture', 'professor', 'academic', 'presentation'],
                  patterns: ['What is the lecture about...?', 'What is the professor\'s field...?', 'What example does the professor give...?', 'What is the main point...?']
                },
                {
                  name: '长篇文章阅读',
                  keywords: ['reading', 'passage', 'article', 'comprehension'],
                  patterns: ['What is the passage mainly about...?', 'What can be inferred from paragraph 3...?', 'What is the author\'s attitude...?', 'What does the word...refer to...?']
                },
                {
                  name: '信息定位技巧',
                  keywords: ['location', 'scanning', 'skimming', 'searching'],
                  patterns: ['Where can you find information about...?', 'What section discusses...?', 'In which paragraph would you look for...?', 'The information about...is located in...']
                }
              ]
            }
          };
        case 'work':
          return {
            week1: {
              focus: '基础职场自我介绍和问候',
              themes: [
                {
                  name: '工作场合的自我介绍',
                  keywords: ['introduce', 'background', 'experience', 'position'],
                  patterns: ['My name is...', 'I work in the...', 'I have X years of experience in...', 'My role involves...']
                },
                {
                  name: '职场基本问候语',
                  keywords: ['greeting', 'formal', 'informal', 'polite'],
                  patterns: ['Good morning/afternoon...', 'How are you today?', 'Nice to see you again...', 'I hope you had a good weekend...']
                },
                {
                  name: '询问工作内容',
                  keywords: ['responsibilities', 'duties', 'tasks', 'projects'],
                  patterns: ['What do you do here?', 'What are your main responsibilities?', 'What projects are you working on?', 'How long have you been in this role?']
                },
                {
                  name: '描述日常工作',
                  keywords: ['daily', 'routine', 'schedule', 'meetings'],
                  patterns: ['I usually start my day with...', 'My typical day involves...', 'I\'m responsible for...', 'I spend most of my time...']
                }
              ]
            },
            week2: {
              focus: '办公室日常沟通和会议基础',
              themes: [
                {
                  name: '请求帮助',
                  keywords: ['help', 'assist', 'support', 'guidance'],
                  patterns: ['Could you help me with...?', 'I need some assistance with...', 'Would you mind showing me how to...?', 'Could you give me some guidance on...?']
                },
                {
                  name: '提供帮助',
                  keywords: ['offer', 'support', 'collaborate', 'teamwork'],
                  patterns: ['Let me help you with that...', 'I can assist you with...', 'Would you like me to...?', 'We can work together on...']
                },
                {
                  name: '会议邀请',
                  keywords: ['meeting', 'invite', 'schedule', 'agenda'],
                  patterns: ['We have a meeting scheduled for...', 'Could you join us for...?', 'The meeting will cover...', 'Please confirm your attendance for...']
                },
                {
                  name: '会议准备',
                  keywords: ['prepare', 'materials', 'presentation', 'notes'],
                  patterns: ['I need to prepare for...', 'Let me gather the materials for...', 'What should I bring to the meeting?', 'I\'m preparing a presentation on...']
                }
              ]
            }
          };
        case 'study':
          return {
            week1: {
              focus: '学术环境基础沟通',
              themes: [
                {
                  name: '课堂自我介绍',
                  keywords: ['introduction', 'classroom', 'students', 'academic'],
                  patterns: ['My name is...', 'I\'m studying...', 'My major is...', 'I\'m interested in...']
                },
                {
                  name: '课程咨询',
                  keywords: ['course', 'schedule', 'requirements', 'credits'],
                  patterns: ['What does this course cover?', 'When are the office hours?', 'What are the prerequisites?', 'How many credits is this course?']
                },
                {
                  name: '学习小组合作',
                  keywords: ['group', 'project', 'collaboration', 'discussion'],
                  patterns: ['Let\'s work together on...', 'What do you think about...?', 'How should we divide the work?', 'When should we meet to discuss...?']
                },
                {
                  name: '简单演讲',
                  keywords: ['presentation', 'speech', 'audience', 'topic'],
                  patterns: ['Today I\'m going to talk about...', 'My presentation is divided into X parts...', 'What I want to emphasize is...', 'To conclude my presentation...']
                }
              ]
            },
            week2: {
              focus: '学术讨论与研究基础',
              themes: [
                {
                  name: '学术文献阅读',
                  keywords: ['research', 'article', 'journal', 'publication'],
                  patterns: ['According to the study by...', 'The research indicates that...', 'What is your interpretation of...?', 'How does this relate to previous research?']
                },
                {
                  name: '研究报告写作',
                  keywords: ['writing', 'paper', 'report', 'analysis'],
                  patterns: ['The purpose of this paper is...', 'Our findings suggest that...', 'In this section, we will discuss...', 'What are the implications of these results?']
                },
                {
                  name: '课堂讨论参与',
                  keywords: ['discussion', 'participation', 'opinion', 'feedback'],
                  patterns: ['I agree with...because...', 'Have you considered that...?', 'What\'s your perspective on...?', 'I\'d like to add that...']
                },
                {
                  name: '导师沟通',
                  keywords: ['advisor', 'mentor', 'guidance', 'academic support'],
                  patterns: ['Could you provide some guidance on...?', 'I\'d like to discuss my progress with...', 'What areas should I focus on improving?', 'Could you recommend some resources for...?']
                }
              ]
            }
          };
        default:
          return {
            week1: {
              focus: '日常英语基础交流',
              themes: [
                {
                  name: '基础问候',
                  keywords: ['greeting', 'hello', 'goodbye', 'polite'],
                  patterns: ['Nice to meet you!', 'How are you today?', 'Good morning/afternoon/evening!', 'Have a great day!']
                },
                {
                  name: '个人信息',
                  keywords: ['personal', 'information', 'details', 'background'],
                  patterns: ['My name is...', 'I\'m from...', 'I live in...', 'I speak...languages']
                },
                {
                  name: '兴趣爱好',
                  keywords: ['hobbies', 'interests', 'activities', 'free time'],
                  patterns: ['I like to...', 'I enjoy...', 'My hobbies include...', 'In my free time, I usually...']
                },
                {
                  name: '日常安排',
                  keywords: ['schedule', 'routine', 'plans', 'activities'],
                  patterns: ['I usually start my day at...', 'Today I have to...', 'I\'m planning to...', 'My schedule for tomorrow includes...']
                }
              ]
            },
            week2: {
              focus: '日常对话进阶',
              themes: [
                {
                  name: '计划安排',
                  keywords: ['plans', 'arrangements', 'schedule', 'future'],
                  patterns: ['What are your plans for...?', 'Let\'s arrange to meet at...', 'I\'m planning to...', 'Would you be available on...?']
                },
                {
                  name: '意见表达',
                  keywords: ['opinion', 'viewpoint', 'perspective', 'thoughts'],
                  patterns: ['In my opinion...', 'I think that...', 'From my perspective...', 'What\'s your take on...?']
                },
                {
                  name: '故事讲述',
                  keywords: ['story', 'narrative', 'experience', 'events'],
                  patterns: ['Let me tell you about...', 'Yesterday I went to...', 'The interesting thing about this was...', 'What happened next was...']
                },
                {
                  name: '情感交流',
                  keywords: ['feelings', 'emotions', 'mood', 'reactions'],
                  patterns: ['I feel...when...', 'That makes me feel...', 'How did you feel when...?', 'I was really...about...']
                }
              ]
            }
          };
      }
    };

    const trackContent = getTrackContent();
    const weeks = [];

    // 创建一个动态主题池，根据用户需要的课时数量来分配课程
    const createDynamicLessons = (themes: any[], totalLessons: number, weekNumber: number) => {
      const lessons = [];
      const themePool = [];

      // 复制主题池以满足所需课时数量
      while (themePool.length < totalLessons) {
        themePool.push(...themes);
      }

      // 取所需数量的主题
      const selectedThemes = themePool.slice(0, totalLessons);

      selectedThemes.forEach((themeData, index) => {
        const lessonIndex = (weekNumber - 1) * totalLessons + index + 1;
        lessons.push({
          index: lessonIndex,
          theme: themeData.name,
          objective: `学习${themeData.name}的核心内容`,
          today_you_can: `掌握${themeData.name}的基本技能`,
          keywords: themeData.keywords,
          patterns: themeData.patterns,
          difficulty_band: calculateLessonDifficulty(weekNumber, lessonIndex, totalLessons * 2, startBand, targetBand)
        });
      });

      return lessons;
    };

    // 根据当前日期决定从第几周开始
    if (currentWeek === 1) {
      // 月初，显示完整的两周
      weeks.push(
        {
          week: 1,
          focus: trackContent.week1.focus,
          days: Array.from({length: studyDaysPerWeek}, (_, dayIndex) => ({
            day: dayIndex + 1,
            lessons: createDynamicLessons(trackContent.week1.themes, lessonsPerDay, 1)
          }))
        },
        {
          week: 2,
          focus: trackContent.week2.focus,
          days: Array.from({length: studyDaysPerWeek}, (_, dayIndex) => ({
            day: dayIndex + 1,
            lessons: createDynamicLessons(trackContent.week2.themes, lessonsPerDay, 2)
          }))
        }
      );
    } else {
      // 月中，只显示剩余的两周（第3、4周）
      weeks.push(
        {
          week: 3,
          focus: `${trackContent.week1.focus} - 第3周`,
          days: Array.from({length: studyDaysPerWeek}, (_, dayIndex) => ({
            day: dayIndex + 1,
            lessons: createDynamicLessons(trackContent.week1.themes, lessonsPerDay, 3).map(lesson => ({
              ...lesson,
              theme: `${lesson.theme} (进阶)`,
              objective: `深入学习${lesson.theme}的高级技巧`,
              today_you_can: `能够熟练运用${lesson.theme}解决实际问题`
            }))
          }))
        },
        {
          week: 4,
          focus: `${trackContent.week2.focus} - 第4周`,
          days: Array.from({length: studyDaysPerWeek}, (_, dayIndex) => ({
            day: dayIndex + 1,
            lessons: createDynamicLessons(trackContent.week2.themes, lessonsPerDay, 4).map(lesson => ({
              ...lesson,
              theme: `${lesson.theme} (综合)`,
              objective: `综合应用${lesson.theme}的所有技能`,
              today_you_can: `能够独立完成${lesson.theme}相关的复杂任务`
            }))
          }))
        }
      );
    }

    return { weeks };
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

        console.log('=== 开始加载方案详情 ===');
        console.log('方案数据:', planData);
        console.log('用户数据:', intakeData);
        console.log('用户每日学习时间(分钟):', intakeData.daily_minutes);
        console.log('用户每周学习天数:', intakeData.study_days_per_week);

        // 强制清除旧的缓存数据，确保重新生成
        const expectedMonths = Math.max(1, Math.min(12, Math.ceil((planData?.weeks || 8) / 4)));
        console.log('=== 月数计算 ===');
        console.log('预期月数:', expectedMonths);
        console.log('方案周数:', planData?.weeks);
        console.log('方案tier:', planData?.tier);
        console.log('方案track:', planData?.track);

        // 无条件清除缓存，确保重新生成正确数据
        localStorage.removeItem('monthlyPlan');
        localStorage.removeItem('syllabus');
        console.log('=== 已清除缓存 ===');

        // 尝试使用AI生成月度计划
        console.log('=== 开始AI生成月度计划 ===');
        try {
          const response = await fetch('/api/generate/monthly', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plan: planData,
              intake: intakeData
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              console.log('AI生成的月度计划:', JSON.stringify(result.data, null, 2));
              console.log('月度计划月数:', result.data.months_total);
              console.log('月度计划里程碑数量:', result.data.milestones.length);

              setMonthlyPlan(result.data);
              localStorage.setItem('monthlyPlan', JSON.stringify(result.data));
              console.log('=== AI生成成功 ===');
            } else {
              throw new Error(result.error || 'AI生成失败');
            }
          } else {
            throw new Error('API调用失败');
          }
        } catch (error) {
          console.warn('AI生成失败，使用动态数据作为回退:', error);

          // 如果AI生成失败，使用动态生成的数据作为回退
          const dynamicMockPlan = generateMockMonthlyPlan(planData);
          console.log('使用回退数据，月度计划:', JSON.stringify(dynamicMockPlan, null, 2));
          console.log('回退数据月数:', dynamicMockPlan.months_total);
          console.log('回退数据里程碑数量:', dynamicMockPlan.milestones.length);

          setMonthlyPlan(dynamicMockPlan);
          localStorage.setItem('monthlyPlan', JSON.stringify(dynamicMockPlan));
        }

        // 获取当前的月度计划数据（无论是AI生成的还是回退数据）
        const getCurrentMonthlyPlan = () => {
          const savedMonthlyPlan = localStorage.getItem('monthlyPlan');
          if (savedMonthlyPlan) {
            try {
              return JSON.parse(savedMonthlyPlan);
            } catch (e) {
              console.warn('解析保存的月度计划失败，使用重新生成');
            }
          }
          return generateMockMonthlyPlan(planData);
        };

        // 尝试使用AI生成首月课程大纲
        console.log('=== 开始AI生成首月课程大纲 ===');
        try {
          const currentMonthlyPlan = getCurrentMonthlyPlan();

          const syllabusResponse = await fetch('/api/generate/syllabus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              monthlyPlan: currentMonthlyPlan,
              plan: planData,
              intake: intakeData
            })
          });

          if (syllabusResponse.ok) {
            const syllabusResult = await syllabusResponse.json();
            if (syllabusResult.success && syllabusResult.data) {
              console.log('AI生成的课程大纲成功');
              setSyllabus(syllabusResult.data);
              localStorage.setItem('syllabus', JSON.stringify(syllabusResult.data));
              console.log('=== AI课程大纲生成成功 ===');
            } else {
              throw new Error(syllabusResult.error || 'AI生成失败');
            }
          } else {
            throw new Error('课程大纲API调用失败');
          }
        } catch (error) {
          console.warn('AI课程大纲生成失败，使用模拟数据:', error);

          // 如果AI生成失败，使用动态生成的模拟数据作为回退
          const fallbackSyllabus = generateMockSyllabus(planData);
          setSyllabus(fallbackSyllabus);
          localStorage.setItem('syllabus', JSON.stringify(fallbackSyllabus));
        }

        console.log('首月课程大纲设置完成');

        // 确保用户信息被保存
        localStorage.setItem('userIntake', JSON.stringify(intakeData));

        // 调试动态门限功能状态
        console.log('=== 动态门限功能状态检查 ===');
        console.log('环境变量 NEXT_PUBLIC_FEATURE_DYNAMIC_GATES_UI:', process.env.NEXT_PUBLIC_FEATURE_DYNAMIC_GATES_UI);
        console.log('isDynamicGatesUIEnabled():', isDynamicGatesUIEnabled());
        console.log('月度计划数据:', monthlyPlan);

        setIsLoading(false);
      } catch (error) {
        console.error('加载方案详情失败:', error);

        // 如果有任何错误，确保至少显示月度计划
        console.warn('发生错误，确保至少显示月度计划');

        // 使用动态生成的数据作为最后的回退
        const emergencyFallbackSyllabus = generateMockSyllabus(planData);
        setSyllabus(emergencyFallbackSyllabus);
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

                    {isDynamicGatesUIEnabled() ? (
                      <>
                        {console.log('=== DynamicGateInfo渲染 ===', {
                          month: milestone.month,
                          max_target_band: milestone.max_target_band,
                          assessment_gate: milestone.assessment_gate,
                          isDynamicGatesUIEnabled: isDynamicGatesUIEnabled()
                        })}
                        <DynamicGateInfo
                          milestone={{
                            month: milestone.month,
                            max_target_band: milestone.max_target_band,
                            assessment_gate: milestone.assessment_gate
                          }}
                          showSelfTest={true}
                        />
                      </>
                    ) : (
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
                    )}

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
                                          <div className="flex items-center gap-2 mb-1">
                                            <div className="font-semibold text-gray-900">
                                              {lesson.theme}
                                            </div>
                                            <div className={`px-2 py-1 text-xs font-medium rounded ${
                                              lesson.difficulty_band.includes('A1') ? 'bg-green-100 text-green-700' :
                                              lesson.difficulty_band.includes('A2') ? 'bg-blue-100 text-blue-700' :
                                              lesson.difficulty_band.includes('B1') ? 'bg-yellow-100 text-yellow-700' :
                                              lesson.difficulty_band.includes('B2') ? 'bg-orange-100 text-orange-700' :
                                              lesson.difficulty_band.includes('C1') ? 'bg-red-100 text-red-700' :
                                              'bg-gray-100 text-gray-700'
                                            }`}>
                                              {lesson.difficulty_band}
                                            </div>
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