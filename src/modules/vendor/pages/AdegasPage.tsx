import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  Store, 
  Plus, 
  MapPin, 
  Clock, 
  Edit, 
  Power, 
  Star,
  Settings
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormAdegaModal } from '../components/FormAdegaModal';

export interface Adega {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  logo_url: string;
  banner_url: string;
  rating: number;
  is_open: boolean;
  address: string;
  operating_hours: string;
  delivery_fee: number;
  minimum_order: number;
}

export const AdegasPage = () => {
  const { user } = useAuth();
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adegaToEdit, setAdegaToEdit] = useState<Adega | null>(null);

  const fetchAdegas = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('vendor_id', user.id)
        .order('name');
        
      setAdegas(data || []);
    } catch (error) {
      console.warn('Erro ao buscar adegas:', error);
      setAdegas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdegas();
  }, [user]);

  const handleToggleOpen = async (adega: Adega) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_open: !adega.is_open })
        .eq('id', adega.id);

      if (error) throw error;
      
      setAdegas(adegas.map(a => a.id === adega.id ? { ...a, is_open: !a.is_open } : a));
    } catch (error) {
      console.error('Erro ao alterar status da adega:', error);
      alert('Erro ao alterar status');
    }
  };

  const handleOpenModal = (adega?: Adega) => {
    if (adega) {
      setAdegaToEdit(adega);
    } else {
      setAdegaToEdit(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAdegaToEdit(null);
  };

  const handleSave = () => {
    fetchAdegas();
    handleCloseModal();
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Minhas Adegas</h1>
          <p className="text-text-secondary mt-1">Gerencie suas lojas, horários e taxas de entrega.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Adega
        </Button>
      </div>

      {adegas.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Nenhuma adega cadastrada"
          description="Você ainda não possui nenhuma adega cadastrada. Crie a primeira para começar a vender."
          action={{
            label: 'Criar Nova Adega',
            onClick: () => handleOpenModal()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adegas.map(adega => (
            <Card key={adega.id} className="overflow-hidden border border-zinc-800 flex flex-col group">
              <div className="h-32 w-full relative bg-zinc-900 border-b border-zinc-800">
                {adega.banner_url && adega.banner_url.trim() !== '' ? (
                  <img src={adega.banner_url} alt="Banner" className="w-full h-full object-cover opacity-70" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-zinc-900 to-zinc-800"></div>
                )}
                
                <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-xl bg-zinc-900 border-2 border-background overflow-hidden shadow-lg z-10">
                  {adega.logo_url && adega.logo_url.trim() !== '' ? (
                    <img src={adega.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                      <Store className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                <div className="absolute top-3 right-3 z-10">
                  {adega.is_open ? (
                    <Badge variant="success" className="bg-emerald-500/90 text-white border-none shadow-md">Aberta</Badge>
                  ) : (
                    <Badge variant="danger" className="bg-rose-500/90 text-white border-none shadow-md">Fechada</Badge>
                  )}
                </div>
              </div>
              
              <div className="p-4 pt-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-lg leading-tight truncate pr-2">{adega.name}</h3>
                  <div className="flex items-center text-gold text-xs font-bold shrink-0 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                    {adega.rating ? adega.rating.toFixed(1) : 'Novo'}
                  </div>
                </div>
                
                <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">
                  {adega.description || 'Sem descrição'}
                </p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-xs text-text-secondary">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-zinc-500 shrink-0" />
                    <span className="truncate">{adega.address || 'Endereço não informado'}</span>
                  </div>
                  <div className="flex items-center text-xs text-text-secondary">
                    <Clock className="w-3.5 h-3.5 mr-2 text-zinc-500 shrink-0" />
                    <span className="truncate">{adega.operating_hours || 'Horário não informado'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium pt-2 border-t border-zinc-800/50">
                    <span className="text-white">
                      <span className="text-text-secondary mr-1">Entrega:</span> 
                      {adega.delivery_fee === 0 ? 'Grátis' : `R$ ${adega.delivery_fee?.toFixed(2) || '0.00'}`}
                    </span>
                    <span className="text-white">
                      <span className="text-text-secondary mr-1">Mínimo:</span> 
                      R$ {adega.minimum_order?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleToggleOpen(adega)}
                    className={adega.is_open ? 'hover:bg-rose-500/10 hover:text-rose-500' : 'hover:bg-emerald-500/10 hover:text-emerald-500'}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {adega.is_open ? 'Pausar Loja' : 'Abrir Loja'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenModal(adega)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <FormAdegaModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          adega={adegaToEdit}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
