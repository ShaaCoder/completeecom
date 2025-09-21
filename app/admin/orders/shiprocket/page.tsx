'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrderStatusManager } from '@/components/admin/order-status-manager';
import { ShiprocketIntegration } from '@/components/admin/shiprocket-integration';
import { RealTimeOrderStatus } from '@/components/real-time-order-status';
import { 
  Package, 
  Truck, 
  Settings, 
  Search,
  Info,
  CheckCircle,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminAuthWrapper } from '@/components/admin/admin-auth-wrapper';

export default function AdminShiprocketPage() {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  // Sample order IDs for testing
  const sampleOrderIds = [
    '68ca80a308820cc22116cb5c', // From your screenshot
    'NYK1758101745739' // Order number from screenshot
  ];

  const handleOrderSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter an order ID or order number');
      return;
    }

    setSelectedOrderId(searchQuery.trim());
    setActiveTab('management');
    toast.success(`Selected order: ${searchQuery.trim()}`);
  };

  const handleSampleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSearchQuery(orderId);
    setActiveTab('management');
    toast.success(`Selected sample order: ${orderId}`);
  };

  const handleShipmentCreated = (shipmentData: any) => {
    toast.success('Shipment created and order updated!');
    // Optionally switch to monitoring tab to see real-time updates
    setActiveTab('monitoring');
  };

  return (
    <AdminAuthWrapper requireAdmin={true}>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shiprocket Order Management</h1>
              <p className="text-gray-600">Manage orders, create shipments, and track deliveries</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Integration Status</p>
                    <p className="font-semibold text-green-600">✅ Connected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ready to Ship</p>
                    <p className="font-semibold">Confirmed Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Truck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">In Transit</p>
                    <p className="font-semibold">Live Tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Monitor className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Real-time Updates</p>
                    <p className="font-semibold">Live Monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Order
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manage Order
            </TabsTrigger>
            <TabsTrigger value="shiprocket" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Shiprocket Tools
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Live Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Order to Manage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search">Order ID or Order Number</Label>
                  <div className="flex gap-3 mt-1">
                    <Input
                      id="search"
                      placeholder="Enter order ID (e.g., 68ca80a308820cc22116cb5c) or order number (e.g., NYK1758101745739)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleOrderSearch()}
                      className="flex-1"
                    />
                    <Button onClick={handleOrderSearch}>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>

                {/* Sample Orders */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Quick Access - Sample Orders:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sampleOrderIds.map((orderId) => (
                      <Card key={orderId} className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-sm text-gray-600">{orderId}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {orderId.length === 24 ? 'MongoDB ObjectId' : 'Order Number'}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSampleOrderSelect(orderId)}
                            >
                              Select
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How to use:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Enter an order ID or order number in the search field above</li>
                  <li>Or click "Select" on one of the sample orders</li>
                  <li>Use the "Manage Order" tab to update order status and create shipments</li>
                  <li>Use the "Shiprocket Tools" tab for advanced delivery management</li>
                  <li>Monitor real-time updates in the "Live Monitoring" tab</li>
                </ol>
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Order Management Tab */}
          <TabsContent value="management" className="space-y-6">
            {selectedOrderId ? (
              <OrderStatusManager
                orderId={selectedOrderId}
                orderNumber={selectedOrderId}
              />
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please search for and select an order first using the "Find Order" tab.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Shiprocket Integration Tab */}
          <TabsContent value="shiprocket" className="space-y-6">
            {selectedOrderId ? (
              <ShiprocketIntegration
                orderId={selectedOrderId}
                onShipmentCreated={handleShipmentCreated}
              />
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please search for and select an order first using the "Find Order" tab.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Live Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            {selectedOrderId ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Real-Time Order Monitoring</CardTitle>
                    <p className="text-sm text-gray-600">
                      Watch live updates as changes are made to the order status
                    </p>
                  </CardHeader>
                </Card>

                <RealTimeOrderStatus
                  orderId={selectedOrderId}
                  orderNumber={selectedOrderId}
                  showConnectionStatus={true}
                  compact={false}
                />

                <Alert className="border-blue-200 bg-blue-50">
                  <Monitor className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Live Monitoring Active:</strong> This page will automatically update when order status changes are made.
                    You can test this by updating the order status in the "Manage Order" tab or creating a shipment in the "Shiprocket Tools" tab.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please search for and select an order first using the "Find Order" tab.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Information */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Shiprocket Integration Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-green-600">✅ What's Working</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Shiprocket API integration</li>
                  <li>• Real-time order status updates</li>
                  <li>• Shipment creation and tracking</li>
                  <li>• Serviceability checking</li>
                  <li>• Live monitoring dashboard</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">🔧 How to Test</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Use sample order IDs provided</li>
                  <li>• Update order status and watch live updates</li>
                  <li>• Create Shiprocket shipments</li>
                  <li>• Check delivery serviceability</li>
                  <li>• Track packages in real-time</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-purple-600">🚀 Features</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Server-sent events for live updates</li>
                  <li>• Mock mode for testing (configurable)</li>
                  <li>• Multiple delivery partner support</li>
                  <li>• Comprehensive tracking timeline</li>
                  <li>• Admin and customer interfaces</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </AdminAuthWrapper>
  );
}
