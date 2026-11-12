-- Gerado por scripts/build-seed-sql.mjs. Não edite à mão.

begin;

insert into public.settings (id, store_name, tagline, whatsapp, phone_display, instagram, address, maps_url, hours, pickup_enabled, delivery_enabled, delivery_note, announcement)
values (1, 'Atelier da Carne', 'Carnes de qualidade e cortes especiais', '5541996752749', '(41) 99675-2749', 'atelierdacarne4', 'Rua Maranhão, 1710, Portão, Curitiba/PR', 'https://maps.google.com/?q=Rua+Maranh%C3%A3o,+1710+-+Port%C3%A3o,+Curitiba+-+PR', '[{"days":[1,2,3,4,5],"open":"09:00","close":"19:30"},{"days":[6],"open":"09:00","close":"18:00"}]'::jsonb, true, true, 'A taxa de entrega é combinada pelo WhatsApp conforme o bairro.', 'Encomende pelo catálogo e retire sem fila, ou receba em casa.')
on conflict (id) do nothing;

insert into public.categories (slug, name, subtitle, animal, cover_url, sort_order)
values ('bovinos-premium', 'Bovinos Premium', 'Cortes nobres para grelha, parrilla e ocasiões especiais', 'bovino', '/categorias/bovinas-premium.webp', 0)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'ancho-black', 'Ancho Black', 'Miolo da costela com marmoreio intenso. Suculento, macio e cheio de sabor. O queridinho de quem entende de churrasco.', 'kg', 69.99, 'bovino', array['ancho']::text[], array['Grelha', 'Parrilla']::text[], 'Black', true, 0
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'mignon-bovino', 'Mignon Bovino', 'O corte mais macio do boi. Perfeito para medalhões, tournedos e preparos rápidos em fogo alto.', 'kg', 110.99, 'bovino', array['file-mignon']::text[], array['Frigideira', 'Grelha', 'Medalhão']::text[], null, true, 1
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'prime-rib-bovino', 'Prime Rib Bovino', 'Ancho com osso: mais sabor, mais suculência e uma apresentação de respeito na tábua.', 'kg', 69.99, 'bovino', array['ancho']::text[], array['Grelha', 'Forno']::text[], null, false, 2
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'prime-rib-suino', 'Prime Rib Suíno', 'Carré suíno alto, com osso, macio e suculento. Fica incrível na brasa ou selado e finalizado no forno.', 'kg', 29.99, 'suino', array['carre']::text[], array['Grelha', 'Forno']::text[], null, false, 3
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 't-bone', 'T-Bone', 'Dois cortes em um: contrafilé de um lado e mignon do outro, separados pelo osso em T.', 'kg', 59.99, 'bovino', array['contrafile', 'file-mignon']::text[], array['Grelha', 'Parrilla']::text[], null, false, 4
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'bife-ancho', 'Bife Ancho', 'Bifes altos de ancho, prontos para selar. Gordura entremeada que derrete e perfuma a carne.', 'kg', 75.99, 'bovino', array['ancho']::text[], array['Grelha', 'Frigideira']::text[], null, false, 5
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'contra-file-chorizo', 'Contra Filé Chorizo', 'Bife de chorizo à moda argentina: alto, com capa de gordura lateral e sabor marcante.', 'kg', 79.99, 'bovino', array['contrafile']::text[], array['Grelha', 'Parrilla']::text[], null, true, 6
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'cowboy-steak', 'Cowboy Steak', 'Ancho com o osso da costela aparado. Um corte imponente para ser o centro da mesa.', 'kg', 79.99, 'bovino', array['ancho']::text[], array['Grelha', 'Parrilla']::text[], 'Destaque', false, 7
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'denver-steak', 'Denver Steak', 'Corte do miolo do acém com marmoreio surpreendente. Macio, saboroso e ótimo custo-benefício.', 'kg', 79.99, 'bovino', array['acem']::text[], array['Grelha', 'Frigideira']::text[], null, false, 8
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'flat-iron-steak', 'Flat Iron Steak', 'Retirado do miolo da paleta: textura macia e sabor intenso, um dos cortes mais macios do boi.', 'kg', 89.99, 'bovino', array['paleta']::text[], array['Grelha', 'Frigideira']::text[], null, false, 9
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'short-rib', 'Short Rib', 'Costela em peça curta com muita carne sobre o osso. Ideal para defumar ou assar lentamente.', 'kg', 69.99, 'bovino', array['costela']::text[], array['Defumação', 'Forno', 'Parrilla']::text[], null, false, 10
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'shoulder-steak', 'Shoulder Steak', 'Bife da paleta, magro e saboroso, que vai bem na grelha ou na frigideira bem quente.', 'kg', 79.99, 'bovino', array['paleta']::text[], array['Grelha', 'Frigideira']::text[], null, false, 11
from public.categories where slug = 'bovinos-premium'
on conflict (slug) do nothing;

insert into public.categories (slug, name, subtitle, animal, cover_url, sort_order)
values ('bovinos', 'Bovinos', 'Cortes do dia a dia, moídos e preparados', 'bovino', '/categorias/bovinas.webp', 1)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'picanha-bovina', 'Picanha Bovina', 'A rainha do churrasco brasileiro, com a capa de gordura que garante suculência.', 'kg', 110.99, 'bovino', array['picanha']::text[], array['Churrasco', 'Grelha']::text[], 'Mais pedido', true, 0
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'fraldinha', 'Fraldinha', 'Fibras longas, muito suculenta e saborosa. Asse inteira e fatie contra a fibra.', 'kg', 59.99, 'bovino', array['fraldinha']::text[], array['Churrasco', 'Forno']::text[], null, false, 1
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'assado-de-tiras', 'Assado de Tiras', 'Costela em tiras transversais, clássico da parrilla. Rápida na brasa e cheia de sabor.', 'kg', 69.99, 'bovino', array['costela']::text[], array['Parrilla', 'Churrasco']::text[], null, false, 2
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'costela-bovina-desossada', 'Costela Bovina Desossada', 'Costela sem osso, prática para assados longos e desfiados.', 'kg', 49.99, 'bovino', array['costela']::text[], array['Forno', 'Fogo de chão']::text[], null, false, 3
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'costela-bovina-dianteira', 'Costela Bovina Dianteira', null, 'kg', 49.99, 'bovino', array['costela']::text[], array['Forno', 'Fogo de chão']::text[], null, false, 4
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'costela-bovina-ripa', 'Costela Bovina Ripa', null, 'kg', 39.99, 'bovino', array['costela']::text[], array['Churrasco', 'Forno']::text[], null, false, 5
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'costela-minga', 'Costela Minga', null, 'kg', 39.99, 'bovino', array['ponta-agulha']::text[], array['Panela de pressão', 'Forno']::text[], null, false, 6
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'costela-borboleta', 'Costela Borboleta', null, 'kg', 39.99, 'bovino', array['costela']::text[], array['Churrasco', 'Forno']::text[], null, false, 7
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'costela-resfriada-temperada', 'Costela Resfriada Temperada', null, 'kg', 39.99, 'bovino', array['costela']::text[], array['Forno', 'Churrasco']::text[], 'Temperada', false, 8
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'cupim-bovino', 'Cupim Bovino', 'Corte da corcova do boi, marmorizado e macio quando assado lentamente.', 'kg', 52.99, 'bovino', array['cupim']::text[], array['Forno', 'Defumação']::text[], null, false, 9
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'alcatra-sem-osso', 'Alcatra sem Osso', null, 'kg', 84.99, 'bovino', array['alcatra']::text[], array['Grelha', 'Bifes', 'Churrasco']::text[], null, false, 10
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'alcatra-com-osso', 'Alcatra com Osso', null, 'kg', 59.99, 'bovino', array['alcatra']::text[], array['Churrasco', 'Grelha']::text[], null, false, 11
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'bife-milanesa-alcatra', 'Bife Milanesa Alcatra', null, 'kg', 85.99, 'bovino', array['alcatra']::text[], array['Empanar', 'Frigideira']::text[], null, false, 12
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'strogonoff-alcatra', 'Strogonoff Alcatra', null, 'kg', 84.98, 'bovino', array['alcatra']::text[], array['Panela']::text[], null, false, 13
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'patinho', 'Patinho', null, 'kg', 54.99, 'bovino', array['patinho']::text[], array['Bifes', 'Moído', 'Panela']::text[], null, false, 14
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'bife-milanesa-patinho', 'Bife Milanesa Patinho', null, 'kg', 55.99, 'bovino', array['patinho']::text[], array['Empanar', 'Frigideira']::text[], null, false, 15
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'strogonoff-patinho', 'Strogonoff Patinho', null, 'kg', 52.99, 'bovino', array['patinho']::text[], array['Panela']::text[], null, false, 16
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'coxao-mole', 'Coxão Mole', null, 'kg', 57.99, 'bovino', array['coxao-mole']::text[], array['Bifes', 'Panela']::text[], null, false, 17
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'coxao-mole-moido', 'Coxão Mole Moído', null, 'kg', 59.99, 'bovino', array['coxao-mole']::text[], array['Moído', 'Hambúrguer']::text[], null, false, 18
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'strogonoff-coxao', 'Strogonoff Coxão', null, 'kg', 57.99, 'bovino', array['coxao-mole']::text[], array['Panela']::text[], null, false, 19
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'bife-milanesa-coxao', 'Bife Milanesa Coxão', null, 'kg', 58.99, 'bovino', array['coxao-mole']::text[], array['Empanar', 'Frigideira']::text[], null, false, 20
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'posta-branca', 'Posta Branca', null, 'kg', 42.99, 'bovino', array['coxao-duro']::text[], array['Panela', 'Cozidos']::text[], null, false, 21
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'posta-vermelha', 'Posta Vermelha', null, 'kg', 47.99, 'bovino', array['coxao-mole']::text[], array['Panela', 'Assados']::text[], null, false, 22
from public.categories where slug = 'bovinos'
on conflict (slug) do nothing;

insert into public.categories (slug, name, subtitle, animal, cover_url, sort_order)
values ('suinos', 'Suínos', 'Do lombo ao pernil, inclusive os recheados da casa', 'suino', '/categorias/suinas.webp', 2)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'picanha-suina', 'Picanha Suína', 'Macia, com capa de gordura que fica crocante na brasa.', 'kg', 39.99, 'suino', array['picanha']::text[], array['Churrasco', 'Grelha']::text[], null, true, 0
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'lombo-suino', 'Lombo Suíno', null, 'kg', 34.99, 'suino', array['lombo']::text[], array['Forno', 'Grelha']::text[], null, false, 1
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'mignon-suino', 'Mignon Suíno', null, 'kg', 39.99, 'suino', array['mignon']::text[], array['Frigideira', 'Medalhão']::text[], null, false, 2
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'carre-suino', 'Carré Suíno', null, 'kg', 21.99, 'suino', array['carre']::text[], array['Grelha', 'Forno']::text[], null, false, 3
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'bisteca-suina', 'Bisteca Suína', null, 'kg', 21.99, 'suino', array['carre']::text[], array['Grelha', 'Frigideira']::text[], null, false, 4
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'bisteca-suina-especial', 'Bisteca Suína Especial', null, 'kg', 25.99, 'suino', array['carre']::text[], array['Grelha', 'Frigideira']::text[], null, false, 5
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'costela-suina-sem-pele', 'Costela Suína sem Pele', null, 'kg', 39.99, 'suino', array['costela']::text[], array['Forno', 'Churrasco']::text[], null, false, 6
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'costela-suina-defumada', 'Costela Suína Defumada', null, 'kg', 55.99, 'suino', array['costela']::text[], array['Feijoada', 'Forno']::text[], 'Defumada', false, 7
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'panceta-suina', 'Panceta Suína', null, 'kg', 39.99, 'suino', array['barriga']::text[], array['Churrasco', 'Forno']::text[], null, false, 8
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'barriga-resfriada-temperada', 'Barriga Resfriada Temperada', null, 'kg', 39.99, 'suino', array['barriga']::text[], array['Forno', 'Churrasco']::text[], 'Temperada', false, 9
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'paleta-suina-com-osso', 'Paleta Suína com Osso', null, 'kg', 25.99, 'suino', array['paleta']::text[], array['Forno', 'Panela']::text[], null, false, 10
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'paleta-suina-sem-osso', 'Paleta Suína sem Osso', null, 'kg', 31.99, 'suino', array['paleta']::text[], array['Forno', 'Panela']::text[], null, false, 11
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'sobrepaleta-suina', 'Sobrepaleta Suína', null, 'kg', 32.99, 'suino', array['copa']::text[], array['Churrasco', 'Forno']::text[], null, false, 12
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'pernil-suino-com-osso', 'Pernil Suíno com Osso', null, 'kg', 25.99, 'suino', array['pernil']::text[], array['Forno']::text[], null, false, 13
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'pernil-suino-sem-osso', 'Pernil Suíno sem Osso', null, 'kg', 31.99, 'suino', array['pernil']::text[], array['Forno', 'Desfiado']::text[], null, false, 14
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'lombo-suino-recheado', 'Lombo Suíno Recheado', 'Recheado na casa, pronto para ir ao forno.', 'kg', 49.90, 'suino', array['lombo']::text[], array['Forno']::text[], 'Recheado', false, 15
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'panceta-suina-recheada', 'Panceta Suína Recheada', 'Panceta enrolada e recheada na casa. Pele pururuca, interior suculento.', 'kg', 49.90, 'suino', array['barriga']::text[], array['Forno']::text[], 'Recheado', false, 16
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'pernil-desossado-recheado', 'Pernil Desossado Recheado', null, 'kg', 49.90, 'suino', array['pernil']::text[], array['Forno']::text[], 'Recheado', false, 17
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'sobrepaleta-desossada-recheada', 'Sobrepaleta Desossada Recheada', null, 'kg', 49.90, 'suino', array['copa']::text[], array['Forno']::text[], 'Recheado', false, 18
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'mascara-suina', 'Máscara Suína', null, 'kg', 21.99, 'suino', array['cabeca']::text[], array['Feijoada', 'Cozidos']::text[], null, false, 19
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'pe-suino', 'Pé Suíno', null, 'kg', 21.99, 'suino', array['pe']::text[], array['Feijoada']::text[], null, false, 20
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'rabo-suino', 'Rabo Suíno', null, 'kg', 21.99, 'suino', array['rabo']::text[], array['Feijoada']::text[], null, false, 21
from public.categories where slug = 'suinos'
on conflict (slug) do nothing;

insert into public.categories (slug, name, subtitle, animal, cover_url, sort_order)
values ('frango', 'Frango', 'Cortes frescos, temperados e desossados', 'frango', '/categorias/frango-2.webp', 3)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'coxinha-da-asa-temperada', 'Coxinha da Asa Temperada', null, 'kg', 25.99, 'frango', array['asa']::text[], array['Churrasco', 'Airfryer']::text[], 'Temperada', true, 0
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'coxinha-da-asa', 'Coxinha da Asa', null, 'kg', 24.99, 'frango', array['asa']::text[], array['Churrasco', 'Airfryer', 'Forno']::text[], null, false, 1
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'tulipa', 'Tulipa', null, 'kg', 30.99, 'frango', array['asa']::text[], array['Airfryer', 'Churrasco']::text[], null, false, 2
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'tulipa-na-mostarda', 'Tulipa na Mostarda', null, 'kg', 31.99, 'frango', array['asa']::text[], array['Airfryer', 'Churrasco']::text[], 'Temperada', false, 3
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'tulipa-temperada', 'Tulipa Temperada', null, 'kg', 31.99, 'frango', array['asa']::text[], array['Airfryer', 'Churrasco']::text[], 'Temperada', false, 4
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'file-de-peito-de-frango', 'Filé de Peito de Frango', null, 'kg', 29.99, 'frango', array['peito']::text[], array['Grelha', 'Frigideira']::text[], null, false, 5
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'peito-de-frango-sem-osso', 'Peito de Frango sem Osso', null, 'kg', 29.99, 'frango', array['peito']::text[], array['Forno', 'Desfiado']::text[], null, false, 6
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'strogonoff-de-frango', 'Strogonoff de Frango', null, 'kg', 29.99, 'frango', array['peito']::text[], array['Panela']::text[], null, false, 7
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'coxa-com-sobrecoxa', 'Coxa com Sobrecoxa', null, 'kg', 13.99, 'frango', array['coxa', 'sobrecoxa']::text[], array['Forno', 'Churrasco']::text[], null, false, 8
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'coxa-com-sobrecoxa-desossada', 'Coxa com Sobrecoxa Desossada', null, 'kg', 21.99, 'frango', array['coxa', 'sobrecoxa']::text[], array['Churrasco', 'Grelha']::text[], null, false, 9
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'coxa-de-frango', 'Coxa de Frango', null, 'kg', 10.99, 'frango', array['coxa']::text[], array['Forno', 'Airfryer']::text[], null, false, 10
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'sobrecoxa', 'Sobrecoxa', null, 'kg', 15.99, 'frango', array['sobrecoxa']::text[], array['Forno', 'Churrasco']::text[], null, false, 11
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'sobrecoxa-desossada', 'Sobrecoxa Desossada', null, 'kg', 21.99, 'frango', array['sobrecoxa']::text[], array['Churrasco', 'Grelha']::text[], null, false, 12
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'coracao-de-frango', 'Coração de Frango', null, 'kg', 45.99, 'frango', array['miudos']::text[], array['Churrasco']::text[], null, false, 13
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'moela-de-frango', 'Moela de Frango', null, 'kg', 12.99, 'frango', array['miudos']::text[], array['Panela', 'Petisco']::text[], null, false, 14
from public.categories where slug = 'frango'
on conflict (slug) do nothing;

insert into public.categories (slug, name, subtitle, animal, cover_url, sort_order)
values ('linguicas', 'Linguiças', 'Seleção Bizinelli, Belvedere e Perdigão', null, '/categorias/linguicas.webp', 4)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-toscana-bizinelli', 'Linguiça Toscana Bizinelli', null, 'kg', 24.99, 'suino', array['pernil']::text[], array['Churrasco']::text[], null, false, 0
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-toscana-na-brasa-perdigao', 'Linguiça Toscana na Brasa Perdigão', null, 'kg', 32.90, null, '{}'::text[], array['Churrasco']::text[], null, false, 1
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-pernil-bizinelli', 'Linguiça Pernil Bizinelli', null, 'kg', 29.90, 'suino', array['pernil']::text[], array['Churrasco']::text[], null, false, 2
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-pernil-apimentada-bizinelli', 'Linguiça Pernil Apimentada Bizinelli', null, 'kg', 39.99, 'suino', array['pernil']::text[], array['Churrasco']::text[], 'Picante', false, 3
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-pernil-com-bacon-bizinelli', 'Linguiça Pernil com Bacon Bizinelli', null, 'kg', 39.99, 'suino', array['pernil']::text[], array['Churrasco']::text[], null, false, 4
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-pernil-com-queijo-bizinelli', 'Linguiça Pernil com Queijo Bizinelli', null, 'kg', 39.99, 'suino', array['pernil']::text[], array['Churrasco']::text[], null, false, 5
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-pernil-grossa', 'Linguiça Pernil Grossa', null, 'kg', 26.99, 'suino', array['pernil']::text[], array['Churrasco']::text[], null, false, 6
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-campeira-bizinelli', 'Linguiça Campeira Bizinelli', null, 'kg', 39.99, null, '{}'::text[], array['Churrasco']::text[], null, false, 7
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-fina-bizinelli', 'Linguiça Fina Bizinelli', null, 'kg', 45.99, null, '{}'::text[], array['Churrasco', 'Petisco']::text[], null, false, 8
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-fina-belvedere', 'Linguiça Fina Belvedere', null, 'kg', 45.99, null, '{}'::text[], array['Churrasco', 'Petisco']::text[], null, false, 9
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-calabresa', 'Linguiça Calabresa', null, 'kg', 32.99, null, '{}'::text[], array['Petisco', 'Feijoada']::text[], null, false, 10
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'linguica-paio-bizinelli', 'Linguiça Paio Bizinelli', null, 'kg', 35.90, null, '{}'::text[], array['Feijoada']::text[], null, false, 11
from public.categories where slug = 'linguicas'
on conflict (slug) do nothing;

insert into public.categories (slug, name, subtitle, animal, cover_url, sort_order)
values ('hamburgueres', 'Hambúrgueres', 'Blends da casa, moldados no Atelier', 'bovino', '/categorias/hamburgueres.webp', 5)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'hamburguer-de-picanha-180g', 'Hambúrguer de Picanha 180g', null, 'un', 7.00, 'bovino', array['picanha']::text[], array['Chapa', 'Grelha']::text[], '180 g', true, 0
from public.categories where slug = 'hamburgueres'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'hamburguer-de-fraldinha-150g', 'Hambúrguer de Fraldinha 150g', null, 'un', 6.50, 'bovino', array['fraldinha']::text[], array['Chapa', 'Grelha']::text[], '150 g', false, 1
from public.categories where slug = 'hamburgueres'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'hamburguer-de-costela-150g', 'Hambúrguer de Costela 150g', null, 'un', 6.00, 'bovino', array['costela']::text[], array['Chapa', 'Grelha']::text[], '150 g', false, 2
from public.categories where slug = 'hamburgueres'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'hamburguer-de-acem-com-bacon', 'Hambúrguer de Acém com Bacon', null, 'kg', 40.00, 'bovino', array['acem']::text[], array['Chapa', 'Grelha']::text[], null, false, 3
from public.categories where slug = 'hamburgueres'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'hamburguer-bovino', 'Hambúrguer Bovino', null, 'kg', 33.99, 'bovino', '{}'::text[], array['Chapa', 'Grelha']::text[], null, false, 4
from public.categories where slug = 'hamburgueres'
on conflict (slug) do nothing;

insert into public.categories (slug, name, subtitle, animal, cover_url, sort_order)
values ('espetinhos', 'Espetinhos', 'Montados na casa, prontos para a brasa', null, '/categorias/espetinhos.webp', 6)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'espetinho-de-alcatra', 'Espetinho de Alcatra', null, 'kg', 92.99, 'bovino', array['alcatra']::text[], array['Churrasco']::text[], null, false, 0
from public.categories where slug = 'espetinhos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'espetinho-de-coracao', 'Espetinho de Coração', null, 'kg', 46.99, 'frango', array['miudos']::text[], array['Churrasco']::text[], null, false, 1
from public.categories where slug = 'espetinhos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'espetinho-de-frango', 'Espetinho de Frango', null, 'kg', 30.99, 'frango', array['peito']::text[], array['Churrasco']::text[], null, false, 2
from public.categories where slug = 'espetinhos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'espetinho-de-frango-com-bacon', 'Espetinho de Frango com Bacon', null, 'kg', 39.99, 'frango', array['peito']::text[], array['Churrasco']::text[], null, false, 3
from public.categories where slug = 'espetinhos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'espetinho-de-kafta', 'Espetinho de Kafta', null, 'kg', 42.99, null, '{}'::text[], array['Churrasco']::text[], null, false, 4
from public.categories where slug = 'espetinhos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'espetinho-de-linguica-fina', 'Espetinho de Linguiça Fina', null, 'kg', 46.99, null, '{}'::text[], array['Churrasco']::text[], null, false, 5
from public.categories where slug = 'espetinhos'
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, 'espetinho-xixo', 'Espetinho Xixo', 'Carne, linguiça, pimentão e cebola intercalados no espeto.', 'kg', 49.99, null, '{}'::text[], array['Churrasco']::text[], null, false, 6
from public.categories where slug = 'espetinhos'
on conflict (slug) do nothing;

insert into public.kits (slug, name, tagline, items, price, old_price, image_url, badge, note, sort_order)
values ('kit-semanal', 'Kit Semanal', 'A semana inteira resolvida', array['500 g Strogonoff de carne', '500 g Moída de patinho', '500 g Bife de patinho', '500 g Filé de peito de frango', '500 g Strogonoff de frango', '500 g Sobrepaleta suína']::text[], 139.90, null, '/categorias/suinas.webp', 'Mais vendido', null, 0)
on conflict (slug) do nothing;

insert into public.kits (slug, name, tagline, items, price, old_price, image_url, badge, note, sort_order)
values ('quarta-do-hamburguer', 'Quarta do Hambúrguer', 'Burger night completa para 6', array['6 pães brioche', '6 hambúrgueres 150 g (fraldinha ou costela)', '6 fatias de queijo cheddar', '12 fatias de bacon', '1 sacola térmica']::text[], 59.90, null, '/categorias/hamburgueres.webp', 'Toda quarta', null, 1)
on conflict (slug) do nothing;

insert into public.kits (slug, name, tagline, items, price, old_price, image_url, badge, note, sort_order)
values ('kit-churrasco', 'Kit Churrasco', 'O churrasco de domingo, pronto', array['1 kg Contrafilé com osso', '1 kg Coxinha da asa temperada', '500 g Linguiça Toscana Bizinelli', '1 Pão de alho Santa Massa 240 g']::text[], 129.90, null, '/categorias/espetinhos.webp', 'Pedir com 2h', 'Pedido com 2 horas de antecedência.', 2)
on conflict (slug) do nothing;

commit;
