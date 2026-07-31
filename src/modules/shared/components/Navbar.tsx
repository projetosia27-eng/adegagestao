import { Link, useLocation } from 'react-router-dom';
import { Wine, Store, ShoppingBag, User, Sparkles } from 'lucide-react';
import { ProfileSwitcher } from '@/modules/auth/components/ProfileSwitcher';
import { useAuth } from '@/modules/auth/hooks/useAuth';

export function Navbar() {
  const location = useLocation();
  const { activeRole, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-wine-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wine-600 to-wine-950 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wine className="w-5 h-5 text-wine-400 group-hover:text-wine-300" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold font-serif tracking-tight text-white flex items-center gap-1.5">
                Adega<span className="text-wine-500">Hub</span>
              </span>
              <span className="block text-[10px] tracking-wider uppercase text-slate-400 font-sans">
                {activeRole === 'vendor' ? 'Painel do Vendedor' : 'Marketplace & Adega'}
              </span>
            </div>
          </Link>

          {/* Navegação principal */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              to="/marketplace"
              className={`flex items-center gap-1.5 transition-colors ${
                location.pathname.startsWith('/marketplace')
                  ? 'text-wine-400 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Marketplace</span>
            </Link>

            {activeRole === 'customer' ? (
              <Link
                to="/cellar"
                className={`flex items-center gap-1.5 transition-colors ${
                  location.pathname.startsWith('/cellar')
                    ? 'text-wine-400 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Wine className="w-4 h-4 text-wine-400" />
                <span>Minha Adega</span>
              </Link>
            ) : (
              <Link
                to="/vendor/dashboard"
                className={`flex items-center gap-1.5 transition-colors ${
                  location.pathname.startsWith('/vendor')
                    ? 'text-amber-400 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4 text-amber-400" />
                <span>Gerenciar Loja</span>
              </Link>
            )}
          </nav>

          {/* Alternador de Perfil & Ações */}
          <div className="flex items-center gap-4">
            <ProfileSwitcher />

            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
