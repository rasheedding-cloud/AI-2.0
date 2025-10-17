import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = [
      'relative w-full rounded-lg border p-4',
      '[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    ];

    const variantClasses = {
      default: 'bg-background text-foreground',
      destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    };

    const classes = cn(baseClasses, variantClasses[variant], className);

    return <div className={classes} ref={ref} {...props} />;
  }
);

Alert.displayName = 'Alert';

const AlertDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      ref={ref}
      {...props}
    />
  )
);

AlertDescription.displayName = 'AlertDescription';

const AlertTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      ref={ref}
      {...props}
    />
  )
);

AlertTitle.displayName = 'AlertTitle';

export { Alert, AlertTitle, AlertDescription };