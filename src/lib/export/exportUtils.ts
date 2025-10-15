import type { PlanOption, MonthlyPlan, FirstMonthSyllabus } from '@/types';

export interface ExportData {
  plan: PlanOption;
  monthlyPlan: MonthlyPlan;
  syllabus: FirstMonthSyllabus;
  userIntake: any;
}

export class ExportUtils {
  // 导出为Excel格式
  static async exportToExcel(data: ExportData): Promise<Blob> {
    const { plan, syllabus } = data;

    // 创建工作表
    const worksheet = [];
    const headers = [
      '周',
      '天',
      '课程序号',
      '主题',
      '学习目标',
      '今日你能',
      '关键词',
      '核心句型',
      '难度等级'
    ];

    worksheet.push(headers);

    // 遍历首月课程
    syllabus.weeks.forEach((week) => {
      week.days.forEach((day) => {
        day.lessons.forEach((lesson) => {
          const row = [
            `第${week.week}周`,
            `第${day.day}天`,
            lesson.index,
            lesson.theme,
            lesson.objective,
            lesson.today_you_can,
            lesson.keywords.join(', '),
            lesson.patterns.join(', '),
            lesson.difficulty_band || '未设置'
          ];
          worksheet.push(row);
        });
      });
    });

    // 创建CSV内容
    const csvContent = worksheet.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // 添加BOM以确保中文显示正常
    const BOM = '\uFEFF';

    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  // 导出为PDF格式
  static async exportToPDF(data: ExportData): Promise<Blob> {
    const { plan, monthlyPlan, syllabus } = data;

    // 创建PDF内容（HTML格式）
    const htmlContent = this.generatePDFContent(data);

    // 使用浏览器打印功能生成PDF
    return new Promise((resolve, reject) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        reject(new Error('无法打开打印窗口'));
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
        resolve(new Blob([''], { type: 'application/pdf' }));
      };
    });
  }

  // 生成PDF HTML内容
  private static generatePDFContent(data: ExportData): string {
    const { plan, monthlyPlan, syllabus } = data;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>AI学习方案 - ${plan.ui_label_target}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 15px;
            }
            .plan-info {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .milestone {
              background: #e0f2fe;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 10px;
            }
            .lesson {
              background: #fef3c7;
              padding: 10px;
              border-left: 4px solid #3b82f6;
              margin-bottom: 10px;
            }
            .keywords {
              display: flex;
              gap: 8px;
              margin: 5px 0;
              flex-wrap: wrap;
            }
            .keyword {
              background: #dbeafe;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              color: #065f46;
            }
            .patterns {
              display: flex;
              gap: 8px;
              margin: 5px 0;
              flex-wrap: wrap;
            }
            .pattern {
              background: #ecfdf5;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              color: #065f46;
              font-family: monospace;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #d1d5db;
              color: #6b7280;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .section { page-break-inside: avoid; }
              .lesson { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AI定制学习方案</h1>
            <h2>${plan.ui_label_current} → ${plan.ui_label_target}</h2>
          </div>

          <div class="section">
            <div class="section-title">方案概览</div>
            <div class="plan-info">
              <p><strong>方案类型：</strong>${plan.tier === 'light' ? '轻量方案' : plan.tier === 'standard' ? '标准方案' : '进阶方案'}</p>
              <p><strong>学习强度：</strong>每天${plan.daily_minutes}分钟，每周${plan.days_per_week}天</p>
              <p><strong>预计完成：</strong>${plan.weeks}周（${plan.finish_date_est}）</p>
              <p><strong>总课程数：</strong>${plan.lessons_total}节</p>
              <p><strong>学习成果：</strong></p>
              <ul>
                ${plan.can_do_examples.map(example => `<li>${example}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">16周学习里程碑</div>
            ${monthlyPlan.milestones.map((milestone, index) => `
              <div class="milestone">
                <h4>第${milestone.month}月目标</h4>
                <ul>
                  ${milestone.focus.map(focus => `<li>${focus}</li>`).join('')}
                </ul>
                <p><strong>评估标准：</strong>准确率${(milestone.assessment_gate.accuracy * 100).toFixed(0)}%，${milestone.assessment_gate.task_steps}步任务，${milestone.assessment_gate.fluency_pauses}次停顿</p>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">首月课程大纲</div>
            ${syllabus.weeks.map((week) => `
              <div class="milestone">
                <h3>第${week.week}周：${week.focus}</h3>
                ${week.days.map((day) => `
                  <div class="lesson">
                    <h4>第${day.day}天（${day.lessons.length}节课）</h4>
                    ${day.lessons.map((lesson) => `
                      <div>
                        <strong>课程${lesson.index}：${lesson.theme}</strong>
                        <p><strong>目标：</strong>${lesson.objective}</p>
                        <p><strong>今天你能：</strong>${lesson.today_you_can}</p>
                        <div class="keywords">
                          ${lesson.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
                        </div>
                        <div class="patterns">
                          ${lesson.patterns.map(pattern => `<span class="pattern">${pattern}</span>`).join('')}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>生成时间：${new Date().toLocaleDateString('zh-CN')}</p>
            <p>AI定制学习方案 - 版权所有</p>
          </div>
        </body>
      </html>
    `;
  }

  // 生成iCal日历文件
  static generateICalendar(data: ExportData): string {
    const { plan } = data;
    const startDate = new Date();

    // 创建未来16周的日历事件
    const events: string[] = [];

    for (let week = 1; week <= 16; week++) {
      for (let day = 1; day <= plan.days_per_week; day++) {
        const eventDate = new Date(startDate);
        eventDate.setDate(startDate.getDate() + (week - 1) * 7 + (day - 1));

        // 设置为工作日（周一到周五）
        if (eventDate.getDay() >= 1 && eventDate.getDay() <= 5) {
          const startTime = new Date(eventDate);
          startTime.setHours(19, 0, 0, 0);

          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + plan.daily_minutes);

          events.push([
            'BEGIN:VEVENT',
            'UID:' + `lesson-${week}-${day}-${Date.now()}`,
            'DTSTAMP:' + eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
            'DTSTART:' + startTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
            'DTEND:' + endTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
            'SUMMARY:英语学习 - 第' + week + '周第' + day + '天',
            'DESCRIPTION:学习' + plan.daily_minutes + '分钟英语课程',
            'END:VEVENT'
          ].join('\n'));
        }
      }
    }

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Microsoft Corporation//Outlook 15.0.0.0//EN
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Asia/Shanghai
END:VTIMEZONE
${events.join('\n')}
END:VCALENDAR`;
  }

  // 生成学习提醒文本
  static generateReminderText(data: ExportData): string {
    const { plan } = data;

    return `📚 AI英语学习提醒

学习计划：${plan.ui_label_current} → ${plan.ui_label_target}
学习强度：每天${plan.daily_minutes}分钟，每周${plan.days_per_week}天
预计完成：${plan.weeks}周（${plan.finish_date_est}）

每日学习建议：
1. 固定学习时间，培养学习习惯
2. 结合实际工作场景练习所学内容
3. 定期复习之前学过的内容
4. 与同事或朋友练习口语交流
5. 记录学习笔记，跟踪进步情况

加油！您正在向${plan.ui_label_target}的目标稳步前进！`;
  }
}

// 导出工具类
export class ExportManager {
  // 下载文件
  static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 导出Excel
  static async exportExcel(data: ExportData): Promise<void> {
    try {
      const blob = await ExportUtils.exportToExcel(data);
      this.downloadFile(blob, `学习计划_${data.plan.ui_label_target}_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('导出Excel失败:', error);
      throw new Error('导出Excel失败');
    }
  }

  // 导出PDF
  static async exportPDF(data: ExportData): Promise<void> {
    try {
      const blob = await ExportUtils.exportToPDF(data);
      this.downloadFile(blob, `学习计划_${data.plan.ui_label_target}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('导出PDF失败:', error);
      throw new Error('导出PDF失败');
    }
  }

  // 导出日历
  static exportCalendar(data: ExportData): void {
    try {
      const icalContent = ExportUtils.generateICalendar(data);
      const blob = new Blob([icalContent], { type: 'text/calendar' });
      this.downloadFile(blob, `学习计划_${data.plan.ui_label_target}.ics`);
    } catch (error) {
      console.error('导出日历失败:', error);
      throw new Error('导出日历失败');
    }
  }

  // 复制提醒文本
  static copyReminderText(data: ExportData): void {
    try {
      const text = ExportUtils.generateReminderText(data);
      navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('复制提醒文本失败:', error);
      throw new Error('复制提醒文本失败');
    }
  }
}