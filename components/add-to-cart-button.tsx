'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  disabled?: boolean;
}

export function AddToCartButton({ product, className, disabled = false }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = () => {
    if (disabled) return;
    
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1
    });
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled}
      className={cn(
        "bg-rose-600 hover:bg-rose-700 transition-all duration-200",
        isAdded && "bg-green-600 hover:bg-green-700",
        disabled && "bg-gray-400 cursor-not-allowed",
        className
      )}
      size="lg"
    >
      {disabled ? (
        <>
          <ShoppingCart className="w-5 h-5 mr-2" />
          Out of Stock
        </>
      ) : isAdded ? (
        <>
          <Check className="w-5 h-5 mr-2" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
}