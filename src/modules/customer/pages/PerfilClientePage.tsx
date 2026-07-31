import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { 
  User, 
  MapPin, 
  Settings, 
  LogOut, 
  Camera, 
  History, 
  Heart,
  Search,
  Navigation,
  Loader2,
  CheckCircle,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PerfilClientePage = () => {
  const { user, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
  });

  const [addressForm, setAddressForm] = useState({
    zip_code: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    lat: '',
    lng: '',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.fullName || '',
        phone: user.phone || '',
      });
      setAddressForm({
        zip_code: user.zipCode || '',
        address: user.address || '',
        number: user.number || '',
        complement: user.complement || '',
        neighborhood: user.neighborhood || '',
        city: user.city || '',
        state: user.state || '',
        lat: user.lat ? user.lat.toString() : '',
        lng: user.lng ? user.lng.toString() : '',
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setSuccessMessage(null);
    try {
      const { error } = await updateProfile({
        fullName: profile.full_name,
        phone: profile.phone,
      });
      if (error) throw error;
      setSuccessMessage('Informações pessoais salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoadingProfile(false);
    }
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
        setAddressForm(prev => ({
          ...prev,
          zip_code: data.cep || prev.zip_code,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      } else {
        alert('CEP não encontrado na base do ViaCEP. Preencha os campos manualmente.');
      }
    } catch (err) {
      console.warn('Erro ao consultar ViaCEP:', err);
      alert('Não foi possível consultar o CEP automaticamente. Preencha os campos manualmente.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddressForm(prev => ({ ...prev, zip_code: value }));

    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddressByCep(value);
    }
  };

  const handleGetLocationFromAddress = async () => {
    setLoadingGeo(true);
    const addressParts = [
      addressForm.address,
      addressForm.number,
      addressForm.neighborhood,
      addressForm.city,
      addressForm.state,
      addressForm.zip_code
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
        setAddressForm(prev => ({
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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    setSuccessMessage(null);
    try {
      const { error } = await updateProfile({
        zipCode: addressForm.zip_code,
        address: addressForm.address,
        number: addressForm.number,
        complement: addressForm.complement,
        neighborhood: addressForm.neighborhood,
        city: addressForm.city,
        state: addressForm.state,
        lat: addressForm.lat ? parseFloat(addressForm.lat) : undefined,
        lng: addressForm.lng ? parseFloat(addressForm.lng) : undefined,
      });
      if (error) throw error;
      setSuccessMessage('Endereço e localização em tempo real salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar endereço.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Meu Perfil</h1>
          <p className="text-text-secondary mt-1">Gerencie seu nome, telefone, CEP e localização para entregas.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
        {/* Sidebar avatar & links */}
        <div className="md:col-span-1 space-y-4">
          <Card className="p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-900 overflow-hidden text-gold font-bold text-2xl">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-10 h-10 text-zinc-500" />}
              </div>
              <button 
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 bg-gold text-zinc-950 rounded-full flex items-center justify-center hover:bg-gold/90 transition-colors shadow-lg"
                title="Alterar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white">{user?.fullName || 'Usuário'}</h2>
            <p className="text-sm text-text-secondary">{user?.email}</p>
            {user?.phone && (
              <p className="text-xs text-gold mt-1 flex items-center justify-center gap-1">
                <Phone className="w-3 h-3" /> {user.phone}
              </p>
            )}
          </Card>

          <Card className="p-2 flex flex-col">
            <button 
              className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-lg text-white transition-colors text-left" 
              onClick={() => navigate('/cliente/pedidos')}
            >
              <History className="w-5 h-5 text-zinc-400" />
              <span>Meus Pedidos</span>
            </button>
            <button 
              className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-lg text-white transition-colors text-left" 
              onClick={() => navigate('/cliente/favoritos')}
            >
              <Heart className="w-5 h-5 text-zinc-400" />
              <span>Favoritos</span>
            </button>
            <button 
              className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-lg text-rose-500 transition-colors text-left mt-2" 
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Sair da conta</span>
            </button>
          </Card>
        </div>

        {/* Main forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Informações Pessoais */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" />
              Editar Informações Pessoais
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo *</label>
                  <Input 
                    name="full_name"
                    value={profile.full_name || ""}
                    onChange={handleProfileChange}
                    className="bg-zinc-900 border-zinc-800 text-white" 
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Telefone / Whatsapp *</label>
                  <Input 
                    name="phone"
                    value={profile.phone || ""}
                    onChange={handleProfileChange}
                    className="bg-zinc-900 border-zinc-800 text-white" 
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">E-mail</label>
                  <Input 
                    value={user?.email || ''}
                    disabled
                    className="bg-zinc-900 border-zinc-800 opacity-50 cursor-not-allowed text-zinc-400" 
                  />
                  <p className="text-xs text-text-secondary mt-1">O e-mail é a sua chave de acesso e não pode ser alterado.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={loadingProfile} className="bg-gold text-zinc-950 font-bold hover:bg-gold/90">
                  {loadingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Informações Pessoais'
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Endereço de Entrega & ViaCEP */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold" />
                Endereço de Entrega (ViaCEP & Localização)
              </h3>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Campo de CEP com ViaCEP */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">CEP *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      name="zip_code"
                      value={addressForm.zip_code || ""}
                      onChange={handleZipCodeChange}
                      placeholder="00000-000"
                      className="bg-zinc-900 border-zinc-800 text-white"
                      required
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
                    onClick={() => fetchAddressByCep(addressForm.zip_code)}
                    disabled={loadingCep}
                    className="shrink-0 border-zinc-700"
                  >
                    {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                    Buscar CEP
                  </Button>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Digite os 8 números do seu CEP para preencher o endereço automaticamente.
                </p>
              </div>

              {/* Logradouro e Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Endereço / Logradouro *</label>
                  <Input 
                    name="address"
                    value={addressForm.address || ""}
                    onChange={handleAddressChange}
                    placeholder="Ex: Rua das Flores"
                    className="bg-zinc-900 border-zinc-800 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Bairro *</label>
                  <Input 
                    name="neighborhood"
                    value={addressForm.neighborhood || ""}
                    onChange={handleAddressChange}
                    placeholder="Ex: Centro"
                    className="bg-zinc-900 border-zinc-800 text-white"
                    required
                  />
                </div>
              </div>

              {/* Número e Complemento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Número *</label>
                  <Input 
                    name="number"
                    value={addressForm.number || ""}
                    onChange={handleAddressChange}
                    placeholder="Ex: 123"
                    className="bg-zinc-900 border-zinc-800 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Complemento</label>
                  <Input 
                    name="complement"
                    value={addressForm.complement || ""}
                    onChange={handleAddressChange}
                    placeholder="Ex: Apto 45, Bloco B"
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* Cidade e Estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Cidade *</label>
                  <Input 
                    name="city"
                    value={addressForm.city || ""}
                    onChange={handleAddressChange}
                    placeholder="São Paulo"
                    className="bg-zinc-900 border-zinc-800 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Estado (UF) *</label>
                  <Input 
                    name="state"
                    value={addressForm.state || ""}
                    onChange={handleAddressChange}
                    placeholder="SP"
                    maxLength={2}
                    className="bg-zinc-900 border-zinc-800 text-white uppercase"
                    required
                  />
                </div>
              </div>

              {/* Localização em tempo real (GPS) */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-gold" />
                      Localização Atual em Tempo Real (GPS)
                    </span>
                    <p className="text-xs text-text-secondary">
                      Puxe suas coordenadas para garantir cálculo de taxa e frete exatos.
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
                      value={addressForm.lat || ""}
                      onChange={handleAddressChange}
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
                      value={addressForm.lng || ""}
                      onChange={handleAddressChange}
                      placeholder="-46.633308"
                      className="bg-zinc-900 border-zinc-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={savingAddress} className="bg-gold text-zinc-950 font-bold hover:bg-gold/90">
                  {savingAddress ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando Endereço...
                    </>
                  ) : (
                    'Salvar Endereço e Localização'
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Sessão e Conta */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-zinc-800 pb-4">
              <LogOut className="w-5 h-5 text-rose-500" />
              Sessão e Conta
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Encerrar Sessão do Aplicativo</p>
                <p className="text-xs text-text-secondary">Você sairá da sua conta de cliente e retornará para a página de login.</p>
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
        </div>
      </div>
    </div>
  );
};
