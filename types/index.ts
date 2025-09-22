export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string | {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
  };
  subcategory?: string;
  brand: string;
  stock: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  features: string[];
  ingredients?: string[];
  isNew?: boolean; // This will be mapped from isNewProduct in the API
  isBestseller?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  
  // Essential new fields for public API
  sku?: string;
  color?: string;
  size?: string;
  weight?: {
    value?: number;
    unit?: string;
  };
  material?: string;
  scent?: string;
  gender?: string;
  ageGroup?: string;
  manufacturer?: string;
  allergens?: string[];
  dietaryInfo?: string[];
  skinType?: string[];
  hairType?: string[];
  countryOfOrigin?: string;
  
  // Category-specific data
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  
  technicalSpecs?: {
    model?: string;
    warranty?: {
      duration?: number;
      unit?: 'days' | 'months' | 'years';
      type?: 'manufacturer' | 'seller' | 'extended';
    };
    powerRequirements?: string;
    connectivity?: string[];
    compatibility?: string[];
  };
  
  // Variants for product options
  variants?: Array<{
    color?: string;
    size?: string;
    price?: number;
    originalPrice?: number;
    stock?: number;
    sku?: string;
    images?: string[];
  }>;
  
  // Inventory
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
  role: 'customer' | 'admin';
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingAddress: Address;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}
