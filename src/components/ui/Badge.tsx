import React from 'react';
import { cn } from '@/lib/utils';

export const Badge = ({ className, children, variant = 'default' }: { className?: string; children: React.ReactNode; variant?: 'default' | 'gold' | 'outline' | 'success' | 'danger' }) => {
  const variants = {
    default: 'bg-zinc-800/80 text-text-secondary border border-zinc-700/50',
    gold: 'bg-gold/10 text-gold border border-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]',
    outline: 'border border-zinc-700 text-text-secondary',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    danger: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1', variants[variant], className)}>
      {children}
    </span>
  );
};
