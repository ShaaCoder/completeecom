'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  validateCart: () => Promise<{
    validItems: CartItem[];
    invalidItems: Array<{
      productId: string;
      name: string;
      reason: string;
    }>;
    hasChanges: boolean;
  }>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => set((state) => {
        const existingItem = state.items.find(item => item.productId === newItem.productId);
        
        if (existingItem) {
          return {
            items: state.items.map(item =>
              item.productId === newItem.productId
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            )
          };
        }
        
        return {
          items: [...state.items, { ...newItem, id: Date.now().toString() }]
        };
      }),
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item.productId !== productId)
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        items: quantity <= 0 
          ? state.items.filter(item => item.productId !== productId)
          : state.items.map(item =>
              item.productId === productId ? { ...item, quantity } : item
            )
      })),
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      validateCart: async () => {
        const { items } = get();
        
        if (items.length === 0) {
          return {
            validItems: [],
            invalidItems: [],
            hasChanges: false
          };
        }
        
        try {
          const response = await fetch('/api/cart/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            const { validItems, invalidItems, summary } = result.data;
            
            // If there are changes, update the cart with valid items only
            if (summary.hasChanges) {
              set({ items: validItems });
            }
            
            return {
              validItems,
              invalidItems,
              hasChanges: summary.hasChanges
            };
          } else {
            console.error('Cart validation failed:', result.message);
            return {
              validItems: items,
              invalidItems: [],
              hasChanges: false
            };
          }
        } catch (error) {
          console.error('Error validating cart:', error);
          return {
            validItems: items,
            invalidItems: [],
            hasChanges: false
          };
        }
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);