'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Mail,
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  MessageSquare,
  Calendar,
  RefreshCw,
  Bell,
  Star,
  HelpCircle,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useOrder } from '@/hooks/use-orders';
import { useAuthStore } from '@/hooks/use-auth';
import { OrderStatusTimeline } from '@/components/order-status-timeline';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order-status-badge';
import { OrderItemsList } from '@/components/order-items-list';
import { EnhancedOrderTrackingTimeline } from '@/components/enhanced-order-tracking-timeline';
import { LiveTrackingWidget, useLiveTracking } from '@/components/live-tracking-widget';
import { AdvancedTrackingFeatures } from '@/components/advanced-tracking-features';
import { RealTimeOrderStatus } from '@/components/real-time-order-status';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAuthenticated } = useAuthStore();
  const orderId = params.id as string;
  const { order, loading, error } = useOrder(orderId, { pollIntervalMs: 30000 }); // Poll every 30 seconds
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [tracking, setTracking] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [enhancedTracking, setEnhancedTracking] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status !== 'loading') {
      // Check authentication - either NextAuth session or existing auth store
      if (!session && !isAuthenticated) {
        router.push('/auth/login');
      }
    }
  }, [mounted, session, isAuthenticated, status, router]);

  // Enhanced tracking data from API
  const fetchEnhancedTracking = async () => {
    if (!order?.trackingNumber) return;
    
    try {
      const response = await fetch(`/api/orders/track/${order.trackingNumber}`);
      const result = await response.json();
      
      if (result.success) {
        setEnhancedTracking(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch enhanced tracking:', error);
    }
  };

  // Fetch enhanced tracking when order is loaded
  useEffect(() => {
    if (order && order.trackingNumber) {
      fetchEnhancedTracking();
    }
  }, [order]);

  const handleTrackingRefresh = async () => {
    await fetchEnhancedTracking();
    toast.success('Tracking information updated');
  };

  // Show loading state or redirect if not authenticated
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session && !isAuthenticated) {
    return (
      <div>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 text-red-500 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access this page.
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.push('/auth/login')} className="w-full bg-rose-600 hover:bg-rose-700">
                Go to Login
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                Return to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Order Details...</h1>
            <p className="text-gray-600">Please wait while we fetch your order information</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 text-red-500 mx-auto mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'The order you are looking for does not exist or you do not have permission to view it.'}
            </p>
            <div className="space-y-3">
              <Link href="/profile">
                <Button className="w-full bg-rose-600 hover:bg-rose-700">
                  View My Orders
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // getStatusSteps removed; using OrderStatusTimeline component instead

  return (
    <div>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/profile" className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Orders
            </Link>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
                <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
                {order.trackingNumber && (
                  <p className="text-sm text-gray-500 mt-1">
                    Tracking: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{order.trackingNumber}</code>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} className="px-4 py-2 text-sm font-medium" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTrackingRefresh}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Live Tracking
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Support
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Timeline and Items */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Real-Time Order Status */}
                  <RealTimeOrderStatus
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    initialStatus={order.status}
                    showConnectionStatus={true}
                    compact={false}
                  />

                  {/* Live Tracking Widget */}
                  {order.trackingNumber && (
                    <LiveTrackingWidget
                      orderId={order.id}
                      trackingNumber={order.trackingNumber}
                      carrier={(order as any).carrier}
                      onTrackingUpdate={(data) => {
                        // Handle live tracking updates
                        console.log('Live tracking update:', data);
                      }}
                    />
                  )}

                  {/* Enhanced Order Status Timeline */}
                  <EnhancedOrderTrackingTimeline
                    orderId={order.id}
                    timeline={enhancedTracking?.timeline || []}
                    trackingData={enhancedTracking?.tracking}
                    onRefresh={handleTrackingRefresh}
                  />

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <OrderItemsList items={order.items} />
                    </CardContent>
                  </Card>

                  {/* Advanced Tracking Features */}
                  <AdvancedTrackingFeatures
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    currentStatus={order.status}
                  />
                </div>

                {/* Right Column - Summary and Info */}
                <div className="space-y-6">
                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{order.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>₹{order.shipping}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-₹{order.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-3">
                        <span>Total:</span>
                        <span>₹{order.total}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipping Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{order.shippingAddress.name}</p>
                        <p className="text-gray-600">{order.shippingAddress.address}</p>
                        <p className="text-gray-600">
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{order.shippingAddress.phone}</span>
                        </div>
                        {order.shippingAddress.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{order.shippingAddress.email}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Information */}
                  {enhancedTracking?.deliveryInfo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="w-5 h-5" />
                          Delivery Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {enhancedTracking.deliveryInfo.requiresSignature && (
                          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded">
                            <HelpCircle className="w-4 h-4" />
                            <span className="text-sm">Signature required for delivery</span>
                          </div>
                        )}
                        {enhancedTracking.deliveryInfo.deliveryInstructions?.map((instruction: string, index: number) => (
                          <p key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                            {instruction}
                          </p>
                        ))}
                        <div className="flex items-center gap-4 pt-2 border-t">
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-1" />
                            {enhancedTracking.deliveryInfo.contactInfo?.customerCare}
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-mono text-sm">{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                      {(order as any).expectedDeliveryAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expected Delivery:</span>
                          <span className="text-sm">
                            {new Date((order as any).expectedDeliveryAt).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {order.status === 'delivered' && (
                      <Button className="w-full bg-rose-600 hover:bg-rose-700">
                        <Star className="w-4 h-4 mr-1" />
                        Leave a Review
                      </Button>
                    )}
                    {enhancedTracking?.deliveryInfo?.canReschedule && (
                      <Button variant="outline" className="w-full">
                        <Calendar className="w-4 h-4 mr-1" />
                        Reschedule Delivery
                      </Button>
                    )}
                    {enhancedTracking?.deliveryInfo?.canCancel && (
                      <Button variant="outline" className="w-full text-red-600 border-red-600 hover:bg-red-50">
                        Cancel Order
                      </Button>
                    )}
                    <Link href="/">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Live Tracking Tab */}
            <TabsContent value="tracking" className="space-y-6">
              {/* Real-Time Status - Always show for any order */}
              <RealTimeOrderStatus
                orderId={order.id}
                orderNumber={order.orderNumber}
                initialStatus={order.status}
                showConnectionStatus={true}
                compact={false}
              />

              {order.trackingNumber ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {/* Enhanced Timeline */}
                    <EnhancedOrderTrackingTimeline
                      orderId={order.id}
                      timeline={enhancedTracking?.timeline || []}
                      trackingData={enhancedTracking?.tracking}
                      onRefresh={handleTrackingRefresh}
                    />
                  </div>
                  <div className="space-y-6">
                    {/* Live Widget */}
                    <LiveTrackingWidget
                      orderId={order.id}
                      trackingNumber={order.trackingNumber}
                      carrier={(order as any).carrier}
                    />
                    
                    {/* Map Placeholder */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Delivery Route</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <MapPin className="w-12 h-12 mx-auto mb-2" />
                            <p>Interactive map coming soon</p>
                            <p className="text-sm mt-1">Track your package in real-time</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Tracking Information</h3>
                    <p className="text-gray-600 mb-4">
                      Your order status is being monitored in real-time above. Detailed tracking information will be available once your order is shipped and a tracking number is assigned.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-center gap-2 text-blue-800">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Live updates active - You'll be notified when admin updates your order status</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Options */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Support</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button className="h-12" onClick={() => window.open('tel:+91-1800-123-4567')}>
                          <Phone className="w-4 h-4 mr-2" />
                          Call Support
                        </Button>
                        <Button variant="outline" className="h-12" onClick={() => window.open('https://wa.me/919876543210')}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Customer Care:</strong> +91-1800-123-4567</p>
                        <p><strong>WhatsApp:</strong> +91-9876543210</p>
                        <p><strong>Email:</strong> support@ecommerce.com</p>
                        <p><strong>Hours:</strong> 24/7 Support Available</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* FAQ */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Common Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm">How can I track my order?</h4>
                          <p className="text-sm text-gray-600 mt-1">Use the tracking number provided in your order confirmation email or check the Live Tracking tab.</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Can I change my delivery address?</h4>
                          <p className="text-sm text-gray-600 mt-1">Address changes are possible before the order is shipped. Please contact support immediately.</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">What if I'm not available for delivery?</h4>
                          <p className="text-sm text-gray-600 mt-1">Our delivery partner will attempt delivery 3 times. You can also reschedule delivery through this page.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Actions */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {enhancedTracking?.deliveryInfo?.canCancel && (
                        <Button variant="outline" className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50">
                          Cancel Order
                        </Button>
                      )}
                      {enhancedTracking?.deliveryInfo?.canReschedule && (
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="w-4 h-4 mr-2" />
                          Reschedule Delivery
                        </Button>
                      )}
                      {order.status === 'delivered' && (
                        <Button variant="outline" className="w-full justify-start">
                          <Star className="w-4 h-4 mr-2" />
                          Rate & Review
                        </Button>
                      )}
                      <Button variant="outline" className="w-full justify-start">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Report Issue
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Order Details for Support */}
                  <Card>
                    <CardHeader>
                      <CardTitle>For Support Reference</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-mono">{order.orderNumber}</span>
                      </div>
                      {order.trackingNumber && (
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-gray-600">Tracking ID:</span>
                          <span className="font-mono">{order.trackingNumber}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-600">Order Date:</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-600">Status:</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <Dialog open={isTrackOpen} onOpenChange={setIsTrackOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tracking {(order as any)?.trackingNumber || ''}</DialogTitle>
          </DialogHeader>
          {!tracking && trackingLoading && (
            <div className="p-6 text-center text-gray-600">Loading tracking...</div>
          )}
          {tracking && (
            <div className="p-2">
              <div className="mb-4 text-sm text-gray-600">Status: {tracking.status} • ETA: {tracking.estimatedDelivery || '—'}</div>
              <div className="space-y-2 max-h-80 overflow-auto">
                {tracking.trackingHistory?.map((h: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-md">
                    <div className="font-medium">{h.status}</div>
                    <div className="text-sm text-gray-600">{h.location} • {new Date(h.timestamp).toLocaleString()}</div>
                    {h.remarks && <div className="text-sm">{h.remarks}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
