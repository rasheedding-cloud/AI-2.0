import { StepConfig, NativeLanguage } from '@/types/intake';

export const STEPS: StepConfig[] = [
  {
    id: 1,
    title: '性别选择',
    description: '请选择您的性别',
    isRequired: true,
  },
  {
    id: 2,
    title: '身份选择',
    description: '请选择您当前的身份',
    isRequired: true,
  },
  {
    id: 3,
    title: '母语选择',
    description: '请选择您的母语',
    isRequired: true,
  },
  {
    id: 4,
    title: '学习目标',
    description: '请描述您的英语学习目标',
    isRequired: true,
  },
  {
    id: 5,
    title: '时间安排',
    description: '请设置您的学习时间安排',
    isRequired: true,
  },
  {
    id: 6,
    title: '基础评估',
    description: '请评估您的英语基础情况',
    isRequired: true,
  },
];

export const NATIVE_LANGUAGES: NativeLanguage[] = [
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: '男性', icon: '👨' },
  { value: 'female', label: '女性', icon: '👩' },
  { value: 'other', label: '其他', icon: '👤' },
] as const;

export const IDENTITY_OPTIONS = [
  {
    value: 'professional',
    label: '职场人士',
    description: '已参加工作，需要提升职场英语能力',
    icon: '💼'
  },
  {
    value: 'university',
    label: '大学生',
    description: '在读大学本科生或研究生',
    icon: '🎓'
  },
  {
    value: 'highschool',
    label: '高中生',
    description: '在读高中学生',
    icon: '📚'
  },
] as const;