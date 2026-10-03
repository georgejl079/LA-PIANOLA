-- SCRIPT SEGURO: Solo agrega la tabla store_info sin borrar datos existentes
-- Ejecuta esto en Supabase SQL Editor

-- Crear tabla store_info si no existe
create table if not exists public.store_info (
  id int primary key default 1,
  story text,
  mission text,
  hours text,
  address text,
  email text,
  instagram text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insertar fila inicial si no existe
insert into public.store_info (id)
select 1
where not exists (select 1 from public.store_info where id = 1);

-- Habilitar RLS en store_info
alter table public.store_info enable row level security;

-- Bloque para crear políticas solo si no existen
do $$
begin
  -- Políticas para store_info
  if not exists (select 1 from pg_policies where policyname = 'Public read store_info' and tablename = 'store_info') then
    create policy "Public read store_info" on public.store_info for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Authenticated write store_info' and tablename = 'store_info') then
    create policy "Authenticated write store_info" on public.store_info for all using (auth.role() = 'authenticated');
  end if;

  -- Políticas para categories
  if not exists (select 1 from pg_policies where policyname = 'Public read categories' and tablename = 'categories') then
    create policy "Public read categories" on public.categories for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Authenticated write categories' and tablename = 'categories') then
    create policy "Authenticated write categories" on public.categories for all using (auth.role() = 'authenticated');
  end if;

  -- Políticas para products
  if not exists (select 1 from pg_policies where policyname = 'Public read products' and tablename = 'products') then
    create policy "Public read products" on public.products for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Authenticated write products' and tablename = 'products') then
    create policy "Authenticated write products" on public.products for all using (auth.role() = 'authenticated');
  end if;

  -- Políticas para promotions
  if not exists (select 1 from pg_policies where policyname = 'Public read promotions' and tablename = 'promotions') then
    create policy "Public read promotions" on public.promotions for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Authenticated write promotions' and tablename = 'promotions') then
    create policy "Authenticated write promotions" on public.promotions for all using (auth.role() = 'authenticated');
  end if;

  -- Políticas para hero_images
  if not exists (select 1 from pg_policies where policyname = 'Public read hero_images' and tablename = 'hero_images') then
    create policy "Public read hero_images" on public.hero_images for select using (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Authenticated write hero_images' and tablename = 'hero_images') then
    create policy "Authenticated write hero_images" on public.hero_images for all using (auth.role() = 'authenticated');
  end if;
end $$;
