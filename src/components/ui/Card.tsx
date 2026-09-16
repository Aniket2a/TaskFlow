import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'flat';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:
        'bg-white border border-zinc-200/80 rounded-xl shadow-xs dark:bg-zinc-900 dark:border-zinc-800',
      subtle:
        'bg-zinc-50/70 border border-zinc-200/60 rounded-xl dark:bg-zinc-900/50 dark:border-zinc-800/80',
      flat:
        'bg-white border border-zinc-200 rounded-xl dark:bg-zinc-900 dark:border-zinc-800',
    };

    return (
      <div ref={ref} className={cn(variants[variant], 'p-5', className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
