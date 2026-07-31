import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Sparkles, 
  Plus, 
  Calendar,
  Image as ImageIcon,
  Power,
  Trash2,
  Edit
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  banner_url: string | null;
  is_active: boolean;
  products_included: number;
}

export const PromocoesPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState<Promotion | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta promoção?')) {
      setPromotions(promotions.filter(p => p.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setPromotions(promotions.map(p => 
      p.id === id ? { ...p, is_active: !p.is_active } : p
    ));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Promoções & Banners</h1>
          <p className="text-text-secondary mt-1">Crie campanhas temporárias para impulsionar suas vendas.</p>
        </div>
        <Button onClick={() => { setPromoToEdit(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {promotions.length > 0 ? (
          promotions.map(promo => (
            <Card key={promo.id} className="overflow-hidden border border-zinc-800 flex flex-col group">
              <div className="h-40 w-full relative bg-zinc-900 border-b border-zinc-800">
                {promo.banner_url && promo.banner_url.trim() !== '' ? (
                  <img src={promo.banner_url} alt={promo.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/50">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs uppercase tracking-wider font-bold">Sem Banner</span>
                  </div>
                )}
                
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  {promo.is_active ? (
                    <Badge variant="success" className="bg-emerald-500/90 text-white border-none shadow-md backdrop-blur-sm">Ativa</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-zinc-900/90 text-zinc-300 border-zinc-700 shadow-md backdrop-blur-sm">Inativa</Badge>
                  )}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-white text-lg leading-tight mb-2">{promo.title}</h3>
                <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">
                  {promo.description}
                </p>
                
                <div className="flex items-center justify-between py-3 border-y border-zinc-800/50 mb-4 text-xs text-text-secondary">
                  <div className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                    <span>{new Date(promo.start_date).toLocaleDateString('pt-BR')} até {new Date(promo.end_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="font-bold text-white">{promo.products_included}</span> produtos
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleActive(promo.id)}
                    className={promo.is_active ? 'border-zinc-700 text-zinc-400 hover:text-white' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {promo.is_active ? 'Pausar' : 'Ativar'}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setPromoToEdit(promo); setIsModalOpen(true); }} className="px-3">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(promo.id)} className="px-3 border-rose-500/20 text-rose-500 hover:bg-rose-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="lg:col-span-2">
            <EmptyState
              icon={Sparkles}
              title="Nenhuma promoção ativa"
              description="Crie campanhas para impulsionar suas vendas. Você pode adicionar banners que aparecerão para os clientes."
              action={{
                label: 'Criar Promoção',
                onClick: () => { setPromoToEdit(null); setIsModalOpen(true); }
              }}
            />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg my-8 bg-surface border-zinc-800 flex flex-col p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {promoToEdit ? 'Editar Promoção' : 'Nova Promoção'}
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Título da Promoção</label>
                <Input defaultValue={promoToEdit?.title} className="bg-zinc-900 border-zinc-800" placeholder="Ex: Festival de Inverno" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                <textarea 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-gold resize-none"
                  rows={3}
                  defaultValue={promoToEdit?.description}
                  placeholder="Detalhes da promoção..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Início</label>
                  <Input type="date" defaultValue={promoToEdit?.start_date?.split('T')[0]} className="bg-zinc-900 border-zinc-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Fim</label>
                  <Input type="date" defaultValue={promoToEdit?.end_date?.split('T')[0]} className="bg-zinc-900 border-zinc-800" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Banner Promocional (Opcional)</label>
                <div className="relative h-32 w-full rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-colors">
                  <ImageIcon className="w-6 h-6 text-zinc-500 mb-2" />
                  <span className="text-xs text-zinc-400 font-medium">Fazer upload da imagem</span>
                </div>
                <p className="text-[10px] text-text-secondary mt-1">Recomendado: 1200x400px</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 sticky bottom-0 bg-surface">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsModalOpen(false)}>Salvar Promoção</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
