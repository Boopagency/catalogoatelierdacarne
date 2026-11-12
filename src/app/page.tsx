import { Storefront } from "@/components/store/storefront";
import { getCatalog } from "@/lib/catalog";

export const revalidate = 60;

export default async function Home() {
  const catalog = await getCatalog();
  return <Storefront catalog={catalog} />;
}
