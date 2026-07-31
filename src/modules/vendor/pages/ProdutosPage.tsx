import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Tag,
  Store,
  AlertTriangle
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormProdutoModal } from '../components/FormProdutoModal';
import { Link, useParams } from 'react-router-dom';

export interface Product {
  id: string;
  store_id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  promotional_price: number | null;
  image_url: string;
  stock: number;
  is_active: boolean;
  featured: boolean;
  store_name?: string;
}

export const ProdutosPage = () => {
  const { user } = useAuth();
  const { id: storeIdParam } = useParams(); // If accessing via /adega/:id/produtos
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [filterStore, setFilterStore] = useState(storeIdParam || 'all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const fetchStores = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('vendor_id', user.id);
      
      if (!error && data) {
        setStores(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First get user's stores if not already fetching
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('vendor_id', user.id);
        
      if (storesError) throw storesError;
      
      const storeIds = storesData.map(s => s.id);
      
      if (storeIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('products')
        .select('*');
        
      if (storeIdParam) {
        query = query.eq('store_id', storeIdParam);
      } else {
        query = query.in('store_id', storeIds);
      }
        
      const { data, error } = await query.order('name');
        
      if (error) {
        // If table doesn't exist yet, just show empty
        console.warn(error);
        setProducts([]);
      } else {
        const enrichedProducts = data.map(p => {
          const store = storesData.find(s => s.id === p.store_id);
          return { ...p, store_name: store?.name || 'Desconhecida' };
        });
        setProducts(enrichedProducts);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, [user, storeIdParam]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir produto.');
    }
  };

  const handleOpenModal = (product?: Product) => {
    setProductToEdit(product || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  const handleSave = () => {
    fetchProducts();
    handleCloseModal();
  };

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesActive = filterActive === 'all' || 
                          (filterActive === 'active' ? p.is_active : !p.is_active);
    const matchesStore = filterStore === 'all' || p.store_id === filterStore;
    
    return matchesSearch && matchesCategory && matchesActive && matchesStore;
  });

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Produtos</h1>
          <p className="text-text-secondary mt-1">Gerencie seu catálogo, preços e estoque.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {stores.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Nenhuma adega encontrada"
          description="Você precisa criar uma adega antes de cadastrar produtos."
          action={{
            label: 'Criar Adega',
            onClick: () => window.location.href = '/vendedor/adegas'
          }}
        />
      ) : products.length === 0 && !searchQuery ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Seu catálogo está vazio. Comece a adicionar produtos para vender."
          action={{
            label: 'Cadastrar Produto',
            onClick: () => handleOpenModal()
          }}
        />
      ) : (
        <Card className="flex flex-col border border-zinc-800 bg-surface">
          <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Buscar por nome ou descrição..." 
                className="pl-9 bg-zinc-900 border-zinc-800"
                value={searchQuery || ""}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <select 
                className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
                value={filterStore}
                onChange={e => setFilterStore(e.target.value)}
              >
                <option value="all">Todas as Lojas</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select 
                className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">Todas Categorias</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select 
                className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
                value={filterActive}
                onChange={e => setFilterActive(e.target.value)}
              >
                <option value="all">Todos Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary bg-zinc-900/50 uppercase border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-4">Produto</th>
                  <th className="px-4 py-4">Loja</th>
                  <th className="px-4 py-4">Categoria</th>
                  <th className="px-4 py-4">Preço</th>
                  <th className="px-4 py-4">Estoque</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                            {product.image_url && product.image_url.trim() !== '' ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {product.name}
                              {product.featured && (
                                <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20 text-[10px] px-1 py-0 h-4">Destaque</Badge>
                              )}
                            </div>
                            <div className="text-xs text-text-secondary line-clamp-1">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{product.store_name}</td>
                      <td className="px-4 py-3 text-text-secondary">{product.category}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">R$ {(product.promotional_price || product.price).toFixed(2)}</div>
                        {product.promotional_price && (
                          <div className="text-xs text-text-secondary line-through">R$ {product.price.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {product.stock <= 5 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          <span className={product.stock <= 5 ? 'text-amber-500 font-bold' : 'text-white'}>
                            {product.stock} un
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {product.is_active ? (
                          <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ativo</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700">Inativo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(product)} className="h-8 px-2">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)} className="h-8 px-2 border-rose-500/20 text-rose-500 hover:bg-rose-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                      Nenhum produto encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isModalOpen && (
        <FormProdutoModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          product={productToEdit}
          onSave={handleSave}
          stores={stores}
          preselectedStoreId={filterStore !== 'all' ? filterStore : undefined}
        />
      )}
    </div>
  );
};
