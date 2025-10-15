'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, Download, Calendar, FileText, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { ExportManager, ExportUtils } from '@/lib/export/exportUtils';
import type { ExportData } from '@/lib/export/exportUtils';

export default function ExportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 从localStorage获取数据
    const loadExportData = () => {
      try {
        const planStr = localStorage.getItem('selectedPlan');
        const monthlyPlanStr = localStorage.getItem('monthlyPlan');
        const syllabusStr = localStorage.getItem('syllabus');
        const userIntakeStr = localStorage.getItem('userIntake');

        if (!planStr || !monthlyPlanStr || !syllabusStr || !userIntakeStr) {
          // 如果没有数据，返回向导页面
          router.push('/wizard');
          return;
        }

        const data: ExportData = {
          plan: JSON.parse(planStr),
          monthlyPlan: JSON.parse(monthlyPlanStr),
          syllabus: JSON.parse(syllabusStr),
          userIntake: JSON.parse(userIntakeStr)
        };

        setExportData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('加载导出数据失败:', error);
        router.push('/plans');
      }
    };

    loadExportData();
  }, [router]);

  const handleExportExcel = async () => {
    if (!exportData) return;

    setExporting('excel');
    try {
      await ExportManager.exportExcel(exportData);
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出Excel失败，请重试');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!exportData) return;

    setExporting('pdf');
    try {
      await ExportManager.exportPDF(exportData);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出PDF失败，请重试');
    } finally {
      setExporting(null);
    }
  };

  const handleExportCalendar = () => {
    if (!exportData) return;

    setExporting('calendar');
    try {
      ExportManager.exportCalendar(exportData);
    } catch (error) {
      console.error('导出日历失败:', error);
      alert('导出日历失败，请重试');
    } finally {
      setExporting(null);
    }
  };

  const handleCopyReminder = () => {
    if (!exportData) return;

    setExporting('reminder');
    try {
      ExportManager.copyReminderText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('复制提醒文本失败:', error);
      alert('复制失败，请重试');
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-4 text-lg text-gray-600">正在准备导出数据...</div>
        </div>
      </div>
    );
  }

  if (!exportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">缺少导出数据</h3>
            <p className="text-gray-600 mb-6">请先完成学习方案生成</p>
            <Button onClick={() => router.push('/wizard')}>
              重新开始
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>

            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                导出学习方案
              </div>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            导出您的学习方案
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            选择您需要的导出格式，随时随地查看您的学习计划
          </p>
        </div>

        {/* 方案概览 */}
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {exportData.plan.ui_label_current} → {exportData.plan.ui_label_target}
            </h2>
            <div className="text-sm text-gray-500">
              {exportData.plan.tier === 'light' ? '轻量方案' :
               exportData.plan.tier === 'standard' ? '标准方案' : '进阶方案'}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{exportData.plan.weeks}</div>
              <div className="text-sm text-blue-800">周数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{exportData.plan.lessons_total}</div>
              <div className="text-sm text-green-800">课程数</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{exportData.plan.daily_minutes}</div>
              <div className="text-sm text-purple-800">每日分钟</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{exportData.plan.days_per_week}</div>
              <div className="text-sm text-orange-800">每周天数</div>
            </div>
          </div>
        </Card>

        {/* 导出选项 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Excel导出 */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  导出Excel表格
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  包含完整课程大纲的CSV格式表格，方便在Excel或其他表格软件中查看和编辑
                </p>
                <Button
                  onClick={handleExportExcel}
                  disabled={exporting === 'excel'}
                  className="w-full"
                  variant="outline"
                >
                  {exporting === 'excel' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {exporting === 'excel' ? '导出中...' : '下载Excel'}
                </Button>
              </div>
            </div>
          </Card>

          {/* PDF导出 */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  导出PDF文档
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  精美排版的PDF文档，包含完整学习方案，适合打印和分享
                </p>
                <Button
                  onClick={handleExportPDF}
                  disabled={exporting === 'pdf'}
                  className="w-full"
                  variant="outline"
                >
                  {exporting === 'pdf' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {exporting === 'pdf' ? '导出中...' : '下载PDF'}
                </Button>
              </div>
            </div>
          </Card>

          {/* 日历导出 */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  导出到日历
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  生成iCal日历文件，可以导入到手机、电脑的日历应用中，设置学习提醒
                </p>
                <Button
                  onClick={handleExportCalendar}
                  disabled={exporting === 'calendar'}
                  className="w-full"
                  variant="outline"
                >
                  {exporting === 'calendar' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {exporting === 'calendar' ? '导出中...' : '下载日历'}
                </Button>
              </div>
            </div>
          </Card>

          {/* 复制提醒文本 */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Copy className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  复制学习提醒
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  复制学习提醒文本到剪贴板，可以粘贴到便签、备忘录或分享给朋友
                </p>
                <Button
                  onClick={handleCopyReminder}
                  disabled={exporting === 'reminder'}
                  className="w-full"
                  variant="outline"
                >
                  {exporting === 'reminder' ? (
                    <LoadingSpinner size="sm" />
                  ) : copied ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {exporting === 'reminder' ? '复制中...' : copied ? '已复制' : '复制文本'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 使用提示 */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 使用提示
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Excel表格</strong>：适合进一步编辑和自定义学习计划</p>
            <p>• <strong>PDF文档</strong>：适合打印出来随时查看，或发送给老师、朋友</p>
            <p>• <strong>日历文件</strong>：导入到手机日历后，可以设置自动提醒</p>
            <p>• <strong>提醒文本</strong>：可以作为手机壁纸或桌面壁纸，激励自己坚持学习</p>
          </div>
        </Card>

        {/* 完成按钮 */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            完成导出
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}