import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Printer, 
  MessageCircle, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  CheckCircle2,
  Truck,
  Package,
  Send
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Order, OrderItem } from './PedidosVendedorPage';
import { useAuth } from '@/modules/auth/hooks/useAuth';

export const PedidoVendedorDetalhePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{sender: 'vendor'|'customer', text: string, time: string}[]>([
    { sender: 'customer', text: 'Olá, por favor, pode enviar sachês de ketchup?', time: '10:32' }
  ]);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('id', id)
          .single();

        if (data) {
          setOrder(data as any);
        } else {
          // Mock data if no DB yet
          setOrder({
            id: id,
            store_id: 'store-1',
            customer_id: 'cust-1',
            customer_name: 'João Silva',
            status: 'pending',
            total: 145.90,
            created_at: new Date().toISOString(),
            delivery_address: 'Rua das Flores, 123 - Apto 45, Centro, São Paulo - SP',
            items: [
              { id: 'i1', product_name: 'Vinho Tinto Chileno Reservado', quantity: 2, price: 59.90 },
              { id: 'i2', product_name: 'Gelo de Coco 200ml', quantity: 4, price: 6.52 }
            ]
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const updateStatus = async (status: Order['status']) => {
    if (!order) return;
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
      if (!error) {
        setOrder({ ...order, status });
      }
    } catch (e) {
      // Mock update
      setOrder({ ...order, status });
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const originalBody = document.body.innerHTML;
    const printHtml = `
      <html>
        <head>
          <title>Recibo de Pedido #${order?.id}</title>
          <style>
            body { 
              font-family: monospace; 
              color: black; 
              width: 58mm; /* Thermal printer width */
              margin: 0; 
              padding: 5mm; 
              font-size: 12px;
            }
            .center { text-align: center; }
            .divider { border-bottom: 1px dashed black; margin: 5px 0; }
            .flex { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
            .text-sm { font-size: 10px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    setChatHistory([...chatHistory, {
      sender: 'vendor',
      text: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatMessage('');
  };

  if (loading || !order) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/vendedor/pedidos">
            <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Pedido #{order.id.split('-')[0] || order.id}
            </h1>
            <p className="text-text-secondary mt-1">Realizado em {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Cupom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalhes Principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-zinc-800 gap-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Status do Pedido</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={order.status === 'pending' ? 'danger' : 'outline'} className={order.status === 'pending' ? 'animate-pulse' : ''}>Pendente</Badge>
                  <ArrowLeft className="w-4 h-4 text-zinc-600 rotate-180 self-center" />
                  <Badge variant="outline" className={order.status === 'preparing' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : ''}>Preparando</Badge>
                  <ArrowLeft className="w-4 h-4 text-zinc-600 rotate-180 self-center" />
                  <Badge variant="outline" className={order.status === 'delivering' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' : ''}>Em Rota</Badge>
                  <ArrowLeft className="w-4 h-4 text-zinc-600 rotate-180 self-center" />
                  <Badge variant={order.status === 'delivered' ? 'success' : 'outline'}>Entregue</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <Button variant="primary" onClick={() => updateStatus('preparing')} className="bg-amber-600 hover:bg-amber-700 text-white">Aceitar Pedido</Button>
                )}
                {order.status === 'preparing' && (
                  <Button variant="primary" onClick={() => updateStatus('delivering')} className="bg-blue-600 hover:bg-blue-700 text-white">Despachar</Button>
                )}
                {order.status === 'delivering' && (
                  <Button variant="primary" onClick={() => updateStatus('delivered')} className="bg-emerald-600 hover:bg-emerald-700 text-white">Finalizar</Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2" /> Cliente
                </h3>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <p className="font-bold text-white text-lg">{order.customer_name}</p>
                  <p className="text-sm text-text-secondary mt-1 flex items-center"><Phone className="w-3.5 h-3.5 mr-1"/> (11) 98765-4321</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> Entrega
                </h3>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 h-full">
                  <p className="text-sm text-white leading-relaxed">{order.delivery_address}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center">
              <Package className="w-4 h-4 mr-2" /> Itens do Pedido
            </h3>
            
            <div className="space-y-4">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-white">
                      {item.quantity}x
                    </div>
                    <span className="text-white font-medium">{item.product_name}</span>
                  </div>
                  <span className="text-text-secondary font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800 space-y-3">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Subtotal</span>
                <span>R$ {(order.total - 10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Taxa de Entrega</span>
                <span>R$ 10.00</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-zinc-800">
                <span>Total</span>
                <span className="text-gold">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-0 overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center">
              <MessageCircle className="w-5 h-5 text-gold mr-2" />
              <h3 className="font-bold text-white">Chat com Cliente</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface/50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'vendor' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.sender === 'vendor' 
                      ? 'bg-gold text-zinc-900 rounded-tr-none' 
                      : 'bg-zinc-800 text-white rounded-tl-none'
                  }`}>
                    <p className="text-sm font-medium">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-text-secondary mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-zinc-900 border-t border-zinc-800">
              <form onSubmit={sendChatMessage} className="relative">
                <Input 
                  placeholder="Digite uma mensagem..." 
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  className="bg-zinc-800 border-transparent pr-12 text-sm"
                />
                <Button type="submit" size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gold hover:text-white hover:bg-gold/20">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Hidden Print Content */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="center mb-4">
            <h2 style={{margin: '0'}}>{order.store_id || 'Adega Hub'}</h2>
            <div className="text-sm">Pedido #{order.id.split('-')[0] || order.id}</div>
            <div className="text-sm">{new Date(order.created_at).toLocaleString()}</div>
          </div>
          
          <div className="divider"></div>
          
          <div className="mb-2">
            <div className="bold">Cliente:</div>
            <div>{order.customer_name}</div>
          </div>
          
          <div className="mb-2">
            <div className="bold">Endereço:</div>
            <div>{order.delivery_address}</div>
          </div>

          <div className="divider"></div>
          
          <div className="mb-2 bold">ITENS:</div>
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex mb-2">
              <div>{item.quantity}x {item.product_name}</div>
              <div>R$ {(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}

          <div className="divider"></div>
          
          <div className="flex">
            <div>Subtotal:</div>
            <div>R$ {(order.total - 10).toFixed(2)}</div>
          </div>
          <div className="flex">
            <div>Taxa Entrega:</div>
            <div>R$ 10.00</div>
          </div>
          <div className="divider"></div>
          <div className="flex bold" style={{ fontSize: '14px' }}>
            <div>TOTAL:</div>
            <div>R$ {order.total.toFixed(2)}</div>
          </div>
          
          <div className="divider" style={{marginTop: '15px'}}></div>
          <div className="center text-sm" style={{marginTop: '10px'}}>
            Obrigado pela preferência!
          </div>
        </div>
      </div>
    </div>
  );
};
