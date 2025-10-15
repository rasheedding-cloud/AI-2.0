import { IntakeFormData, ValidationError } from '@/types/intake';

export const validateIntakeData = (data: Partial<IntakeFormData>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // 性别验证
  if (!data.gender) {
    errors.push({ field: 'gender', message: '请选择性别' });
  }

  // 身份验证
  if (!data.identity) {
    errors.push({ field: 'identity', message: '请选择您的身份' });
  }

  // 母语验证
  if (!data.nativeLanguage || data.nativeLanguage.trim() === '') {
    errors.push({ field: 'nativeLanguage', message: '请选择您的母语' });
  }

  // 学习目标验证
  if (!data.learningGoal || data.learningGoal.trim() === '') {
    errors.push({ field: 'learningGoal', message: '请输入您的学习目标' });
  } else if (data.learningGoal.length < 10) {
    errors.push({ field: 'learningGoal', message: '学习目标至少需要10个字符' });
  } else if (data.learningGoal.length > 500) {
    errors.push({ field: 'learningGoal', message: '学习目标不能超过500个字符' });
  }

  // 时间安排验证
  if (!data.schedule) {
    errors.push({ field: 'schedule', message: '请设置学习时间安排' });
  } else {
    if (data.schedule.dailyHours < 0.5 || data.schedule.dailyHours > 12) {
      errors.push({ field: 'schedule', message: '每日学习时长应在0.5-12小时之间' });
    }
    if (data.schedule.weeklyDays < 1 || data.schedule.weeklyDays > 7) {
      errors.push({ field: 'schedule', message: '每周学习天数应在1-7天之间' });
    }
  }

  return errors;
};

export const validateStep = (step: number, data: Partial<IntakeFormData>): ValidationError[] => {
  const errors: ValidationError[] = [];

  switch (step) {
    case 1: // 性别选择
      if (!data.gender) {
        errors.push({ field: 'gender', message: '请选择性别' });
      }
      break;
    case 2: // 身份选择
      if (!data.identity) {
        errors.push({ field: 'identity', message: '请选择您的身份' });
      }
      break;
    case 3: // 母语选择
      if (!data.nativeLanguage || data.nativeLanguage.trim() === '') {
        errors.push({ field: 'nativeLanguage', message: '请选择您的母语' });
      }
      break;
    case 4: // 学习目标
      if (!data.learningGoal || data.learningGoal.trim() === '') {
        errors.push({ field: 'learningGoal', message: '请输入您的学习目标' });
      } else if (data.learningGoal.length < 10) {
        errors.push({ field: 'learningGoal', message: '学习目标至少需要10个字符' });
      } else if (data.learningGoal.length > 500) {
        errors.push({ field: 'learningGoal', message: '学习目标不能超过500个字符' });
      }
      break;
    case 5: // 时间安排
      if (!data.schedule) {
        errors.push({ field: 'schedule', message: '请设置学习时间安排' });
      } else {
        if (data.schedule.dailyHours < 0.5 || data.schedule.dailyHours > 12) {
          errors.push({ field: 'schedule', message: '每日学习时长应在0.5-12小时之间' });
        }
        if (data.schedule.weeklyDays < 1 || data.schedule.weeklyDays > 7) {
          errors.push({ field: 'schedule', message: '每周学习天数应在1-7天之间' });
        }
      }
      break;
    case 6: // 基础判断
      if (data.isBeginner === undefined) {
        errors.push({ field: 'isBeginner', message: '请选择是否有英语基础' });
      }
      break;
  }

  return errors;
};