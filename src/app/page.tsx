import { SimpleCatalog } from "@/components/store/simple-catalog";
import { effectivePrice } from "@/lib/format";
import { getCatalog } from "@/lib/catalog";

export const revalidate = 60;

export default async function Home() {
  const c = await getCatalog();
  const kits = c.kits
    .filter((k) => k.available)
    .map((k) => ({ id: "kit-" + k.id, name: k.name, price: k.price, was: k.old_price, unit: "kit", details: k.items, badge: k.badge, quarta: k.promo_quarta && !!k.old_price }));
  const sections = c.categories
    .map((cat) => ({
      name: cat.name,
      cover: cat.cover_url,
      items: cat.products
        .filter((p) => p.available)
        .map((p) => {
          const price = effectivePrice(p);
          return { id: p.id, name: p.name, price, was: price < p.price ? p.price : null, unit: p.unit as string };
        }),
    }))
    .filter((s) => s.items.length);
  return <SimpleCatalog storeName={c.settings.store_name} whatsapp={c.settings.whatsapp} kits={kits} sections={sections} />;
}
