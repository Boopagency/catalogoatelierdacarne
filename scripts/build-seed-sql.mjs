// Gera supabase/seed.sql a partir de src/data/catalog.json
// Uso: npm run seed:sql
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "src/data/catalog.json"), "utf8"));

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a && a.length ? `array[${a.map(q).join(", ")}]::text[]` : "'{}'::text[]");
const num = (n) => (n === null || n === undefined ? "null" : Number(n).toFixed(2));

const s = data.settings;
const out = [];
out.push("-- Gerado por scripts/build-seed-sql.mjs — não edite à mão.");
out.push("begin;");
out.push(
  `insert into public.settings (id, store_name, tagline, whatsapp, phone_display, instagram, address, maps_url, hours, pickup_enabled, delivery_enabled, delivery_note, announcement)
values (1, ${q(s.store_name)}, ${q(s.tagline)}, ${q(s.whatsapp)}, ${q(s.phone_display)}, ${q(s.instagram)}, ${q(s.address)}, ${q(s.maps_url)}, ${q(JSON.stringify(s.hours))}::jsonb, ${s.pickup_enabled}, ${s.delivery_enabled}, ${q(s.delivery_note)}, ${q(s.announcement)})
on conflict (id) do nothing;`
);

data.categories.forEach((c, ci) => {
  out.push(
    `insert into public.categories (slug, name, subtitle, animal, cover_url, sort_order)
values (${q(c.slug)}, ${q(c.name)}, ${q(c.subtitle)}, ${q(c.animal)}, ${q(c.cover)}, ${ci})
on conflict (slug) do nothing;`
  );
  c.products.forEach((p, pi) => {
    out.push(
      `insert into public.products (category_id, slug, name, description, unit, price, animal, cut_regions, prep_tags, badge, featured, sort_order)
select id, ${q(slugify(p.n))}, ${q(p.n)}, ${q(p.d ?? null)}, ${q(p.u ?? "kg")}, ${num(p.p)}, ${q(p.a ?? c.animal ?? null)}, ${arr(p.r)}, ${arr(p.t)}, ${q(p.b ?? null)}, ${p.f ? "true" : "false"}, ${pi}
from public.categories where slug = ${q(c.slug)}
on conflict (slug) do nothing;`
    );
  });
});

data.kits.forEach((k, ki) => {
  out.push(
    `insert into public.kits (slug, name, tagline, items, price, old_price, image_url, badge, note, sort_order)
values (${q(slugify(k.name))}, ${q(k.name)}, ${q(k.tagline)}, ${arr(k.items)}, ${num(k.price)}, ${num(k.old_price)}, ${q(k.image)}, ${q(k.badge)}, ${q(k.note ?? null)}, ${ki})
on conflict (slug) do nothing;`
  );
});
out.push("commit;");

writeFileSync(join(root, "supabase/seed.sql"), out.join("\n\n") + "\n");
const total = data.categories.reduce((n, c) => n + c.products.length, 0);
console.log(`seed.sql: ${data.categories.length} categorias, ${total} produtos, ${data.kits.length} kits`);
