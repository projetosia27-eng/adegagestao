-- ========================================================
-- SCHEMA SQL PARA ADEGA HUB (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://zvcuiouaonjupzblmaae.supabase.co
-- ========================================================

-- 1. TABELA DE ADEGAS (STORES)
CREATE TABLE IF NOT EXISTS public.stores (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE PRODUTOS (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PEDIDOS (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT,
    customer_name TEXT,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, preparing, delivering, delivered, canceled
    total NUMERIC NOT NULL,
    delivery_address TEXT,
    payment_method TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE ITENS DO PEDIDO (ORDER_ITEMS)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID,
    product_name TEXT,
    quantity INTEGER DEFAULT 1,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE CUPONS (COUPONS)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    type TEXT DEFAULT 'percentage', -- percentage, fixed
    value NUMERIC NOT NULL,
    min_purchase NUMERIC DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE PROMOÇÕES (PROMOTIONS)
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    products_included INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE ENTREGADORES (DRIVERS)
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    vehicle TEXT,
    plate TEXT,
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'offline', -- offline, online, delivering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HABILITAR RLS E CRIAR POLÍTICAS PERMISSIVAS PARA DEMO / PRODUÇÃO
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (Leitura e Escrita livre para demonstração)
CREATE POLICY "Permitir leitura publica de stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Permitir insercao publica de stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao publica de stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao publica de stores" ON public.stores FOR DELETE USING (true);

CREATE POLICY "Permitir leitura publica de products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Permitir insercao publica de products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao publica de products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusao publica de products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Permitir leitura publica de orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Permitir insercao publica de orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao publica de orders" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura publica de order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Permitir insercao publica de order_items" ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir acesso aos cupons" ON public.coupons FOR ALL USING (true);
CREATE POLICY "Permitir acesso as promocoes" ON public.promotions FOR ALL USING (true);
CREATE POLICY "Permitir acesso aos entregadores" ON public.drivers FOR ALL USING (true);

-- CRIAR BUCKET DE IMAGENS NO STORAGE (se necessário)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Acesso publico as imagens" ON storage.objects FOR ALL USING (bucket_id = 'images');
