import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  Star,
  Phone,
  Calendar,
  DollarSign
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  total_spent: number;
  last_purchase: string;
  order_count: number;
  is_vip: boolean;
}

export const ClientesPage = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVip, setFilterVip] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // recent, spent_desc, orders_desc

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('vendor_id', user.id);

        const storeIds = (stores || []).map(s => s.id);

        if (storeIds.length === 0) {
          setCustomers([]);
          setLoading(false);
          return;
        }

        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .in('store_id', storeIds)
          .order('created_at', { ascending: false });

        if (!orders || orders.length === 0) {
          setCustomers([]);
        } else {
          const map = new Map<string, Customer>();

          orders.forEach((o: any) => {
            const key = o.customer_id || o.customer_name || 'Desconhecido';
            const name = o.customer_name || 'Cliente';
            const total = Number(o.total) || 0;
            const createdAt = o.created_at;

            if (!map.has(key)) {
              map.set(key, {
                id: key,
                name: name,
                phone: o.delivery_address || 'Não informado',
                total_spent: total,
                last_purchase: createdAt,
                order_count: 1,
                is_vip: total > 500,
              });
            } else {
              const existing = map.get(key)!;
              existing.total_spent += total;
              existing.order_count += 1;
              if (new Date(createdAt) > new Date(existing.last_purchase)) {
                existing.last_purchase = createdAt;
              }
              if (existing.total_spent > 500) {
                existing.is_vip = true;
              }
            }
          });

          setCustomers(Array.from(map.values()));
        }
      } catch (err) {
        console.warn('Erro ao carregar clientes:', err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [user]);

  const handleToggleVip = (id: string) => {
    setCustomers(customers.map(c => 
      c.id === id ? { ...c, is_vip: !c.is_vip } : c
    ));
  };

  const filteredCustomers = customers
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.phone.includes(searchQuery);
      const matchesVip = filterVip === 'all' || 
                         (filterVip === 'vip' ? c.is_vip : !c.is_vip);
      return matchesSearch && matchesVip;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime();
      if (sortBy === 'spent_desc') return b.total_spent - a.total_spent;
      if (sortBy === 'orders_desc') return b.order_count - a.order_count;
      return 0;
    });

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
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Meus Clientes</h1>
          <p className="text-text-secondary mt-1">Conheça seu público e gerencie clientes VIP.</p>
        </div>
      </div>

      <Card className="flex flex-col border border-zinc-800 bg-surface">
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Buscar por nome ou telefone..." 
              className="pl-9 bg-zinc-900 border-zinc-800"
              value={searchQuery || ""}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select 
              className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
              value={filterVip}
              onChange={e => setFilterVip(e.target.value)}
            >
              <option value="all">Todos os Clientes</option>
              <option value="vip">Apenas VIPs</option>
              <option value="regular">Regulares</option>
            </select>

            <select 
              className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="recent">Mais Recentes</option>
              <option value="spent_desc">Maior Gasto</option>
              <option value="orders_desc">Mais Pedidos</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary bg-zinc-900/50 uppercase border-b border-zinc-800">
              <tr>
                <th className="px-4 py-4">Cliente</th>
                <th className="px-4 py-4">Contato</th>
                <th className="px-4 py-4">Desempenho</th>
                <th className="px-4 py-4">Última Compra</th>
                <th className="px-4 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                          <span className="font-bold text-white text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {customer.name}
                            {customer.is_vip && (
                              <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                            )}
                          </div>
                          {customer.is_vip && (
                            <div className="text-[10px] text-gold font-bold uppercase tracking-wider">Cliente VIP</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-text-secondary">
                        <Phone className="w-3.5 h-3.5 mr-2 text-zinc-500 shrink-0" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-emerald-500 font-bold">
                          <DollarSign className="w-3.5 h-3.5 mr-1" />
                          R$ {customer.total_spent.toFixed(2)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {customer.order_count} {customer.order_count === 1 ? 'pedido' : 'pedidos'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-text-secondary">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-500 shrink-0" />
                        {new Date(customer.last_purchase).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant={customer.is_vip ? 'outline' : 'secondary'} 
                        size="sm" 
                        onClick={() => handleToggleVip(customer.id)}
                        className={customer.is_vip ? 'border-gold/20 text-gold hover:bg-gold/10' : ''}
                      >
                        <Star className={`w-4 h-4 mr-2 ${customer.is_vip ? 'fill-gold' : ''}`} />
                        {customer.is_vip ? 'Remover VIP' : 'Marcar VIP'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <EmptyState
                      icon={Users}
                      title="Nenhum cliente encontrado"
                      description={searchQuery ? "Nenhum cliente corresponde aos filtros de busca." : "Você ainda não possui clientes."}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
