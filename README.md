# Atelier da Carne — Catálogo digital

Catálogo online do Atelier da Carne (Portão, Curitiba). Substitui o PDF: o cliente busca cortes, vê de onde cada um vem no
boi/porco/frango, monta o pedido e envia pelo WhatsApp. A loja atualiza preços, fotos e disponibilidade num portal e
acompanha os pedidos em tempo real.

- **Catálogo público:** `/`
- **Acompanhamento do pedido (cliente):** `/pedido/CODIGO`
- **Portal da loja:** `/admin`

## Stack

Next.js 15 (App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Realtime) · Vercel.

## Como funciona

| Parte | Onde |
| --- | --- |
| Produtos, kits e categorias do PDF | `src/data/catalog.json` → gera `supabase/seed.sql` (`npm run seed:sql`) |
| Banco, segurança (RLS) e funções | `supabase/migrations/0001_init.sql` |
| Mapa dos cortes (SVG) | `src/lib/anatomy.ts` + `src/components/cut-diagram.tsx` |
| Vitrine, carrinho e checkout | `src/components/store/*` |
| Portal | `src/components/admin/*` |

- O pedido é gravado pela função `place_order`, que **recalcula os preços no banco** (o navegador não consegue alterar valores).
- O cliente acompanha o pedido por um código curto via `track_order` (sem expor telefone ou endereço).
- Cada edição no portal chama `/api/revalidate` e o catálogo público se atualiza na hora.
- **Sem as variáveis do Supabase o site funciona em modo demonstração**: lê `catalog.json` e o pedido vai direto para o WhatsApp
  (sem gravar no banco e sem portal).

## Ativar em produção

1. **Supabase** — crie um projeto (região São Paulo) e rode, no SQL Editor, o conteúdo de
   `supabase/migrations/0001_init.sql` e depois `supabase/seed.sql`.
2. Em **Authentication → Sign In / Providers**, desligue *Allow new users to sign up*.
3. Crie o usuário da loja em **Authentication → Users → Add user** (e-mail + senha) e libere o acesso ao portal:
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'email-da-loja@exemplo.com';
   ```
4. **Vercel** — importe o repositório e configure as variáveis:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
   NEXT_PUBLIC_SITE_URL=https://<domínio do catálogo>
   ```

## Desenvolvimento local

```bash
npm install
npx supabase start          # sobe Postgres/Auth/Storage locais e aplica migração + seed
cp .env.example .env.local  # use a URL e a publishable key que o comando acima mostrar
npm run dev
```
