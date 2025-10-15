export type Gender = 'male' | 'female' | 'other';

export type Identity = 'professional' | 'university' | 'highschool';

export interface NativeLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export interface Schedule {
  dailyHours: number;
  weeklyDays: number;
}

export interface IntakeFormData {
  gender: Gender;
  identity: Identity;
  nativeLanguage: string;
  learningGoal: string;
  schedule: Schedule;
  isBeginner: boolean;
  wantsQuickTest: boolean;
}

export interface ValidationError {
  field: keyof IntakeFormData;
  message: string;
}

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  isRequired: boolean;
}

export interface WizardStepProps {
  value: any;
  onChange: (value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors: ValidationError[];
  isFirstStep: boolean;
  isLastStep: boolean;
}