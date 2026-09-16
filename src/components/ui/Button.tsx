import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const variantStyles = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:translate-y-[0.5px]',
      secondary:
        'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
      outline:
        'border border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/60',
      ghost:
        'bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:translate-y-[0.5px]',
    };

    // Horizontal padding is strictly 2x vertical padding
    const sizeStyles = {
      sm: 'py-1.5 px-3 text-xs gap-1.5',
      md: 'py-2 px-4 text-sm gap-2',
      lg: 'py-2.5 px-5 text-base gap-2.5',
      icon: 'p-2 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
