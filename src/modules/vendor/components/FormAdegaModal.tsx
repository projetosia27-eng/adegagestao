import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Upload, Store, Image as ImageIcon, Loader2, Navigation, Search, MapPin, Compass } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Adega } from '../pages/AdegasPage';
import { Card } from '@/components/ui/Card';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const MapPinIcon = new L.DivIcon({
  html: `<div style="color: #ef4444; display: flex; justify-content: center; align-items: center; drop-shadow: 0 4px 6px rgba(0,0,0,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg></div>`,
  className: 'bg-transparent',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

function MapPickerEvents({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    dragend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    }
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}


interface FormAdegaModalProps {
  isOpen: boolean;
  onClose: () => void;
  adega: Adega | null;
  onSave: () => void;
}

export const FormAdegaModal = ({ isOpen, onClose, adega, onSave }: FormAdegaModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    zip_code: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    lat: '',
    lng: '',
    operating_hours: '',
    delivery_fee: '',
    minimum_order: '',
    logo_url: '',
    banner_url: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const [startDay, setStartDay] = useState('Segunda');
  const [endDay, setEndDay] = useState('Domingo');
  const [openTime, setOpenTime] = useState('10:00');
  const [closeTime, setCloseTime] = useState('22:00');

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      operating_hours: `${startDay} a ${endDay}: ${openTime} às ${closeTime}`
    }));
  }, [startDay, endDay, openTime, closeTime]);

  useEffect(() => {
    if (adega) {
      if (adega.operating_hours) {
        const match = adega.operating_hours.match(/([a-zA-Záéíóúãõç]+) a ([a-zA-Záéíóúãõç]+): ([\d:]+) às ([\d:]+)/i);
        if (match) {
          setStartDay(match[1]);
          setEndDay(match[2]);
          setOpenTime(match[3]);
          setCloseTime(match[4]);
        }
      }
      
      setFormData({
        name: adega.name || '',
        description: adega.description || '',
        zip_code: (adega as any).zip_code || '',
        address: adega.address || '',
        neighborhood: (adega as any).neighborhood || (adega as any).bairro || '',
        city: (adega as any).city || '',
        state: (adega as any).state || '',
        lat: (adega as any).lat?.toString() || '',
        lng: (adega as any).lng?.toString() || '',
        operating_hours: adega.operating_hours || '',
        delivery_fee: adega.delivery_fee?.toString() || '0',
        minimum_order: adega.minimum_order?.toString() || '0',
        logo_url: adega.logo_url || '',
        banner_url: adega.banner_url || '',
      });
      setLogoPreview(adega.logo_url || '');
      setBannerPreview(adega.banner_url || '');
    } else {
      setFormData({
        name: '',
        description: '',
        zip_code: '',
        address: '',
        neighborhood: '',
        city: '',
        state: '',
        lat: '',
        lng: '',
        operating_hours: '',
        delivery_fee: '0',
        minimum_order: '0',
        logo_url: '',
        banner_url: '',
      });
      setLogoPreview('');
      setBannerPreview('');
    }
    setLogoFile(null);
    setBannerFile(null);
    setError(null);
  }, [adega, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchAddressByCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      alert('Digite um CEP válido com 8 números.');
      return;
    }

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      } else {
        alert('CEP não encontrado. Digite o endereço manualmente.');
      }
    } catch (err) {
      console.warn('Erro ao buscar ViaCEP:', err);
      alert('Não foi possível buscar o CEP automaticamente. Digite o endereço manualmente.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, zip_code: value }));

    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressByCep(value);
    }
  };

  const handleGetLocationFromAddress = async () => {
    setLoadingGeo(true);
    const addressParts = [
      formData.address,
      formData.neighborhood,
      formData.city,
      formData.state,
      formData.zip_code
    ].filter(Boolean);
    
    const addressStr = addressParts.join(', ');
    
    if (addressParts.length < 3) {
      alert('Por favor, preencha mais detalhes do endereço (Logradouro, Bairro, Cidade) para buscar as coordenadas.');
      setLoadingGeo(false);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}`, {
        headers: {
          'User-Agent': 'AdegaHub/1.0'
        }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(lat).toFixed(6),
          lng: parseFloat(lon).toFixed(6)
        }));
      } else {
        alert('Não foi possível encontrar as coordenadas exatas. Tente adicionar o número ou preencher os campos manualmente.');
      }
    } catch (err) {
      console.warn('Erro ao buscar coordenadas:', err);
      alert('Erro de conexão ao buscar coordenadas.');
    } finally {
      setLoadingGeo(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(previewUrl);
      } else {
        setBannerFile(file);
        setBannerPreview(previewUrl);
      }
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      let finalLogoUrl = formData.logo_url;
      let finalBannerUrl = formData.banner_url;

      if (logoFile) {
        try {
          finalLogoUrl = await uploadImage(logoFile, `stores/${user.id}/logos`);
        } catch (imgErr) {
          console.warn('Não foi possível fazer upload do logo:', imgErr);
        }
      }
      
      if (bannerFile) {
        try {
          finalBannerUrl = await uploadImage(bannerFile, `stores/${user.id}/banners`);
        } catch (imgErr) {
          console.warn('Não foi possível fazer upload do banner:', imgErr);
        }
      }

      const storeData = {
        vendor_id: user.id,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        neighborhood: formData.neighborhood,
        zip_code: formData.zip_code,
        city: formData.city,
        state: formData.state,
        lat: formData.lat ? parseFloat(formData.lat) : -23.550520,
        lng: formData.lng ? parseFloat(formData.lng) : -46.633308,
        operating_hours: formData.operating_hours,
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        minimum_order: parseFloat(formData.minimum_order) || 0,
        logo_url: finalLogoUrl,
        banner_url: finalBannerUrl,
      };

      if (adega) {
        const { error: updateError } = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', adega.id)
          .eq('vendor_id', user.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('stores')
          .insert({
            ...storeData,
            is_open: false,
            rating: 5.0
          });
          
        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      console.error(err);
      if (err.status === 404 || err.code === '42P01' || err.message?.includes("Could not find the table 'public.stores'")) {
        setError('A tabela "stores" não existe no seu projeto Supabase (erro 404). Por favor, execute o script SQL abaixo no SQL Editor do seu Supabase para criar as tabelas.');
      } else {
        setError(err.message || 'Erro ao salvar adega. Verifique sua conexão ou configurações do Supabase.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sqlSnippet = `CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    neighborhood TEXT,
    zip_code TEXT,
    city TEXT,
    state TEXT,
    lat NUMERIC,
    lng NUMERIC,
    logo_url TEXT,
    banner_url TEXT,
    rating NUMERIC DEFAULT 5.0,
    is_open BOOLEAN DEFAULT false,
    operating_hours TEXT,
    delivery_fee NUMERIC DEFAULT 0,
    minimum_order NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total a stores" ON public.stores FOR ALL USING (true);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-3xl my-8 bg-surface border-zinc-800 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-surface z-10 rounded-t-xl">
          <h2 className="text-xl font-bold text-white">
            {adega ? 'Editar Adega' : 'Nova Adega'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-500 space-y-3">
              <p className="font-semibold">{error}</p>
              {error.includes('stores') && (
                <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs text-zinc-300">
                  <p className="mb-2 text-zinc-400">Copie e cole este código SQL no <strong>SQL Editor</strong> do Supabase (https://zvcuiouaonjupzblmaae.supabase.co):</p>
                  <pre className="p-2 bg-zinc-900 rounded overflow-x-auto text-[11px] text-gold font-mono">{sqlSnippet}</pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sqlSnippet);
                      alert('Código SQL copiado para a área de transferência!');
                    }}
                    className="mt-2 text-xs text-gold underline hover:text-white"
                  >
                    Copiar Código SQL
                  </button>
                </div>
              )}
            </div>
          )}

          <form id="adega-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Imagens */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-text-secondary">Identidade Visual</h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Banner (Recomendado: 1200x400)</label>
                  <div className="relative h-40 w-full rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 overflow-hidden group">
                    {bannerPreview && bannerPreview.trim() !== '' ? (
                      <>
                        <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                            <Upload className="w-4 h-4 mr-2" />
                            Trocar Banner
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-colors">
                        <ImageIcon className="w-8 h-8 text-zinc-500 mb-2" />
                        <span className="text-sm text-zinc-400 font-medium">Fazer upload do banner</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="w-40 shrink-0">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Logo (1:1)</label>
                  <div className="relative h-40 w-40 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 overflow-hidden group mx-auto">
                    {logoPreview && logoPreview.trim() !== '' ? (
                      <>
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full text-sm font-medium flex items-center">
                            <Upload className="w-4 h-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-colors">
                        <Store className="w-8 h-8 text-zinc-500 mb-2" />
                        <span className="text-xs text-zinc-400 font-medium text-center px-2">Upload logo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-zinc-800" />

            {/* Info Básica e Endereço */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-text-secondary">Informações Básicas e Localização</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Nome da Adega *</label>
                  <Input 
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Adega Premium"
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                  <textarea 
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Breve descrição da sua loja..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                {/* CEP acima do endereço com ViaCEP */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">CEP (Busca Automática via ViaCEP)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        name="zip_code"
                        value={formData.zip_code || ""}
                        onChange={handleZipCodeChange}
                        placeholder="00000-000"
                        className="bg-zinc-900 border-zinc-800"
                      />
                      {loadingCep && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-gold animate-spin" />
                        </div>
                      )}
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fetchAddressByCep(formData.zip_code)}
                      disabled={loadingCep}
                      className="shrink-0"
                    >
                      {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                      Buscar CEP
                    </Button>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Digite os 8 números do CEP para preencher automaticamente os campos de endereço abaixo.
                  </p>
                </div>

                {/* Logradouro e Bairro */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Endereço / Logradouro *</label>
                    <Input 
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Rua das Flores, 123"
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Bairro *</label>
                    <Input 
                      name="neighborhood"
                      value={formData.neighborhood || ""}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Centro"
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                </div>

                {/* Cidade e Estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Cidade</label>
                    <Input 
                      name="city"
                      value={formData.city || ""}
                      onChange={handleChange}
                      placeholder="São Paulo"
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Estado (UF)</label>
                    <Input 
                      name="state"
                      value={formData.state || ""}
                      onChange={handleChange}
                      placeholder="SP"
                      className="bg-zinc-900 border-zinc-800 uppercase"
                    />
                  </div>
                </div>

                {/* Geolocalização / Latitude & Longitude com Botão de Captura */}
                <div className="pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-text-secondary flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gold" />
                      Coordenadas GPS (Latitude & Longitude)
                    </label>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={handleGetLocationFromAddress}
                      disabled={loadingGeo}
                      className="text-gold border-gold/30 hover:bg-gold/10 text-xs"
                    >
                      {loadingGeo ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Buscar Coordenadas pelo Endereço
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Latitude</label>
                      <Input 
                        name="lat"
                        type="number"
                        step="any"
                        value={formData.lat || ""}
                        onChange={handleChange}
                        placeholder="-23.550520"
                        className="bg-zinc-900 border-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Longitude</label>
                      <Input 
                        name="lng"
                        type="number"
                        step="any"
                        value={formData.lng || ""}
                        onChange={handleChange}
                        placeholder="-46.633308"
                        className="bg-zinc-900 border-zinc-800"
                      />
                    </div>
                  </div>
                  
                  <div className="h-48 w-full rounded-lg overflow-hidden relative border border-zinc-800 mt-2">
                    <MapContainer 
                      center={formData.lat && formData.lng ? [parseFloat(formData.lat), parseFloat(formData.lng)] : [-23.550520, -46.633308]} 
                      zoom={15} 
                      className="w-full h-full z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      />
                      <MapUpdater center={formData.lat && formData.lng ? [parseFloat(formData.lat), parseFloat(formData.lng)] : [-23.550520, -46.633308]} />
                      <MapPickerEvents onMove={(lat, lng) => {
                        setFormData(prev => ({
                          ...prev,
                          lat: lat.toFixed(6),
                          lng: lng.toFixed(6)
                        }));
                      }} />
                      {(formData.lat && formData.lng) && (
                        <Marker position={[parseFloat(formData.lat), parseFloat(formData.lng)]} icon={MapPinIcon} />
                      )}
                    </MapContainer>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-zinc-900/90 text-zinc-300 px-3 py-1.5 rounded-full text-xs flex items-center shadow-md border border-zinc-800/50 pointer-events-none">
                      <Compass className="w-3.5 h-3.5 mr-1.5 text-gold" />
                      Arraste o mapa para ajustar
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <hr className="border-zinc-800" />

            {/* Operação */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-text-secondary">Operação & Entregas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Horário de Funcionamento *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs text-text-secondary">Dias da semana</label>
                      <div className="flex items-center gap-2">
                        <select 
                          value={startDay}
                          onChange={(e) => setStartDay(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-gold"
                        >
                          {diasDaSemana.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <span className="text-zinc-500 text-sm">a</span>
                        <select 
                          value={endDay}
                          onChange={(e) => setEndDay(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-gold"
                        >
                          {diasDaSemana.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs text-text-secondary">Horários</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={openTime}
                          onChange={(e) => setOpenTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-gold"
                        />
                        <span className="text-zinc-500 text-sm">às</span>
                        <input
                          type="time"
                          value={closeTime}
                          onChange={(e) => setCloseTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Taxa de Entrega (R$)</label>
                    <Input 
                      name="delivery_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.delivery_fee || ""}
                      onChange={handleChange}
                      placeholder="0.00 para Grátis"
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Pedido Mínimo (R$)</label>
                    <Input 
                      name="minimum_order"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minimum_order || ""}
                      onChange={handleChange}
                      placeholder="Ex: 50.00"
                      className="bg-zinc-900 border-zinc-800"
                    />
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 rounded-b-xl">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" form="adega-form" disabled={loading} className="w-full sm:w-auto min-w-[120px] bg-gold text-zinc-950 hover:bg-gold/90 font-bold">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Adega'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

