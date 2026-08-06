import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Heart, 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  ChevronLeft, 
  ShoppingCart,
  Plus,
  Minus,
  Info,
  Store,
  Package,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreData {
  id: string;
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

interface Product {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  promotional_price: number | null;
  image_url: string;
  stock: number;
}

import { useCart } from '../contexts/CartContext';

export const AdegaDetalhePage = () => {
  const { id } = useParams();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const { items, addItem, updateQuantity, removeItem } = useCart();
  
  const cart = items.reduce((acc, item) => ({ ...acc, [item.productId]: item.quantity }), {} as Record<string, number>);

  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        let storeData = null;
        try {
          const { data } = await supabase
            .from('stores')
            .select('*')
            .eq('id', id)
            .single();
          storeData = data;
        } catch (err) {
          console.warn('Erro na consulta da adega:', err);
        }

        if (!storeData) {
          // Fallback to sample store data if store not found in Supabase
          const isExpress = id === 'adega-demo-2';
          setStore({
            id: id || 'adega-demo-1',
            name: isExpress ? 'Empório & Adega Express' : 'Adega Premium Jardins',
            description: isExpress 
              ? 'Bebidas geladas com entrega rápida em até 30 minutos na sua porta.'
              : 'Especializada em vinhos finos, espumantes e destilados importados de alta qualidade.',
            logo_url: isExpress 
              ? 'https://images.unsplash.com/photo-1528823872057-9c018a7a70b3?w=200&h=200&fit=crop'
              : 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&h=200&fit=crop',
            banner_url: isExpress 
              ? 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=1200&h=400&fit=crop'
              : 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&h=400&fit=crop',
            rating: isExpress ? 4.7 : 4.9,
            is_open: true,
            address: isExpress ? 'Rua Augusta, 800 - Consolação, São Paulo' : 'Alameda Santos, 1200 - Jardins, São Paulo',
            operating_hours: '10:00 - 23:00',
            delivery_fee: isExpress ? 4.90 : 0,
            minimum_order: isExpress ? 20 : 30,
          });

          setProducts([
            {
              id: `${id || 'demo'}-prod-1`,
              category: 'Vinhos Tintos',
              name: 'Vinho Tinto Cabernet Sauvignon 750ml',
              description: 'Vinho encorpado com notas de frutas vermelhas e carvalho.',
              price: 79.90,
              promotional_price: 49.90,
              image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop',
              stock: 15
            },
            {
              id: `${id || 'demo'}-prod-2`,
              category: 'Espumantes',
              name: 'Espumante Brut Rosé 750ml',
              description: 'Espumante refrescante com bolhas finas e aroma floral.',
              price: 120.00,
              promotional_price: 89.90,
              image_url: 'https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?w=300&h=300&fit=crop',
              stock: 10
            },
            {
              id: `${id || 'demo'}-prod-3`,
              category: 'Vinhos Brancos',
              name: 'Vinho Branco Sauvignon Blanc 750ml',
              description: 'Leve, cítrico e ideal para acompanhar frutos do mar.',
              price: 50.00,
              promotional_price: 35.00,
              image_url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=300&h=300&fit=crop',
              stock: 20
            },
            {
              id: `${id || 'demo'}-prod-4`,
              category: 'Destilados',
              name: 'Whisky 12 Anos Importado 1L',
              description: 'Whisky escocês envelhecido 12 anos em barris de carvalho.',
              price: 189.90,
              promotional_price: 159.90,
              image_url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=300&h=300&fit=crop',
              stock: 8
            },
            {
              id: `${id || 'demo'}-prod-5`,
              category: 'Cervejas Especiais',
              name: 'Cerveja IPA Artesanal 500ml',
              description: 'Cerveja com amargor equilibrado e aroma de lúpulo cítrico.',
              price: 24.90,
              promotional_price: 18.90,
              image_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&h=300&fit=crop',
              stock: 25
            }
          ]);
        } else {
          setStore({
            id: storeData.id,
            name: storeData.name || 'Adega',
            description: storeData.description || '',
            logo_url: storeData.logo_url || '',
            banner_url: storeData.banner_url || '',
            rating: storeData.rating || 5.0,
            is_open: storeData.is_open ?? true,
            address: storeData.address || '',
            operating_hours: storeData.operating_hours || '',
            delivery_fee: storeData.delivery_fee || 0,
            minimum_order: storeData.minimum_order || 0,
          });

          // Fetch products for this store
          let productsData: any[] = [];
          try {
            const { data } = await supabase
              .from('products')
              .select('*')
              .eq('store_id', id)
              .eq('is_active', true);
            productsData = data || [];
          } catch (err) {
            console.warn('Erro na consulta dos produtos:', err);
          }

          if (productsData.length > 0) {
            setProducts(
              productsData.map((p: any) => ({
                id: p.id,
                category: p.category || 'Geral',
                name: p.name,
                description: p.description || '',
                price: p.price,
                promotional_price: p.promotional_price,
                image_url: p.image_url || '',
                stock: p.stock ?? 10,
              }))
            );
          } else {
            setProducts([]);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes da adega", error);
        setStore(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreDetails();
  }, [id]);

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleUpdateCart = (productId: string, delta: number) => {
    const current = cart[productId] || 0;
    const next = Math.max(0, current + delta);
    
    if (next === 0) {
      removeItem(productId);
    } else {
      const product = products.find(p => p.id === productId);
      if (product) {
        const availableStock = (product.stock !== undefined && product.stock !== null && product.stock > 0) ? product.stock : 10;
        if (next <= availableStock) {
          if (current === 0) {
            addItem({
              productId,
              storeId: store?.id || 'adega-demo-1',
              storeName: store?.name || 'Adega',
              name: product.name,
              price: product.promotional_price || product.price,
              imageUrl: product.image_url,
              quantity: next,
              stock: availableStock
            });
            setAddedToast(`"${product.name}" adicionado ao carrinho!`);
            setTimeout(() => setAddedToast(null), 3000);
          } else {
            updateQuantity(productId, next);
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white p-4">
        <h2 className="text-2xl font-bold mb-4">Adega não encontrada</h2>
        <Link to="/cliente/home">
          <Button>Voltar para o Início</Button>
        </Link>
      </div>
    );
  }

  // Filter products by search query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const cartTotalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-transparent">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Link to="/cliente/home">
            <button className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-white border border-zinc-700/50 hover:bg-zinc-800 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <button 
            onClick={handleToggleFavorite}
            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-md flex items-center justify-center text-white border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
          >
            <Heart className={cn("w-5 h-5 transition-colors", isFavorite ? "fill-rose-500 text-rose-500" : "text-white")} />
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-64 sm:h-80 w-full bg-zinc-900">
        {store.banner_url && store.banner_url.trim() !== '' && (
          <img 
            src={store.banner_url} 
            alt={`Banner ${store.name}`} 
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-10">
        {/* Store Info Header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8 items-start">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-zinc-900 border-4 border-background overflow-hidden shadow-2xl shrink-0">
            {store.logo_url && store.logo_url.trim() !== '' ? (
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <Store className="w-10 h-10" />
              </div>
            )}
          </div>
          <div className="flex-1 pt-2 sm:pt-10">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{store.name}</h1>
              <div className="flex items-center text-gold bg-gold/10 px-2.5 py-1 rounded-lg shrink-0 border border-gold/20">
                <Star className="w-4 h-4 mr-1 fill-current" />
                <span className="font-bold">{store.rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-4 max-w-2xl">
              {store.description}
            </p>
            <div className="flex flex-wrap gap-3">
              {store.is_open ? (
                <Badge variant="success">Aberto agora</Badge>
              ) : (
                <Badge variant="danger">Fechado</Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {store.operating_hours}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {store.address}
              </Badge>
            </div>
          </div>
        </div>

        <hr className="border-zinc-800/80 mb-8" />

        {/* Store Stats/Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Pedido Mínimo</p>
              <p className="font-bold text-white">R$ {store.minimum_order.toFixed(2)}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Taxa de Entrega</p>
              <p className="font-bold text-white">
                {store.delivery_fee === 0 ? 'Grátis' : `R$ ${store.delivery_fee.toFixed(2)}`}
              </p>
            </div>
          </Card>
        </div>

        {/* Search Products */}
        <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-md py-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input 
              placeholder="Buscar vinhos, espumantes..." 
              className="pl-12 bg-surface/50 border-zinc-800"
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories & Products */}
        <div className="space-y-12">
          {Object.entries(productsByCategory).map(([category, catProducts]) => (
            <div key={category} id={`category-${category}`}>
              <h2 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
                {category} <Badge variant="outline">{catProducts.length}</Badge>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catProducts.map(product => {
                  const qty = cart[product.id] || 0;
                  
                  return (
                    <Card key={product.id} className="p-4 flex gap-4 hover:border-gold/30 transition-colors group">
                      <div className="w-24 h-24 rounded-lg bg-background border border-zinc-800 overflow-hidden relative shrink-0">
                        {product.promotional_price && (
                          <div className="absolute top-0 left-0 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">
                            PROMO
                          </div>
                        )}
                        {product.image_url && product.image_url.trim() !== '' ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col min-w-0">
                        <h4 className="font-bold text-white text-base leading-tight mb-1 truncate">{product.name}</h4>
                        <p className="text-xs text-text-secondary line-clamp-2 mb-2">{product.description}</p>
                        
                        <div className="mt-auto flex items-end justify-between gap-2">
                          <div>
                            {product.promotional_price ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 line-through">R$ {product.price.toFixed(2)}</span>
                                <span className="text-lg font-bold text-gold">R$ {product.promotional_price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-white">R$ {product.price.toFixed(2)}</span>
                            )}
                          </div>
                          
                          {qty > 0 ? (
                            <div className="flex items-center bg-surface border border-zinc-700 rounded-lg p-1">
                              <button 
                                onClick={() => handleUpdateCart(product.id, -1)}
                                className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-white">{qty}</span>
                              <button 
                                onClick={() => handleUpdateCart(product.id, 1)}
                                disabled={qty >= product.stock}
                                className="w-7 h-7 rounded bg-gold/20 hover:bg-gold/30 text-gold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant={product.stock > 0 ? "secondary" : "ghost"}
                              disabled={product.stock <= 0}
                              onClick={() => handleUpdateCart(product.id, 1)}
                              className="shrink-0 cursor-pointer"
                            >
                              {product.stock <= 0 ? 'Esgotado' : <><Plus className="w-4 h-4 mr-1" /> Adicionar</>}
                            </Button>
                          )}
                        </div>
                        {product.stock > 0 && product.stock <= 5 && (
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-500 font-medium">
                            <Info className="w-3 h-3" /> Restam apenas {product.stock} unidades
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(productsByCategory).length === 0 && (
            <div className="text-center py-12 text-text-secondary">
              Nenhum produto encontrado para "{searchQuery}".
            </div>
          )}
        </div>
      </div>

      {/* Added Toast Notification */}
      {addedToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-zinc-950 font-bold px-4 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span className="text-sm">{addedToast}</span>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <Link to="/cliente/carrinho">
            <Button size="lg" className="w-full shadow-2xl flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {cartTotalItems}
                </div>
                <span>Ver Carrinho</span>
              </div>
              <div className="flex items-center gap-2 font-bold group-hover:translate-x-1 transition-transform">
                R$ {Object.entries(cart).reduce((total, [id, qty]) => {
                  const p = products.find(p => p.id === id);
                  if (!p) return total;
                  return total + (p.promotional_price || p.price) * qty;
                }, 0).toFixed(2)}
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </div>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
