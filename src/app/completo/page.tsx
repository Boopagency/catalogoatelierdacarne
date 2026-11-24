import { Storefront } from "@/components/store/storefront";
import { getCatalog } from "@/lib/catalog";

export const revalidate = 60;

export default async function Completo() {
  const catalog = await getCatalog();
  return <Storefront catalog={catalog} />;
}
