export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  /** FastAPI serialises Decimal values as strings, e.g. "8.50". */
  price: string;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_vegetarian: boolean;
  is_spicy: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items: MenuItem[];
}

export type OrderType = "collection" | "delivery";
export type PaymentMethod = "cash" | "card";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";

export interface OrderItem {
  id: number;
  menu_item_id: number | null;
  item_name: string;
  unit_price: string;
  quantity: number;
  special_instructions: string | null;
  line_total: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  order_type: OrderType;
  delivery_address: string | null;
  notes: string | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  subtotal: string;
  delivery_fee: string;
  total: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

