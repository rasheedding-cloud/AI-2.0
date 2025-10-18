import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ToastOptions {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface ToastItem extends ToastOptions {
  id: string;
  timestamp: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((options: ToastOptions): string => {
    const id = options.id || Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = {
      ...options,
      id,
      timestamp: Date.now(),
      duration: options.duration ?? 5000,
    };

    setToasts(prev => [...prev, newToast]);

    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export interface ToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const handleAction = () => {
    toast.action?.onClick();
    handleRemove();
  };

  const typeConfig = {
    success: {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const config = typeConfig[toast.type || 'info'];

  const toastClasses = cn(
    'relative max-w-sm w-full bg-white rounded-lg shadow-lg border pointer-events-auto overflow-hidden',
    'transition-all duration-300 ease-in-out transform',
    config.bgColor,
    config.borderColor,
    isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95',
    isLeaving && 'translate-x-full opacity-0 scale-95'
  );

  return (
    <div className={toastClasses} role="alert" aria-live="polite">
      <div className="p-4">
        <div className="flex items-start">
          <div className={cn('flex-shrink-0', config.iconColor)}>
            {config.icon}
          </div>
          <div className="ml-3 w-0 flex-1 rtl:ml-0 rtl:mr-3">
            {toast.title && (
              <p className={cn('text-sm font-medium', config.textColor)}>
                {toast.title}
              </p>
            )}
            {toast.message && (
              <p className={cn(
                'text-sm mt-1',
                toast.title ? 'text-gray-500 dark:text-gray-400' : config.textColor
              )}>
                {toast.message}
              </p>
            )}
            {toast.action && (
              <div className="mt-3 flex space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={handleAction}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex rtl:ml-0 rtl:mr-4">
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
              aria-label="关闭通知"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {!toast.persistent && (
        <div
          className={cn(
            'h-1 bg-gradient-to-r from-blue-500 to-purple-500 origin-left',
            'animate-[shrink_5s_linear_forwards]'
          )}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      )}
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-4 pointer-events-none rtl:left-4 rtl:right-auto"
      aria-label="通知"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

// 便捷方法
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
    const { addToast } = useToast();
    return addToast({ type: 'success', message, ...options });
  },
  error: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
    const { addToast } = useToast();
    return addToast({ type: 'error', message, ...options });
  },
  warning: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
    const { addToast } = useToast();
    return addToast({ type: 'warning', message, ...options });
  },
  info: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
    const { addToast } = useToast();
    return addToast({ type: 'info', message, ...options });
  },
};

export default ToastProvider;