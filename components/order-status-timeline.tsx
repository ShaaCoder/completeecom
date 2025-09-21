'use client';

import { CheckCircle, Package, Truck, Clock, CreditCard, Calendar } from 'lucide-react';

interface OrderStatusStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  current: boolean;
  date?: string;
}

interface OrderStatusTimelineProps {
  status: string;
  paymentStatus: string;
  createdAt?: string;
  updatedAt?: string;
  // Optional explicit dates from backend
  paymentAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  expectedDeliveryAt?: string;
  className?: string;
}

export function OrderStatusTimeline({ 
  status, 
  paymentStatus, 
  createdAt, 
  updatedAt,
  paymentAt,
  confirmedAt,
  shippedAt,
  deliveredAt,
  expectedDeliveryAt,
  className = '' 
}: OrderStatusTimelineProps) {
  const getStatusSteps = (): OrderStatusStep[] => {
    const steps: OrderStatusStep[] = [
      {
        id: 'order-placed',
        title: 'Order Placed',
        description: 'Your order has been received',
        icon: <CheckCircle className="w-5 h-5" />,
        completed: true,
        current: false,
        date: createdAt ? new Date(createdAt).toLocaleDateString() : undefined
      },
      {
        id: 'payment',
        title: 'Payment',
        description: paymentStatus === 'completed' ? 'Payment confirmed' : 'Payment pending',
        icon: <CreditCard className="w-5 h-5" />,
        completed: paymentStatus === 'completed',
        current: paymentStatus === 'pending',
        date: (paymentAt || createdAt) ? new Date(paymentAt || createdAt as string).toLocaleDateString() : undefined
      },
      {
        id: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order is being prepared',
        icon: <Package className="w-5 h-5" />,
        completed: ['confirmed', 'shipped', 'delivered'].includes(status),
        current: status === 'confirmed',
        date: (confirmedAt || createdAt) ? new Date(confirmedAt || createdAt as string).toLocaleDateString() : undefined
      },
      {
        id: 'shipped',
        title: 'Shipped',
        description: expectedDeliveryAt ? `Expected delivery: ${new Date(expectedDeliveryAt).toLocaleDateString()}` : 'Your order is on the way',
        icon: <Truck className="w-5 h-5" />,
        completed: status === 'delivered',
        current: status === 'shipped',
        date: (shippedAt || updatedAt) ? new Date(shippedAt || updatedAt as string).toLocaleDateString() : undefined
      },
      {
        id: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered',
        icon: <CheckCircle className="w-5 h-5" />,
        completed: status === 'delivered',
        current: false,
        date: deliveredAt ? new Date(deliveredAt).toLocaleDateString() : (status === 'delivered' && updatedAt ? new Date(updatedAt).toLocaleDateString() : undefined)
      }
    ];

    if (status === 'cancelled') {
      steps.push({
        id: 'cancelled',
        title: 'Cancelled',
        description: 'Your order has been cancelled',
        icon: <Clock className="w-5 h-5" />,
        completed: true,
        current: false,
        date: updatedAt ? new Date(updatedAt).toLocaleDateString() : undefined
      });
    }

    return steps;
  };

  const statusSteps = getStatusSteps();

  return (
    <div className={`space-y-6 ${className}`}>
      {statusSteps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-4 relative">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            step.completed 
              ? 'bg-green-500 text-white' 
              : step.current 
              ? 'bg-rose-500 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${
                step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </h3>
              {step.date && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {step.date}
                </span>
              )}
            </div>
            <p className={`text-sm mt-1 ${
              step.completed || step.current ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {step.description}
            </p>
          </div>
          {index < statusSteps.length - 1 && (
            <div className={`absolute left-5 top-12 w-0.5 h-6 ${
              step.completed ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
