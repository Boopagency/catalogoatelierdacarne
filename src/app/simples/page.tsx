import { SimpleCatalog } from "@/components/store/simple-catalog";
import { getCatalog } from "@/lib/catalog";

export const revalidate = 60;
export const metadata = { title: "Catálogo · Atelier da Carne" };

export default async function Simples() {
  const c = await getCatalog();
  const sections = [
    ...c.categories.map((cat) => ({
      name: cat.name,
      cover: cat.cover_url,
      items: cat.products
        .filter((p) => p.available)
        .map((p) => ({ id: p.id, name: p.name, price: p.promo_price ?? p.price, unit: p.unit as string })),
    })),
    {
      name: "Kits",
      cover: null,
      items: c.kits.filter((k) => k.available).map((k) => ({ id: "kit-" + k.id, name: k.name, price: k.price, unit: "kit" })),
    },
  ].filter((s) => s.items.length);
  return <SimpleCatalog storeName={c.settings.store_name} whatsapp={c.settings.whatsapp} sections={sections} />;
}
