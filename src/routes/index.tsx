import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { CadastroPage } from '@/modules/auth/pages/CadastroPage';
import { RecuperarSenhaPage } from '@/modules/auth/pages/RecuperarSenhaPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Construction } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

import { HomeClientePage } from '@/modules/customer/pages/HomeClientePage';
import { AdegaDetalhePage } from '@/modules/customer/pages/AdegaDetalhePage';

import { CarrinhoPage } from '@/modules/customer/pages/CarrinhoPage';
import { PerfilClientePage } from '@/modules/customer/pages/PerfilClientePage';

import { DashboardVendedorPage } from '@/modules/vendor/pages/DashboardVendedorPage';
import { AdegasPage } from '@/modules/vendor/pages/AdegasPage';
import { ProdutosPage } from '@/modules/vendor/pages/ProdutosPage';
import { PedidosVendedorPage } from '@/modules/vendor/pages/PedidosVendedorPage';
import { PedidoVendedorDetalhePage } from '@/modules/vendor/pages/PedidoVendedorDetalhePage';
import { ClientesPage } from '@/modules/vendor/pages/ClientesPage';

import { CuponsPage } from '@/modules/vendor/pages/CuponsPage';
import { PromocoesPage } from '@/modules/vendor/pages/PromocoesPage';
import { EntregadoresPage } from '@/modules/vendor/pages/EntregadoresPage';
import { ConfiguracoesVendedorPage } from '@/modules/vendor/pages/ConfiguracoesVendedorPage';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 h-full">
    <EmptyState
      icon={Construction}
      title={title}
      description="Esta página está em construção."
    />
  </div>
);

export function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />

      {/* Rotas Cliente */}
      <Route path="/cliente/*" element={
        <ProtectedRoute allowedRoles={['customer', 'both']}>
          <AppLayout>
            <Routes>
              <Route path="home" element={<HomeClientePage />} />
              <Route path="adega/:id" element={<AdegaDetalhePage />} />
              <Route path="carrinho" element={<CarrinhoPage />} />
              <Route path="pedidos" element={<PlaceholderPage title="Meus Pedidos" />} />
              <Route path="pedido/:id" element={<PlaceholderPage title="Detalhes do Pedido" />} />
              <Route path="favoritos" element={<PlaceholderPage title="Favoritos" />} />
              <Route path="perfil" element={<PerfilClientePage />} />
              <Route path="*" element={<Navigate to="home" replace />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Rotas Vendedor */}
      <Route path="/vendedor/*" element={
        <ProtectedRoute allowedRoles={['vendor', 'both']}>
          <AppLayout>
            <Routes>
              <Route path="dashboard" element={<DashboardVendedorPage />} />
              <Route path="adegas" element={<AdegasPage />} />
              <Route path="adega/:id" element={<PlaceholderPage title="Detalhes da Adega" />} />
              <Route path="produtos" element={<ProdutosPage />} />
              <Route path="adega/:id/produtos" element={<ProdutosPage />} />
              <Route path="pedidos" element={<PedidosVendedorPage />} />
              <Route path="pedido/:id" element={<PedidoVendedorDetalhePage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="financeiro" element={<PlaceholderPage title="Financeiro" />} />
              <Route path="despesas" element={<PlaceholderPage title="Despesas" />} />
              <Route path="cupons" element={<CuponsPage />} />
              <Route path="promocoes" element={<PromocoesPage />} />
              <Route path="entregadores" element={<EntregadoresPage />} />
              <Route path="configuracoes" element={<ConfiguracoesVendedorPage />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
