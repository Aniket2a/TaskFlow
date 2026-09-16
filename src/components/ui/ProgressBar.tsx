import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string; // hex or tailwind class
  className?: string;
  height?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'bg-indigo-600',
  className,
  height = 'md',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  const isHex = color.startsWith('#');

  return (
    <div
      className={cn(
        'w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800',
        heightStyles[height],
        className
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-out',
          !isHex && color
        )}
        style={{
          width: `${clamped}%`,
          backgroundColor: isHex ? color : undefined,
        }}
      />
    </div>
  );
};
