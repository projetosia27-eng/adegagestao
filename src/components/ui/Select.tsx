import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
}

export const Select = ({ className, options, ...props }: SelectProps) => (
  <div className="relative">
    <select
      className={cn(
        'w-full appearance-none bg-background border border-zinc-800 rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all shadow-sm',
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-surface">{opt.label}</option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
);
