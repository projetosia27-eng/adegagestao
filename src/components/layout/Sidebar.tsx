import { Link, useLocation } from 'react-router-dom';
import { Wine, Store, LayoutDashboard, Settings, Box } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useCart } from '@/modules/customer/contexts/CartContext';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
  const location = useLocation();
  const { user, activeRole } = useAuth();
  const { items } = useCart();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const isVendorRoute = location.pathname.startsWith('/vendedor');
  const userRole = user?.role || activeRole || 'customer';
  const effectiveRole = (userRole === 'vendor' || isVendorRoute) && userRole === 'vendor' ? 'vendor' : 'customer';

  const customerLinks: Array<{ to: string; icon: any; label: string; isCart?: boolean }> = [
    { to: '/cliente/home', icon: Store, label: 'Adegas' },
    { to: '/cliente/carrinho', icon: Box, label: 'Carrinho', isCart: true },
    { to: '/cliente/pedidos', icon: LayoutDashboard, label: 'Meus Pedidos' },
    { to: '/cliente/favoritos', icon: Wine, label: 'Favoritos' },
    { to: '/cliente/perfil', icon: Settings, label: 'Perfil' },
  ];

  const vendorLinks: Array<{ to: string; icon: any; label: string; isCart?: boolean }> = [
    { to: '/vendedor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vendedor/pedidos', icon: Store, label: 'Pedidos' },
    { to: '/vendedor/adegas', icon: Box, label: 'Minhas Adegas' },
    { to: '/vendedor/financeiro', icon: Wine, label: 'Financeiro' },
    { to: '/vendedor/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  const links = effectiveRole === 'vendor' ? vendorLinks : customerLinks;

  return (
    <aside className="hidden md:flex w-64 bg-surface border-r border-zinc-800/50 flex-col z-40">
      <div className="p-8">
        <Link to="/" className="flex items-center space-x-3 mb-10 group">
          <div className="w-8 h-8 bg-gradient-to-br from-gold to-gold-dark rounded-lg shadow-lg shadow-gold/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <div className="w-4 h-4 border-2 border-background/80 rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-text-secondary">
            AdegaHub
          </h1>
        </Link>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3 py-2 rounded-md flex items-center justify-between transition-colors cursor-pointer',
                  isActive 
                    ? 'bg-zinc-800/50 text-white shadow-sm border border-zinc-700/50' 
                    : 'text-text-secondary hover:bg-zinc-800/30 hover:text-white'
                )}
              >
                <div className="flex items-center space-x-3">
                  <link.icon className={cn("w-4 h-4", isActive ? "text-gold" : "opacity-70")} />
                  <span className="text-sm font-medium">{link.label}</span>
                </div>
                {link.isCart && totalCartItems > 0 && (
                  <span className="bg-gold text-zinc-950 font-bold text-xs px-2 py-0.5 rounded-full">
                    {totalCartItems}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-zinc-800/50 bg-background/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-surface border border-zinc-700 flex items-center justify-center text-xs font-bold text-gold">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white line-clamp-1">{user?.fullName || 'Usuário'}</p>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider">Perfil {effectiveRole === 'vendor' ? 'Vendedor' : 'Cliente'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
