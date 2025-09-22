'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  Search, 
  Filter,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Phone,
  MessageSquare,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrders } from '@/hooks/use-orders';
import { useRealTimeTracking, useMultipleOrderTracking } from '@/hooks/use-real-time-tracking';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { toast } from 'sonner';

interface TrackingStats {
  total: number;
  pending: number;
  shipped: number;
  delivered: number;
  exceptions: number;
  avgDeliveryTime: number;
}

// Helper function to map tracking status to OrderStatusBadge expected types
const mapTrackingStatusToOrderStatus = (status: string): 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('delivered') || statusLower === 'delivered') return 'delivered';
  if (statusLower.includes('shipped') || statusLower === 'shipped' || 
      statusLower.includes('transit') || statusLower.includes('out for delivery')) return 'shipped';
  if (statusLower.includes('confirmed') || statusLower === 'confirmed') return 'confirmed';
  if (statusLower.includes('cancelled') || statusLower === 'cancelled') return 'cancelled';
  return 'pending'; // Default fallback
};

export default function AdminOrderTrackingDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [stats, setStats] = useState<TrackingStats>({
    total: 0,
    pending: 0,
    shipped: 0,
    delivered: 0,
    exceptions: 0,
    avgDeliveryTime: 0
  });

  // Fetch orders with filtering
  const { orders, loading, error, refetch } = useOrders({
    page: 1,
    limit: 50,
    status: statusFilter === 'all' ? undefined : statusFilter
  });

  // Real-time tracking for multiple orders
  const shippedOrderIds = orders
    ?.filter(order => ['shipped', 'delivered'].includes(order.status))
    ?.map(order => order.id) || [];

  const { 
    trackingData: liveTrackingData, 
    connections,
    isAnyConnected 
  } = useMultipleOrderTracking(shippedOrderIds, {
    enableToasts: false,
    onStatusChange: (data) => {
      toast.success(`Order ${data.orderNumber} status updated: ${data.newStatus}`);
      refetch();
    }
  });

  // Calculate stats
  useEffect(() => {
    if (orders) {
      const newStats: TrackingStats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        exceptions: orders.filter(o => o.status === 'cancelled').length,
        avgDeliveryTime: 3.5 // Mock calculation
      };
      setStats(newStats);
    }
  }, [orders]);

  // Filter orders based on search and status
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const handleOrderView = (order: any) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Order status updated successfully');
        refetch();
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const exportTrackingData = () => {
    const csvData = filteredOrders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer Name': order.shippingAddress.name,
      'Status': order.status,
      'Tracking Number': (order as any).trackingNumber || 'N/A',
      'Carrier': (order as any).carrier || 'N/A',
      'Order Date': new Date(order.createdAt).toLocaleDateString(),
      'Total': `₹${order.total}`
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Tracking Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and monitor order deliveries in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isAnyConnected ? "secondary" : "outline"} className={isAnyConnected ? "bg-green-100 text-green-800" : ""}>
              {isAnyConnected ? '🟢 Live Tracking Connected' : '🔴 Live Tracking Offline'}
            </Badge>
            <Button variant="outline" onClick={refetch} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportTrackingData}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shipped</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.shipped}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Delivery</p>
                  <p className="text-2xl font-bold">{stats.avgDeliveryTime}d</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by order number or customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="overview">Orders Overview</TabsTrigger>
            <TabsTrigger value="live">Live Tracking</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Orders Table */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Orders ({filteredOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{order.items.length} items</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.shippingAddress.name}</p>
                            <p className="text-sm text-gray-500">{order.shippingAddress.city}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                          {liveTrackingData[order.id] && (
                            <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700">
                              Live
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {(order as any).trackingNumber ? (
                            <div className="text-sm">
                              <p className="font-mono">{(order as any).trackingNumber}</p>
                              <p className="text-gray-500">{(order as any).carrier}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not shipped</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">₹{order.total}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOrderView(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <Select onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                                <SelectTrigger className="w-24 h-8">
                                  <Edit className="w-3 h-3" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="confirmed">Confirm</SelectItem>
                                  <SelectItem value="shipped">Ship</SelectItem>
                                  <SelectItem value="delivered">Deliver</SelectItem>
                                  <SelectItem value="cancelled">Cancel</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Tracking Tab */}
          <TabsContent value="live">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(liveTrackingData).map(([orderId, tracking]) => (
                <Card key={orderId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Order {tracking.orderNumber}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Status:</span>
                      <OrderStatusBadge status={mapTrackingStatusToOrderStatus(tracking.status)} />
                    </div>
                    {tracking.liveTracking && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Live Status:</span>
                          <Badge variant="outline">{tracking.liveTracking.status}</Badge>
                        </div>
                        {tracking.liveTracking.currentLocation && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{tracking.liveTracking.currentLocation}</span>
                          </div>
                        )}
                        {tracking.liveTracking.estimatedDelivery && (
                          <div className="text-sm">
                            <span className="font-medium">ETA:</span>{' '}
                            {new Date(tracking.liveTracking.estimatedDelivery).toLocaleString()}
                          </div>
                        )}
                      </>
                    )}
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(tracking.lastUpdated).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {Object.keys(liveTrackingData).length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Live Tracking Available</h3>
                  <p className="text-gray-500">Orders with tracking numbers will appear here for live monitoring</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>On-time Deliveries</span>
                      <span className="font-medium text-green-600">85%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Average Delivery Time</span>
                      <span className="font-medium">{stats.avgDeliveryTime} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Delivery Exceptions</span>
                      <span className="font-medium text-red-600">3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Customer Satisfaction</span>
                      <span className="font-medium text-blue-600">4.7/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Carrier Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Shiprocket</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">90%</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="w-18 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Delhivery</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">85%</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="w-17 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Blue Dart</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">88%</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div className="w-17.6 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Order Details Modal */}
        <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Order Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <OrderStatusBadge status={selectedOrder.status} />
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">₹{selectedOrder.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                      </div>
                      {(selectedOrder as any).trackingNumber && (
                        <div className="flex justify-between">
                          <span>Tracking:</span>
                          <span className="font-mono text-xs">{(selectedOrder as any).trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span>{selectedOrder.shippingAddress.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span>{selectedOrder.shippingAddress.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>City:</span>
                        <span>{selectedOrder.shippingAddress.city}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="border rounded-lg">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h5 className="font-medium">{item.name}</h5>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}