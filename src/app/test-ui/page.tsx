'use client';

import React from 'react';
import { Button } from '@/components/ui';

export default function TestUIPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          UI组件测试
        </h1>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Button组件测试</h2>
          <div className="flex flex-wrap gap-3">
            <Button>测试按钮</Button>
            <Button variant="outline">边框按钮</Button>
            <Button variant="ghost">幽灵按钮</Button>
            <Button disabled>禁用按钮</Button>
          </div>
        </div>

        <div className="mt-6 bg-green-100 dark:bg-green-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">测试成功</h2>
          <p className="text-gray-700 dark:text-gray-300">
            如果你能看到这个页面，说明UI组件库已经成功创建并可以正常使用！
          </p>
          <div className="mt-4">
            <Button onClick={() => alert('按钮点击成功！')}>
              点击测试
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}