import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'high' | 'medium' | 'low' | 'success' | 'indigo';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
    secondary: 'bg-zinc-100 text-zinc-600 border-transparent dark:bg-zinc-800 dark:text-zinc-400',
    outline: 'bg-transparent text-zinc-700 border-zinc-200 dark:text-zinc-300 dark:border-zinc-700',
    high: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 font-medium dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60',
    low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-medium whitespace-nowrap transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
