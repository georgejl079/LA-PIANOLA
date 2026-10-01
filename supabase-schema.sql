-- Tabla de categorías
create table public.categories (
  id text primary key,
  name text not null,
  image text not null,
  "order" int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de productos
create table public.products (
  id serial primary key,
  sku text,
  name text not null,
  brand text default 'LA PIANOLA',
  price numeric not null,
  cat text not null references public.categories(id) on delete cascade,
  img text not null,
  images jsonb default '[]'::jsonb,
  short_desc text,
  description text,
  details jsonb default '{}'::jsonb,
  "pairsWith" int[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de promociones
create table public.promotions (
  id serial primary key,
  badge text,
  title text not null,
  sub text,
  image text not null,
  cat text not null references public.categories(id) on delete cascade,
  "fullDescription" text,
  "validUntil" text,
  conditions jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de imágenes del carrusel hero
create table public.hero_images (
  id serial primary key,
  url text not null,
  "order" int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.hero_images enable row level security;

-- Políticas públicas de lectura (para el sitio web)
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read products" on public.products for select using (true);
create policy "Public read promotions" on public.promotions for select using (true);
create policy "Public read hero_images" on public.hero_images for select using (true);

-- Políticas de escritura solo para usuarios autenticados (panel admin)
create policy "Authenticated write categories" on public.categories for all using (auth.role() = 'authenticated');
create policy "Authenticated write products" on public.products for all using (auth.role() = 'authenticated');
create policy "Authenticated write promotions" on public.promotions for all using (auth.role() = 'authenticated');
create policy "Authenticated write hero_images" on public.hero_images for all using (auth.role() = 'authenticated');
