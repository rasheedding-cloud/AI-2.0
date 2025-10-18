import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      'hover:shadow-lg active:scale-[0.98]',
      'rtl:flex-row-reverse',
    ];

    const variantClasses = {
      primary: [
        'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
        'hover:from-blue-700 hover:to-purple-700',
        'focus:ring-blue-500',
        'dark:from-blue-500 dark:to-purple-500',
        'dark:hover:from-blue-600 dark:hover:to-purple-600',
      ],
      secondary: [
        'bg-gray-100 text-gray-900 border border-gray-200',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
        'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
        'dark:hover:bg-gray-700',
      ],
      outline: [
        'bg-transparent text-gray-700 border border-gray-300',
        'hover:bg-gray-50',
        'focus:ring-gray-500',
        'dark:text-gray-300 dark:border-gray-600',
        'dark:hover:bg-gray-800',
      ],
      ghost: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
        'dark:text-gray-300 dark:hover:bg-gray-800',
      ],
      destructive: [
        'bg-red-600 text-white',
        'hover:bg-red-700',
        'focus:ring-red-500',
        'dark:bg-red-700 dark:hover:bg-red-800',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-sm min-h-[40px]',
      lg: 'px-6 py-3 text-base min-h-[48px]',
      xl: 'px-8 py-4 text-lg min-h-[56px]',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      className
    );

    const renderIcon = (position: 'left' | 'right') => {
      if (!icon || position !== iconPosition) return null;
      return (
        <span className={cn('shrink-0', position === 'left' ? 'mr-2 rtl:ml-2' : 'ml-2 rtl:mr-2')}>
          {icon}
        </span>
      );
    };

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 rtl:ml-2 rtl:-mr-1 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {renderIcon('left')}
        <span className="truncate">{children}</span>
        {renderIcon('right')}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };