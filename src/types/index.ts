export type Gender = 'male' | 'female' | 'prefer_not_to_say';
export type Identity = 'working_adult' | 'university' | 'high_school';
export type Track = 'work' | 'travel' | 'study' | 'daily' | 'exam';
export type DifficultyBand = 'Pre-A' | 'A1-' | 'A1' | 'A1+' | 'A2-' | 'A2' | 'A2+' | 'B1-' | 'B1';
export type CulturalMode = 'sa' | 'gcc' | 'none';
export type PlanTier = 'light' | 'standard' | 'intensive';
export type DiagnosisColor = 'green' | 'yellow' | 'red';

export interface Intake {
  gender: Gender;
  identity: Identity;
  native_language: 'ar' | 'zh' | 'other';
  goal_free_text: string;
  zero_base: boolean | null;
  self_assessed_level?: 'Pre-A' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  deadline_date?: string | null;
  daily_minutes_pref?: number | null;
  study_days_per_week?: number | null; // default 5
  cultural_mode: CulturalMode;
  track_override?: Track | null;
}

export interface PlanOption {
  tier: PlanTier;
  track: Track;
  ui_label_current: string;
  ui_label_target: string;
  can_do_examples: string[]; // 3–4
  daily_minutes: number;
  days_per_week: number;
  weeks: number;
  finish_date_est: string; // YYYY-MM
  lessons_total: number; // 25' lessons
  diagnosis: DiagnosisColor;
  diagnosis_tips: string[]; // e.g. ["+15min/day","6 days/week","lower target"]
  monthly_milestones_one_line: string[];
}

export interface MonthlyMilestone {
  month: 1 | 2 | 3 | 4;
  max_target_band: DifficultyBand; // M1 A2+, M2 A2+, M3 B1-, M4 B1
  focus: string[]; // 3–6 条
  assessment_gate: {
    accuracy: number;
    task_steps: number;
    fluency_pauses: number;
  };
}

export interface MonthlyPlan {
  months_total: 4; // 固定 4
  milestones: MonthlyMilestone[];
}

export interface LessonCaps {
  grammar_allow: string[];
  grammar_forbid: string[];
  listening_wpm_max: number;
  max_sentences: number;
}

export interface TeacherGuide {
  ask: string;
  say: string;
  tip: string;
}

export interface Lesson {
  index: number;
  difficulty_band: DifficultyBand;
  theme: string;
  objective: string;
  today_you_can: string; // 1 line
  keywords: string[];
  patterns: string[];
  teacher_guide: TeacherGuide;
  review_patterns?: string[]; // pattern ids
  caps: LessonCaps;
  max_task_steps: number;
}

export interface DayLessons {
  day: 1 | 2 | 3 | 4 | 5;
  lessons: Lesson[];
}

export interface WeekPlan {
  week: 1 | 2 | 3 | 4;
  focus: string;
  days: DayLessons[];
}

export interface FirstMonthSyllabus {
  weeks: WeekPlan[];
}

export interface QuickTest {
  answers?: string[];
  score?: number;
  mapped_start?: string;
  micro_units?: string[];
}

export interface AppState {
  intake: Intake | null;
  planOptions: PlanOption[] | null;
  chosen: PlanOption | null;
  monthlyPlan: MonthlyPlan | null;
  month1: FirstMonthSyllabus | null;
  quickTest?: QuickTest;
}

// LLM Adapter Interface
export interface LLMAdapter {
  chat<TOut = string>(opts: {
    system?: string;
    prompt: string;
    temperature?: number;
  }): Promise<TOut>;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// Export Types
export interface ExportOptions {
  format: 'excel' | 'pdf';
  includeTeacherNotes?: boolean;
}

export interface ReminderOptions {
  type: 'whatsapp' | 'email' | 'calendar';
  frequency: 'daily' | 'weekly';
  time: string; // HH:MM format
  enabled: boolean;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Analytics Events
export type AnalyticsEvent =
  | 'intake_completed'
  | 'track_detected'
  | 'plan_shown'
  | 'plan_selected'
  | 'monthly_plan_rendered'
  | 'first_month_rendered'
  | 'quicktest_started'
  | 'quicktest_finished'
  | 'export_clicked'
  | 'reminder_optin'
  | 'trial_booked';

export interface AnalyticsData {
  event: AnalyticsEvent;
  properties?: Record<string, any>;
  timestamp: string;
}

// UI Component Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 主题相关类型
export type Theme = 'light' | 'dark' | 'system';

// 尺寸类型
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 颜色变体类型
export type Variant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline'
  | 'ghost'
  | 'destructive';

// 位置类型
export type Position = 'top' | 'right' | 'bottom' | 'left' | 'center';

// 动画类型
export type Animation = 'fade' | 'slide' | 'scale' | 'bounce' | 'none';

// 通用类型定义
export type ApiResponse<T = any> = {
  data: T;
  message: string;
  success: boolean;
  code?: number;
};

// 分页类型
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 排序类型
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// 过滤类型
export interface FilterOption {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like';
  value: any;
}

// 表格列类型
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

// 菜单项类型
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  disabled?: boolean;
  badge?: string | number;
}

// 用户信息类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'teacher' | 'student';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// 学习计划类型
export interface LearningPlan {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // 分钟
  lessons: Lesson[];
  objectives: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 资源类型
export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'link';
  url: string;
  size?: number;
  description?: string;
}

// 测验类型
export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  timeLimit?: number; // 分钟
  passingScore: number; // 百分比
  maxAttempts: number;
}

// 问题类型
export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

// 学习进度类型
export interface LearningProgress {
  id: string;
  userId: string;
  planId: string;
  completedLessons: string[];
  currentLesson?: string;
  timeSpent: number; // 分钟
  score?: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt: string;
}

// 表单验证类型
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  validation?: ValidationRule;
  options?: { label: string; value: any }[];
  disabled?: boolean;
  hidden?: boolean;
}

// 文件上传类型
export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

// 通知类型
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  action?: {
    label: string;
    url: string;
  };
}

// 搜索结果类型
export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// 统计数据类型
export interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalPlans: number;
  completedPlans: number;
  averageScore: number;
  timeSpent: number;
  growthRate: number;
}