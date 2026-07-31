import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  AlertTriangle,
  ArrowRight,
  Plus,
  Tag,
  Truck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  time: string;
  total: number;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'canceled';
}

export const DashboardVendedorPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  
  const [salesToday, setSalesToday] = useState(0);
  const [salesWeek, setSalesWeek] = useState(0);
  const [salesMonth, setSalesMonth] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);

  const [salesData, setSalesData] = useState<{ name: string; sales: number }[]>([
    { name: 'Seg', sales: 0 },
    { name: 'Ter', sales: 0 },
    { name: 'Qua', sales: 0 },
    { name: 'Qui', sales: 0 },
    { name: 'Sex', sales: 0 },
    { name: 'Sáb', sales: 0 },
    { name: 'Dom', sales: 0 },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Get vendor's store IDs
        let storeIds: string[] = [];
        try {
          const { data } = await supabase
            .from('stores')
            .select('id')
            .eq('vendor_id', user.id);
          storeIds = (data || []).map((s: any) => s.id);
        } catch (err) {
          console.warn('Erro ao consultar adegas:', err);
        }

        if (storeIds.length === 0) {
          setRecentOrders([]);
          setLowStock([]);
          setLoading(false);
          return;
        }

        // 2. Fetch recent orders for vendor's stores
        let orders: any[] = [];
        try {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .in('store_id', storeIds)
            .order('created_at', { ascending: false });
          orders = data || [];
        } catch (err) {
          console.warn('Erro ao consultar pedidos:', err);
        }

        // Calculate sales metrics
        let todaySum = 0;
        let weekSum = 0;
        let monthSum = 0;
        let totalSum = 0;
        let pendingCount = 0;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        orders.forEach((o: any) => {
          const val = Number(o.total) || 0;
          totalSum += val;
          const orderDate = new Date(o.created_at);

          if (o.status === 'pending') {
            pendingCount++;
          }

          if (orderDate >= startOfToday) todaySum += val;
          if (orderDate >= startOfWeek) weekSum += val;
          if (orderDate >= startOfMonth) monthSum += val;
        });

        setSalesToday(todaySum);
        setSalesWeek(weekSum);
        setSalesMonth(monthSum);
        setTotalOrdersCount(orders.length);
        setPendingOrdersCount(pendingCount);
        setTicketMedio(orders.length > 0 ? totalSum / orders.length : 0);

        // Format recent orders
        const formattedOrders: RecentOrder[] = orders.slice(0, 5).map((o: any) => ({
          id: String(o.id).substring(0, 8),
          customer: o.customer_name || 'Cliente',
          time: new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          total: Number(o.total) || 0,
          status: o.status || 'pending',
        }));
        setRecentOrders(formattedOrders);

        // 3. Fetch products with low stock
        let lowStockProducts: LowStockItem[] = [];
        try {
          const { data } = await supabase
            .from('products')
            .select('*')
            .in('store_id', storeIds)
            .lte('stock', 5);
          lowStockProducts = (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            stock: p.stock ?? 0,
            min_stock: 5,
          }));
        } catch (err) {
          console.warn('Erro ao consultar produtos com estoque baixo:', err);
        }
        setLowStock(lowStockProducts);

      } catch (error) {
        console.warn('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 animate-pulse space-y-6">
        <div className="h-8 w-64 bg-zinc-800 rounded mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-zinc-800 rounded-xl"></div>
          <div className="h-96 bg-zinc-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-text-secondary mt-1">Bem-vindo de volta! Aqui está o resumo real das suas adegas.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/vendedor/produtos">
            <Button className="shrink-0 bg-gold text-zinc-950 hover:bg-gold/90 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between border-t-2 border-t-gold">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-sm font-medium">Vendas Hoje</h3>
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">R$ {salesToday.toFixed(2)}</div>
            <p className="text-text-secondary text-xs mt-1">Pedidos do dia</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-sm font-medium">Vendas da Semana</h3>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">R$ {salesWeek.toFixed(2)}</div>
            <p className="text-text-secondary text-xs mt-1">Acumulado da semana</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-sm font-medium">Vendas do Mês</h3>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">R$ {salesMonth.toFixed(2)}</div>
            <p className="text-text-secondary text-xs mt-1">Acumulado do mês</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-secondary text-sm font-medium">Ticket Médio</h3>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">R$ {ticketMedio.toFixed(2)}</div>
            <p className="text-text-secondary text-xs mt-1">Com base em {totalOrdersCount} pedidos</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white text-lg">Vendas (Semana)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#D4AF37' }}
                />
                <Area type="monotone" dataKey="sales" name="Vendas (R$)" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pending & Shortcuts */}
        <div className="space-y-6">
          {/* Action Required */}
          <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-500/5">
            <h3 className="font-bold text-white mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
              Atenção Necessária
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{pendingOrdersCount}</div>
                    <div className="text-xs text-text-secondary">Pedidos Pendentes</div>
                  </div>
                </div>
                <Link to="/vendedor/pedidos">
                  <Button size="sm" variant="outline" className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10">
                    Ver
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{lowStock.length}</div>
                    <div className="text-xs text-text-secondary">Estoque Baixo</div>
                  </div>
                </div>
                <Link to="/vendedor/produtos">
                  <Button size="sm" variant="outline" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
                    Repor
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="p-5">
            <h3 className="font-bold text-white mb-4">Atalhos Rápidos</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/vendedor/produtos" className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-gold/50 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                <Package className="w-5 h-5 text-zinc-400 group-hover:text-gold transition-colors" />
                <span className="text-xs font-medium text-white">Produtos</span>
              </Link>
              <Link to="/vendedor/pedidos" className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-gold/50 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                <ShoppingBag className="w-5 h-5 text-zinc-400 group-hover:text-gold transition-colors" />
                <span className="text-xs font-medium text-white">Pedidos</span>
              </Link>
              <Link to="/vendedor/cupons" className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-gold/50 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                <Tag className="w-5 h-5 text-zinc-400 group-hover:text-gold transition-colors" />
                <span className="text-xs font-medium text-white">Cupons</span>
              </Link>
              <Link to="/vendedor/entregadores" className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-gold/50 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                <Truck className="w-5 h-5 text-zinc-400 group-hover:text-gold transition-colors" />
                <span className="text-xs font-medium text-white">Entregas</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Últimos Pedidos</h3>
            <Link to="/vendedor/pedidos" className="text-sm text-gold hover:underline flex items-center">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-secondary">
                Nenhum pedido recebido ainda.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary bg-zinc-900/50 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                      <td className="px-4 py-3 font-medium text-white">#{order.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-white">{order.customer}</div>
                        <div className="text-xs text-text-secondary">{order.time}</div>
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'pending' && <Badge variant="danger" className="bg-rose-500/10 text-rose-500 border-rose-500/20">Pendente</Badge>}
                        {order.status === 'preparing' && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Preparando</Badge>}
                        {order.status === 'delivering' && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Em Rota</Badge>}
                        {order.status === 'delivered' && <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Entregue</Badge>}
                        {order.status === 'canceled' && <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">Cancelado</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">R$ {order.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center">
              <Package className="w-5 h-5 text-amber-500 mr-2" />
              Estoque Baixo
            </h3>
            <Link to="/vendedor/produtos" className="text-sm text-gold hover:underline flex items-center">
              Gerenciar <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-secondary">
                Nenhum produto com estoque crítico no momento.
              </div>
            ) : (
              lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-medium text-white truncate text-sm">{item.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">Mínimo ideal: {item.min_stock}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bold text-rose-500 text-lg">{item.stock}</span>
                      <span className="text-xs text-text-secondary ml-1">un</span>
                    </div>
                    <Link to="/vendedor/produtos">
                      <Button size="sm" variant="outline" className="shrink-0 h-8">
                        Repor
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
