import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  Store, 
  Phone, 
  MessageCircle, 
  CreditCard, 
  Truck, 
  Moon, 
  Sun,
  Camera,
  Save,
  Loader2,
  MapPin,
  Search,
  Navigation,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ConfiguracoesVendedorPage = () => {
  const { user, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [config, setConfig] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    pix_key: '',
    delivery_policy: '',
    theme: 'dark',
    avatar_url: '',
    // Endereço
    zip_code: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    lat: '',
    lng: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        let vendorData: any = null;
        try {
          const { data } = await supabase
            .from('vendor_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          vendorData = data;
        } catch (err) {
          console.warn('vendor_profiles not found or not created yet');
        }

        const theme = vendorData?.theme || 'dark';
        if (theme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }

        setConfig({
          name: vendorData?.name || user.fullName || '',
          phone: vendorData?.phone || user.phone || '',
          whatsapp: vendorData?.whatsapp || '',
          pix_key: vendorData?.pix_key || '',
          delivery_policy: vendorData?.delivery_policy || '',
          theme: theme,
          avatar_url: vendorData?.avatar_url || '',
          zip_code: vendorData?.zip_code || user.zipCode || '',
          address: vendorData?.address || user.address || '',
          number: vendorData?.number || user.number || '',
          complement: vendorData?.complement || user.complement || '',
          neighborhood: vendorData?.neighborhood || user.neighborhood || '',
          city: vendorData?.city || user.city || '',
          state: vendorData?.state || user.state || '',
          lat: vendorData?.lat ? vendorData.lat.toString() : (user.lat ? user.lat.toString() : ''),
          lng: vendorData?.lng ? vendorData.lng.toString() : (user.lng ? user.lng.toString() : '')
        });
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fetchAddressByCep = async (cepVal: string) => {
    const cleanCep = cepVal.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      alert('Digite um CEP válido com 8 dígitos (ex: 01001-000).');
      return;
    }

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setConfig(prev => ({
          ...prev,
          zip_code: data.cep || prev.zip_code,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      } else {
        alert('CEP não encontrado no ViaCEP. Digite os dados do endereço manualmente.');
      }
    } catch (err) {
      console.warn('Erro ao consultar ViaCEP:', err);
      alert('Não foi possível buscar o CEP automaticamente. Digite o endereço manualmente.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfig(prev => ({ ...prev, zip_code: value }));

    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressByCep(value);
    }
  };

  const handleGetLocationFromAddress = async () => {
    setLoadingGeo(true);
    const addressParts = [
      config.address,
      config.number,
      config.neighborhood,
      config.city,
      config.state,
      config.zip_code
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
        setConfig(prev => ({
          ...prev,
          lat: parseFloat(lat).toFixed(6),
          lng: parseFloat(lon).toFixed(6)
        }));
        setSuccessMessage(`Coordenadas obtidas com sucesso.`);
        setTimeout(() => setSuccessMessage(null), 4000);
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

  const handleThemeChange = (theme: 'dark' | 'light') => {
    setConfig(prev => ({ ...prev, theme }));
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccessMessage(null);

    try {
      // 1. Atualiza no perfil do usuário (Auth)
      await updateProfile({
        fullName: config.name,
        phone: config.phone,
        zipCode: config.zip_code,
        address: config.address,
        number: config.number,
        complement: config.complement,
        neighborhood: config.neighborhood,
        city: config.city,
        state: config.state,
        lat: config.lat ? parseFloat(config.lat) : undefined,
        lng: config.lng ? parseFloat(config.lng) : undefined,
      });

      // 2. Salva em vendor_profiles no Supabase (se a tabela existir)
      try {
        await supabase
          .from('vendor_profiles')
          .upsert({
            id: user.id,
            name: config.name,
            phone: config.phone,
            whatsapp: config.whatsapp,
            pix_key: config.pix_key,
            delivery_policy: config.delivery_policy,
            theme: config.theme,
            avatar_url: config.avatar_url,
            zip_code: config.zip_code,
            address: config.address,
            number: config.number,
            complement: config.complement,
            neighborhood: config.neighborhood,
            city: config.city,
            state: config.state,
            lat: config.lat ? parseFloat(config.lat) : null,
            lng: config.lng ? parseFloat(config.lng) : null,
            updated_at: new Date().toISOString()
          });
      } catch (dbErr) {
        console.warn('Aviso: vendor_profiles não sincronizado:', dbErr);
      }

      setSuccessMessage('Configurações e endereço do vendedor salvos com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (fetching) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Configurações & Perfil</h1>
          <p className="text-text-secondary mt-1">Gerencie seu perfil de vendedor, endereço, pagamentos e preferências.</p>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleLogout}
          className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-2 shrink-0 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair do App</span>
        </Button>
      </div>

      {successMessage && (
        <div className="fixed top-24 right-4 md:right-8 z-50 p-4 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-4 shadow-xl backdrop-blur-md max-w-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 pb-24">
        
        {/* Perfil Básico */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Store className="w-5 h-5 text-gold" />
            Perfil do Vendedor
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full bg-zinc-900 border-4 border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                {config.avatar_url && config.avatar_url.trim() !== '' ? (
                  <img src={config.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-12 h-12 text-zinc-600" />
                )}
                <button type="button" className="absolute bottom-0 inset-x-0 h-1/3 bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-3">JPG ou PNG (Máx 2MB)</p>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo / Empresa *</label>
                <Input 
                  name="name"
                  value={config.name || ""}
                  onChange={handleChange}
                  className="bg-zinc-900 border-zinc-800 text-white" 
                  placeholder="Nome do responsável ou loja"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Telefone Principal *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      name="phone"
                      value={config.phone || ""}
                      onChange={handleChange}
                      className="pl-9 bg-zinc-900 border-zinc-800 text-white" 
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">WhatsApp para Contato</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <Input 
                      name="whatsapp"
                      value={config.whatsapp || ""}
                      onChange={handleChange}
                      className="pl-9 bg-zinc-900 border-zinc-800 text-white" 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cadastro de Endereço & ViaCEP */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
            <MapPin className="w-5 h-5 text-gold" />
            Endereço do Vendedor / Estabelecimento
          </h2>

          <div className="space-y-4">
            {/* CEP com busca automática ViaCEP */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">CEP *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    name="zip_code"
                    value={config.zip_code || ""}
                    onChange={handleZipCodeChange}
                    placeholder="00000-000"
                    className="bg-zinc-900 border-zinc-800 text-white"
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
                  onClick={() => fetchAddressByCep(config.zip_code)}
                  disabled={loadingCep}
                  className="shrink-0 border-zinc-700"
                >
                  {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                  Buscar CEP
                </Button>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Digite os 8 números do CEP para preencher o endereço automaticamente via ViaCEP.
              </p>
            </div>

            {/* Logradouro e Bairro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Endereço / Logradouro</label>
                <Input 
                  name="address"
                  value={config.address || ""}
                  onChange={handleChange}
                  placeholder="Ex: Av. Paulista"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Bairro</label>
                <Input 
                  name="neighborhood"
                  value={config.neighborhood || ""}
                  onChange={handleChange}
                  placeholder="Ex: Bela Vista"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>

            {/* Número e Complemento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Número</label>
                <Input 
                  name="number"
                  value={config.number || ""}
                  onChange={handleChange}
                  placeholder="Ex: 1000"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Complemento</label>
                <Input 
                  name="complement"
                  value={config.complement || ""}
                  onChange={handleChange}
                  placeholder="Ex: Sala 12"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Cidade</label>
                <Input 
                  name="city"
                  value={config.city || ""}
                  onChange={handleChange}
                  placeholder="São Paulo"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Estado (UF)</label>
                <Input 
                  name="state"
                  value={config.state || ""}
                  onChange={handleChange}
                  placeholder="SP"
                  maxLength={2}
                  className="bg-zinc-900 border-zinc-800 text-white uppercase"
                />
              </div>
            </div>

            {/* GPS em Tempo Real */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-gold" />
                    Localização em Tempo Real (GPS)
                  </span>
                  <p className="text-xs text-text-secondary">
                    Defina suas coordenadas exatas para clientes encontrarem suas adegas no mapa.
                  </p>
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleGetLocationFromAddress}
                  disabled={loadingGeo}
                  className="border-gold/40 text-gold hover:bg-gold/10 text-xs shrink-0"
                >
                  {loadingGeo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 mr-1.5" />
                      Buscar Coordenadas pelo Endereço
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Latitude GPS</label>
                  <Input 
                    name="lat"
                    type="number"
                    step="any"
                    value={config.lat || ""}
                    onChange={handleChange}
                    placeholder="-23.550520"
                    className="bg-zinc-900 border-zinc-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Longitude GPS</label>
                  <Input 
                    name="lng"
                    type="number"
                    step="any"
                    value={config.lng || ""}
                    onChange={handleChange}
                    placeholder="-46.633308"
                    className="bg-zinc-900 border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Financeiro e Pagamentos */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
            <CreditCard className="w-5 h-5 text-gold" />
            Recebimentos
          </h2>
          
          <div className="max-w-xl">
            <label className="block text-sm font-medium text-text-secondary mb-1">Chave PIX (Para repasses e pagamentos direto)</label>
            <Input 
              name="pix_key"
              value={config.pix_key || ""}
              onChange={handleChange}
              className="bg-zinc-900 border-zinc-800 text-white font-mono" 
              placeholder="CPF/CNPJ, E-mail, Celular ou Chave Aleatória"
            />
            <p className="text-xs text-text-secondary mt-2">Certifique-se de que a chave PIX informada está correta para evitar problemas nos repasses.</p>
          </div>
        </Card>

        {/* Política de Entrega */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Truck className="w-5 h-5 text-gold" />
            Política de Entrega e Retirada
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Informações sobre frete e regras da loja</label>
            <textarea 
              name="delivery_policy"
              value={config.delivery_policy || ""}
              onChange={handleChange}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-gold resize-none"
              placeholder="Ex: Entregas realizadas em até 40 min para um raio de 5km. Retirada no local disponível após 15 min da confirmação..."
            />
          </div>
        </Card>

        {/* Aparência */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Moon className="w-5 h-5 text-gold" />
            Aparência do Painel
          </h2>
          
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                config.theme === 'dark' ? 'border-gold bg-gold/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <span className={`font-medium ${config.theme === 'dark' ? 'text-white' : 'text-zinc-400'}`}>Modo Escuro</span>
            </button>
            
            <button 
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                config.theme === 'light' ? 'border-gold bg-gold/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
                <Sun className="w-6 h-6 text-zinc-900" />
              </div>
              <span className={`font-medium ${config.theme === 'light' ? 'text-white' : 'text-zinc-400'}`}>Modo Claro</span>
            </button>
          </div>
        </Card>

        {/* Sessão / Conta */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-zinc-800 pb-4">
            <LogOut className="w-5 h-5 text-rose-500" />
            Sessão e Conta
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Encerrar Sessão</p>
              <p className="text-xs text-text-secondary">Você sairá da sua conta de vendedor e retornará para a tela de login.</p>
            </div>
            <Button 
              type="button" 
              onClick={handleLogout}
              className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-sm font-semibold gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair do App
            </Button>
          </div>
        </Card>

        <div className="flex justify-end sticky bottom-6 z-10">
          <Button type="submit" disabled={loading} className="px-8 shadow-xl shadow-gold/10 bg-gold text-zinc-950 font-bold hover:bg-gold/90">
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
};

