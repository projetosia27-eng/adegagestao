import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Upload, Package, Loader2, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '../pages/ProdutosPage';
import { Card } from '@/components/ui/Card';

interface FormProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: () => void;
  stores: {id: string, name: string}[];
  preselectedStoreId?: string;
}

export const FormProdutoModal = ({ isOpen, onClose, product, onSave, stores, preselectedStoreId }: FormProdutoModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    store_id: preselectedStoreId || (stores.length > 0 ? stores[0].id : ''),
    name: '',
    category: '',
    description: '',
    price: '',
    promotional_price: '',
    stock: '',
    is_active: true,
    featured: false,
    image_url: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (product) {
      setFormData({
        store_id: product.store_id || "",
        name: product.name || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        promotional_price: product.promotional_price?.toString() || '',
        stock: product.stock?.toString() || '0',
        is_active: product.is_active ?? true,
        featured: product.featured ?? false,
        image_url: product.image_url || ''
      });
      setImagePreview(product.image_url || '');
    } else {
      setFormData({
        store_id: preselectedStoreId || (stores.length > 0 ? stores[0].id : ''),
        name: '',
        category: '',
        description: '',
        price: '',
        promotional_price: '',
        stock: '0',
        is_active: true,
        featured: false,
        image_url: ''
      });
      setImagePreview('');
    }
    setImageFile(null);
    setError(null);
  }, [product, isOpen, stores, preselectedStoreId]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

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
    if (!formData.store_id) {
      setError('Selecione uma loja.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        try {
          finalImageUrl = await uploadImage(imageFile);
        } catch (imgErr: any) {
          console.warn('Erro ao carregar imagem no storage, usando preview:', imgErr);
          // If storage fails, fallback to imagePreview or original url
          finalImageUrl = imagePreview || formData.image_url;
        }
      }

      const productData: any = {
        store_id: formData.store_id,
        name: formData.name,
        category: formData.category || 'Geral',
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        promotional_price: formData.promotional_price ? parseFloat(formData.promotional_price) : null,
        stock: parseInt(formData.stock, 10) || 0,
        is_active: formData.is_active,
        featured: formData.featured,
        image_url: finalImageUrl,
      };

      if (product) {
        let { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
          
        if (updateError && updateError.message?.includes('featured')) {
          // Retry without 'featured' if column is missing in database
          delete productData.featured;
          const retryRes = await supabase
            .from('products')
            .update(productData)
            .eq('id', product.id);
          updateError = retryRes.error;
        }

        if (updateError) throw updateError;
      } else {
        let { error: insertError } = await supabase
          .from('products')
          .insert(productData);
          
        if (insertError && insertError.message?.includes('featured')) {
          // Retry without 'featured' if column is missing in database
          delete productData.featured;
          const retryRes = await supabase
            .from('products')
            .insert(productData);
          insertError = retryRes.error;
        }

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      console.error(err);
      if (err.status === 404 || err.code === '42P01' || err.message?.includes("Could not find the table 'public.products'")) {
        setError('A tabela "products" não existe no seu projeto Supabase (erro 404). Por favor, execute o script SQL abaixo no SQL Editor do Supabase.');
      } else {
        setError(err.message || 'Erro ao salvar produto. Verifique a conexão com o Supabase.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sqlProductsSnippet = `CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'Geral',
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    promotional_price NUMERIC,
    image_url TEXT,
    stock INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo em products" ON public.products FOR ALL USING (true);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-2xl my-8 bg-surface border-zinc-800 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-surface z-10 rounded-t-xl">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Editar Produto' : 'Novo Produto'}
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
              {error.includes('products') && (
                <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs text-zinc-300">
                  <p className="mb-2 text-zinc-400">Copie e cole este código SQL no <strong>SQL Editor</strong> do Supabase (https://zvcuiouaonjupzblmaae.supabase.co):</p>
                  <pre className="p-2 bg-zinc-900 rounded overflow-x-auto text-[11px] text-gold font-mono">{sqlProductsSnippet}</pre>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sqlProductsSnippet);
                      alert('Código SQL de produtos copiado!');
                    }}
                    className="mt-2 text-xs text-gold underline hover:text-white"
                  >
                    Copiar Código SQL
                  </button>
                </div>
              )}
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Imagem */}
              <div className="w-full md:w-1/3 shrink-0">
                <label className="block text-sm font-medium text-text-secondary mb-2">Imagem do Produto</label>
                <div className="relative aspect-square w-full rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 overflow-hidden group">
                  {imagePreview && imagePreview.trim() !== '' ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full text-sm font-medium flex items-center shadow-lg">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 transition-colors">
                      <Package className="w-8 h-8 text-zinc-500 mb-2" />
                      <span className="text-xs text-zinc-400 font-medium text-center px-2">Adicionar imagem</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* Info Básica */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Loja *</label>
                  <select 
                    name="store_id"
                    value={formData.store_id || ""}
                    onChange={handleChange}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-gold"
                  >
                    <option value="" disabled>Selecione a loja...</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Produto *</label>
                  <Input 
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Vinho Tinto Reservado"
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Categoria *</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input 
                      name="category"
                      value={formData.category || ""}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Vinhos, Cervejas, Destilados..."
                      className="bg-zinc-900 border-zinc-800 pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
              <textarea 
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                placeholder="Breve descrição do produto..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-gold resize-none"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Preço (R$) *</label>
                <Input 
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ""}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Preço Promo (R$)</label>
                <Input 
                  name="promotional_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.promotional_price || ""}
                  onChange={handleChange}
                  placeholder="0.00 (opcional)"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">Estoque (un) *</label>
                <Input 
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock || ""}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>

            <div className="flex gap-6 pt-4 border-t border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-sm font-medium text-white select-none">Produto Ativo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${formData.featured ? 'bg-gold' : 'bg-zinc-700'}`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.featured ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-sm font-medium text-white select-none">Destaque</span>
              </label>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3 sticky bottom-0 rounded-b-xl">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="product-form" disabled={loading} className="min-w-[120px]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Produto'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
