'use client';

import { IOrderItem } from '@/types/order';
import { getImageUrl } from '@/lib/image-utils';

interface OrderItemsListProps {
  items: IOrderItem[];
  showImages?: boolean;
  className?: string;
}

export function OrderItemsList({ 
  items, 
  showImages = true, 
  className = '' 
}: OrderItemsListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
          {showImages && (
            <img 
              src={getImageUrl(item.image)} 
              alt={item.name}
              className="w-16 h-16 object-cover rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.svg';
              }}
            />
          )}
          <div className="flex-1">
            <h4 className="font-medium">{item.name}</h4>
            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
            {item.variant && <p className="text-sm text-gray-600">Variant: {item.variant}</p>}
          </div>
          <div className="text-right">
            <p className="font-medium">₹{item.price}</p>
            <p className="text-sm text-gray-600">Total: ₹{item.price * item.quantity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
