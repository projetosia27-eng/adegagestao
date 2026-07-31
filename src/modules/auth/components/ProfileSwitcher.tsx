import { useAuth } from '../hooks/useAuth';
import { Wine, Store, UserCheck } from 'lucide-react';

export function ProfileSwitcher() {
  const { activeRole, setActiveRole, user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-wine-900/40 shadow-inner">
      <button
        onClick={() => setActiveRole('customer')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          activeRole === 'customer'
            ? 'bg-wine-700 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Wine className="w-3.5 h-3.5" />
        <span>Perfil Cliente</span>
      </button>

      <button
        onClick={() => setActiveRole('vendor')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          activeRole === 'vendor'
            ? 'bg-amber-700 text-white shadow-md'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Store className="w-3.5 h-3.5" />
        <span>Perfil Vendedor</span>
      </button>
    </div>
  );
}
