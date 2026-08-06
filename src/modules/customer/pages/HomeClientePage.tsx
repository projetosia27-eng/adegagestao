import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Search, MapPin, Star, Clock, Map as MapIcon, ChevronRight, Store, Loader2, Package, ShoppingBag, Plus, Check, Navigation, Compass, Filter, Sparkles, Crosshair, Home, LocateFixed, Locate } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leafet default icon issue directly in component if needed, but we'll use DivIcon
const MapPinIcon = new L.DivIcon({
  html: `<div style="color: #ef4444; display: flex; justify-content: center; align-items: center; drop-shadow: 0 4px 6px rgba(0,0,0,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg></div>`,
  className: 'bg-transparent',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '@/modules/auth/hooks/useAuth';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
}

interface StoreData {
  id: string;
  name: string;
  logo_url: string;
  lat: number;
  lng: number;
  delivery_fee: number;
  minimum_order: number;
  is_open: boolean;
  rating: number;
  distance?: number;
}

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

// Update map center dynamically
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapPickerEvents({ onMove }: { onMove: (loc: Location) => void }) {
  useMapEvents({
    dragend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      onMove({ lat: center.lat, lng: center.lng });
    }
  });
  return null;
}

export const HomeClientePage = () => {
  const { user, updateProfile } = useAuth();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationMode, setLocationMode] = useState<'gps' | 'profile' | 'manual'>('gps');
  const [stores, setStores] = useState<StoreData[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  
  // Modal for location selection (iFood style)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);
  const [mapPickerLocation, setMapPickerLocation] = useState<Location | null>(null);
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  const { items, addItem } = useCart();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Automatically capture live GPS on initial page load (like iFood)
  useEffect(() => {
    requestGeolocation();
  }, []);

  const requestGeolocation = () => {
    setLocationError(null);
    setIsLocating(true);
    setLocationMode('gps');

    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada pelo seu navegador.');
      setIsLocating(false);
      if (user?.lat && user?.lng) {
        useProfileAddress();
      } else {
        fetchStores(null);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(loc);

        // Reverse geocode to get street / neighborhood name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`,
            {
              headers: {
                'Accept-Language': 'pt-BR,pt;q=0.9',
                'User-Agent': 'AdegaHub/1.0'
              }
            }
          );

          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const road = data.address.road || data.address.pedestrian || data.address.suburb || '';
              const houseNum = data.address.house_number || '';
              const neighborhood = data.address.neighbourhood || data.address.suburb || data.address.city_district || '';
              const city = data.address.city || data.address.town || data.address.municipality || '';

              let formatted = '';
              if (road) formatted += road;
              if (houseNum) formatted += `, ${houseNum}`;
              if (neighborhood) formatted += `${formatted ? ' - ' : ''}${neighborhood}`;
              if (city && !neighborhood) formatted += `${formatted ? ' - ' : ''}${city}`;

              if (!formatted && data.display_name) {
                formatted = data.display_name.split(',').slice(0, 2).join(', ');
              }

              if (formatted) {
                setDetectedAddress(`${formatted} (GPS Ao Vivo)`);
                setAddedToast(`Localização GPS obtida: ${formatted}`);
                setTimeout(() => setAddedToast(null), 3500);
              } else {
                setDetectedAddress('Sua Localização Atual (GPS)');
              }
            }
          }
        } catch (err) {
          console.warn('Geolocalização reversa falhou:', err);
          setDetectedAddress('Localização Atual (GPS)');
          setAddedToast('Sua localização atual foi obtida via GPS!');
          setTimeout(() => setAddedToast(null), 3000);
        } finally {
          setIsLocating(false);
          setIsLocationModalOpen(false);
          fetchStores(loc);
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn('Erro ao obter localização GPS:', error.message);

        let msg = 'Não foi possível obter sua localização atual via GPS.';
        if (error.code === 1) {
          msg = 'Permissão de localização negada pelo navegador. Ative o GPS no navegador.';
        } else if (error.code === 2) {
          msg = 'Sinal de GPS indisponível no seu dispositivo.';
        } else if (error.code === 3) {
          msg = 'Tempo limite esgotado ao tentar obter sinal GPS.';
        }

        setLocationError(msg);
        if (user?.lat && user?.lng) {
          const loc = { lat: Number(user.lat), lng: Number(user.lng) };
          setUserLocation(loc);
          setLocationMode('profile');
          setDetectedAddress(user.address || 'Endereço Cadastrado');
          fetchStores(loc);
        } else {
          fetchStores(null);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const useProfileAddress = () => {
    if (user?.lat && user?.lng) {
      const loc = { lat: Number(user.lat), lng: Number(user.lng) };
      setUserLocation(loc);
      setLocationMode('profile');
      const addr = `${user.address || 'Endereço Cadastrado'}${user.number ? `, ${user.number}` : ''}${user.neighborhood ? ` - ${user.neighborhood}` : ''}`;
      setDetectedAddress(addr);
      setIsLocationModalOpen(false);
      setAddedToast('Endereço do perfil selecionado');
      setTimeout(() => setAddedToast(null), 3000);
      fetchStores(loc);
    } else {
      setAddedToast('Você não possui coordenadas salvas no perfil. Use o GPS.');
      setTimeout(() => setAddedToast(null), 3000);
    }
  };

  const searchManualAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAddressInput.trim()) return;

    setIsSearchingManual(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddressInput)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'User-Agent': 'AdegaHub/1.0'
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const loc = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
          setUserLocation(loc);
          setLocationMode('manual');
          setDetectedAddress(item.display_name.split(',').slice(0, 2).join(', '));
          setIsLocationModalOpen(false);
          setManualAddressInput('');
          setAddedToast(`Endereço localizado: ${item.display_name.split(',')[0]}`);
          setTimeout(() => setAddedToast(null), 3500);
          fetchStores(loc);
        } else {
          setAddedToast('Endereço não encontrado. Tente digitar o bairro e cidade.');
          setTimeout(() => setAddedToast(null), 3500);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar endereço manual:', err);
      setAddedToast('Erro ao buscar endereço. Verifique sua conexão.');
      setTimeout(() => setAddedToast(null), 3000);
    } finally {
      setIsSearchingManual(false);
    }
  };

  const generateNearbyDemoStores = () => {
    const loc = userLocation || { lat: -23.561684, lng: -46.655981 };
    const locName = detectedAddress ? detectedAddress.split(',')[0].trim() : 'Sua Região';

    const localStores: StoreData[] = [
      {
        id: `demo-local-1-${Date.now()}`,
        name: `Adega Express - ${locName}`,
        logo_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&h=200&fit=crop',
        lat: loc.lat + 0.005,
        lng: loc.lng + 0.005,
        delivery_fee: 0,
        minimum_order: 25,
        is_open: true,
        rating: 4.9,
        distance: calculateDistance(loc.lat, loc.lng, loc.lat + 0.005, loc.lng + 0.005)
      },
      {
        id: `demo-local-2-${Date.now()}`,
        name: `Empório & Conveniência 24h`,
        logo_url: 'https://images.unsplash.com/photo-1528823872057-9c018a7a70b3?w=200&h=200&fit=crop',
        lat: loc.lat - 0.007,
        lng: loc.lng - 0.007,
        delivery_fee: 4.90,
        minimum_order: 20,
        is_open: true,
        rating: 4.8,
        distance: calculateDistance(loc.lat, loc.lng, loc.lat - 0.007, loc.lng - 0.007)
      }
    ];

    setStores(prev => {
      const filtered = prev.filter(s => !s.id.startsWith('demo-local-'));
      return [...localStores, ...filtered].sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
        return 0;
      });
    });

    setPromotions(prev => [
      { id: `p-1-${Date.now()}`, storeId: localStores[0].id, storeName: localStores[0].name, name: 'Vinho Tinto Reserva Especial', price: 49.9, originalPrice: 79.9, image: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?w=200&h=300&fit=crop' },
      { id: `p-2-${Date.now()}`, storeId: localStores[1].id, storeName: localStores[1].name, name: 'Cerveja Artesanal Pack 6x', price: 34.9, originalPrice: 45.0, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200&h=300&fit=crop' },
      ...prev
    ]);

    setAddedToast('Adegas locais demonstrativas geradas próximo à sua localização!');
    setTimeout(() => setAddedToast(null), 3500);
  };

  const fetchStores = async (location: Location | null) => {
    setLoading(true);
    try {
      let data: any[] = [];
      try {
        const res = await supabase.from('stores').select('*');
        data = res.data || [];
      } catch (err) {
        console.warn('Instabilidade de conexão ao buscar adegas:', err);
      }

      let parsedStores: StoreData[] = (data || []).map(store => ({
        id: store.id,
        name: store.name || 'Adega Desconhecida',
        logo_url: store.logo_url || '',
        lat: Number(store.lat) || 0,
        lng: Number(store.lng) || 0,
        delivery_fee: Number(store.delivery_fee) || 0,
        minimum_order: Number(store.minimum_order) || 0,
        is_open: store.is_open ?? true,
        rating: Number(store.rating) || 5.0,
      }));

      // Calculate distance for each registered store based on GPS location
      if (location) {
        parsedStores = parsedStores.map(store => {
          let dist: number | undefined = undefined;
          if (store.lat && store.lng && (store.lat !== 0 || store.lng !== 0)) {
            dist = calculateDistance(location.lat, location.lng, store.lat, store.lng);
          }
          return {
            ...store,
            distance: dist
          };
        });

        parsedStores.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          if (a.distance !== undefined) return -1;
          if (b.distance !== undefined) return 1;
          return 0;
        });
      }

      // Fetch promotions for these stores from Supabase
      const storeIds = parsedStores.map(s => s.id);
      if (storeIds.length > 0) {
        try {
          const promoRes = await supabase
            .from('products')
            .select('*')
            .in('store_id', storeIds)
            .not('promotional_price', 'is', null);

          const promoData = promoRes.data || [];
          const mappedPromos = promoData.map(p => {
            const store = parsedStores.find(s => s.id === p.store_id);
            return {
              id: p.id,
              storeId: p.store_id,
              storeName: store?.name || 'Adega',
              name: p.name,
              price: Number(p.promotional_price || p.price),
              originalPrice: p.price ? Number(p.price) : undefined,
              image: p.image_url || 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?w=200&h=300&fit=crop'
            };
          });
          setPromotions(mappedPromos);
        } catch (err) {
          console.warn('Erro ao buscar promoções', err);
          setPromotions([]);
        }
      } else {
        setPromotions([]);
      }

      setStores(parsedStores);
    } catch (error) {
      console.warn('Não foi possível carregar as adegas:', error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPromoToCart = (item: any) => {
    addItem({
      productId: item.id,
      storeId: item.storeId,
      storeName: item.storeName,
      name: item.name,
      price: item.price,
      imageUrl: item.image,
      quantity: 1,
      stock: 99 // Assumindo estoque para itens em promoção
    });
    setAddedToast(`"${item.name}" adicionado ao carrinho!`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (userLocation) {
      if (store.distance === undefined || store.distance > 2) {
        return false;
      }
    }

    return true;
  });

  const confirmMapPickerLocation = async () => {
    if (!mapPickerLocation) return;
    
    setIsSearchingManual(true); // Reusing this loading state
    try {
      const { lat, lng } = mapPickerLocation;
      setUserLocation({ lat, lng });
      setLocationMode('manual');
      
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      
      if (data && data.address) {
        const formatted = [
          data.address.road || data.address.suburb,
          data.address.city || data.address.town || data.address.village
        ].filter(Boolean).join(', ');
        setDetectedAddress(formatted || 'Local Selecionado no Mapa');
      } else {
        setDetectedAddress('Local Selecionado no Mapa');
      }
      
      setAddedToast('Localização definida com sucesso!');
      setTimeout(() => setAddedToast(null), 3000);
      fetchStores({ lat, lng });
      
      setIsPickingOnMap(false);
      setIsLocationModalOpen(false);
    } catch (err) {
      console.warn('Reverse geocoding failed', err);
      // Still use the location even if geocoding fails
      setUserLocation(mapPickerLocation);
      setLocationMode('manual');
      setDetectedAddress('Local Selecionado no Mapa');
      fetchStores(mapPickerLocation);
      
      setIsPickingOnMap(false);
      setIsLocationModalOpen(false);
    } finally {
      setIsSearchingManual(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header & Search */}
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-text-secondary">Entregando em</span>
                {locationMode === 'gps' && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    GPS Ao Vivo
                  </Badge>
                )}
                {locationMode === 'profile' && (
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[10px] px-1.5 py-0 font-medium">
                    Endereço Perfil
                  </Badge>
                )}
              </div>
              <button 
                onClick={() => setIsLocationModalOpen(true)}
                disabled={isLocating}
                className="flex items-center text-sm font-bold text-white group cursor-pointer hover:text-gold transition-colors text-left"
                title="Clique para alterar seu local de entrega ou atualizar seu GPS"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 text-gold mr-1.5 animate-spin shrink-0" />
                ) : (
                  <MapPin className="w-4 h-4 text-gold mr-1 group-hover:scale-110 transition-transform shrink-0" />
                )}
                <span className="truncate max-w-[180px] sm:max-w-[340px]">
                  {isLocating ? (
                    <span className="text-gold font-medium">Capturando sinal GPS...</span>
                  ) : detectedAddress ? (
                    detectedAddress
                  ) : user?.address ? (
                    `${user.address}${user.number ? `, ${user.number}` : ''}${user.neighborhood ? ` - ${user.neighborhood}` : ''}`
                  ) : userLocation ? (
                    'Localização capturada'
                  ) : (
                    'Definir local de entrega...'
                  )}
                </span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-60 group-hover:opacity-100 shrink-0" />
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={requestGeolocation}
              disabled={isLocating}
              className="border-gold/40 text-gold hover:bg-gold/10 hover:border-gold text-xs font-semibold shrink-0 gap-1.5"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 text-gold" />
              )}
              <span className="hidden sm:inline">GPS Atual</span>
              <span className="sm:hidden">GPS</span>
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input 
              placeholder="Buscar produtos, adegas..." 
              className="pl-10 bg-zinc-900 border-zinc-800"
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-8">
        
        {locationError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{locationError}</span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={requestGeolocation}
              disabled={isLocating}
              className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs shrink-0"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Obtendo GPS...
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  Tentar novamente
                </>
              )}
            </Button>
          </div>
        )}

        {/* Promo Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold-dark to-gold p-6 sm:p-8 flex items-center justify-between">
          <div className="relative z-10 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              Ofertas Especiais da Semana
            </h2>
            <p className="text-white/80 text-sm mb-4">
              Até 40% OFF em vinhos selecionados e frete grátis acima de R$ 200.
            </p>
            <Button variant="secondary" size="sm" className="bg-white text-gold hover:bg-zinc-100">
              Ver Promoções
            </Button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
            <Store className="w-64 h-64 -mb-16 -mr-16" />
          </div>
        </div>

        {/* Proximity Filter & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-gold shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Adegas Próximas</h3>
              <p className="text-xs text-text-secondary">
                {userLocation ? (
                  <>Mostrando adegas até <span className="text-gold font-semibold">2 km</span> ({filteredStores.length} disponível{filteredStores.length !== 1 ? 's' : ''})</>
                ) : (
                  'Obtenha sua localização via GPS para filtrar por proximidade'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowMap(!showMap)}
              className="text-xs ml-1 border-zinc-700 shrink-0"
            >
              <MapIcon className="w-3.5 h-3.5 mr-1" />
              {showMap ? 'Ocultar Mapa' : 'Mapa'}
            </Button>
          </div>
        </div>

        {/* Map Section */}
        {showMap && (
          <Card className="h-64 sm:h-96 overflow-hidden relative border-zinc-800 z-10">
            {userLocation ? (
              <MapContainer 
                center={[userLocation.lat, userLocation.lng]} 
                zoom={13} 
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapUpdater center={[userLocation.lat, userLocation.lng]} />
                
                {/* User Marker */}
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>Você está aqui</Popup>
                </Marker>

                {/* Stores Markers */}
                {filteredStores.filter(s => s.lat !== 0 && s.lng !== 0).map(store => (
                  <Marker key={store.id} position={[store.lat, store.lng]}>
                    <Popup>
                      <div className="text-zinc-900 font-medium">
                        <strong>{store.name}</strong><br/>
                        {store.distance !== undefined ? `${store.distance.toFixed(1)} km de distância` : 'Endereço cadastrado'}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                Aguardando localização...
              </div>
            )}
          </Card>
        )}

        {/* Stores List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : filteredStores.length === 0 ? (
          <Card className="p-8 text-center bg-zinc-900/50 border-zinc-800 space-y-4">
            <MapPin className="w-12 h-12 mx-auto text-gold/70" />
            <div>
              <h4 className="text-lg font-bold text-white mb-1">
                {searchQuery 
                  ? `Nenhuma adega correspondente a "${searchQuery}"`
                  : `Nenhuma adega encontrada a até 2km de você`
                }
              </h4>
              <p className="text-sm text-text-secondary max-w-md mx-auto">
                {userLocation 
                  ? `Não encontramos adegas cadastradas dentro do raio de 2km em ${detectedAddress || 'sua localização'}.`
                  : 'Obtenha sua localização para visualizar as adegas no seu raio de entrega.'
                }
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="sm"
                onClick={generateNearbyDemoStores}
                className="bg-gold text-zinc-950 font-semibold hover:bg-gold-light text-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simular Adegas Locais no Meu GPS
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStores.map(store => (
              <Link to={`/cliente/adega/${store.id}`} key={store.id}>
                <Card className="p-4 hover:border-gold/30 transition-colors group cursor-pointer h-full flex flex-col">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                      {store.logo_url && store.logo_url.trim() !== '' ? (
                        <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Store className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-white truncate text-base">{store.name}</h4>
                        <div className="flex items-center text-gold shrink-0 bg-gold/10 px-1.5 py-0.5 rounded text-xs font-medium">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          {store.rating.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-3">
                        {store.distance !== undefined && (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {store.distance < 1 ? `${(store.distance * 1000).toFixed(0)}m` : `${store.distance.toFixed(1)}km`}
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center">
                          {store.delivery_fee === 0 ? (
                            <span className="text-emerald-500 font-medium">Frete Grátis</span>
                          ) : (
                            `Entrega R$ ${store.delivery_fee.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {store.is_open ? (
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 text-[10px] py-0">
                            Aberto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-rose-500 border-rose-500/20 bg-rose-500/10 text-[10px] py-0">
                            Fechado
                          </Badge>
                        )}
                        <span className="text-[10px] text-zinc-500">
                          Min. R$ {store.minimum_order.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Promoções do Dia */}
        {promotions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Promoções do Dia</h3>
              {promotions.length > 4 && (
                <Button variant="outline" size="sm" className="text-xs">
                  Ver todas
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {promotions.slice(0, 4).map(item => (
              <Card key={item.id} className="p-3 hover:border-gold/30 transition-colors group h-full flex flex-col justify-between">
                <div>
                  <div className="aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden mb-3 relative">
                    <Badge className="absolute top-2 left-2 bg-rose-500 text-white border-none text-[10px] z-10 px-1.5 py-0">
                      -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                    </Badge>
                    {item.image && item.image.trim() !== '' ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">{item.name}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-gold text-sm">R$ {item.price.toFixed(2)}</span>
                    <span className="text-xs text-zinc-500 line-through">R$ {item.originalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  className="w-full bg-gold/10 hover:bg-gold text-gold hover:text-zinc-950 border border-gold/30 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  onClick={() => handleAddPromoToCart(item)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </Button>
              </Card>
            ))}
          </div>
        </div>
        )}

        {/* Favoritos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Favoritos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {stores.slice(0, 1).map(store => (
              <Link to={`/cliente/adega/${store.id}`} key={store.id}>
                <Card className="p-4 hover:border-gold/30 transition-colors group cursor-pointer h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-2 right-2 z-10">
                    <Star className="w-5 h-5 text-gold fill-gold" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                      {store.logo_url && store.logo_url.trim() !== '' ? (
                        <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Store className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-white truncate text-base">{store.name}</h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-3">
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-gold fill-gold" />
                          {store.rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        {store.distance !== undefined && (
                          <span className="flex items-center">
                            {store.distance < 1 ? `${(store.distance * 1000).toFixed(0)}m` : `${store.distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {store.is_open ? (
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 text-[10px] py-0">
                            Aberto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-rose-500 border-rose-500/20 bg-rose-500/10 text-[10px] py-0">
                            Fechado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Mais Vendidas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Adegas Mais Vendidas (Próximas)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStores.slice().sort((a, b) => b.rating - a.rating).slice(0, 3).map((store, index) => (
              <Link to={`/cliente/adega/${store.id}`} key={store.id}>
                <Card className="p-4 hover:border-gold/30 transition-colors group cursor-pointer h-full flex flex-col relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-9xl font-bold text-zinc-800/50 pointer-events-none z-0">
                    {index + 1}
                  </div>
                  <div className="flex gap-4 relative z-10">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                      {store.logo_url && store.logo_url.trim() !== '' ? (
                        <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Store className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-white truncate text-base">{store.name}</h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-3">
                        <span className="flex items-center text-gold">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          {store.rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        {store.distance !== undefined && (
                          <span className="flex items-center">
                            {store.distance < 1 ? `${(store.distance * 1000).toFixed(0)}m` : `${store.distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {store.is_open ? (
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 text-[10px] py-0">
                            Aberto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-rose-500 border-rose-500/20 bg-rose-500/10 text-[10px] py-0">
                            Fechado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Added Toast Notification */}
      {addedToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-zinc-950 font-bold px-4 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span className="text-sm">{addedToast}</span>
        </div>
      )}

      {/* Floating Cart Bar when cart has items */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-4">
          <Link to="/cliente/carrinho">
            <div className="bg-gradient-to-r from-gold to-gold-dark text-zinc-950 font-bold p-4 rounded-2xl shadow-xl shadow-gold/20 flex items-center justify-between hover:brightness-105 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950/20 flex items-center justify-center text-zinc-950">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-zinc-950/80 uppercase tracking-wider">Ver Carrinho</div>
                  <div className="text-sm">{totalCartItems} {totalCartItems === 1 ? 'item' : 'itens'} selecionados</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold">R$ {totalCartValue.toFixed(2)}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* iFood-Style Location Selector Modal */}
      <Modal 
        isOpen={isLocationModalOpen} 
        onClose={() => {
          setIsLocationModalOpen(false);
          setIsPickingOnMap(false);
        }} 
        title={isPickingOnMap ? "Ajustar Localização" : "Onde você quer receber seu pedido?"}
      >
        {isPickingOnMap ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Arraste o mapa para posicionar o marcador exatamente no seu endereço.</p>
            <div className="h-64 sm:h-80 w-full rounded-xl overflow-hidden relative border border-zinc-800">
              <MapContainer 
                center={mapPickerLocation ? [mapPickerLocation.lat, mapPickerLocation.lng] : [-23.561684, -46.655981]} 
                zoom={15} 
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapPickerEvents onMove={(loc) => setMapPickerLocation(loc)} />
                {mapPickerLocation && (
                  <Marker position={[mapPickerLocation.lat, mapPickerLocation.lng]} icon={MapPinIcon} />
                )}
              </MapContainer>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:flex-1 border-zinc-800"
                onClick={() => setIsPickingOnMap(false)}
              >
                Cancelar
              </Button>
              <Button
                className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold"
                onClick={confirmMapPickerLocation}
                disabled={isSearchingManual}
              >
                {isSearchingManual ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmar Local
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Option 1: Live GPS (iFood Primary Choice) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-zinc-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <LocateFixed className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">Localização Atual (GPS)</h4>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Recomendado</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Pega exatamente onde você está no momento via GPS satélite
                    </p>
                    {detectedAddress && (
                      <p className="text-xs text-emerald-300 font-semibold mt-1 bg-emerald-950/60 p-2 rounded border border-emerald-500/20">
                        📍 {detectedAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={requestGeolocation}
                  disabled={isLocating}
                  className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm gap-2 cursor-pointer"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Obtendo...
                    </>
                  ) : (
                    <>
                      <LocateFixed className="w-4 h-4" />
                      Usar GPS
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMapPickerLocation(userLocation || { lat: -23.561684, lng: -46.655981 });
                    setIsPickingOnMap(true);
                  }}
                  className="w-full sm:flex-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold px-3"
                  title="Ajustar posição no mapa caso o GPS esteja impreciso"
                >
                  <MapIcon className="w-4 h-4 mr-1" />
                  Ajustar Mapa
                </Button>
              </div>
            </div>

            {/* Option 2: Registered Profile Address */}
            {user?.address && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0 mt-0.5">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Endereço Cadastrado na Conta</h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      {user.address}{user.number ? `, ${user.number}` : ''}{user.neighborhood ? ` - ${user.neighborhood}` : ''}
                    </p>
                    {user.city && <p className="text-xs text-zinc-400">{user.city}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={useProfileAddress}
                    className="w-full sm:flex-1 border-zinc-700 hover:bg-zinc-800 text-white font-semibold text-xs cursor-pointer"
                  >
                    Usar Endereço
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (user?.lat && user?.lng) {
                        setMapPickerLocation({ lat: Number(user.lat), lng: Number(user.lng) });
                      } else {
                        setMapPickerLocation({ lat: -23.561684, lng: -46.655981 });
                      }
                      setIsPickingOnMap(true);
                    }}
                    className="w-full sm:w-auto border-zinc-700 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold px-3"
                  >
                    <MapIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Option 3: Manual Address Search */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-gold" />
                Buscar Outro Endereço ou Cidade
              </h4>
              <form onSubmit={searchManualAddress} className="flex gap-2">
                <Input
                  placeholder="Ex: Av. Paulista, São Paulo..."
                  value={manualAddressInput}
                  onChange={(e) => setManualAddressInput(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-sm"
                />
                <Button
                  type="submit"
                  disabled={isSearchingManual || !manualAddressInput.trim()}
                  className="bg-gold text-zinc-950 font-bold hover:bg-gold-light text-xs shrink-0 cursor-pointer"
                >
                  {isSearchingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
