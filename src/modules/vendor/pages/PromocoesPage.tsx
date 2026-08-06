import React, { useState, useEffect } from 'react';
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

const DEFAULT_PROMOS: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Festival de Vinhos de Inverno',
    description: 'Até 40% de desconto em vinhos tintos selecionados para aquecer seu inverno.',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    banner_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&q=80',
    is_active: true,
    products_included: 15
  }
];

export const PromocoesPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState<Promotion | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('@adegahub:promotions');
    if (saved) {
      setPromotions(JSON.parse(saved));
    } else {
      setPromotions(DEFAULT_PROMOS);
      localStorage.setItem('@adegahub:promotions', JSON.stringify(DEFAULT_PROMOS));
    }
  }, []);

  const saveToStorage = (newPromos: Promotion[]) => {
    setPromotions(newPromos);
    localStorage.setItem('@adegahub:promotions', JSON.stringify(newPromos));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta promoção?')) {
      saveToStorage(promotions.filter(p => p.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    saveToStorage(promotions.map(p => 
      p.id === id ? { ...p, is_active: !p.is_active } : p
    ));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const promo: Promotion = {
      id: promoToEdit ? promoToEdit.id : `promo-${Date.now()}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      banner_url: (formData.get('banner_url') as string) || null,
      is_active: true,
      products_included: Math.floor(Math.random() * 20) + 1 // Mock products count
    };

    if (promoToEdit) {
      saveToStorage(promotions.map(p => p.id === promo.id ? promo : p));
    } else {
      saveToStorage([promo, ...promotions]);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Promoções & Banners</h1>
          <p className="text-text-secondary mt-1">Crie campanhas temporárias para impulsionar suas vendas.</p>
        </div>
        <Button onClick={() => { setPromoToEdit(null); setIsModalOpen(true); }} className="bg-gold hover:bg-gold-dark text-black font-semibold">
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
                  <img src={promo.banner_url} alt={promo.title} className="w-full h-full object-cover opacity-80 mix-blend-overlay" />
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
                <h3 className="font-bold text-white text-lg leading-tight mb-2 font-display">{promo.title}</h3>
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
          <Card className="w-full max-w-lg my-8 bg-surface border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white font-display">
                {promoToEdit ? 'Editar Promoção' : 'Nova Promoção'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Título da Promoção</label>
                <Input name="title" required defaultValue={promoToEdit?.title} className="bg-zinc-900 border-zinc-800" placeholder="Ex: Festival de Inverno" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                <textarea 
                  name="description"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-gold resize-none"
                  rows={3}
                  defaultValue={promoToEdit?.description}
                  placeholder="Detalhes da promoção..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Início</label>
                  <Input name="start_date" type="date" required defaultValue={promoToEdit?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0]} className="bg-zinc-900 border-zinc-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Fim</label>
                  <Input name="end_date" type="date" required defaultValue={promoToEdit?.end_date?.split('T')[0]} className="bg-zinc-900 border-zinc-800" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Banner Promocional (URL da imagem)</label>
                <Input name="banner_url" defaultValue={promoToEdit?.banner_url || ""} className="bg-zinc-900 border-zinc-800" placeholder="https://..." />
                <p className="text-[10px] text-text-secondary mt-1">Recomendado: 1200x400px</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gold text-black hover:bg-gold-dark font-semibold">Salvar Promoção</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
