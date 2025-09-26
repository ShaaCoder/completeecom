'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Package, 
  Eye, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Edit,
  LogOut,
  User,
  ShoppingBag,
  Heart,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuthStore } from '@/hooks/use-auth';
import { useOrders } from '@/hooks/use-orders';
import { apiClient } from '@/lib/api';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/order-status-badge';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { orders, loading: ordersLoading } = useOrders({ limit: 20 });
  const [activeTab, setActiveTab] = useState('orders');
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.replace('/');
        router.refresh();
      }
    }
  };

  // Show loading state
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session && !isAuthenticated) {
    return null;
  }

  // Use session user if available, otherwise use auth store user
  const currentUser = session?.user || user;

  return (
    <div>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                  {currentUser?.image ? (
                    <img 
                      src={currentUser.image} 
                      alt={currentUser.name || 'User'} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-rose-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentUser?.name || 'User'}</h1>
                  <p className="text-gray-600">{currentUser?.email}</p>
                  <p className="text-sm text-gray-500">
                    Member since {session ? 'Recently' : (user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A')}
                    {session && <span className="ml-2 text-rose-600">(via Google)</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Wishlist
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Orders</h2>
                <Badge variant="outline">{orders.length} orders</Badge>
              </div>

              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
                    <Link href="/">
                      <Button className="bg-rose-600 hover:bg-rose-700">
                        Start Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                              <OrderStatusBadge status={order.status} />
                              <PaymentStatusBadge status={order.paymentStatus} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span>{order.items.length} item(s)</span>
                              </div>
                              <div>
                                <span>Total: ₹{order.total}</span>
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              {(order as any).expectedDeliveryAt && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Expected: {new Date((order as any).expectedDeliveryAt).toLocaleDateString()}</span>
                                </div>
                              )}
                              {(order as any).shippedAt && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Shipped: {new Date((order as any).shippedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                              {(order as any).deliveredAt && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Delivered: {new Date((order as any).deliveredAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                Items: {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                {order.items.length > 2 && ` +${order.items.length - 2} more`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <Link href={`/orders/${order.id}`}>
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                            {order.status === 'delivered' && (
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                Leave Review
                              </Button>
                            )}
                            {['pending', 'confirmed'].includes(order.status) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full sm:w-auto text-red-600 border-red-600 hover:bg-red-50"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to cancel this order?')) {
                                    try {
                                      await apiClient.cancelOrder(order.id, 'Cancelled by customer');
                                      router.refresh();
                                    } catch (error) {
                                      console.error('Failed to cancel order:', error);
                                    }
                                  }
                                }}
                              >
                                Cancel Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Saved Addresses</h2>
                <Button size="sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
                  <p className="text-gray-600 mb-6">Add addresses to make checkout faster.</p>
                  <Button>
                    <MapPin className="w-4 h-4 mr-2" />
                    Add Your First Address
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Wishlist</h2>
                <Badge variant="outline">0 items</Badge>
              </div>
              
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                  <p className="text-gray-600 mb-6">Save items you love for later.</p>
                  <Link href="/">
                    <Button className="bg-rose-600 hover:bg-rose-700">
                      Start Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <h2 className="text-xl font-semibold">Account Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-gray-900">{currentUser?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{currentUser?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{String((currentUser && 'phone' in currentUser ? currentUser.phone : '') || user?.phone || 'Not provided')}</p>
                    </div>
                    {session && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Sign-in Method</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          <span>Google OAuth</span>
                          <Badge variant="outline" className="text-xs">Verified</Badge>
                        </p>
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Information
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                      <p className="text-sm text-gray-600">Receive updates about your orders</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                      <p className="text-sm text-gray-600">Get order updates via SMS</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Update Preferences
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}