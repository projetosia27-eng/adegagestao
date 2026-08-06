import { Search, ShoppingBag, Wine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { NotificacoesDropdown } from './NotificacoesDropdown';
import { useCart } from '@/modules/customer/contexts/CartContext';

export const Header = () => {
  const { user, activeRole } = useAuth();
  const { items } = useCart();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const isCustomer = (user?.role || activeRole || 'customer') !== 'vendor';

  return (
    <header className="h-16 md:h-20 border-b border-zinc-800/80 flex items-center justify-between px-4 md:px-8 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        {/* Mobile Brand Logo */}
        <Link to={isCustomer ? "/cliente/home" : "/vendedor/dashboard"} className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-gold to-gold-dark rounded-lg flex items-center justify-center shadow-md shadow-gold/20">
            <Wine className="w-5 h-5 text-zinc-950" />
          </div>
          <span className="font-bold text-white text-base tracking-tight font-display">Adega Prime</span>
        </Link>

        {/* Desktop Status Badge */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="text-xs text-text-secondary tracking-wider uppercase font-semibold">Status do Sistema</div>
          <div className="flex items-center space-x-2 bg-surface/80 px-3 py-1 rounded-full border border-zinc-800/80">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <span className="text-[11px] font-medium text-emerald-400">Online & Sincronizado</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 text-text-secondary">
        <button className="p-2 hover:bg-surface rounded-full transition-colors hidden sm:block">
          <Search className="w-5 h-5" />
        </button>
        {isCustomer && (
          <Link to="/cliente/carrinho" className="p-2 hover:bg-surface rounded-full transition-colors relative">
            <ShoppingBag className="w-5 h-5 text-gold" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-zinc-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in-50">
                {totalCartItems}
              </span>
            )}
          </Link>
        )}
        <NotificacoesDropdown />
        <div className="w-8 h-8 md:hidden rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-gold/30 flex items-center justify-center text-xs font-bold text-gold shadow-sm">
          {user?.fullName?.charAt(0) || 'A'}
        </div>
      </div>
    </header>
  );
};
