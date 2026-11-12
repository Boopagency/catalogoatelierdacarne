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
  live: boolean; // true = dados do Supabase; false = modo demonstração
};

export type OrderStatus = "novo" | "confirmado" | "separando" | "pronto" | "em_rota" | "concluido" | "cancelado";

export type OrderItem = {
  id?: string;
  name: string;
  unit: "kg" | "un" | "kit";
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
};

export type Order = {
  id: string;
  number: number;
  code: string;
  customer_name: string;
  customer_phone: string;
  fulfillment: "retirada" | "entrega";
  address: string | null;
  neighborhood: string | null;
  scheduled_for: string | null;
  payment_method: string | null;
  notes: string | null;
  status: OrderStatus;
  status_history: { status: OrderStatus; at: string }[];
  subtotal: number;
  item_count: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type TrackedOrder = {
  code: string;
  number: number;
  first_name: string;
  fulfillment: "retirada" | "entrega";
  scheduled_for: string | null;
  status: OrderStatus;
  status_history: { status: OrderStatus; at: string }[];
  subtotal: number;
  created_at: string;
  items: OrderItem[];
};
