'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/cart-store';

interface CartCounterProps {
  className?: string;
}

export function CartCounter({ className }: CartCounterProps) {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore(state => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before hydration, don't show the count
  if (!mounted) {
    return null;
  }

  // Only show if there are items
  if (totalItems === 0) {
    return null;
  }

  return (
    <span className={className}>
      {totalItems}
    </span>
  );
}