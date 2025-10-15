import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'rounded-xl transition-all duration-200',
      'dark:bg-gray-800 dark:text-white',
    ];

    const variantClasses = {
      default: [
        'bg-white border border-gray-200',
        'dark:border-gray-700',
      ],
      outlined: [
        'bg-white border-2 border-gray-300',
        'dark:border-gray-600 dark:bg-gray-800',
      ],
      elevated: [
        'bg-white shadow-lg border border-gray-100',
        'dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-900',
      ],
      flat: [
        'bg-gray-50',
        'dark:bg-gray-800',
      ],
    };

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const interactionClasses = [
      hover && 'hover:shadow-xl hover:-translate-y-1',
      interactive && 'cursor-pointer active:scale-[0.98]',
    ];

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      interactionClasses,
      className
    );

    return (
      <div className={classes} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-start justify-between pb-4 border-b border-gray-100',
          'dark:border-gray-700',
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && (
          <div className="flex-shrink-0 ml-4 rtl:ml-0 rtl:mr-4">
            {action}
          </div>
        )}
      </div>
    );
  }
);

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn('py-4', className)} ref={ref} {...props} />
    );
  }
);

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          'pt-4 border-t border-gray-100 mt-4',
          'dark:border-gray-700',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };