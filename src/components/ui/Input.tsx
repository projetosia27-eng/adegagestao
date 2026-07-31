import React from 'react';
import { cn } from '@/lib/utils';

export const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'w-full bg-background border border-zinc-800 rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-zinc-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all shadow-sm',
      className
    )}
    {...props}
  />
);
