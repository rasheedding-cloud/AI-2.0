import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      required = false,
      leftIcon,
      rightIcon,
      variant = 'default',
      id,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = [
      'w-full px-3 py-2 text-sm rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:bg-gray-100 disabled:cursor-not-allowed',
      'rtl:text-right',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
    ];

    const variantClasses = {
      default: [
        'border border-gray-300 bg-white',
        'focus:border-blue-500 focus:ring-blue-500',
        'hover:border-gray-400',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-white',
        'dark:focus:border-blue-400 dark:focus:ring-blue-400',
        'dark:hover:border-gray-500',
      ],
      filled: [
        'bg-gray-50 border-0',
        'focus:bg-white focus:ring-2 focus:ring-blue-500',
        'hover:bg-gray-100',
        'dark:bg-gray-700 dark:text-white dark:focus:bg-gray-800',
        'dark:hover:bg-gray-600',
      ],
      outlined: [
        'border-2 border-gray-200 bg-transparent',
        'focus:border-blue-500 focus:ring-blue-500',
        'hover:border-gray-300',
        'dark:border-gray-700 dark:text-white',
        'dark:focus:border-blue-400 dark:focus:ring-blue-400',
        'dark:hover:border-gray-600',
      ],
    };

    const errorClasses = error
      ? [
          'border-red-500 text-red-900 placeholder-red-300',
          'focus:border-red-500 focus:ring-red-500',
          'dark:border-red-600 dark:text-red-100 dark:placeholder-red-400',
          'dark:focus:border-red-400 dark:focus:ring-red-400',
        ]
      : [];

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      errorClasses,
      leftIcon && 'pl-10 rtl:pl-3 rtl:pr-10',
      rightIcon && 'pr-10 rtl:pr-3 rtl:pl-10',
      className
    );

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      props.onBlur?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-1.5 transition-colors duration-200',
              error
                ? 'text-red-700 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 dark:text-red-400 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400',
                'rtl:left-auto rtl:right-3',
                error && 'text-red-500 dark:text-red-400'
              )}
            >
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            id={inputId}
            className={classes}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error || helperText ? `${inputId}-description` : undefined
            }
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {rightIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400',
                'rtl:right-auto rtl:left-3',
                error && 'text-red-500 dark:text-red-400'
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={`${inputId}-description`}
            className={cn(
              'mt-1.5 text-sm transition-colors duration-200',
              error
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };