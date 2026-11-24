# Atelier da Carne · Catálogo digital

Catálogo online do Atelier da Carne (Portão, Curitiba). O cliente toca em **+** nos cortes e envia o pedido pronto
pelo WhatsApp da loja. A loja muda preços e disponibilidade numa planilha do Google.

- **Catálogo simples (principal):** `/`
- **Catálogo completo** (fotos, mapa de cortes, busca, checkout com entrega/retirada): `/completo`

Stack: Next.js 15 (App Router) · Tailwind CSS 4 · Vercel. Sem banco de dados e sem login.

## Preços: planilha do Google

A planilha tem duas abas lidas pelo site (não renomeie as abas nem a primeira linha):

| Aba | Colunas |
| --- | --- |
| **Produtos** | Categoria · Produto · Preço · Promoção · Unidade (`kg`/`un`) · Disponível (`Sim`/`Não`) |
| **Kits** | Kit · O que vem (separado por `\|`) · Preço · Preço de (riscado) · Promoção só na quarta · Selo · Disponível |

- Publicada em *Arquivo → Compartilhar → Publicar na Web*. O link vai na variável `SHEET_URL` da Vercel
  (aceita `/pub` ou `/pubhtml`).
- O site relê a planilha a cada 1 minuto; o Google leva até ~5 minutos para refletir uma edição.
- Linha com preço inválido ou `Disponível = Não` some do site. Se a planilha não responder ou não tiver o cabeçalho
  esperado, o site continua mostrando a última versão boa.
- Kit com **Promoção só na quarta = Sim**: na quarta (horário de Brasília) cobra o *Preço* com o *Preço de* riscado;
  nos outros dias cobra o *Preço de*.

Sem `SHEET_URL`, os preços vêm de `src/data/catalog.json`.

## Onde está cada coisa

| Parte | Onde |
| --- | --- |
| Leitura da planilha | `src/lib/sheet.ts` (teste: `npm test`) |
| Textos, capas, mapa de cortes e preços de reserva | `src/data/catalog.json` |
| Catálogo simples | `src/app/page.tsx` + `src/components/store/simple-catalog.tsx` |
| Catálogo completo | `src/app/completo/page.tsx` + `src/components/store/*` |
| Mapa dos cortes (SVG) | `src/lib/anatomy.ts` + `src/components/cut-diagram.tsx` |
| Mensagem do WhatsApp | `src/lib/whatsapp.ts` |

## Desenvolvimento

```bash
npm install
npm run dev
```
