'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard } from 'lucide-react';
import { useApi } from '@/hooks/use-api';

interface StripeCheckoutProps {
  items: Array<{
    productId: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
  }>;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  total: number;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

export function StripeCheckout({ 
  items, 
  shippingAddress, 
  total, 
  onSuccess, 
  onError 
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { createCheckoutSession } = useApi();

  const handleCheckout = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await createCheckoutSession({
        items,
        shippingAddress,
        total,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      setMessage(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Amount</span>
            <span className="font-semibold">₹{total}</span>
          </div>
          <div className="text-xs text-gray-500">
            You will be redirected to Stripe for secure payment processing
          </div>
        </div>

        {message && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Checkout Session...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with Stripe
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          Powered by Stripe • Secure & Encrypted
        </div>
      </CardContent>
    </Card>
  );
}
