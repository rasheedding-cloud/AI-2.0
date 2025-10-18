import { Intake } from '@/types';

export type LearningTrack = 'work' | 'travel' | 'study' | 'daily' | 'exam';

/**
 * 智能学习轨道推荐系统
 * 基于用户的学习目标和背景信息自动推荐最适合的学习轨道
 */
export function recommendLearningTrack(intake: Intake): LearningTrack {
  const { goal_free_text, identity, native_language } = intake;

  if (!goal_free_text) {
    console.log('未提供学习目标，默认推荐日常交流轨道');
    return 'daily'; // 默认推荐日常交流
  }

  // 将目标文本转换为小写，便于匹配
  const goalText = goal_free_text.toLowerCase();

  // 防止循环调用和无限循环的检查
  if (goalText.length > 1000) {
    console.warn('目标文本过长，截断处理');
    return 'daily';
  }

  // 关键词权重映射
  const trackKeywords = {
    work: {
      keywords: [
        '工作', '职场', '商务', '会议', '邮件', '汇报', '演讲', '谈判', '同事', '领导',
        '客户', '业务', '公司', '职业', '面试', '升职', '加薪', '项目管理', '团队',
        'work', 'business', 'career', 'professional', 'office', 'meeting', 'presentation',
        'email', 'report', 'client', 'customer', 'job', 'interview', 'promotion'
      ],
      weight: 0
    },
    travel: {
      keywords: [
        '旅行', '旅游', '出国', '酒店', '飞机', '火车', '问路', '点餐', '购物', '观光',
        '签证', '海关', '机场', '景点', '民宿', '导游', '地图', '背包', '自由行',
        'travel', 'trip', 'hotel', 'flight', 'airport', 'restaurant', 'shopping', 'tourist',
        'vacation', 'holiday', 'abroad', 'foreign', 'sightseeing', 'backpack', 'adventure'
      ],
      weight: 0
    },
    study: {
      keywords: [
        '学习', '考试', '留学', '学校', '课程', '作业', '论文', '研究', '学术', '大学',
        '托福', '雅思', 'GRE', 'GMAT', 'SAT', '考研', '四六级', '证书', '培训',
        'study', 'exam', 'test', 'school', 'university', 'college', 'course', 'homework',
        'research', 'academic', 'paper', 'thesis', 'certificate', 'training', 'education'
      ],
      weight: 0
    },
    daily: {
      keywords: [
        '日常', '生活', '朋友', '交流', '对话', '聊天', '电影', '美剧', '英剧', '音乐',
        '游戏', '社交', '兴趣', '爱好', '娱乐', '放松', '休闲', '聚会', '约会',
        'daily', 'life', 'friend', 'social', 'conversation', 'chat', 'movie', 'tv show',
        'series', 'drama', 'music', 'game', 'hobby', 'interest', 'party', 'dating'
      ],
      weight: 0
    },
    exam: {
      keywords: [
        '考试', '测试', '认证', '资格', '评估', '测评', '分数', '成绩', '及格', '满分',
        '题库', '模拟', '真题', '冲刺', '备考', '应试', '技巧', '策略', '时间管理',
        'exam', 'test', 'certification', 'qualification', 'assessment', 'score', 'grade',
        'pass', 'perfect', 'practice', 'mock', 'review', 'preparation', 'strategy'
      ],
      weight: 0
    }
  };

  // 计算每个轨道的关键词匹配权重
  for (const [track, config] of Object.entries(trackKeywords)) {
    for (const keyword of config.keywords) {
      // 检查是否包含关键词
      if (goalText.includes(keyword.toLowerCase())) {
        trackKeywords[track as LearningTrack].weight += 1;
      }
    }
  }

  // 特殊规则：美剧相关强烈推荐日常轨道
  if (goalText.includes('美剧') || goalText.includes('英剧') ||
      goalText.includes('电视剧') || goalText.includes('tv show') ||
      goalText.includes('series') || goalText.includes('drama')) {
    trackKeywords.daily.weight += 3;
  }

  // 特殊规则：国际友人强烈推荐日常轨道
  if (goalText.includes('国际友人') || goalText.includes('外国朋友') ||
      goalText.includes('international friend') || goalText.includes('foreign friend')) {
    trackKeywords.daily.weight += 3;
  }

  // 特殊规则：职场背景适当增加工作轨道权重
  if (identity === 'working_adult') {
    trackKeywords.work.weight += 1;
  }

  // 特殊规则：学生背景适当增加学习轨道权重
  if (identity === 'university' || identity === 'high_school') {
    trackKeywords.study.weight += 1;
  }

  // 找出权重最高的轨道
  let maxWeight = 0;
  let recommendedTrack: LearningTrack = 'daily';

  for (const [track, config] of Object.entries(trackKeywords)) {
    if (config.weight > maxWeight) {
      maxWeight = config.weight;
      recommendedTrack = track as LearningTrack;
    }
  }

  // 如果所有轨道权重都很低（0或1），返回日常轨道作为默认
  if (maxWeight <= 1) {
    return 'daily';
  }

  // 只在开发环境或调试模式下输出详细日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`智能轨道推荐结果: ${recommendedTrack} (权重: ${maxWeight})`);
    console.log('各轨道权重:', trackKeywords);
  }

  return recommendedTrack;
}

/**
 * 根据学习轨道生成目标描述
 */
export function generateTrackTargetDescription(track: LearningTrack): string {
  const descriptions = {
    work: '职场熟练交流',
    travel: '自如出国旅行',
    study: '学术学习研究',
    daily: '流畅日常对话',
    exam: '考试认证通过'
  };

  return descriptions[track] || '流畅日常对话';
}

/**
 * 根据学习轨道生成能力示例
 */
export function generateTrackCanDoExamples(track: LearningTrack): string[] {
  const examples = {
    work: [
      '能够进行专业的商务会议和讨论',
      '能够撰写规范的商务邮件和报告',
      '能够进行有效的商务演讲和展示',
      '能够处理复杂的客户沟通和谈判'
    ],
    travel: [
      '能够自如地在国外问路和点餐',
      '能够与当地人进行简单友好的交流',
      '能够处理酒店入住和购物等事务',
      '能够在紧急情况下寻求帮助'
    ],
    study: [
      '能够理解学术讲座和课程内容',
      '能够撰写学术文章和研究报告',
      '能够参与学术讨论和小组合作',
      '能够阅读和理解专业文献资料'
    ],
    daily: [
      '能够与外国朋友进行流畅的日常对话',
      '能够理解并讨论电影、音乐等娱乐内容',
      '能够在社交场合自如地表达观点',
      '能够分享生活经历和个人感受'
    ],
    exam: [
      '能够在考试中准确理解题目要求',
      '能够快速定位和分析关键信息',
      '能够运用有效的应试技巧和策略',
      '能够在规定时间内完成高质量答案'
    ]
  };

  return examples[track] || examples.daily;
}

/**
 * 智能分析学习目标并推荐最适合的学习轨道
 */
export function analyzeLearningGoal(goalText: string): {
  recommendedTrack: LearningTrack;
  confidence: number;
  reasoning: string;
} {
  const intake = {
    goal_free_text: goalText,
    identity: 'working_adult',
    native_language: 'zh',
    gender: 'prefer_not_to_say',
    zero_base: false,
    cultural_mode: 'gcc',
    daily_minutes_pref: 60,
    study_days_per_week: 5
  } as Intake;

  const recommendedTrack = recommendLearningTrack(intake);

  // 计算置信度
  const confidence = calculateRecommendationConfidence(goalText, recommendedTrack);

  // 生成推荐理由
  const reasoning = generateRecommendationReasoning(goalText, recommendedTrack);

  return {
    recommendedTrack,
    confidence,
    reasoning
  };
}

/**
 * 计算推荐置信度
 */
function calculateRecommendationConfidence(goalText: string, track: LearningTrack): number {
  const trackKeywords = {
    work: ['工作', '职场', '商务', '公司', '业务'],
    travel: ['旅行', '旅游', '出国', '酒店', '景点'],
    study: ['学习', '考试', '留学', '学术', '课程'],
    daily: ['日常', '生活', '朋友', '交流', '电影'],
    exam: ['考试', '测试', '认证', '资格', '评估']
  };

  const keywords = trackKeywords[track];
  let matchCount = 0;

  for (const keyword of keywords) {
    if (goalText.includes(keyword)) {
      matchCount++;
    }
  }

  // 置信度基于匹配的关键词数量
  return Math.min(0.9, 0.3 + (matchCount * 0.15));
}

/**
 * 生成推荐理由
 */
function generateRecommendationReasoning(goalText: string, track: LearningTrack): string {
  const reasoningMap = {
    work: '检测到与职业发展相关的关键词，推荐职场英语轨道',
    travel: '检测到与旅行相关的关键词，推荐旅行英语轨道',
    study: '检测到与学习考试相关的关键词，推荐学术英语轨道',
    daily: '检测到与日常生活相关的关键词，推荐日常交流轨道',
    exam: '检测到与考试认证相关的关键词，推荐考试英语轨道'
  };

  return reasoningMap[track] || '基于您的学习目标推荐通用英语轨道';
}