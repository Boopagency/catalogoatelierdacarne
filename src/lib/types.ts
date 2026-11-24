import type { Animal } from "./anatomy";

export type Unit = "kg" | "un";

export type Settings = {
  store_name: string;
  tagline: string | null;
  whatsapp: string;
  phone_display: string | null;
  instagram: string | null;
  address: string | null;
  maps_url: string | null;
  hours: { days: number[]; open: string; close: string }[];
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_note: string | null;
  announcement: string | null;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  animal: Animal | null;
  cover_url: string | null;
  sort_order: number;
  active: boolean;
};

export type Product = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  unit: Unit;
  price: number;
  promo_price: number | null;
  image_url: string | null;
  animal: Animal | null;
  cut_regions: string[];
  prep_tags: string[];
  badge: string | null;
  available: boolean;
  featured: boolean;
  sort_order: number;
};

export type Kit = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  items: string[];
  price: number;
  old_price: number | null;
  promo_quarta: boolean; // "de/por" só vale às quartas; nos outros dias cobra o preço "de"
  image_url: string | null;
  badge: string | null;
  note: string | null;
  available: boolean;
  sort_order: number;
};

export type CategoryWithProducts = Category & { products: Product[] };

export type Catalog = {
  settings: Settings;
  categories: CategoryWithProducts[];
  kits: Kit[];
};
