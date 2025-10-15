'use client';

import React, { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  LoadingSpinner,
  Skeleton,
  LoadingOverlay,
  DotsLoader,
  ProgressBar,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ConfirmDialog,
  ToastProvider,
  useToast,
  toast,
} from '@/components/ui';

function ComponentShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [progress, setProgress] = useState(0);
  const { addToast } = useToast();

  const handleShowToast = () => {
    toast.success('这是一个成功消息！');
  };

  const handleShowError = () => {
    toast.error('这是一个错误消息！');
  };

  const handleShowWarning = () => {
    toast.warning('这是一个警告消息！');
  };

  const handleShowInfo = () => {
    toast.info('这是一个信息消息！');
  };

  const handleLoading = () => {
    setIsLoading(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
          toast.success('加载完成！');
        }, 500);
      }
    }, 200);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              UI组件展示
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              以下是AI学习方案项目中所有基础UI组件的展示
            </p>
          </div>

          {/* Button组件展示 */}
          <Card className="mb-8">
            <CardHeader title="Button组件" subtitle="不同类型和尺寸的按钮" />
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    按钮变体
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    按钮尺寸
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    按钮状态
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled</Button>
                    <Button loading>Loading</Button>
                    <Button fullWidth>Full Width</Button>
                    <Button
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      }
                    >
                      With Icon
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input组件展示 */}
          <Card className="mb-8">
            <CardHeader title="Input组件" subtitle="不同样式的输入框" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="默认输入框"
                  placeholder="请输入内容"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Input
                  label="带图标的输入框"
                  placeholder="搜索..."
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                <Input
                  label="错误状态"
                  error="这是错误信息"
                  defaultValue="无效的输入"
                />
                <Input
                  label="帮助文本"
                  helperText="这是帮助文本"
                  placeholder="请输入邮箱"
                  type="email"
                />
                <Input
                  label="必填字段"
                  required
                  placeholder="必填"
                />
                <Input
                  label="不同样式"
                  variant="filled"
                  placeholder="填充样式"
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading组件展示 */}
          <Card className="mb-8">
            <CardHeader title="Loading组件" subtitle="加载状态组件" />
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Loading Spinner
                  </h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    <LoadingSpinner size="sm" />
                    <LoadingSpinner size="md" />
                    <LoadingSpinner size="lg" />
                    <LoadingSpinner size="xl" />
                    <LoadingSpinner color="secondary" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Skeleton 骨架屏
                  </h3>
                  <div className="space-y-3">
                    <Skeleton variant="text" width="100%" height={20} />
                    <Skeleton variant="text" width="80%" height={20} />
                    <Skeleton variant="rectangular" width={100} height={100} />
                    <Skeleton variant="circular" width={60} height={60} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    其他加载组件
                  </h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    <DotsLoader size="sm" />
                    <DotsLoader size="md" />
                    <DotsLoader size="lg" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    进度条
                  </h3>
                  <div className="space-y-3">
                    <ProgressBar value={progress} />
                    <ProgressBar value={65} color="success" />
                    <ProgressBar value={30} color="warning" />
                    <ProgressBar value={80} color="error" />
                  </div>
                </div>

                <Button onClick={handleLoading} loading={isLoading}>
                  {isLoading ? '加载中...' : '开始加载'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modal组件展示 */}
          <Card className="mb-8">
            <CardHeader title="Modal组件" subtitle="模态框和确认对话框" />
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setIsModalOpen(true)}>
                  打开模态框
                </Button>
                <Button onClick={() => setIsConfirmOpen(true)} variant="outline">
                  打开确认对话框
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Toast组件展示 */}
          <Card className="mb-8">
            <CardHeader title="Toast组件" subtitle="消息提示组件" />
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleShowToast} variant="primary">
                  成功消息
                </Button>
                <Button onClick={handleShowError} variant="destructive">
                  错误消息
                </Button>
                <Button onClick={handleShowWarning} variant="outline">
                  警告消息
                </Button>
                <Button onClick={handleShowInfo} variant="secondary">
                  信息消息
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 组合示例 */}
          <Card className="mb-8">
            <CardHeader title="组合示例" subtitle="多个组件的组合使用" />
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    label="用户名"
                    placeholder="请输入用户名"
                    className="flex-1 mr-4"
                  />
                  <Button>提交</Button>
                </div>
                <ProgressBar value={75} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal组件 */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="示例模态框"
          description="这是一个模态框的示例"
          size="md"
        >
          <ModalContent>
            <div className="space-y-4">
              <p>
                这是模态框的内容区域。您可以在这里放置任何内容，比如表单、图片或其他组件。
              </p>
              <Input label="示例输入框" placeholder="在这里输入内容" />
            </div>
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button onClick={() => {
              setIsModalOpen(false);
              toast.success('操作成功！');
            }}>
              确认
            </Button>
          </ModalFooter>
        </Modal>

        {/* ConfirmDialog组件 */}
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            setIsConfirmOpen(false);
            toast.success('已确认操作！');
          }}
          title="确认删除"
          message="您确定要删除这个项目吗？此操作不可撤销。"
          variant="danger"
          confirmText="删除"
          cancelText="取消"
        />

        {/* LoadingOverlay组件 */}
        <LoadingOverlay
          visible={isLoading}
          message="正在处理，请稍候..."
          spinnerSize="lg"
          backdrop="blur"
        />
      </div>
    </ToastProvider>
  );
}

export default function ComponentShowcasePage() {
  return (
    <ToastProvider>
      <ComponentShowcase />
    </ToastProvider>
  );
}