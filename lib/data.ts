import { Product, User, Order } from '@/types';

export const categories = [
  { id: 'makeup', name: 'Makeup', subcategories: ['Face', 'Eyes', 'Lips', 'Nails'] },
  { id: 'skincare', name: 'Skincare', subcategories: ['Cleansers', 'Moisturizers', 'Serums', 'Sunscreen'] },
  { id: 'haircare', name: 'Hair Care', subcategories: ['Shampoo', 'Conditioner', 'Styling', 'Treatment'] },
  { id: 'fragrance', name: 'Fragrance', subcategories: ['Women', 'Men', 'Unisex'] },
  { id: 'bodycare', name: 'Body Care', subcategories: ['Shower', 'Moisturizer', 'Deodorant'] },
];

export const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Radiance Foundation SPF 30',
    slug: 'radiance-foundation-spf-30',
    price: 1299,
    originalPrice: 1599,
    description: 'Full coverage foundation with SPF protection for all-day wear and natural radiance.',
    images: [
      'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'
    ],
    category: 'makeup',
    subcategory: 'Face',
    brand: 'GlowUp',
    stock: 45,
    rating: 4.5,
    reviewCount: 128,
    tags: ['bestseller', 'spf', 'full-coverage'],
    features: ['SPF 30 Protection', '16-hour wear', 'Transfer-resistant', 'Available in 20 shades'],
    isBestseller: true
  },
  {
    id: '2',
    name: 'Vitamin C Brightening Serum',
    slug: 'vitamin-c-brightening-serum',
    price: 899,
    description: 'Potent vitamin C serum that brightens skin and reduces dark spots for a radiant complexion.',
    images: [
      'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
      'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg'
    ],
    category: 'skincare',
    subcategory: 'Serums',
    brand: 'Pure Glow',
    stock: 32,
    rating: 4.7,
    reviewCount: 89,
    tags: ['vitamin-c', 'brightening', 'anti-aging'],
    features: ['20% Vitamin C', 'Dermatologist tested', 'Cruelty-free', 'Suitable for all skin types'],
    ingredients: ['Vitamin C', 'Hyaluronic Acid', 'Niacinamide'],
    isNew: true
  },
  {
    id: '3',
    name: 'Luxury Rose Gold Lipstick',
    slug: 'luxury-rose-gold-lipstick',
    price: 649,
    originalPrice: 799,
    description: 'Creamy, long-wearing lipstick with a luxurious rose gold finish and nourishing formula.',
    images: [
      'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg',
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'
    ],
    category: 'makeup',
    subcategory: 'Lips',
    brand: 'Velvet Touch',
    stock: 67,
    rating: 4.3,
    reviewCount: 234,
    tags: ['long-wearing', 'creamy', 'luxury'],
    features: ['8-hour wear', 'Enriched with Vitamin E', 'Smooth application', 'Available in 15 shades'],
    isBestseller: true
  },
  {
    id: '4',
    name: 'Hydrating Night Moisturizer',
    slug: 'hydrating-night-moisturizer',
    price: 1199,
    description: 'Rich, nourishing night cream that deeply hydrates and repairs skin while you sleep.',
    images: [
      'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg',
      'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg'
    ],
    category: 'skincare',
    subcategory: 'Moisturizers',
    brand: 'NightGlow',
    stock: 28,
    rating: 4.6,
    reviewCount: 156,
    tags: ['hydrating', 'night-care', 'anti-aging'],
    features: ['Deep hydration', 'Anti-aging peptides', 'Non-comedogenic', 'Fragrance-free'],
    ingredients: ['Hyaluronic Acid', 'Peptides', 'Ceramides', 'Shea Butter']
  },
  {
    id: '5',
    name: 'Shimmer Eyeshadow Palette',
    slug: 'shimmer-eyeshadow-palette',
    price: 1599,
    originalPrice: 1999,
    description: '12-shade eyeshadow palette with highly pigmented shimmer and matte shades for stunning eye looks.',
    images: [
      'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg',
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg'
    ],
    category: 'makeup',
    subcategory: 'Eyes',
    brand: 'ColorPop',
    stock: 19,
    rating: 4.8,
    reviewCount: 342,
    tags: ['palette', 'shimmer', 'pigmented'],
    features: ['12 versatile shades', 'Highly pigmented', 'Blendable formula', 'Long-lasting'],
    isNew: true
  },
  {
    id: '6',
    name: 'Argan Oil Hair Treatment',
    slug: 'argan-oil-hair-treatment',
    price: 799,
    description: 'Nourishing argan oil treatment that repairs damaged hair and adds natural shine.',
    images: [
      'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg'
    ],
    category: 'haircare',
    subcategory: 'Treatment',
    brand: 'Pure Hair',
    stock: 41,
    rating: 4.4,
    reviewCount: 98,
    tags: ['argan-oil', 'repair', 'shine'],
    features: ['100% Pure Argan Oil', 'Repairs damaged hair', 'Adds shine', 'Heat protection'],
    ingredients: ['Argan Oil', 'Vitamin E', 'Essential Oils']
  }
];

// Mock user data
export const mockUser: User = {
  id: 'user-1',
  name: 'Priya Sharma',
  email: 'priya@email.com',
  phone: '+91 9876543210',
  role: 'customer',
  addresses: [
    {
      id: 'addr-1',
      name: 'Priya Sharma',
      phone: '+91 9876543210',
      address: '123 MG Road, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      isDefault: true
    }
  ]
};

// Mock orders for demonstration
export const sampleOrders: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'NYK2024001',
    userId: 'user-1',
    items: [
      {
        id: '1',
        productId: '1',
        name: 'Radiance Foundation SPF 30',
        price: 1299,
        image: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
        quantity: 1
      }
    ],
    subtotal: 1299,
    shipping: 99,
    discount: 0,
    total: 1398,
    status: 'delivered',
    paymentStatus: 'completed',
    shippingAddress: mockUser.addresses[0],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-18T15:45:00Z'
  }
];