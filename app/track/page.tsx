'use client';

import { useState, useEffect } from 'react';
import { Search, Package, Truck, MapPin, Phone, Lock, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { toast } from 'sonner';
import Link from 'next/link';
import { RealTimeOrderStatus } from '@/components/real-time-order-status';

interface PublicTrackingData {
  order: {
    orderNumber: string;
    status: string;
    createdAt: string;
    estimatedDeliveryAt?: string;
    total?: number;
    itemCount?: number;
    shippingAddress?: {
      name: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  tracking: {
    trackingNumber: string;
    carrier: string;
    currentStatus: string;
    lastUpdated: string;
    trackingUrl?: string;
  };
  timeline: Array<{
    status: string;
    description: string;
    timestamp: string;
    completed: boolean;
    icon: string;
  }>;
  accessLevel: 'public' | 'verified' | 'full';
  message?: string;
}

export default function PublicOrderTrackingPage() {
  const [activeTab, setActiveTab] = useState('tracking');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [trackingData, setTrackingData] = useState<PublicTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track by tracking number (public access)
  const trackByTrackingNumber = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/orders/track/${trackingNumber.trim()}`);
      const result = await response.json();

      if (result.success) {
        setTrackingData(result.data);
        toast.success('Order found!');
      } else {
        setError(result.message || 'Order not found');
        setTrackingData(null);
      }
    } catch (error) {
      setError('Failed to track order. Please try again.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  // Track by order number + phone (verified access)
  const trackByOrderAndPhone = async () => {
    if (!orderNumber.trim() || !phoneNumber.trim()) {
      toast.error('Please enter both order number and phone number');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // We'll use a placeholder tracking number since we don't have it yet
      const response = await fetch(
        `/api/orders/track/VERIFY?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phoneNumber.trim())}`
      );
      const result = await response.json();

      if (result.success) {
        setTrackingData(result.data);
        toast.success('Order verified and found!');
      } else {
        setError(result.message || 'Order not found or phone number does not match');
        setTrackingData(null);
      }
    } catch (error) {
      setError('Failed to verify order. Please try again.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'check-circle': CheckCircle,
      'package': Package,
      'truck': Truck
    };
    const IconComponent = icons[iconName] || Package;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
            <p className="text-lg text-gray-600 mb-6">
              Enter your tracking number or order details to get the latest updates
            </p>
            
            {/* Login Prompt */}
            <Alert className="max-w-2xl mx-auto mb-8">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                For complete tracking details and live updates,{' '}
                <Link href="/auth" className="text-blue-600 hover:text-blue-700 font-medium underline">
                  sign in to your account
                </Link>
              </AlertDescription>
            </Alert>

            {/* Live Updates Banner - Only show when tracking data exists */}
            {trackingData && (
              <Alert className="max-w-2xl mx-auto mb-8 border-green-200 bg-green-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <AlertDescription className="text-green-800">
                    <strong>🎉 Real-time tracking is active!</strong> You'll automatically see updates when the status changes.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Tracking Input Methods */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="tracking">By Tracking Number</TabsTrigger>
              <TabsTrigger value="order">By Order & Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="tracking">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">Track by Tracking Number</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter tracking number (e.g., MOCK1234567890ABCD)"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && trackByTrackingNumber()}
                      className="text-center"
                    />
                    <Button 
                      onClick={trackByTrackingNumber} 
                      disabled={loading}
                      className="px-8"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {loading ? 'Tracking...' : 'Track'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    You'll get basic tracking information. For complete details, please log in.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="order">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">Track by Order Number</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Order Number (e.g., ORD-1234567890-ABCD)"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                    />
                    <Input
                      placeholder="Phone Number (+91 9876543210)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && trackByOrderAndPhone()}
                    />
                  </div>
                  <Button 
                    onClick={trackByOrderAndPhone} 
                    disabled={loading}
                    className="w-full"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? 'Verifying...' : 'Track Order'}
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                    We'll verify your phone number and show detailed tracking information.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="max-w-2xl mx-auto mb-8">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tracking Results */}
          {trackingData && (
            <div className="space-y-6">
              {/* Access Level Info */}
              <div className="text-center">
                <Badge 
                  variant={trackingData.accessLevel === 'verified' ? 'default' : 'outline'}
                  className="px-4 py-2"
                >
                  {trackingData.accessLevel === 'public' && '🔓 Public Access'}
                  {trackingData.accessLevel === 'verified' && '✅ Phone Verified'}
                  {trackingData.accessLevel === 'full' && '🔐 Full Access'}
                </Badge>
                {trackingData.message && (
                  <p className="text-sm text-gray-600 mt-2">{trackingData.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Status */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Real-time Order Status */}
                  <RealTimeOrderStatus
                    orderNumber={trackingData.order.orderNumber}
                    initialStatus={trackingData.order.status}
                    showConnectionStatus={true}
                    compact={false}
                  />

                  {/* Traditional Order Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Order Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Order {trackingData.order.orderNumber}</h3>
                          <p className="text-sm text-gray-500">
                            Placed on {new Date(trackingData.order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(trackingData.order.status)}>
                          {trackingData.order.status.charAt(0).toUpperCase() + trackingData.order.status.slice(1)}
                        </Badge>
                      </div>
                      
                      {trackingData.order.estimatedDeliveryAt && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Estimated Delivery</p>
                          <p className="text-blue-700">
                            {new Date(trackingData.order.estimatedDeliveryAt).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tracking Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {trackingData.timeline.map((event, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              event.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {getStatusIcon(event.icon)}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-medium ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                {event.status}
                              </h4>
                              <p className={`text-sm ${event.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                                {event.description}
                              </p>
                              {event.timestamp && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(event.timestamp).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div className="space-y-6">
                  {/* Tracking Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Shipping Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Tracking Number</p>
                        <p className="font-mono text-sm">{trackingData.tracking.trackingNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Carrier</p>
                        <p className="font-medium">{trackingData.tracking.carrier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Status</p>
                        <Badge className={getStatusColor(trackingData.tracking.currentStatus)}>
                          {trackingData.tracking.currentStatus}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="text-sm">{new Date(trackingData.tracking.lastUpdated).toLocaleString()}</p>
                      </div>
                      {trackingData.tracking.trackingUrl && (
                        <div>
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <a href={trackingData.tracking.trackingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Track on {trackingData.tracking.carrier}
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Order Details (verified access only) */}
                  {trackingData.accessLevel === 'verified' && trackingData.order.total && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span>Items:</span>
                          <span>{trackingData.order.itemCount}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>₹{trackingData.order.total}</span>
                        </div>
                        {trackingData.order.shippingAddress && (
                          <div className="pt-3 border-t">
                            <p className="text-sm text-gray-600 mb-1">Delivering to:</p>
                            <p className="font-medium">{trackingData.order.shippingAddress.name}</p>
                            <p className="text-sm text-gray-600">
                              {trackingData.order.shippingAddress.city}, {trackingData.order.shippingAddress.state} - {trackingData.order.shippingAddress.pincode}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Support */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Need Help?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <p><strong>Customer Care:</strong> +91-1800-123-4567</p>
                        <p><strong>WhatsApp:</strong> +91-9876543210</p>
                        <p><strong>Email:</strong> support@ecommerce.com</p>
                      </div>
                      <div className="pt-3">
                        <Link href="/auth">
                          <Button variant="outline" className="w-full">
                            <Lock className="w-4 h-4 mr-2" />
                            Sign In for Full Tracking
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Sample Tracking Numbers */}
          {!trackingData && (
            <div className="max-w-2xl mx-auto mt-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Try Sample Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Don't have a tracking number? Try these sample numbers:
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start font-mono text-xs"
                      onClick={() => {
                        setTrackingNumber('MOCK1734568909123ABCD');
                        setActiveTab('tracking');
                      }}
                    >
                      MOCK1734568909123ABCD
                    </Button>
                    <div className="text-center text-xs text-gray-500">or</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start font-mono text-xs"
                        onClick={() => {
                          setOrderNumber('ORD-1734568909123-ABCD');
                          setActiveTab('order');
                        }}
                      >
                        ORD-1734568909123-ABCD
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs"
                        onClick={() => {
                          setPhoneNumber('+91 9876543210');
                          setActiveTab('order');
                        }}
                      >
                        +91 9876543210
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}