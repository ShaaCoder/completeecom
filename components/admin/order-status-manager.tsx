'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Send, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package,
  XCircle,
  Eye,
  Users
} from 'lucide-react';
import { useOrderStream } from '@/hooks/use-order-stream';
import { toast } from 'sonner';
import { useAuthStore } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api';

interface OrderStatusManagerProps {
  orderId?: string;
  orderNumber?: string;
  initialOrder?: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus?: string;
    userId: string;
  };
}

interface UpdateData {
  status?: string;
  paymentStatus?: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}

export function OrderStatusManager({ 
  orderId, 
  orderNumber, 
  initialOrder 
}: OrderStatusManagerProps) {
  const [selectedOrder, setSelectedOrder] = useState(initialOrder || null);
  const [searchInput, setSearchInput] = useState(orderNumber || '');
  const [updateData, setUpdateData] = useState<UpdateData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [liveConnections, setLiveConnections] = useState(0);
  
  // Use auth store for authentication
  const { isAuthenticated, user } = useAuthStore();

  const { connected, lastEvent } = useOrderStream({
    orderId: selectedOrder?.id,
    orderNumber: selectedOrder?.orderNumber,
    enableToasts: false // Admin doesn't need toasts for their own updates
  });

  // Search for order
  const searchOrder = async () => {
    if (!searchInput.trim()) {
      toast.error('Please enter an order ID or order number');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.getOrderById(searchInput.trim());
      
      if (result.success && result.data) {
        setSelectedOrder(result.data);
        setUpdateData({
          status: result.data.status,
          paymentStatus: result.data.paymentStatus,
          trackingNumber: result.data.trackingNumber || '',
          carrier: result.data.carrier || ''
        });
        toast.success('Order loaded successfully');
      } else {
        toast.error(result.message || 'Order not found');
        setSelectedOrder(null);
      }
    } catch (error) {
      toast.error('Failed to search for order');
      setSelectedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedOrder) {
      toast.error('No order selected');
      return;
    }

    if (!updateData.status) {
      toast.error('Please select a status');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.updateOrder(selectedOrder.id, updateData);
      
      if (result.success && result.data) {
        setSelectedOrder(result.data);
        toast.success(`Order status updated to: ${updateData.status}`, {
          description: 'Live users will see this update in real-time'
        });
        
        // Simulate connection count update (in real app, this would come from the server)
        setLiveConnections(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
      } else {
        toast.error(result.message || 'Failed to update order');
      }
    } catch (error) {
      toast.error('Network error while updating order');
    } finally {
      setIsLoading(false);
    }
  };

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
    { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Delivered', icon: Package, color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' }
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  const carrierOptions = [
    'BlueDart',
    'DTDC',
    'FedEx',
    'DHL',
    'India Post',
    'Delhivery',
    'Ecom Express'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Order Status Manager
            <div className="ml-auto flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              <span>{liveConnections} live connections</span>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Order Search & Update */}
        <div className="space-y-6">
          {/* Search Order */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Find Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Order ID or Order Number</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="search"
                    placeholder="Enter order ID or number..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
                  />
                  <Button onClick={searchOrder} disabled={isLoading}>
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {/* Current Order Info */}
              {selectedOrder && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Order #{selectedOrder.orderNumber}</h3>
                    <Badge className={statusOptions.find(s => s.value === selectedOrder.status)?.color}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Order ID: {selectedOrder.id}</p>
                  <p className="text-sm text-gray-600">User ID: {selectedOrder.userId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Form */}
          {selectedOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Selection */}
                <div>
                  <Label>Order Status</Label>
                  <Select 
                    value={updateData.status || selectedOrder.status} 
                    onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status */}
                <div>
                  <Label>Payment Status</Label>
                  <Select 
                    value={updateData.paymentStatus || selectedOrder.paymentStatus} 
                    onValueChange={(value) => setUpdateData(prev => ({ ...prev, paymentStatus: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tracking Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tracking Number</Label>
                    <Input
                      className="mt-1"
                      placeholder="TRK123456789"
                      value={updateData.trackingNumber || ''}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Carrier</Label>
                    <Select 
                      value={updateData.carrier || ''} 
                      onValueChange={(value) => setUpdateData(prev => ({ ...prev, carrier: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {carrierOptions.map((carrier) => (
                          <SelectItem key={carrier} value={carrier}>
                            {carrier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Internal Notes (Optional)</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Add any internal notes about this update..."
                    value={updateData.notes || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Update Button */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={updateOrderStatus} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isLoading ? 'Updating...' : 'Update Order'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Live Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer View Preview</CardTitle>
              <p className="text-sm text-gray-600">
                This is how customers will see the status update in real-time
              </p>
            </CardHeader>
            <CardContent>
              {selectedOrder ? (
                <div className="space-y-4">
                  {/* Simulated Customer Status Display */}
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <div className="text-center text-sm text-gray-500 mb-4">
                      👤 Customer Live View
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Order #{selectedOrder.orderNumber}</h3>
                        <Badge className={statusOptions.find(s => s.value === (updateData.status || selectedOrder.status))?.color}>
                          {(updateData.status || selectedOrder.status).charAt(0).toUpperCase() + 
                           (updateData.status || selectedOrder.status).slice(1)}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-medium">
                            {(updateData.status || selectedOrder.status).charAt(0).toUpperCase() + 
                             (updateData.status || selectedOrder.status).slice(1)}
                          </span>
                        </div>
                        {(updateData.paymentStatus || selectedOrder.paymentStatus) && (
                          <div className="flex justify-between">
                            <span>Payment:</span>
                            <span className="font-medium">
                              {((updateData.paymentStatus || selectedOrder.paymentStatus) || '').charAt(0).toUpperCase() + 
                               ((updateData.paymentStatus || selectedOrder.paymentStatus) || '').slice(1)}
                            </span>
                          </div>
                        )}
                        {updateData.trackingNumber && (
                          <div className="flex justify-between">
                            <span>Tracking:</span>
                            <span className="font-mono text-xs">{updateData.trackingNumber}</span>
                          </div>
                        )}
                        {updateData.carrier && (
                          <div className="flex justify-between">
                            <span>Carrier:</span>
                            <span className="font-medium">{updateData.carrier}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connection Status */}
                  <div className="text-center text-sm space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={connected ? 'text-green-600' : 'text-red-600'}>
                        {connected ? 'Connected to live updates' : 'Not connected'}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {liveConnections > 0 
                        ? `${liveConnections} customers are currently tracking this order`
                        : 'No customers currently tracking this order'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select an order to see customer preview</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
              {lastEvent ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">Order Updated</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Status changed to: {lastEvent.data.status}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent updates
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OrderStatusManager;