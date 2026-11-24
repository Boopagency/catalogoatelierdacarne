-- Promoção só às quartas: o preço promocional vale apenas na quarta (horário de Brasília).
alter table public.products add column promo_quarta boolean not null default false;

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
      select p.name, case when p.promo_quarta and extract(dow from now() at time zone 'America/Sao_Paulo') <> 3 then p.price else coalesce(p.promo_price, p.price) end, p.unit into v_name_item, v_price, v_unit
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
