"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CreditCard, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/hooks/use-auth';
import { Address } from '@/types';
import { toast } from 'sonner';
import { StripeCheckout } from '@/components/payment/stripe-checkout';
import { apiClient } from '@/lib/api';

export function CheckoutPageClient() {
  'use client';

  const router = useRouter();
  const { items, getTotalPrice, clearCart, validateCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [cartValidated, setCartValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check authentication - either NextAuth session or existing auth store
  const isUserAuthenticated = isAuthenticated || !!session;
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const indianStates = [
    'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Gujarat',
    'Rajasthan', 'West Bengal', 'Madhya Pradesh', 'Uttar Pradesh', 'Delhi'
  ];

  const subtotal = getTotalPrice();
  const shipping = subtotal > 999 ? 0 : 99;
  const COD_CHARGE = 49;
  const total = subtotal + shipping;
  const totalWithCOD = total + COD_CHARGE;

  useEffect(() => {
    if (status !== 'loading' && !isUserAuthenticated) {
      router.push('/auth/login');
    }
  }, [isUserAuthenticated, status, router]);

  // Validate cart when component mounts
  useEffect(() => {
    const performCartValidation = async () => {
      if (items.length > 0 && !cartValidated) {
        try {
          const validation = await validateCart();
          
          if (validation.hasChanges && validation.invalidItems.length > 0) {
            const invalidProductNames = validation.invalidItems.map(item => item.name).join(', ');
            toast.error(`Some items were removed from your cart: ${invalidProductNames}`);
            setValidationError(`The following items are no longer available: ${invalidProductNames}`);
          }
          
          setCartValidated(true);
        } catch (error) {
          console.error('Error validating cart:', error);
          toast.error('Unable to validate cart items. Please refresh the page.');
        }
      }
    };

    if (items.length > 0) {
      performCartValidation();
    } else {
      setCartValidated(true);
    }
  }, [items.length, cartValidated, validateCart]);

  if (status === 'loading' || !cartValidated) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-4"></div>
          <p className="text-gray-600">
            {status === 'loading' ? 'Loading...' : 'Validating cart items...'}
          </p>
        </div>
      </main>
    );
  }

  if (!isUserAuthenticated) {
    return null;
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // Only COD uses this handler; card/upi are handled by StripeCheckout component
      if (paymentMethod !== 'cod') {
        toast.error('Invalid payment method for this flow');
        return;
      }

      const response = await apiClient.createCODOrder({
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
        })),
        shippingAddress: shippingAddress as Address,
      });

      if (response.success) {
        clearCart();
        toast.success('Order placed successfully!');
        const orderNumber = response.data?.orderNumber;
        if (orderNumber) {
          router.push(`/orders/success?order_number=${encodeURIComponent(orderNumber)}`);
        } else {
          router.push('/orders/success');
        }
      } else {
        toast.error(response.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
        
        {validationError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {validationError}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${step >= 1 ? 'text-rose-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step >= 1 ? 'bg-rose-600 border-rose-600 text-white' : 'border-gray-300'}`}>
              <MapPin className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">Shipping</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-rose-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-rose-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step >= 2 ? 'bg-rose-600 border-rose-600 text-white' : 'border-gray-300'}`}>
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="ml-2 font-medium">Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 ? (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" required value={shippingAddress.name || ''} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" required value={shippingAddress.phone || ''} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required value={shippingAddress.address || ''} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" required value={shippingAddress.city || ''} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={shippingAddress.state || ''} onValueChange={(value) => setShippingAddress({ ...shippingAddress, state: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pincode">PIN Code</Label>
                    <Input id="pincode" required value={shippingAddress.pincode || ''} onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" size="lg">Continue to Payment</Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="font-medium">Credit/Debit Card (Stripe)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi" className="font-medium">UPI (Stripe)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="font-medium">Cash on Delivery</Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === 'card' || paymentMethod === 'upi' ? (
                <StripeCheckout
                  items={items.map(item => ({ productId: item.productId, name: item.name, price: item.price, image: item.image, quantity: item.quantity }))}
                  shippingAddress={shippingAddress as Address}
                  total={total}
                  onSuccess={() => {
                    clearCart();
                    toast.success('Order placed successfully!');
                    router.push('/orders/success');
                  }}
                  onError={(error) => { toast.error(error); }}
                />
              ) : (
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">Cash on Delivery</h3>
                  <p className="text-gray-600 mb-4">Pay when your order is delivered. An additional COD handling charge applies.</p>
                  <div className="mb-4 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
                    <div className="flex justify-between"><span>COD Charge</span><span>₹{COD_CHARGE}</span></div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span>₹{totalWithCOD}</span></div>
                  </div>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={isProcessing}>Back</Button>
                      <Button type="submit" className="bg-rose-600 hover:bg-rose-700 flex-1" size="lg" disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : `Place Order - ₹${totalWithCOD}`}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={isProcessing}>Back to Shipping</Button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span>₹{total}</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
