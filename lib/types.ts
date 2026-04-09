// Database types for the application

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  sku: string
  barcode: string | null
  category_id: string | null
  price: number
  compare_at_price: number | null
  cost_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  allow_backorder: boolean
  weight: number | null
  dimensions: { length?: number; width?: number; height?: number } | null
  images: string[]
  tags: string[]
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Animal {
  id: string
  common_name: string
  scientific_name: string | null
  slug: string
  description: string | null
  care_level: 'facil' | 'moderado' | 'avanzado'
  water_type: 'dulce' | 'salada' | 'salobre'
  min_tank_size: number | null
  temperature_min: number | null
  temperature_max: number | null
  ph_min: number | null
  ph_max: number | null
  max_size: number | null
  diet: string | null
  compatibility: string | null
  origin: string | null
  lifespan: string | null
  images: string[]
  price: number
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: 'customer' | 'admin' | 'staff'
  store_credit_balance: number
  total_purchases: number
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string
  label: string | null
  street_line_1: string
  street_line_2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string | null
  status: 'pendiente' | 'confirmado' | 'en_proceso' | 'enviado' | 'entregado' | 'cancelado'
  payment_status: 'pendiente' | 'pagado' | 'fallido' | 'reembolsado'
  payment_method: string | null
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total: number
  currency: string
  customer_email: string | null
  customer_phone: string | null
  shipping_address: Address | null
  billing_address: Address | null
  notes: string | null
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  animal_id: string | null
  item_type: 'product' | 'animal' | 'custom'
  name: string
  sku: string | null
  quantity: number
  unit_price: number
  total_price: number
  metadata: Record<string, unknown> | null
  created_at: string
  product?: Product
  animal?: Animal
}

export interface CartItem {
  id: string
  type: 'product' | 'animal'
  name: string
  price: number
  quantity: number
  image?: string
  stock: number
  sku?: string
}

export interface StoreCredit {
  id: string
  user_id: string
  amount: number
  balance: number
  reason: string | null
  order_id: string | null
  granted_by: string | null
  expires_at: string | null
  created_at: string
}

export interface ProductionOrder {
  id: string
  order_number: string
  customer_id: string | null
  quote_id: string | null
  status: 'cotizado' | 'aprobado' | 'en_produccion' | 'en_acabado' | 'listo' | 'entregado' | 'cancelado'
  priority: 'baja' | 'normal' | 'alta' | 'urgente'
  title: string
  description: string | null
  specifications: Record<string, unknown> | null
  estimated_cost: number | null
  final_cost: number | null
  deposit_amount: number | null
  deposit_paid: boolean
  estimated_completion: string | null
  actual_completion: string | null
  assigned_to: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CustomAquariumQuote {
  id: string
  user_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  dimensions: {
    length: number
    width: number
    height: number
    unit: 'cm' | 'in'
  }
  glass_thickness: number | null
  glass_type: 'normal' | 'templado' | 'laminado' | 'low_iron'
  shape: 'rectangular' | 'cubo' | 'bowfront' | 'hexagonal' | 'cilindrico' | 'custom'
  features: string[]
  base_price: number | null
  total_price: number | null
  status: 'borrador' | 'enviada' | 'revisada' | 'aprobada' | 'rechazada'
  notes: string | null
  admin_notes: string | null
  valid_until: string | null
  created_at: string
  updated_at: string
}

export interface PosSession {
  id: string
  cashier_id: string
  terminal_id: string | null
  opened_at: string
  closed_at: string | null
  opening_cash: number
  closing_cash: number | null
  expected_cash: number | null
  cash_difference: number | null
  total_sales: number
  total_transactions: number
  notes: string | null
}

// Utility types
export type OrderStatus = Order['status']
export type PaymentStatus = Order['payment_status']
export type CareLevel = Animal['care_level']
export type WaterType = Animal['water_type']
export type UserRole = Profile['role']
