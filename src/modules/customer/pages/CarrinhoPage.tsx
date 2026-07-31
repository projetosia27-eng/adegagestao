import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, CartItem } from '../contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MapPin, 
  CreditCard,
  Banknote,
  Ticket,
  AlertCircle,
  Package
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export const CarrinhoPage = () => {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix' | 'cash'>('credit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group items by store
  const itemsByStore = items.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = {
        storeName: item.storeName,
        items: []
      };
    }
    acc[item.storeId].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string; items: CartItem[] }>);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Fake delivery fee logic (e.g., R$ 5 per store)
  const deliveryFee = Object.keys(itemsByStore).length * 5.0; 
  
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const handleApplyCoupon = () => {
    if (coupon.toUpperCase() === 'ADEGA10') {
      setDiscount(subtotal * 0.1);
    } else {
      setDiscount(0);
      alert('Cupom inválido');
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Create one order per store in Supabase
      for (const [storeId, storeData] of Object.entries(itemsByStore)) {
        const storeSubtotal = storeData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        let orderData = null;
        try {
          const res = await supabase
            .from('orders')
            .insert({
              customer_id: user.id,
              customer_name: user.fullName || user.email || 'Cliente',
              store_id: storeId,
              status: 'pending',
              total: storeSubtotal + 5.0,
              delivery_address: user.address || 'Endereço não informado',
              payment_method: paymentMethod,
              observations
            })
            .select()
            .single();
          orderData = res.data;
        } catch (err) {
          console.warn('Erro ao inserir pedido:', err);
        }
        
        if (orderData && orderData.id) {
          const orderItems = storeData.items.map(item => ({
            order_id: orderData.id,
            product_id: item.productId,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price
          }));
          
          try {
            await supabase
              .from('order_items')
              .insert(orderItems);
          } catch (err) {
            console.warn('Erro na inserção dos itens do pedido:', err);
          }
        }
      }

      clearCart();
      navigate('/cliente/pedidos', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao finalizar pedido.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-surface/80 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center gap-4">
          <Link to="/cliente/home" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Carrinho</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <EmptyState
            icon={ShoppingBag}
            title="Seu carrinho está vazio"
            description="Explore as adegas e adicione produtos ao seu carrinho."
            action={{
              label: 'Explorar Adegas',
              onClick: () => navigate('/cliente/home')
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center gap-4">
        <Link to="/cliente/home" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-white">Carrinho</h1>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-500">{error}</p>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-6">
          {Object.entries(itemsByStore).map(([storeId, storeData]) => (
            <div key={storeId}>
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                {storeData.storeName}
              </h3>
              <div className="space-y-3">
                {storeData.items.map(item => (
                  <Card key={item.productId} className="p-3 flex gap-4">
                    <div className="w-20 h-20 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-zinc-800">
                      {item.imageUrl && item.imageUrl.trim() !== '' ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between gap-2 mb-1">
                        <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="text-zinc-500 hover:text-rose-500 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-bold text-gold text-sm mb-2">R$ {item.price.toFixed(2)}</span>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-7 rounded hover:bg-zinc-800 flex items-center justify-center text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-7 h-7 rounded hover:bg-zinc-800 text-gold flex items-center justify-center disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-white">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <Card className="p-4 flex gap-2">
          <div className="relative flex-1">
            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Cupom de desconto" 
              className="pl-9 h-10"
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={handleApplyCoupon} className="h-10">
            Aplicar
          </Button>
        </Card>

        {/* Payment Method */}
        <div>
          <h3 className="font-bold text-white mb-3">Forma de Pagamento</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMethod('credit')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                paymentMethod === 'credit' 
                  ? 'bg-gold/10 border-gold text-gold' 
                  : 'bg-surface border-zinc-800 text-text-secondary hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-medium">Cartão</span>
            </button>
            <button
              onClick={() => setPaymentMethod('pix')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                paymentMethod === 'pix' 
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                  : 'bg-surface border-zinc-800 text-text-secondary hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center font-bold">PIX</div>
              <span className="text-xs font-medium">Pix</span>
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
                paymentMethod === 'cash' 
                  ? 'bg-gold/10 border-gold text-gold' 
                  : 'bg-surface border-zinc-800 text-text-secondary hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Banknote className="w-6 h-6" />
              <span className="text-xs font-medium">Dinheiro</span>
            </button>
          </div>
        </div>

        {/* Observations */}
        <div>
          <h3 className="font-bold text-white mb-3">Observações (opcional)</h3>
          <textarea
            className="w-full bg-surface border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gold resize-none"
            rows={3}
            placeholder="Ex: Tocar o interfone, embalagem para presente..."
            value={observations}
            onChange={e => setObservations(e.target.value)}
          />
        </div>

        {/* Summary */}
        <Card className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="text-white">R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Taxa de Entrega</span>
            <span className="text-white">R$ {deliveryFee.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-500">Desconto</span>
              <span className="text-emerald-500">- R$ {discount.toFixed(2)}</span>
            </div>
          )}
          <hr className="border-zinc-800" />
          <div className="flex justify-between font-bold">
            <span className="text-white">Total</span>
            <span className="text-gold text-lg">R$ {total.toFixed(2)}</span>
          </div>
        </Card>
        
        <div className="pt-4 sm:hidden pb-12">
           <Button 
             variant="outline"
             size="lg" 
             className="w-full border-zinc-700 text-white hover:bg-zinc-800"
             onClick={() => navigate('/cliente/home')}
           >
             Continuar Comprando
           </Button>
        </div>
      </div>

      {/* Checkout Bar */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-zinc-800 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="flex justify-between items-center sm:hidden mb-1">
            <span className="text-text-secondary text-sm">Total:</span>
            <span className="text-xl font-bold text-gold">R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex-1 hidden sm:block">
            <p className="text-xs text-text-secondary mb-0.5">Total a pagar</p>
            <p className="text-xl font-bold text-gold">R$ {total.toFixed(2)}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              size="lg" 
              className="hidden sm:flex"
              onClick={() => navigate(-1)}
            >
              Continuar Comprando
            </Button>
            <Button 
              size="lg" 
              className="flex-1 sm:flex-none sm:w-64 bg-gold hover:bg-gold-light text-zinc-950 font-bold"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Finalizar Pedido'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
