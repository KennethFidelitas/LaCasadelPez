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
  name: string
  scientific_name: string | null
  slug: string
  sku: string
  description: string | null
  care_level: 'facil' | 'moderado' | 'avanzado' | null
  temperament: 'pacifico' | 'semi-agresivo' | 'agresivo' | null
  min_tank_size: number | null
  temperature_min: number | null
  temperature_max: number | null
  ph_min: number | null
  ph_max: number | null
  max_size: number | null
  diet: string | null
  compatibility: string[] | null
  origin: string | null
  lifespan: string | null
  images: string[]
  price: number
  cost: number | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  // La BD usa 'employee' para el rol de vendedor (no 'staff')
  role: 'customer' | 'admin' | 'employee'
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
  order_number: string  // auto-generado por trigger (formato PYY00000), no asignar al crear
  user_id: string | null
  status: 'cotizado' | 'confirmado' | 'en_produccion' | 'listo' | 'entregado' | 'cancelado'
  payment_status: 'pendiente' | 'anticipo' | 'pagado' | 'reembolsado'
  config: Record<string, unknown>
  accessories: Record<string, unknown>[]
  // Dimensiones en cm
  width: number | null
  height: number | null
  depth: number | null
  glass_type: string | null
  glass_thickness: number | null  // mm
  // Desglose de precios
  materials_cost: number
  labor_cost: number
  accessories_cost: number
  subtotal: number
  discount: number
  total: number
  deposit_paid: number
  // Tiempos
  estimated_days: number | null
  started_at: string | null
  completed_at: string | null
  delivered_at: string | null
  // Contacto del cliente
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  // Notas
  notes: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface ProductionUpdate {
  id: string
  production_order_id: string
  status: string | null
  message: string
  images: string[]
  created_by: string | null
  created_at: string
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

export interface Inventory {
  id: string
  animal_id: string
  quantity: number
  location: string | null
  low_stock_threshold: number
}

export interface AnimalMortality {
  id: string
  animal_id: string
  quantity: number
  reason: string
  notes: string | null
  recorded_by: string | null
  recorded_at: string | null
  created_at: string | null
}

export interface MuerteConAnimal extends AnimalMortality {
  animals: {
    name: string
    scientific_name: string | null
  } | null
}

// Utility types
export type OrderStatus = Order['status']
export type PaymentStatus = Order['payment_status']
export type CareLevel = Animal['care_level']
export type UserRole = Profile['role']
export type ProductionStatus = ProductionOrder['status']
export type ProductionPaymentStatus = ProductionOrder['payment_status']
