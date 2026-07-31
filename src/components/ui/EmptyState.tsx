import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: { label: string; onClick: () => void } }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-text-secondary border border-dashed border-zinc-800 rounded-xl bg-surface/30">
    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
      <Icon className="w-8 h-8 text-gold/60" />
    </div>
    <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">{title}</h3>
    <p className="max-w-sm mt-1 text-sm text-zinc-400 mb-8 leading-relaxed">{description}</p>
    {action && (
      <Button variant="outline" className="min-w-[200px]" onClick={action.onClick}>{action.label}</Button>
    )}
  </div>
);
