'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Info, PlayCircle, CheckCircle, Clock, Target, Timer } from 'lucide-react';

interface DynamicGateInfoProps {
  milestone: {
    month: number;
    max_target_band: string;
    assessment_gate: {
      accuracy: number;
      task_steps: number;
      fluency_pauses: number;
    };
  };
  language?: 'zh' | 'en' | 'ar';
  showSelfTest?: boolean;
}

export function DynamicGateInfo({
  milestone,
  language = 'zh',
  showSelfTest = true
}: DynamicGateInfoProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showSelfTestDrawer, setShowSelfTestDrawer] = useState(false);

  // 根据能力上限确定门限类型
  const getGateType = (cap: string) => {
    const isA2 = ["A2-", "A2", "A2+"].includes(cap);
    return isA2 ? 'A2-gate' : 'B1-gate';
  };

  // 生成友好说明
  const generateDescription = (gateType: string, accuracy: number, taskSteps: number, pauses: number) => {
    if (language === 'en') {
      if (gateType === 'A2-gate') {
        return `Complete tasks of ≤${taskSteps} steps with simple reasons. Speak for 30-45 seconds about plans. Max ${pauses} obvious pauses, with ${Math.round(accuracy * 100)}% accuracy (2 mistakes max in 10 sentences).`;
      } else {
        return `Make 60-90 second structured updates with reasons. Handle ≤${taskSteps} step tasks. Max ${pauses} pauses, with ${Math.round(accuracy * 100)}% accuracy.`;
      }
    }

    if (language === 'ar') {
      if (gateType === 'A2-gate') {
        return `أكمل مهام ≤${taskSteps} خطوات مع أسباب بسيطة. تحدث لمدة 30-45 ثانية عن الخطط. كحد أقصى ${pauses} توقف واضح، بدقة ${Math.round(accuracy * 100)}% (خطأان كحد أقصى في 10 جمل).`;
      } else {
        return `قدم تحديثات منظمة مدتها 60-90 ثانية مع أسباب. تعامل مع مهام ≤${taskSteps} خطوات. كحد أقصى ${pauses} توقف، بدقة ${Math.round(accuracy * 100)}%.`;
      }
    }

    // Chinese (default)
    if (gateType === 'A2-gate') {
      return `本月你需要能清楚完成≤${taskSteps}步的小任务，用 because/so/then 说出简单理由，口头30–45秒说明计划。明显停顿不超过${pauses}次，整体正确率约${Math.round(accuracy * 100)}%（10句中最多错2句）。`;
    } else {
      return `本月你需要能做60–90秒结构化更新（背景→状态→下一步），比较两个方案并给出理由，处理≤${taskSteps}步任务。明显停顿≤${pauses}次，整体正确率约${Math.round(accuracy * 100)}%。`;
    }
  };

  // 获取示例内容
  const getExamples = (gateType: string) => {
    if (gateType === 'A2-gate') {
      return language === 'en' ? [
        "Clarify ≤3-step tasks (time/object/action)",
        "Use because/so/then for simple reasons",
        "Speak 30-45 seconds about today's plan"
      ] : language === 'ar' ? [
        "توضيح مهام ≤3 خطوات (وقت/هدف/إجراء)",
        "استخدم because/so/then لأسباب بسيطة",
        "تحدث 30-45 ثانية عن خطط اليوم"
      ] : [
        "能澄清≤3步的任务（时间/对象/动作）",
        "能用 because/so/then 说出简单理由",
        "能口头30–45秒说明今天要做什么"
      ];
    } else {
      return language === 'en' ? [
        "Make 60-90 second structured updates (background→status→next steps)",
        "Compare two options with reasons",
        "Write 6-8 sentence confirmation emails with reasons"
      ] : language === 'ar' ? [
        "قدم تحديثات منظمة مدتها 60-90 ثانية (الخلفية→الحالة→الخطوات التالية)",
        "قارن خيارين مع الأسباب",
        "اكتب رسائل تأكيد من 6-8 جمل مع الأسباب"
      ] : [
        "能做60–90秒结构化更新（背景→状态→下一步）",
        "能比较两个方案并给理由/建议",
        "能写6–8句确认/说明邮件（含理由与下一步）"
      ];
    }
  };

  // 获取快速检查清单
  const getQuickChecks = (gateType: string) => {
    if (gateType === 'A2-gate') {
      return language === 'en' ? [
        "Understand and repeat a 3-step task",
        "Write 4-5 sentences confirming info (time/responsibility/next step)",
        "Obvious pauses ≤2 times when speaking"
      ] : language === 'ar' ? [
        "افهم وكرر مهمة من 3 خطوات",
        "اكتب 4-5 جمل مؤكدة للمعلومات (وقت/مسؤولية/الخطوة التالية)",
        "التوقفات الواضحة ≤2 مرة عند التحدث"
      ] : [
        "听懂并复述一个三步任务",
        "能写4–5句确认信息（含时间/责任/下一步）",
        "口头表达时明显停顿≤2次"
      ];
    } else {
      return language === 'en' ? [
        "Express clearly within 1-2 minutes with reasons",
        "Handle ≤4-step tasks and confirm understanding",
        "Obvious pauses ≤2 times when speaking"
      ] : language === 'ar' ? [
        "عبر بوضوح خلال 1-2 دقيقة مع الأسباب",
        "تعامل مع مهام ≤4 خطوات وأكد الفهم",
        "التوقفات الواضحة ≤2 مرة عند التحدث"
      ] : [
        "能在1–2分钟内清晰表达并包含理由",
        "处理≤4步任务并确认对方理解",
        "口头表达明显停顿≤2次"
      ];
    }
  };

  const gateType = getGateType(milestone.max_target_band);
  const description = generateDescription(
    gateType,
    milestone.assessment_gate.accuracy,
    milestone.assessment_gate.task_steps,
    milestone.assessment_gate.fluency_pauses
  );
  const examples = getExamples(gateType);
  const quickChecks = getQuickChecks(gateType);

  // RTL support for Arabic
  const isRTL = language === 'ar';

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'}`}>
      {/* 主显示区域 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              {language === 'en' ? 'Assessment Criteria' : language === 'ar' ? 'معايير التقييم' : '评估标准'}
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
            {gateType}
          </span>
        </div>

        {/* 基础指标 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{language === 'en' ? 'Accuracy' : language === 'ar' ? 'الدقة' : '准确率'}</span>
            <span className="font-medium">{Math.round(milestone.assessment_gate.accuracy * 100)}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>{language === 'en' ? 'Task Steps' : language === 'ar' ? 'خطوات المهمة' : '任务步骤'}</span>
            <span className="font-medium">{milestone.assessment_gate.task_steps} {language === 'en' ? 'steps' : language === 'ar' ? 'خطوات' : '步'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>{language === 'en' ? 'Pauses' : language === 'ar' ? 'التوقفات' : '停顿次数'}</span>
            <span className="font-medium">{milestone.assessment_gate.fluency_pauses} {language === 'en' ? 'times' : language === 'ar' ? 'مرات' : '次'}</span>
          </div>
        </div>

        {/* 自测按钮 */}
        {showSelfTest && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSelfTestDrawer(true)}
              className="w-full text-xs h-7"
            >
              <PlayCircle className="w-3 h-3 mr-1" />
              {language === 'en' ? 'Try Self-Assessment' : language === 'ar' ? 'جرب التقييم الذاتي' : '我现在试试'}
            </Button>
          </div>
        )}
      </div>

      {/* 详细说明模态框 */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {language === 'en' ? 'Assessment Criteria Explained' : language === 'ar' ? 'شرح معايير التقييم' : '评估标准说明'}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* 友好说明 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">{description}</p>
              </div>

              {/* 达成示例 */}
              <div className="mb-6">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {language === 'en' ? 'Success Examples' : language === 'ar' ? 'أمثلة النجاح' : '达标示例'}
                </h4>
                <ul className="space-y-1">
                  {examples.map((example, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 快速检查清单 */}
              <div className="mb-6">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  {language === 'en' ? 'Quick Check List' : language === 'ar' ? 'قائمة التحقق السريع' : '快速检查清单'}
                </h4>
                <ul className="space-y-1">
                  {quickChecks.map((check, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">☐</span>
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => {
                  setShowDetails(false);
                  setShowSelfTestDrawer(true);
                }}
                className="w-full"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Start Self-Assessment' : language === 'ar' ? 'ابدأ التقييم الذاتي' : '开始自测'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 自测抽屉 */}
      {showSelfTestDrawer && (
        <div className={`fixed inset-y-0 ${isRTL ? 'left-0' : 'right-0'} w-80 bg-white shadow-lg z-50 overflow-y-auto`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {language === 'en' ? 'Self-Assessment' : language === 'ar' ? 'التقييم الذاتي' : '自我评估'}
              </h3>
              <button
                onClick={() => setShowSelfTestDrawer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* 口语练习 */}
            <div className="mb-6">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-600" />
                {language === 'en' ? 'Speaking Practice' : language === 'ar' ? 'التحدث الممارسة' : '口语练习'}
              </h4>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 mb-2">
                  {gateType === 'A2-gate'
                    ? (language === 'en' ? 'Speak for 30-45 seconds about your plan today' : language === 'ar' ? 'تحدث لمدة 30-45 ثانية عن خططك اليوم' : '口头说明今天的计划，30-45秒')
                    : (language === 'en' ? 'Give a 60-90 second structured update' : language === 'ar' ? 'قدم تحديثاً منظماً مدته 60-90 ثانية' : '结构化更新说明，60-90秒')
                  }
                </p>
                <div className="text-xs text-blue-700">
                  {language === 'en' ? 'Structure: ' : language === 'ar' ? 'الهيكل: ' : '结构：'}
                  {gateType === 'A2-gate'
                    ? (language === 'en' ? 'Task → Key Points → Next Steps' : language === 'ar' ? 'المهمة → النقاط الرئيسية → الخطوات التالية' : '任务 → 要点 → 下一步')
                    : (language === 'en' ? 'Background → Status → Issues/Risks → Next Steps' : language === 'ar' ? 'الخلفية → الحالة → المشاكل/المخاطر → الخطوات التالية' : '背景 → 状态 → 问题/风险 → 下一步')
                  }
                </div>
              </div>
              <Button className="w-full mt-2" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                {language === 'en' ? 'Start Timer' : language === 'ar' ? 'ابدأ المؤقت' : '开始计时'}
              </Button>
            </div>

            {/* 写作检查 */}
            <div className="mb-6">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {language === 'en' ? 'Writing Check' : language === 'ar' ? 'فحص الكتابة' : '写作检查'}
              </h4>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-900 mb-2">
                  {language === 'en' ? `Write ${gateType === 'A2-gate' ? '5 sentences' : '6-8 sentences'} including:` : language === 'ar' ? `اكتب ${gateType === 'A2-gate' ? '5 جمل' : '6-8 جمل'} تشمل:` : `写${gateType === 'A2-gate' ? '5句话' : '6-8句话'}，包含：`}
                </p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• {language === 'en' ? 'Time' : language === 'ar' ? 'الوقت' : '时间'}</li>
                  <li>• {language === 'en' ? 'Subject/Responsibility' : language === 'ar' ? 'الموضوع/المسؤولية' : '对象/责任'}</li>
                  <li>• {language === 'en' ? 'Next Steps' : language === 'ar' ? 'الخطوات التالية' : '下一步'}</li>
                  {gateType !== 'A2-gate' && <li>• {language === 'en' ? 'Reasons' : language === 'ar' ? 'الأسباب' : '理由'}</li>}
                </ul>
              </div>
            </div>

            {/* 自评清单 */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                {language === 'en' ? 'Self-Evaluation' : language === 'ar' ? 'التقييم الذاتي' : '自我评估'}
              </h4>
              <div className="space-y-2">
                {quickChecks.map((check, index) => (
                  <label key={index} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-0.5" />
                    <span className="text-gray-700">{check}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button
                className="w-full"
                onClick={() => setShowSelfTestDrawer(false)}
              >
                {language === 'en' ? 'Complete Assessment' : language === 'ar' ? 'أكمل التقييم' : '完成评估'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}