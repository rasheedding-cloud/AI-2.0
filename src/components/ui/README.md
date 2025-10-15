# UI组件库

这是为AI学习方案项目创建的一套基础UI组件库，包含常用的界面组件。

## 组件列表

### Button 按钮组件
支持多种变体、尺寸和状态的按钮组件。

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `loading`: boolean - 是否显示加载状态
- `fullWidth`: boolean - 是否占满宽度
- `icon`: React.ReactNode - 图标
- `iconPosition`: 'left' | 'right' - 图标位置

**使用示例:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={isLoading}>
  提交
</Button>
```

### Input 输入框组件
支持标签、错误状态、帮助文本的输入框组件。

**Props:**
- `label`: string - 标签文本
- `error`: string - 错误信息
- `helperText`: string - 帮助文本
- `required`: boolean - 是否必填
- `leftIcon`: React.ReactNode - 左侧图标
- `rightIcon`: React.ReactNode - 右侧图标
- `variant`: 'default' | 'filled' | 'outlined' - 变体样式

**使用示例:**
```tsx
import { Input } from '@/components/ui';

<Input
  label="用户名"
  placeholder="请输入用户名"
  error={error}
  required
/>
```

### Card 卡片组件
基础卡片容器组件，包含Header、Content、Footer子组件。

**Props:**
- `variant`: 'default' | 'outlined' | 'elevated' | 'flat'
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `hover`: boolean - 是否支持悬停效果
- `interactive`: boolean - 是否可交互

**使用示例:**
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui';

<Card variant="elevated">
  <CardHeader title="标题" subtitle="副标题" />
  <CardContent>
    内容区域
  </CardContent>
  <CardFooter>
    底部操作区
  </CardFooter>
</Card>
```

### Loading 加载组件
包含Spinner、骨架屏、进度条等多种加载状态组件。

**组件列表:**
- `LoadingSpinner`: 旋转加载指示器
- `Skeleton`: 骨架屏
- `LoadingOverlay`: 全屏加载遮罩
- `DotsLoader`: 点状加载器
- `ProgressBar`: 进度条

**使用示例:**
```tsx
import { LoadingSpinner, Skeleton, ProgressBar } from '@/components/ui';

<LoadingSpinner size="md" />
<Skeleton variant="text" width="100%" height={20} />
<ProgressBar value={75} color="primary" />
```

### Modal 模态框组件
弹窗组件，支持多种尺寸和位置配置。

**Props:**
- `isOpen`: boolean - 是否打开
- `onClose`: () => void - 关闭回调
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `position`: 'center' | 'top' | 'bottom'
- `backdrop`: 'blur' | 'dark' | 'light' | 'none'

**子组件:**
- `ModalHeader`: 模态框头部
- `ModalContent`: 模态框内容
- `ModalFooter`: 模态框底部
- `ConfirmDialog`: 确认对话框

**使用示例:**
```tsx
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui';

<Modal isOpen={isOpen} onClose={handleClose} size="md" title="标题">
  <ModalContent>
    内容区域
  </ModalContent>
  <ModalFooter>
    <Button onClick={handleClose}>关闭</Button>
  </ModalFooter>
</Modal>
```

### Toast 消息提示组件
全局消息提示组件，支持多种类型和自定义配置。

**Props:**
- `type`: 'success' | 'error' | 'warning' | 'info'
- `title`: string - 标题
- `message`: string - 消息内容
- `duration`: number - 显示时长
- `persistent`: boolean - 是否持久显示
- `action`: { label: string; onClick: () => void } - 操作按钮

**使用示例:**
```tsx
import { ToastProvider, useToast, toast } from '@/components/ui';

// 在应用根目录包裹
<ToastProvider>
  <App />
</ToastProvider>

// 在组件中使用
const { addToast } = useToast();

// 或使用便捷方法
toast.success('操作成功！');
toast.error('操作失败！');
```

## 特性

### TypeScript支持
所有组件都使用TypeScript编写，提供完整的类型定义。

### Tailwind CSS样式
使用Tailwind CSS进行样式设计，支持自定义主题。

### 无障碍访问
- 支持ARIA属性
- 键盘导航支持
- 屏幕阅读器友好

### RTL支持
支持从右到左的布局，适用于阿拉伯语等语言。

### 深色模式
内置深色模式支持，自动适配系统主题。

### 响应式设计
移动端友好的响应式设计。

### 动画效果
平滑的过渡动画和微交互效果。

## 开发指南

### 添加新组件
1. 在`src/components/ui/`目录下创建组件文件
2. 使用TypeScript定义Props接口
3. 在`index.ts`中导出新组件
4. 更新类型定义文件

### 样式约定
- 使用Tailwind CSS类名
- 遵循设计系统的颜色和间距规范
- 保持一致的交互状态样式

### 无障碍约定
- 使用语义化HTML标签
- 添加适当的ARIA属性
- 确保键盘可访问性
- 提供足够的颜色对比度

## 示例页面
访问`/components-showcase`页面查看所有组件的展示和示例。

## 依赖项
- React 18+
- TypeScript
- Tailwind CSS
- clsx
- tailwind-merge

## 更新日志
### v1.0.0
- 初始版本发布
- 包含6个基础组件
- 完整的TypeScript支持
- 无障碍访问支持