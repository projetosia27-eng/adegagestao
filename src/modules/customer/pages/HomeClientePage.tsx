import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search, MapPin, Star, Clock, Map as MapIcon, ChevronRight, Store, Loader2, Package, ShoppingBag, Plus, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

export const HomeClientePage = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const { items, addItem } = useCart();
  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    if (user?.lat && user?.lng) {
      const loc = { lat: Number(user.lat), lng: Number(user.lng) };
      setUserLocation(loc);
      fetchStores(loc);
    } else {
      requestGeolocation();
    }
  }, [user]);

  const requestGeolocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada pelo seu navegador');
      fetchStores(user?.lat && user?.lng ? { lat: Number(user.lat), lng: Number(user.lng) } : null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(loc);
        fetchStores(loc);
      },
      (error) => {
        console.warn('Aviso de geolocalização:', error.message);
        if (user?.lat && user?.lng) {
          const loc = { lat: Number(user.lat), lng: Number(user.lng) };
          setUserLocation(loc);
          fetchStores(loc);
        } else {
          setLocationError('Mostrando todas as adegas disponíveis.');
          fetchStores(null);
        }
      },
      { timeout: 10000 }
    );
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

      if (parsedStores.length === 0) {
        parsedStores = [
          {
            id: 'adega-demo-1',
            name: 'Adega Premium Jardins',
            logo_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&h=200&fit=crop',
            lat: location ? location.lat + 0.005 : -23.561684,
            lng: location ? location.lng + 0.005 : -46.655981,
            delivery_fee: 0,
            minimum_order: 30,
            is_open: true,
            rating: 4.9,
            distance: 0.8
          },
          {
            id: 'adega-demo-2',
            name: 'Empório & Adega Express',
            logo_url: 'https://images.unsplash.com/photo-1528823872057-9c018a7a70b3?w=200&h=200&fit=crop',
            lat: location ? location.lat - 0.008 : -23.553221,
            lng: location ? location.lng - 0.008 : -46.652110,
            delivery_fee: 4.90,
            minimum_order: 20,
            is_open: true,
            rating: 4.7,
            distance: 1.4
          }
        ];
        
        // Mock promotions for demo stores
        setPromotions([
          { id: '1', storeId: 'adega-demo-1', storeName: 'Adega Premium Jardins', name: 'Vinho Tinto Chileno', price: 49.9, originalPrice: 79.9, image: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?w=200&h=300&fit=crop' },
          { id: '2', storeId: 'adega-demo-2', storeName: 'Empório & Adega Express', name: 'Espumante Brut', price: 89.9, originalPrice: 120.0, image: 'https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?w=200&h=300&fit=crop' },
        ]);
      } else if (location) {
        parsedStores = parsedStores.map(store => {
          let dist: number | undefined = undefined;
          if (store.lat && store.lng && (store.lat !== 0 || store.lng !== 0)) {
            dist = calculateDistance(location.lat, location.lng, store.lat, store.lng);
          }
          return {
            ...store,
            distance: dist
          };
        })
        .sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          if (a.distance !== undefined) return -1;
          if (b.distance !== undefined) return 1;
          return 0;
        });

        // Fetch real promotions for these stores
        if (parsedStores.length > 0) {
          const storeIds = parsedStores.map(s => s.id);
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
                price: p.promotional_price,
                originalPrice: p.price,
                image: p.image_url
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
      } else {
        // Sem localização, buscar promoções de todas as adegas
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
                price: p.promotional_price,
                originalPrice: p.price,
                image: p.image_url
              };
            });
            setPromotions(mappedPromos);
          } catch (err) {
             setPromotions([]);
          }
        }
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

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header & Search */}
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-zinc-800 p-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-text-secondary">Entregando em</span>
              <button 
                onClick={requestGeolocation}
                className="flex items-center text-sm font-medium text-white group"
              >
                <MapPin className="w-4 h-4 text-gold mr-1 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-[320px]">
                  {user?.address ? (
                    `${user.address}${user.number ? `, ${user.number}` : ''}${user.neighborhood ? ` - ${user.neighborhood}` : ''}`
                  ) : userLocation ? (
                    'Localização capturada'
                  ) : (
                    'Obter minha localização...'
                  )}
                </span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 shrink-0" />
              </button>
            </div>
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
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-sm">
            {locationError}
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

        {/* Map Toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Adegas Cadastradas</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowMap(!showMap)}
            className="text-xs"
          >
            <MapIcon className="w-4 h-4 mr-2" />
            {showMap ? 'Ocultar Mapa' : 'Ver no Mapa'}
          </Button>
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
          <Card className="p-8 text-center bg-zinc-900/50 border-zinc-800">
            <Store className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">Nenhuma adega encontrada</h4>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              {searchQuery ? `Nenhuma adega encontrada correspondente a "${searchQuery}".` : 'No momento não encontramos adegas cadastradas.'}
            </p>
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
            <h3 className="text-lg font-bold text-white">Adegas Mais Vendidas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.slice().sort((a, b) => b.rating - a.rating).slice(0, 3).map((store, index) => (
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
    </div>
  );
};
