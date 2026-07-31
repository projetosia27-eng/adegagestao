import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) => {
  const variants = {
    primary: 'bg-gradient-to-r from-gold to-gold-dark text-background hover:opacity-90 font-bold shadow-lg shadow-gold/20 border border-gold-light/50',
    secondary: 'bg-surface text-text-primary hover:bg-zinc-800 border border-zinc-700/50 shadow-sm',
    outline: 'border border-zinc-700 text-text-primary hover:bg-surface hover:border-gold/50 transition-colors',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface/50',
    danger: 'bg-rose-900/80 text-white hover:bg-rose-800 border border-rose-700/50 shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};
