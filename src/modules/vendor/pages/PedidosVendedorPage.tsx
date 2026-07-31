import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  BellRing,
  Volume2,
  VolumeX,
  Search,
  Eye,
  Bike
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

export interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  store_id: string;
  customer_id: string;
  customer_name: string;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'canceled';
  total: number;
  created_at: string;
  delivery_address: string;
  driver_id?: string;
  driver_name?: string;
  items?: OrderItem[];
}

export const PedidosVendedorPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drivers, setDrivers] = useState<{id: string, name: string}[]>([]);
  const [stores, setStores] = useState<{id: string, name: string}[]>([]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  }, [soundEnabled]);

  const fetchInitialData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch user's stores
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name')
        .eq('vendor_id', user.id);
      
      const userStores = storesData || [];
      setStores(userStores);
      const storeIds = userStores.map(s => s.id);

      if (storeIds.length > 0) {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('store_id', storeIds)
          .order('created_at', { ascending: false });

        if (!ordersError && ordersData) {
          setOrders(ordersData as Order[]);
        }

        // Fetch drivers (mocking a drivers table for now, or just some hardcoded ones if none exist)
        // Let's assume a table 'drivers' exists, if not we'll handle gracefully
        const { data: driversData } = await supabase.from('drivers').select('id, name').limit(10);
        setDrivers(driversData || [
          { id: 'd1', name: 'Carlos Motoboy' },
          { id: 'd2', name: 'Roberto Entregas' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!user || stores.length === 0) return;

    const storeIds = stores.map(s => s.id);

    const channel = supabase
      .channel('vendor-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as Order;
          if (storeIds.includes(newOrder.store_id)) {
            setOrders((prev) => [newOrder, ...prev]);
            playNotificationSound();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          if (storeIds.includes(updatedOrder.store_id)) {
            setOrders((prev) => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, stores, playNotificationSound]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
        
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error('Error updating status', err);
      // Fallback for UI if DB doesn't exist
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ driver_id: driverId, driver_name: driver?.name, status: 'delivering' })
        .eq('id', orderId);
        
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { 
        ...o, 
        driver_id: driverId, 
        driver_name: driver?.name, 
        status: 'delivering' 
      } : o));
    } catch (err) {
      console.error('Error assigning driver', err);
      setOrders(prev => prev.map(o => o.id === orderId ? { 
        ...o, 
        driver_id: driverId, 
        driver_name: driver?.name, 
        status: 'delivering' 
      } : o));
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.includes(searchQuery) || o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Gestão de Pedidos
            {pendingCount > 0 && (
              <Badge variant="danger" className="animate-pulse bg-rose-500/20 text-rose-500 border-rose-500/30">
                {pendingCount} novos
              </Badge>
            )}
          </h1>
          <p className="text-text-secondary mt-1">Acompanhe e gerencie os pedidos em tempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={soundEnabled ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 'text-zinc-500'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
            {soundEnabled ? 'Som Ativado' : 'Som Mutado'}
          </Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 border border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Buscar por ID ou Cliente..." 
            className="pl-9 bg-zinc-900 border-zinc-800"
            value={searchQuery || ""}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <Button 
            variant={statusFilter === 'all' ? 'primary' : 'outline'} 
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            Todos
          </Button>
          <Button 
            variant={statusFilter === 'pending' ? 'primary' : 'outline'} 
            onClick={() => setStatusFilter('pending')}
            size="sm"
            className={statusFilter === 'pending' ? 'bg-rose-600 hover:bg-rose-700 text-white border-transparent' : 'border-zinc-800 text-zinc-300'}
          >
            Pendentes
          </Button>
          <Button 
            variant={statusFilter === 'preparing' ? 'primary' : 'outline'} 
            onClick={() => setStatusFilter('preparing')}
            size="sm"
            className={statusFilter === 'preparing' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent' : 'border-zinc-800 text-zinc-300'}
          >
            Preparando
          </Button>
          <Button 
            variant={statusFilter === 'delivering' ? 'primary' : 'outline'} 
            onClick={() => setStatusFilter('delivering')}
            size="sm"
            className={statusFilter === 'delivering' ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' : 'border-zinc-800 text-zinc-300'}
          >
            Em Rota
          </Button>
          <Button 
            variant={statusFilter === 'delivered' ? 'primary' : 'outline'} 
            onClick={() => setStatusFilter('delivered')}
            size="sm"
            className={statusFilter === 'delivered' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' : 'border-zinc-800 text-zinc-300'}
          >
            Concluídos
          </Button>
        </div>
      </Card>

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nenhum pedido encontrado"
          description={orders.length === 0 ? "Você ainda não recebeu nenhum pedido." : "Nenhum pedido corresponde aos filtros atuais."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className={`p-5 flex flex-col border-l-4 ${
              order.status === 'pending' ? 'border-l-rose-500' :
              order.status === 'preparing' ? 'border-l-amber-500' :
              order.status === 'delivering' ? 'border-l-blue-500' :
              order.status === 'delivered' ? 'border-l-emerald-500' :
              'border-l-zinc-500'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-xs text-text-secondary mb-1">#{order.id.split('-')[0] || order.id}</div>
                  <h3 className="font-bold text-white text-lg">{order.customer_name || 'Cliente'}</h3>
                </div>
                <Badge variant={
                  order.status === 'pending' ? 'danger' :
                  order.status === 'preparing' ? 'outline' :
                  order.status === 'delivering' ? 'outline' :
                  order.status === 'delivered' ? 'success' : 'outline'
                } className={`
                  ${order.status === 'preparing' && 'text-amber-500 border-amber-500/30 bg-amber-500/10'}
                  ${order.status === 'delivering' && 'text-blue-500 border-blue-500/30 bg-blue-500/10'}
                `}>
                  {order.status === 'pending' && 'Pendente'}
                  {order.status === 'preparing' && 'Preparando'}
                  {order.status === 'delivering' && 'Em Rota'}
                  {order.status === 'delivered' && 'Entregue'}
                  {order.status === 'canceled' && 'Cancelado'}
                </Badge>
              </div>

              <div className="text-sm text-text-secondary mb-4 space-y-1 flex-1">
                <div className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-2" />
                  {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-start">
                  <div className="w-3.5 h-3.5 mr-2 mt-0.5 border border-zinc-500 rounded-sm shrink-0" />
                  <span className="line-clamp-2">{order.delivery_address || 'Retirada no local'}</span>
                </div>
                {order.driver_name && (
                  <div className="flex items-center text-blue-400 mt-2">
                    <Bike className="w-3.5 h-3.5 mr-2" />
                    {order.driver_name}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-text-secondary text-sm">Total</span>
                <span className="text-gold font-bold text-lg">R$ {(order.total || 0).toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                {order.status === 'pending' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => updateOrderStatus(order.id, 'canceled')} className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10">
                      Recusar
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-amber-600 hover:bg-amber-700 text-white">
                      Aceitar
                    </Button>
                  </>
                )}
                
                {order.status === 'preparing' && (
                  <>
                    <div className="col-span-2 flex gap-2">
                      <select 
                        className="flex-1 bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2 focus:outline-none"
                        onChange={(e) => assignDriver(order.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Atribuir Entregador...</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <Button variant="primary" size="sm" onClick={() => updateOrderStatus(order.id, 'delivering')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 shrink-0">
                        <Truck className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}

                {order.status === 'delivering' && (
                  <Button variant="outline" size="sm" onClick={() => updateOrderStatus(order.id, 'delivered')} className="col-span-2 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Marcar como Entregue
                  </Button>
                )}

                <Link to={`/vendedor/pedido/${order.id}`} className={order.status === 'pending' || order.status === 'preparing' ? 'col-span-2 mt-2' : 'col-span-2'}>
                  <Button variant="secondary" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
