'use client';

import { Badge } from '@/components/ui/badge';

interface OrderStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  className?: string;
}

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'delivered':
        return {
          className: 'bg-green-500 text-white',
          label: 'Delivered'
        };
      case 'shipped':
        return {
          className: 'bg-blue-500 text-white',
          label: 'Shipped'
        };
      case 'confirmed':
        return {
          className: 'bg-orange-500 text-white',
          label: 'Confirmed'
        };
      case 'cancelled':
        return {
          className: 'bg-red-500 text-white',
          label: 'Cancelled'
        };
      default:
        return {
          className: 'bg-gray-500 text-white',
          label: 'Pending'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge className={`${config.className} ${className}`}>
      {config.label}
    </Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: 'pending' | 'completed' | 'failed';
  className?: string;
}

export function PaymentStatusBadge({ status, className = '' }: PaymentStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          className: 'bg-green-500 text-white',
          label: 'Paid'
        };
      case 'pending':
        return {
          className: 'bg-yellow-500 text-white',
          label: 'Pending'
        };
      case 'failed':
        return {
          className: 'bg-red-500 text-white',
          label: 'Failed'
        };
      default:
        return {
          className: 'bg-gray-500 text-white',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge className={`${config.className} ${className}`}>
      {config.label}
    </Badge>
  );
}
