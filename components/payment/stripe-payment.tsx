'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { getStripe, STRIPE_ELEMENTS_OPTIONS } from '@/lib/stripe-client';

interface StripePaymentProps {
  orderId: string;
  amount: number;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

function PaymentForm({ orderId, amount, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Create payment intent
      const response = await apiClient.createPaymentIntent({
        orderId,
        amount,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create payment intent');
      }

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/success`,
        },
      });

      if (error) {
        setMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else {
        setMessage('Payment successful!');
        onSuccess(orderId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setMessage(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600 mb-2">Payment Amount:</p>
        <p className="text-2xl font-bold text-gray-900">₹{amount}</p>
        <p className="text-xs text-gray-500 mt-1">Order ID: {orderId}</p>
      </div>
      
      {message && (
        <Alert className={message.includes('successful') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className="flex items-center gap-2">
            {message.includes('successful') ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay ₹${amount}`
        )}
      </Button>
    </div>
  );
}

export function StripePayment({ orderId, amount, onSuccess, onError }: StripePaymentProps) {
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    getStripe().then(setStripePromise);
  }, []);

  if (!stripePromise) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={STRIPE_ELEMENTS_OPTIONS}>
          <PaymentForm
            orderId={orderId}
            amount={amount}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
