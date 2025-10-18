import { z } from 'zod';

// Base Enums
const genderSchema = z.enum(['male', 'female', 'prefer_not_to_say']);
const identitySchema = z.enum(['working_adult', 'university', 'high_school']);
const trackSchema = z.enum(['work', 'travel', 'study', 'daily', 'exam']);
const difficultyBandSchema = z.enum(['Pre-A', 'A1-', 'A1', 'A1+', 'A2-', 'A2', 'A2+', 'B1-', 'B1']);
const culturalModeSchema = z.enum(['sa', 'gcc', 'none']);
const planTierSchema = z.enum(['light', 'standard', 'intensive']);
const diagnosisColorSchema = z.enum(['green', 'yellow', 'red']);

// Intake Schema
export const intakeSchema = z.object({
  gender: genderSchema,
  identity: identitySchema,
  native_language: z.enum(['ar', 'zh', 'other']),
  goal_free_text: z.string().min(10).max(500),
  zero_base: z.boolean().nullable(),
  self_assessed_level: z.enum(['Pre-A', 'A1', 'A2', 'B1', 'B2', 'C1']).optional(),
  deadline_date: z.string().nullable().optional(),
  daily_minutes_pref: z.number().min(25).max(180).nullable().optional(),
  study_days_per_week: z.number().min(3).max(6).nullable().optional(),
  cultural_mode: culturalModeSchema,
  track_override: trackSchema.nullable().optional(),
});

// Plan Option Schema
export const planOptionSchema = z.object({
  tier: planTierSchema,
  track: trackSchema,
  ui_label_current: z.string(),
  ui_label_target: z.string(),
  can_do_examples: z.array(z.string()).min(2).max(6),
  daily_minutes: z.number().min(25).max(180),
  days_per_week: z.number().min(3).max(6),
  weeks: z.number().min(1).max(52),
  finish_date_est: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  lessons_total: z.number().positive(),
  diagnosis: diagnosisColorSchema,
  diagnosis_tips: z.array(z.string()).max(5),
  monthly_milestones_one_line: z.array(z.string()).min(3).max(4), // 允许3-4个月里程碑
});

// Monthly Milestone Schema
export const monthlyMilestoneSchema = z.object({
  month: z.number().min(1).max(4),
  max_target_band: difficultyBandSchema,
  focus: z.array(z.string()).min(3).max(10), // 增加focus数组限制
  assessment_gate: z.object({
    accuracy: z.number().min(0).max(1),
    task_steps: z.number().positive(),
    fluency_pauses: z.number().min(0),
  }),
});

// Monthly Plan Schema
export const monthlyPlanSchema = z.object({
  months_total: z.number().min(3).max(6), // 允许3-6个月
  milestones: z.array(monthlyMilestoneSchema).min(3).max(6), // 允许3-6个里程碑
});

// Lesson Caps Schema
export const lessonCapsSchema = z.object({
  grammar_allow: z.array(z.string()),
  grammar_forbid: z.array(z.string()),
  listening_wpm_max: z.number().positive(),
  max_sentences: z.number().positive(),
});

// Teacher Guide Schema
export const teacherGuideSchema = z.object({
  ask: z.string(),
  say: z.string(),
  tip: z.string(),
});

// Lesson Schema
export const lessonSchema = z.object({
  index: z.number().positive(),
  difficulty_band: difficultyBandSchema,
  theme: z.string(),
  objective: z.string(),
  today_you_can: z.string(),
  keywords: z.array(z.string()),
  patterns: z.array(z.string()).min(2).max(3),
  teacher_guide: teacherGuideSchema,
  review_patterns: z.array(z.string()).optional(),
  caps: lessonCapsSchema,
  max_task_steps: z.number().positive(),
});

// Day Lessons Schema
export const dayLessonsSchema = z.object({
  day: z.number().min(1).max(7), // 允许一周7天
  lessons: z.array(lessonSchema).min(1).max(10), // 允许每天最多10节课
});

// Week Plan Schema
export const weekPlanSchema = z.object({
  week: z.number().min(1).max(4),
  focus: z.string(),
  days: z.array(dayLessonsSchema).min(1).max(7), // 允许一周7天
});

// First Month Syllabus Schema
export const firstMonthSyllabusSchema = z.object({
  weeks: z.array(weekPlanSchema).min(1).max(6), // 允许1-6周
});

// Quick Test Schema
export const quickTestSchema = z.object({
  answers: z.array(z.string()).optional(),
  score: z.number().min(0).max(100).optional(),
  mapped_start: z.string().optional(),
  micro_units: z.array(z.string()).optional(),
});

// API Response Schemas
export const apiResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    details: z.any().optional(),
  });

// LLM Request/Response Schemas
export const llmRequestSchema = z.object({
  system: z.string().optional(),
  prompt: z.string(),
  temperature: z.number().min(0).max(2).optional(),
});

export const llmResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
});

// Export Request Schema
export const exportRequestSchema = z.object({
  format: z.enum(['excel', 'pdf']),
  includeTeacherNotes: z.boolean().optional(),
});

// Reminder Request Schema
export const reminderRequestSchema = z.object({
  type: z.enum(['whatsapp', 'email', 'calendar']),
  frequency: z.enum(['daily', 'weekly']),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
  enabled: z.boolean(),
});

// Analytics Event Schema
export const analyticsEventSchema = z.enum([
  'intake_completed',
  'track_detected',
  'plan_shown',
  'plan_selected',
  'monthly_plan_rendered',
  'first_month_rendered',
  'quicktest_started',
  'quicktest_finished',
  'export_clicked',
  'reminder_optin',
  'trial_booked',
]);

export const analyticsDataSchema = z.object({
  event: analyticsEventSchema,
  properties: z.record(z.any()).optional(),
  timestamp: z.string(),
});

// Type Guards
export const isValidIntake = (data: unknown): data is z.infer<typeof intakeSchema> => {
  return intakeSchema.safeParse(data).success;
};

export const isValidPlanOption = (data: unknown): data is z.infer<typeof planOptionSchema> => {
  return planOptionSchema.safeParse(data).success;
};

export const isValidMonthlyPlan = (data: unknown): data is z.infer<typeof monthlyPlanSchema> => {
  return monthlyPlanSchema.safeParse(data).success;
};

export const isFirstMonthSyllabus = (data: unknown): data is z.infer<typeof firstMonthSyllabusSchema> => {
  return firstMonthSyllabusSchema.safeParse(data).success;
};

// Error handling utilities
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation helper functions
export const validateAndParse = <T>(schema: z.ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Validation failed details:', {
      schema: schema._def,
      data: data,
      errors: result.error.issues.map(issue => ({
        path: issue.path,
        message: issue.message,
        code: issue.code
      }))
    });
    throw new ValidationError('Validation failed', result.error);
  }
  return result.data;
};

// AI Response Repair Schema
export const repairRequestSchema = z.object({
  originalResponse: z.string(),
  targetSchema: z.string(),
  errorMessage: z.string(),
});

export const repairResponseSchema = z.object({
  repaired: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});