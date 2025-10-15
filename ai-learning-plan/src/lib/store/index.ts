import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AppState, Intake, PlanOption, MonthlyPlan, FirstMonthSyllabus, QuickTest } from '@/types';

interface AppStore extends AppState {
  // Actions
  setIntake: (intake: Intake) => void;
  setPlanOptions: (options: PlanOption[]) => void;
  setChosenPlan: (plan: PlanOption) => void;
  setMonthlyPlan: (plan: MonthlyPlan) => void;
  setFirstMonthSyllabus: (syllabus: FirstMonthSyllabus) => void;
  setQuickTest: (quickTest: QuickTest) => void;

  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Language and Culture
  locale: 'zh' | 'en' | 'ar';
  setLocale: (locale: 'zh' | 'en' | 'ar') => void;
  culturalMode: 'sa' | 'gcc' | 'none';
  setCulturalMode: (mode: 'sa' | 'gcc' | 'none') => void;

  // Reset
  reset: () => void;
  resetPartial: (fields: (keyof AppStore)[]) => void;
}

const initialState: AppState = {
  intake: null,
  planOptions: null,
  chosen: null,
  monthlyPlan: null,
  month1: null,
  quickTest: undefined,
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        ...initialState,

        // UI State
        isLoading: false,
        error: null,
        currentStep: 0,
        locale: 'zh',
        culturalMode: 'sa',

        // Actions
        setIntake: (intake: Intake) =>
          set({ intake }, false, 'setIntake'),

        setPlanOptions: (options: PlanOption[]) =>
          set({ planOptions: options }, false, 'setPlanOptions'),

        setChosenPlan: (plan: PlanOption) =>
          set({ chosen: plan }, false, 'setChosenPlan'),

        setMonthlyPlan: (plan: MonthlyPlan) =>
          set({ monthlyPlan: plan }, false, 'setMonthlyPlan'),

        setFirstMonthSyllabus: (syllabus: FirstMonthSyllabus) =>
          set({ month1: syllabus }, false, 'setFirstMonthSyllabus'),

        setQuickTest: (quickTest: QuickTest) =>
          set({ quickTest }, false, 'setQuickTest'),

        // UI Actions
        setLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, 'setLoading'),

        setError: (error: string | null) =>
          set({ error }, false, 'setError'),

        setCurrentStep: (step: number) =>
          set({ currentStep: step }, false, 'setCurrentStep'),

        setLocale: (locale: 'zh' | 'en' | 'ar') =>
          set({ locale }, false, 'setLocale'),

        setCulturalMode: (mode: 'sa' | 'gcc' | 'none') =>
          set({ culturalMode: mode }, false, 'setCulturalMode'),

        // Reset Actions
        reset: () =>
          set(
            {
              ...initialState,
              isLoading: false,
              error: null,
              currentStep: 0,
              locale: 'zh',
              culturalMode: 'sa',
            },
            false,
            'reset'
          ),

        resetPartial: (fields: (keyof AppStore)[]) => {
          const state = get();
          const newState = { ...state };

          fields.forEach(field => {
            if (field in initialState) {
              (newState as any)[field] = (initialState as any)[field];
            }
          });

          set(newState, false, 'resetPartial');
        },
      }),
      {
        name: 'ai-learning-plan-store',
        partialize: (state) => ({
          intake: state.intake,
          planOptions: state.planOptions,
          chosen: state.chosen,
          monthlyPlan: state.monthlyPlan,
          month1: state.month1,
          quickTest: state.quickTest,
          locale: state.locale,
          culturalMode: state.culturalMode,
          currentStep: state.currentStep,
        }),
      }
    ),
    {
      name: 'ai-learning-plan-store',
    }
  )
);

// Selectors for better performance
export const useIntake = () => useAppStore(state => state.intake);
export const usePlanOptions = () => useAppStore(state => state.planOptions);
export const useChosenPlan = () => useAppStore(state => state.chosen);
export const useMonthlyPlan = () => useAppStore(state => state.monthlyPlan);
export const useFirstMonthSyllabus = () => useAppStore(state => state.month1);
export const useQuickTest = () => useAppStore(state => state.quickTest);

export const useLoading = () => useAppStore(state => state.isLoading);
export const useError = () => useAppStore(state => state.error);
export const useCurrentStep = () => useAppStore(state => state.currentStep);

export const useLocale = () => useAppStore(state => state.locale);
export const useCulturalMode = () => useAppStore(state => state.culturalMode);

// Computed selectors
export const useProgress = () => {
  const intake = useIntake();
  const planOptions = usePlanOptions();
  const chosen = useChosenPlan();
  const monthlyPlan = useMonthlyPlan();
  const month1 = useFirstMonthSyllabus();

  const completedSteps = [
    !!intake,
    !!planOptions,
    !!chosen,
    !!monthlyPlan,
    !!month1,
  ].filter(Boolean).length;

  const totalSteps = 5;
  const progress = completedSteps / totalSteps;

  return { completedSteps, totalSteps, progress };
};

// Actions hook for convenience
export const useAppActions = () => {
  return useAppStore(state => ({
    setIntake: state.setIntake,
    setPlanOptions: state.setPlanOptions,
    setChosenPlan: state.setChosenPlan,
    setMonthlyPlan: state.setMonthlyPlan,
    setFirstMonthSyllabus: state.setFirstMonthSyllabus,
    setQuickTest: state.setQuickTest,
    setLoading: state.setLoading,
    setError: state.setError,
    setCurrentStep: state.setCurrentStep,
    setLocale: state.setLocale,
    setCulturalMode: state.setCulturalMode,
    reset: state.reset,
    resetPartial: state.resetPartial,
  }));
};