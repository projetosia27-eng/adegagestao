import { Link, useLocation } from 'react-router-dom';
import { Wine, Store, LayoutDashboard, Settings, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useCart } from '@/modules/customer/contexts/CartContext';

export const BottomNavigation = () => {
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
    { to: '/cliente/pedidos', icon: LayoutDashboard, label: 'Pedidos' },
    { to: '/cliente/perfil', icon: Settings, label: 'Perfil' },
  ];

  const vendorLinks: Array<{ to: string; icon: any; label: string; isCart?: boolean }> = [
    { to: '/vendedor/dashboard', icon: LayoutDashboard, label: 'Início' },
    { to: '/vendedor/pedidos', icon: Store, label: 'Pedidos' },
    { to: '/vendedor/produtos', icon: Box, label: 'Produtos' },
    { to: '/vendedor/promocoes', icon: Wine, label: 'Promos' },
    { to: '/vendedor/configuracoes', icon: Settings, label: 'Ajustes' },
  ];

  const links = effectiveRole === 'vendor' ? vendorLinks : customerLinks;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-zinc-800/50 flex justify-around p-2 text-text-secondary z-40 pb-safe">
      {links.map((link) => {
        const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
        return (
          <Link 
            key={link.to}
            to={link.to} 
            className={cn(
              "flex flex-col items-center gap-1 w-16 py-2 transition-colors relative",
              isActive ? "text-gold" : "hover:text-white"
            )}
          >
            <div className="relative">
              <link.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]")} />
              {link.isCart && totalCartItems > 0 && (
                <span className="absolute -top-1 -right-2 bg-gold text-zinc-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-background">
                  {totalCartItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  );
};
