'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Send,
  RefreshCw,
  ExternalLink,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api';

interface ShiprocketIntegrationProps {
  orderId?: string;
  onShipmentCreated?: (shipmentData: any) => void;
}

interface ServiceabilityResult {
  serviceable: boolean;
  estimatedDays: number;
  shippingCost: number;
  codAvailable: boolean;
  provider: string;
}

export function ShiprocketIntegration({ orderId, onShipmentCreated }: ShiprocketIntegrationProps) {
  const [activeTab, setActiveTab] = useState('shipment');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [shipmentResult, setShipmentResult] = useState<any>(null);
  const [serviceabilityResults, setServiceabilityResults] = useState<ServiceabilityResult[]>([]);
  const [trackingData, setTrackingData] = useState<any>(null);
  
  // Use auth store for authentication
  const { isAuthenticated, user } = useAuthStore();

  // Serviceability check form
  const [serviceabilityForm, setServiceabilityForm] = useState({
    fromPincode: '400001',
    toPincode: '',
    weight: '500',
    codAmount: '0'
  });

  // Tracking form
  const [trackingForm, setTrackingForm] = useState({
    awbNumber: '',
    provider: 'shiprocket'
  });

  // Load order data
  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  const loadOrder = async (id: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in first');
      return;
    }
    
    setLoading(true);
    try {
      const result = await apiClient.getOrderById(id);
      if (result.success && result.data) {
        setOrder(result.data);
        
        // Pre-fill serviceability form with order data
        if (result.data.shippingAddress) {
          setServiceabilityForm(prev => ({
            ...prev,
            toPincode: result.data.shippingAddress.pincode || ''
          }));
        }

        // Pre-fill tracking form if tracking number exists
        if (result.data.trackingNumber) {
          setTrackingForm(prev => ({
            ...prev,
            awbNumber: result.data.trackingNumber
          }));
        }
      } else {
        toast.error(result.message || 'Failed to load order');
      }
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const createShipment = async () => {
    if (!order) {
      toast.error('No order selected');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/delivery/create-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          provider: 'shiprocket'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShipmentResult(result.data);
        toast.success('Shipment created successfully!');
        
        // Update tracking form
        if (result.data.awbNumber) {
          setTrackingForm(prev => ({
            ...prev,
            awbNumber: result.data.awbNumber
          }));
        }

        // Reload order to get updated data
        await loadOrder(order.id);
        
        onShipmentCreated?.(result.data);
      } else {
        toast.error(result.message || 'Failed to create shipment');
      }
    } catch (error) {
      toast.error('Network error while creating shipment');
    } finally {
      setLoading(false);
    }
  };

  const checkServiceability = async () => {
    if (!serviceabilityForm.fromPincode || !serviceabilityForm.toPincode) {
      toast.error('Please enter both from and to pincodes');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/delivery/serviceability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromPincode: serviceabilityForm.fromPincode,
          toPincode: serviceabilityForm.toPincode,
          weight: parseInt(serviceabilityForm.weight) || 500,
          codAmount: parseInt(serviceabilityForm.codAmount) || 0
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setServiceabilityResults(result.data || []);
        toast.success('Serviceability check completed');
      } else {
        toast.error(result.message || 'Serviceability check failed');
      }
    } catch (error) {
      toast.error('Network error during serviceability check');
    } finally {
      setLoading(false);
    }
  };

  const trackShipment = async () => {
    if (!trackingForm.awbNumber) {
      toast.error('Please enter AWB/Tracking number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/delivery/track/${trackingForm.awbNumber}?provider=${trackingForm.provider}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setTrackingData(result.data);
        toast.success('Tracking data retrieved');
      } else {
        toast.error(result.message || 'Failed to track shipment');
      }
    } catch (error) {
      toast.error('Network error while tracking shipment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'shipped':
      case 'in transit':
      case 'out for delivery':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'picked up':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Shiprocket Integration
            {order && (
              <Badge variant="outline" className="ml-auto">
                Order: {order.orderNumber}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        {order && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <Badge className="ml-2" variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                  {order.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-medium">₹{order.total}</span>
              </div>
              <div>
                <span className="text-gray-600">Tracking:</span>
                <span className="ml-2 font-mono text-xs">
                  {order.trackingNumber || 'Not assigned'}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipment" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Create Shipment
          </TabsTrigger>
          <TabsTrigger value="serviceability" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Check Delivery
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Track Package
          </TabsTrigger>
        </TabsList>

        {/* Create Shipment Tab */}
        <TabsContent value="shipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Shiprocket Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!order ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Please select an order to create a shipment. Use the order management interface to choose an order first.
                  </AlertDescription>
                </Alert>
              ) : order.trackingNumber ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This order already has a tracking number: <code className="bg-gray-100 px-2 py-1 rounded">{order.trackingNumber}</code>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delivery Address</Label>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                        <p className="font-medium">{order.shippingAddress?.name}</p>
                        <p>{order.shippingAddress?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Phone className="w-3 h-3" />
                          <span>{order.shippingAddress?.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Order Items</Label>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        {order.items?.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.name}</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 font-medium">
                          Total: ₹{order.total}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={createShipment} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating Shipment...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Create Shiprocket Shipment
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Shipment Result */}
              {shipmentResult && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-green-800">Shipment Created Successfully!</p>
                      <div className="space-y-1 text-sm">
                        <p><strong>Shipment ID:</strong> {shipmentResult.shipmentId}</p>
                        <p><strong>AWB Number:</strong> {shipmentResult.awbNumber}</p>
                        {shipmentResult.trackingUrl && (
                          <p className="flex items-center gap-2">
                            <strong>Track Online:</strong>
                            <a 
                              href={shipmentResult.trackingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              Open Tracking <ExternalLink className="w-3 h-3" />
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Serviceability Check Tab */}
        <TabsContent value="serviceability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Check Delivery Serviceability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>From Pincode</Label>
                  <Input
                    placeholder="400001"
                    value={serviceabilityForm.fromPincode}
                    onChange={(e) => setServiceabilityForm(prev => ({ ...prev, fromPincode: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>To Pincode</Label>
                  <Input
                    placeholder="110001"
                    value={serviceabilityForm.toPincode}
                    onChange={(e) => setServiceabilityForm(prev => ({ ...prev, toPincode: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Weight (grams)</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={serviceabilityForm.weight}
                    onChange={(e) => setServiceabilityForm(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>COD Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={serviceabilityForm.codAmount}
                    onChange={(e) => setServiceabilityForm(prev => ({ ...prev, codAmount: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={checkServiceability} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Check Serviceability
                  </>
                )}
              </Button>

              {/* Serviceability Results */}
              {serviceabilityResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Serviceability Results:</h4>
                  {serviceabilityResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium capitalize">{result.provider}</h5>
                        <Badge variant={result.serviceable ? "default" : "destructive"}>
                          {result.serviceable ? 'Available' : 'Not Available'}
                        </Badge>
                      </div>
                      {result.serviceable && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">ETA:</span>
                            <span className="ml-2">{result.estimatedDays} days</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Cost:</span>
                            <span className="ml-2">₹{result.shippingCost}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">COD:</span>
                            <span className="ml-2">{result.codAvailable ? 'Available' : 'Not Available'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Track Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>AWB/Tracking Number</Label>
                  <Input
                    placeholder="Enter tracking number"
                    value={trackingForm.awbNumber}
                    onChange={(e) => setTrackingForm(prev => ({ ...prev, awbNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Select 
                    value={trackingForm.provider} 
                    onValueChange={(value) => setTrackingForm(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shiprocket">Shiprocket</SelectItem>
                      <SelectItem value="delhivery">Delhivery</SelectItem>
                      <SelectItem value="bluedart">Blue Dart</SelectItem>
                      <SelectItem value="dtdc">DTDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={trackShipment} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Track Shipment
                  </>
                )}
              </Button>

              {/* Tracking Results */}
              {trackingData && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Current Status</h4>
                      <Badge className="flex items-center gap-2">
                        {getStatusIcon(trackingData.status)}
                        {trackingData.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Location:</span>
                        <span className="ml-2">{trackingData.currentLocation || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected Delivery:</span>
                        <span className="ml-2">
                          {trackingData.estimatedDelivery 
                            ? new Date(trackingData.estimatedDelivery).toLocaleDateString()
                            : 'TBD'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tracking History */}
                  {trackingData.trackingHistory && trackingData.trackingHistory.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Tracking History</h4>
                      <div className="space-y-3">
                        {trackingData.trackingHistory.map((event: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 mt-1">
                              {getStatusIcon(event.status)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{event.status}</p>
                              <p className="text-sm text-gray-600">{event.location}</p>
                              {event.remarks && (
                                <p className="text-xs text-gray-500 mt-1">{event.remarks}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ShiprocketIntegration;