import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  Percent,
  DollarSign,
  Power
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;
  valid_until: string;
  is_active: boolean;
  usage_count: number;
  usage_limit: number | null;
}

export const CuponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
      setCoupons(coupons.filter(c => c.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setCoupons(coupons.map(c => 
      c.id === id ? { ...c, is_active: !c.is_active } : c
    ));
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Cupons de Desconto</h1>
          <p className="text-text-secondary mt-1">Crie e gerencie códigos promocionais para seus clientes.</p>
        </div>
        <Button onClick={() => { setCouponToEdit(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      <Card className="flex flex-col border border-zinc-800 bg-surface">
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Buscar pelo código..." 
              className="pl-9 bg-zinc-900 border-zinc-800"
              value={searchQuery || ""}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary bg-zinc-900/50 uppercase border-b border-zinc-800">
              <tr>
                <th className="px-4 py-4">Código / Tipo</th>
                <th className="px-4 py-4">Valor</th>
                <th className="px-4 py-4">Condições</th>
                <th className="px-4 py-4">Validade</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length > 0 ? (
                filteredCoupons.map(coupon => (
                  <tr key={coupon.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          coupon.type === 'percentage' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {coupon.type === 'percentage' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-white uppercase tracking-wider">{coupon.code}</div>
                          <div className="text-xs text-text-secondary">
                            {coupon.type === 'percentage' ? 'Percentual' : 'Valor Fixo'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">
                        {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `R$ ${coupon.value.toFixed(2)}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-secondary text-xs space-y-1">
                        <div>Min. compra: R$ {coupon.min_purchase.toFixed(2)}</div>
                        <div>
                          Usos: {coupon.usage_count} 
                          {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-text-secondary text-xs">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500 shrink-0" />
                        {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {coupon.is_active ? (
                        <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700">Inativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleActive(coupon.id)} 
                        className={`h-8 px-2 ${coupon.is_active ? 'border-zinc-700 text-zinc-400 hover:text-white' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setCouponToEdit(coupon); setIsModalOpen(true); }} className="h-8 px-2">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(coupon.id)} className="h-8 px-2 border-rose-500/20 text-rose-500 hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <EmptyState
                      icon={Tag}
                      title="Nenhum cupom encontrado"
                      description="Você não possui cupons cadastrados ou nenhum corresponde à sua busca."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Basic Modal Implementation - Would be separated in a real app */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-surface border-zinc-800 flex flex-col p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">
              {couponToEdit ? 'Editar Cupom' : 'Novo Cupom'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Código</label>
                <Input defaultValue={couponToEdit?.code} className="bg-zinc-900 border-zinc-800 uppercase" placeholder="Ex: BEMVINDO10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
                  <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold">
                    <option value="percentage" selected={couponToEdit?.type === 'percentage'}>Percentual (%)</option>
                    <option value="fixed" selected={couponToEdit?.type === 'fixed'}>Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Valor</label>
                  <Input type="number" defaultValue={couponToEdit?.value} className="bg-zinc-900 border-zinc-800" placeholder="10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Compra Mínima (R$)</label>
                  <Input type="number" defaultValue={couponToEdit?.min_purchase} className="bg-zinc-900 border-zinc-800" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Limite de Usos</label>
                  <Input type="number" defaultValue={couponToEdit?.usage_limit || ''} className="bg-zinc-900 border-zinc-800" placeholder="Ilimitado" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Validade</label>
                <Input type="date" defaultValue={couponToEdit?.valid_until?.split('T')[0]} className="bg-zinc-900 border-zinc-800" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsModalOpen(false)}>Salvar Cupom</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
