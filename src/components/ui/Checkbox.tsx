import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  id,
  disabled,
  className,
  label,
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        'relative flex items-center gap-2.5 cursor-pointer select-none group',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={cn(
          'w-5 h-5 rounded-[5px] border transition-all duration-150 flex items-center justify-center',
          checked
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
            : 'border-zinc-300 bg-white group-hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:group-hover:border-zinc-500',
          'focus-within:ring-2 focus-within:ring-indigo-500/40'
        )}
      >
        {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
      </div>
      {label && (
        <span
          className={cn(
            'text-sm transition-colors',
            checked ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
};
