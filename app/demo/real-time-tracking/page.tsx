'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  User, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  Info
} from 'lucide-react';
import { RealTimeOrderStatus } from '@/components/real-time-order-status';
import { OrderStatusManager } from '@/components/admin/order-status-manager';

export default function RealTimeTrackingDemo() {
  const [demoMode, setDemoMode] = useState<'split' | 'admin' | 'user'>('split');
  const [isRunning, setIsRunning] = useState(false);
  
  // Sample order data for demo
  const sampleOrder = {
    id: '507f1f77bcf86cd799439011',
    orderNumber: 'ORD-DEMO-123456',
    status: 'confirmed',
    paymentStatus: 'completed',
    userId: 'user123'
  };

  const handleStartDemo = () => {
    setIsRunning(true);
    // In a real app, this might trigger some demo automation
  };

  const handleStopDemo = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    // Reset demo state
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Real-Time Order Tracking Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            See how order status updates appear instantly for users when admins make changes
          </p>
          
          {/* Demo Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button 
              onClick={handleStartDemo}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Demo
            </Button>
            <Button 
              onClick={handleStopDemo}
              disabled={!isRunning}
              variant="outline"
            >
              <Pause className="w-4 h-4 mr-2" />
              Stop Demo
            </Button>
            <Button 
              onClick={handleReset}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* View Mode Selector */}
          <Tabs value={demoMode} onValueChange={(value) => setDemoMode(value as any)} className="mb-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="split">
                <Monitor className="w-4 h-4 mr-2" />
                Split View
              </TabsTrigger>
              <TabsTrigger value="admin">
                <Settings className="w-4 h-4 mr-2" />
                Admin View
              </TabsTrigger>
              <TabsTrigger value="user">
                <User className="w-4 h-4 mr-2" />
                User View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Demo Status */}
        <Alert className="max-w-4xl mx-auto mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Demo Status: <Badge className={isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {isRunning ? '🟢 Active' : '⚪ Inactive'}
                </Badge>
              </span>
              <span className="text-sm">
                Sample Order: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{sampleOrder.orderNumber}</code>
              </span>
            </div>
          </AlertDescription>
        </Alert>

        {/* Content based on view mode */}
        <TabsContent value="split" className={demoMode === 'split' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Admin Side */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Settings className="w-5 h-5" />
                  Admin Interface
                </CardTitle>
                <p className="text-sm text-blue-700">
                  Update order status here and see the changes appear instantly on the user side
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <OrderStatusManager
                  orderId={sampleOrder.id}
                  orderNumber={sampleOrder.orderNumber}
                  initialOrder={sampleOrder}
                />
              </CardContent>
            </Card>

            {/* User Side */}
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <User className="w-5 h-5" />
                  Customer Interface
                </CardTitle>
                <p className="text-sm text-green-700">
                  This is what customers see - updates appear automatically without refresh
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Live Status Component */}
                <RealTimeOrderStatus
                  orderNumber={sampleOrder.orderNumber}
                  initialStatus={sampleOrder.status}
                  showConnectionStatus={true}
                  compact={false}
                />

                {/* Simulated Customer Tracking Page Elements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Order Number:</span>
                      <span className="font-mono text-sm">{sampleOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <Badge variant="outline">{sampleOrder.paymentStatus}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span>3 items</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>₹2,599</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Demo Instructions */}
                <Alert>
                  <AlertDescription>
                    <strong>How to test:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>Use the admin panel on the left to search for order: <code>{sampleOrder.orderNumber}</code></li>
                      <li>Change the order status using the dropdown</li>
                      <li>Click "Update Order" and watch this side update instantly!</li>
                      <li>Notice the animations, notifications, and live connection indicators</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="admin" className={demoMode === 'admin' ? 'block' : 'hidden'}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admin Order Management Interface
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusManager
                orderId={sampleOrder.id}
                orderNumber={sampleOrder.orderNumber}
                initialOrder={sampleOrder}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className={demoMode === 'user' ? 'block' : 'hidden'}>
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Tracking Experience
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Real-time order tracking as seen by customers
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <RealTimeOrderStatus
                  orderNumber={sampleOrder.orderNumber}
                  initialStatus={sampleOrder.status}
                  showConnectionStatus={true}
                  compact={false}
                />

                {/* Additional customer view elements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Delivery Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { status: 'Order Placed', completed: true, time: '2 days ago' },
                        { status: 'Payment Confirmed', completed: true, time: '2 days ago' },
                        { status: 'Order Confirmed', completed: true, time: '1 day ago' },
                        { status: 'In Preparation', completed: false, time: 'Pending' },
                        { status: 'Shipped', completed: false, time: 'Pending' },
                        { status: 'Delivered', completed: false, time: 'Pending' }
                      ].map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            step.completed ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <div className="flex-1 flex justify-between">
                            <span className={step.completed ? 'text-gray-900' : 'text-gray-500'}>
                              {step.status}
                            </span>
                            <span className="text-sm text-gray-500">{step.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Footer Information */}
        <Card className="mt-12 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>How Real-Time Tracking Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Admin Updates</h4>
                <p className="text-gray-600">
                  When an admin changes an order status through the management interface, the change is immediately saved to the database.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Server-Sent Events</h4>
                <p className="text-gray-600">
                  The API broadcasts the update to all connected clients using Server-Sent Events (SSE) for real-time communication.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Live User Updates</h4>
                <p className="text-gray-600">
                  Customers tracking their orders see the status change instantly with animations and notifications, without needing to refresh the page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}