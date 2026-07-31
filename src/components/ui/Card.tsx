import React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('bg-surface/80 backdrop-blur-sm rounded-xl border border-zinc-800/80 p-5 shadow-xl transition-all duration-300 hover:border-zinc-700/80 hover:shadow-2xl', className)}>
    {children}
  </div>
);
