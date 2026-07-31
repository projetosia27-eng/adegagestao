import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/modules/auth/hooks/useAuth';
import { AppRoutes } from '@/routes';
import { PWAInstallBanner } from '@/modules/shared/components/PWAInstallBanner';
import { CartProvider } from '@/modules/customer/contexts/CartContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <PWAInstallBanner />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
