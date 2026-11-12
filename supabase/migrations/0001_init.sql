-- Atelier da Carne — catálogo digital
-- Schema, segurança (RLS), funções de pedido e storage.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Admins (quem pode entrar no portal)
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admin le o proprio registro" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Configurações da loja (linha única)
-- ---------------------------------------------------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Atelier da Carne',
  tagline text,
  whatsapp text not null,
  phone_display text,
  instagram text,
  address text,
  maps_url text,
  hours jsonb not null default '[]'::jsonb,
  pickup_enabled boolean not null default true,
  delivery_enabled boolean not null default true,
  delivery_note text,
  announcement text,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text,
  animal text check (animal in ('bovino', 'suino', 'frango')),
  cover_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text,
  unit text not null default 'kg' check (unit in ('kg', 'un')),
  price numeric(10, 2) not null check (price >= 0),
  promo_price numeric(10, 2) check (promo_price is null or promo_price >= 0),
  image_url text,
  animal text check (animal in ('bovino', 'suino', 'frango')),
  cut_regions text[] not null default '{}',
  prep_tags text[] not null default '{}',
  badge text,
  available boolean not null default true,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id, sort_order);
alter table public.products enable row level security;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.kits (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  items text[] not null default '{}',
  price numeric(10, 2) not null check (price >= 0),
  old_price numeric(10, 2) check (old_price is null or old_price >= 0),
  image_url text,
  badge text,
  note text,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.kits enable row level security;
create trigger kits_touch before update on public.kits
  for each row execute function public.touch_updated_at();

-- Leitura pública do catálogo, escrita só para admins
create policy "catalogo publico" on public.settings for select to anon, authenticated using (true);
create policy "catalogo publico" on public.categories for select to anon, authenticated using (true);
create policy "catalogo publico" on public.products for select to anon, authenticated using (true);
create policy "catalogo publico" on public.kits for select to anon, authenticated using (true);

create policy "admin edita" on public.settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin insere" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "admin edita" on public.categories for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin apaga" on public.categories for delete to authenticated using ((select public.is_admin()));
create policy "admin insere" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "admin edita" on public.products for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin apaga" on public.products for delete to authenticated using ((select public.is_admin()));
create policy "admin insere" on public.kits for insert to authenticated with check ((select public.is_admin()));
create policy "admin edita" on public.kits for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin apaga" on public.kits for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('public.order_number_seq'),
  code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  fulfillment text not null check (fulfillment in ('retirada', 'entrega')),
  address text,
  neighborhood text,
  scheduled_for text,
  payment_method text,
  notes text,
  status text not null default 'novo'
    check (status in ('novo', 'confirmado', 'separando', 'pronto', 'em_rota', 'concluido', 'cancelado')),
  status_history jsonb not null default '[]'::jsonb,
  subtotal numeric(10, 2) not null default 0,
  item_count int not null default 0,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_phone_idx on public.orders (customer_phone, created_at desc);
alter table public.orders enable row level security;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  kit_id uuid references public.kits (id) on delete set null,
  name text not null,
  unit text not null check (unit in ('kg', 'un', 'kit')),
  quantity numeric(8, 3) not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null,
  notes text,
  sort int not null default 0
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_kit_idx on public.order_items (kit_id);
alter table public.order_items enable row level security;

create policy "admin le pedidos" on public.orders for select to authenticated using ((select public.is_admin()));
create policy "admin edita pedidos" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin apaga pedidos" on public.orders for delete to authenticated using ((select public.is_admin()));
create policy "admin le itens" on public.order_items for select to authenticated using ((select public.is_admin()));

-- Histórico de status automático
create or replace function public.orders_status_history()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.status_history := jsonb_build_array(jsonb_build_object('status', new.status, 'at', now()));
  elsif new.status is distinct from old.status then
    new.status_history := coalesce(old.status_history, '[]'::jsonb)
      || jsonb_build_array(jsonb_build_object('status', new.status, 'at', now()));
  end if;
  return new;
end $$;
create trigger orders_status_history before insert or update on public.orders
  for each row execute function public.orders_status_history();

-- Código curto e não sequencial para o cliente acompanhar o pedido
create or replace function public.new_order_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.orders where code = result);
  end loop;
  return result;
end $$;

-- Cria pedido: valida tudo e recalcula preços a partir do banco
create or replace function public.place_order(payload jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_name text := btrim(coalesce(payload ->> 'customer_name', ''));
  v_phone text := regexp_replace(coalesce(payload ->> 'customer_phone', ''), '\D', '', 'g');
  v_fulfillment text := coalesce(payload ->> 'fulfillment', 'retirada');
  v_address text := nullif(btrim(coalesce(payload ->> 'address', '')), '');
  v_items jsonb := coalesce(payload -> 'items', '[]'::jsonb);
  v_item jsonb;
  v_order_id uuid;
  v_code text;
  v_number int;
  v_subtotal numeric(10, 2) := 0;
  v_count int := 0;
  v_qty numeric;
  v_price numeric(10, 2);
  v_unit text;
  v_name_item text;
  v_ref uuid;
  v_sort int := 0;
  v_settings public.settings;
begin
  select * into v_settings from public.settings where id = 1;

  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'Informe seu nome.' using errcode = '22023';
  end if;
  if length(v_phone) < 10 or length(v_phone) > 13 then
    raise exception 'Informe um WhatsApp válido com DDD.' using errcode = '22023';
  end if;
  if v_fulfillment not in ('retirada', 'entrega') then
    raise exception 'Forma de recebimento inválida.' using errcode = '22023';
  end if;
  if v_fulfillment = 'entrega' and not coalesce(v_settings.delivery_enabled, true) then
    raise exception 'No momento não estamos fazendo entregas.' using errcode = '22023';
  end if;
  if v_fulfillment = 'retirada' and not coalesce(v_settings.pickup_enabled, true) then
    raise exception 'No momento não estamos com retirada na loja.' using errcode = '22023';
  end if;
  if v_fulfillment = 'entrega' and (v_address is null or length(v_address) < 5) then
    raise exception 'Informe o endereço de entrega.' using errcode = '22023';
  end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'Seu carrinho está vazio.' using errcode = '22023';
  end if;
  if jsonb_array_length(v_items) > 60 then
    raise exception 'Pedido com itens demais.' using errcode = '22023';
  end if;

  -- proteção simples contra envios repetidos
  if (select count(*) from public.orders
      where customer_phone = v_phone and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitos pedidos em sequência. Aguarde alguns minutos.' using errcode = '22023';
  end if;

  v_code := public.new_order_code();
  insert into public.orders (code, customer_name, customer_phone, fulfillment, address, neighborhood,
                             scheduled_for, payment_method, notes)
  values (v_code, v_name, v_phone, v_fulfillment, v_address,
          left(nullif(btrim(coalesce(payload ->> 'neighborhood', '')), ''), 80),
          left(nullif(btrim(coalesce(payload ->> 'scheduled_for', '')), ''), 80),
          left(nullif(btrim(coalesce(payload ->> 'payment_method', '')), ''), 40),
          left(nullif(btrim(coalesce(payload ->> 'notes', '')), ''), 500))
  returning id, number into v_order_id, v_number;

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_sort := v_sort + 1;
    begin
      v_ref := (v_item ->> 'id')::uuid;
      v_qty := (v_item ->> 'quantity')::numeric;
    exception when others then
      raise exception 'Item inválido no carrinho.' using errcode = '22023';
    end;

    if coalesce(v_item ->> 'type', 'product') = 'kit' then
      select k.name, k.price into v_name_item, v_price
        from public.kits k where k.id = v_ref and k.available;
      if not found then
        raise exception 'Um dos kits não está mais disponível. Atualize a página.' using errcode = '22023';
      end if;
      v_unit := 'kit';
      if v_qty <> trunc(v_qty) or v_qty < 1 or v_qty > 20 then
        raise exception 'Quantidade inválida para %.', v_name_item using errcode = '22023';
      end if;
      insert into public.order_items (order_id, kit_id, name, unit, quantity, unit_price, line_total, notes, sort)
      values (v_order_id, v_ref, v_name_item, v_unit, v_qty, v_price, round(v_price * v_qty, 2),
              left(nullif(btrim(coalesce(v_item ->> 'notes', '')), ''), 200), v_sort);
    else
      select p.name, coalesce(p.promo_price, p.price), p.unit into v_name_item, v_price, v_unit
        from public.products p
        join public.categories c on c.id = p.category_id
        where p.id = v_ref and p.available and c.active;
      if not found then
        raise exception 'Um dos produtos esgotou. Atualize a página.' using errcode = '22023';
      end if;
      if v_unit = 'kg' and (v_qty < 0.1 or v_qty > 50) then
        raise exception 'Quantidade inválida para %.', v_name_item using errcode = '22023';
      end if;
      if v_unit = 'un' and (v_qty <> trunc(v_qty) or v_qty < 1 or v_qty > 500) then
        raise exception 'Quantidade inválida para %.', v_name_item using errcode = '22023';
      end if;
      insert into public.order_items (order_id, product_id, name, unit, quantity, unit_price, line_total, notes, sort)
      values (v_order_id, v_ref, v_name_item, v_unit, v_qty, v_price, round(v_price * v_qty, 2),
              left(nullif(btrim(coalesce(v_item ->> 'notes', '')), ''), 200), v_sort);
    end if;

    v_subtotal := v_subtotal + round(v_price * v_qty, 2);
    v_count := v_count + 1;
  end loop;

  update public.orders set subtotal = v_subtotal, item_count = v_count where id = v_order_id;

  return jsonb_build_object('code', v_code, 'number', v_number, 'subtotal', v_subtotal);
end $$;
revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- Acompanhamento público do pedido pelo código (sem dados sensíveis)
create or replace function public.track_order(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', o.code,
    'number', o.number,
    'first_name', split_part(o.customer_name, ' ', 1),
    'fulfillment', o.fulfillment,
    'scheduled_for', o.scheduled_for,
    'status', o.status,
    'status_history', o.status_history,
    'subtotal', o.subtotal,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.name, 'unit', i.unit, 'quantity', i.quantity,
        'unit_price', i.unit_price, 'line_total', i.line_total, 'notes', i.notes) order by i.sort)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.code = upper(btrim(p_code));
$$;
revoke all on function public.track_order(text) from public;
grant execute on function public.track_order(text) to anon, authenticated;

-- Tempo real para o painel de pedidos
alter publication supabase_realtime add table public.orders;

-- ---------------------------------------------------------------------------
-- Storage: fotos do catálogo
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "admin envia fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogo' and (select public.is_admin()));
create policy "admin troca fotos" on storage.objects for update to authenticated
  using (bucket_id = 'catalogo' and (select public.is_admin()));
create policy "admin apaga fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'catalogo' and (select public.is_admin()));
