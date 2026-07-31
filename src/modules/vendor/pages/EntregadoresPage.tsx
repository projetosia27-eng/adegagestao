import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Bike, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone,
  MapPin,
  Power,
  Navigation
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { MapaEntrega } from '../components/MapaEntrega';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  is_active: boolean;
  status: 'online' | 'offline' | 'delivering';
  current_order?: string;
  current_location?: { lat: number; lng: number };
}

export const EntregadoresPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [viewMapFor, setViewMapFor] = useState<Driver | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este entregador?')) {
      setDrivers(drivers.filter(d => d.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setDrivers(drivers.map(d => {
      if (d.id === id) {
        const isActive = !d.is_active;
        return { ...d, is_active: isActive, status: isActive ? 'online' : 'offline' };
      }
      return d;
    }));
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.phone.includes(searchQuery)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Entregadores</h1>
          <p className="text-text-secondary mt-1">Gerencie sua frota de entregadores parceiros ou próprios.</p>
        </div>
        <Button onClick={() => { setDriverToEdit(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Entregador
        </Button>
      </div>

      <Card className="flex flex-col border border-zinc-800 bg-surface">
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Buscar por nome ou telefone..." 
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
                <th className="px-4 py-4">Entregador</th>
                <th className="px-4 py-4">Contato</th>
                <th className="px-4 py-4">Veículo</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map(driver => (
                  <tr key={driver.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                          <span className="font-bold text-white text-sm">
                            {driver.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-white">{driver.name}</div>
                          {driver.current_order && (
                            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-0.5 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" /> Em Rota: {driver.current_order}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-text-secondary">
                        <Phone className="w-3.5 h-3.5 mr-2 text-zinc-500 shrink-0" />
                        {driver.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-secondary">
                        <div className="font-medium text-white">{driver.vehicle}</div>
                        {driver.plate && <div className="text-xs">{driver.plate}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={
                        driver.status === 'delivering' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        driver.status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }>
                        {driver.status === 'delivering' && 'Em Entrega'}
                        {driver.status === 'online' && 'Disponível'}
                        {driver.status === 'offline' && 'Offline'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {driver.status === 'delivering' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setViewMapFor(driver)} 
                          className="h-8 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
                        >
                          <Navigation className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleActive(driver.id)} 
                        className={`h-8 px-2 ${driver.is_active ? 'border-zinc-700 text-zinc-400 hover:text-white' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                        title={driver.is_active ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setDriverToEdit(driver); setIsModalOpen(true); }} className="h-8 px-2">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(driver.id)} className="h-8 px-2 border-rose-500/20 text-rose-500 hover:bg-rose-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <EmptyState
                      icon={Bike}
                      title="Nenhum entregador encontrado"
                      description="Você ainda não cadastrou entregadores ou nenhum corresponde à sua busca."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-surface border-zinc-800 flex flex-col p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">
              {driverToEdit ? 'Editar Entregador' : 'Novo Entregador'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo</label>
                <Input defaultValue={driverToEdit?.name} className="bg-zinc-900 border-zinc-800" placeholder="Ex: João Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Telefone (WhatsApp)</label>
                <Input defaultValue={driverToEdit?.phone} className="bg-zinc-900 border-zinc-800" placeholder="(00) 00000-0000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Veículo</label>
                  <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold">
                    <option value="Moto" selected={driverToEdit?.vehicle?.includes('Moto')}>Moto</option>
                    <option value="Bicicleta" selected={driverToEdit?.vehicle?.includes('Bicicleta')}>Bicicleta</option>
                    <option value="Carro" selected={driverToEdit?.vehicle?.includes('Carro')}>Carro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Placa</label>
                  <Input defaultValue={driverToEdit?.plate} className="bg-zinc-900 border-zinc-800 uppercase" placeholder="ABC-1234" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsModalOpen(false)}>Salvar</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Map Modal */}
      {viewMapFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-zinc-900 p-4 border-b border-zinc-800 rounded-t-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center">
                  <Navigation className="w-5 h-5 mr-2 text-blue-500" />
                  Rastreamento em Tempo Real
                </h3>
                <p className="text-sm text-text-secondary">Acompanhando {viewMapFor.name} - Pedido {viewMapFor.current_order}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setViewMapFor(null)}>Fechar</Button>
            </div>
            
            <div className="flex-1 min-h-[500px] bg-zinc-800 rounded-b-xl overflow-hidden relative border border-zinc-800">
              <MapaEntrega 
                driverLocation={viewMapFor.current_location || { lat: -23.55, lng: -46.63 }} 
                destinationLocation={{ lat: -23.56, lng: -46.64 }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
