'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useOrderStream } from '@/hooks/use-order-stream';
import { toast } from 'sonner';

interface RealTimeOrderStatusProps {
  orderId?: string;
  orderNumber?: string;
  initialStatus?: string;
  showConnectionStatus?: boolean;
  compact?: boolean;
}

interface OrderStatus {
  status: string;
  paymentStatus?: string;
  updatedAt?: string;
  isLive?: boolean;
}

export function RealTimeOrderStatus({
  orderId,
  orderNumber,
  initialStatus = 'pending',
  showConnectionStatus = true,
  compact = false
}: RealTimeOrderStatusProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>({
    status: initialStatus,
    isLive: false
  });
  const [updateAnimation, setUpdateAnimation] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  const { connected, lastEvent } = useOrderStream({
    orderId,
    orderNumber,
    enableToasts: true
  });

  // Handle incoming real-time updates
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'updated') {
      const eventData = lastEvent.data;
      
      // Trigger animation
      setUpdateAnimation(true);
      setTimeout(() => setUpdateAnimation(false), 600);
      
      // Update status
      setCurrentStatus({
        status: eventData.status || currentStatus.status,
        paymentStatus: eventData.paymentStatus,
        updatedAt: eventData.updatedAt,
        isLive: true
      });
      
      setLastUpdateTime(new Date().toLocaleTimeString());
      
      // Show success notification
      toast.success(`Order status updated to: ${eventData.status}`, {
        description: `Updated at ${new Date().toLocaleTimeString()}`,
      });
    }
  }, [lastEvent, currentStatus.status]);

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      confirmed: CheckCircle,
      shipped: Truck,
      delivered: Package,
      cancelled: AlertCircle
    };
    const IconComponent = icons[status] || Clock;
    return IconComponent;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const StatusIcon = getStatusIcon(currentStatus.status);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
        <div className={`p-2 rounded-full ${updateAnimation ? 'animate-pulse bg-blue-100' : 'bg-gray-100'}`}>
          <StatusIcon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge 
              className={`${getStatusColor(currentStatus.status)} transition-all duration-300 ${
                updateAnimation ? 'scale-110 shadow-md' : ''
              }`}
            >
              {currentStatus.status.charAt(0).toUpperCase() + currentStatus.status.slice(1)}
            </Badge>
            {currentStatus.isLive && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
            )}
          </div>
          {lastUpdateTime && (
            <p className="text-xs text-gray-500 mt-1">
              Updated at {lastUpdateTime}
            </p>
          )}
        </div>
        {showConnectionStatus && (
          <div className="flex items-center gap-1">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`transition-all duration-300 ${updateAnimation ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span>Order Status</span>
            {currentStatus.isLive && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                LIVE
              </Badge>
            )}
          </div>
          {showConnectionStatus && (
            <div className="flex items-center gap-2 text-sm">
              {connected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff className="w-4 h-4" />
                  <span>Disconnected</span>
                </div>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className={`p-3 rounded-full ${updateAnimation ? 'animate-bounce bg-blue-100' : 'bg-white'} shadow-sm`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              Current Status
            </h3>
            <Badge 
              className={`${getStatusColor(currentStatus.status)} text-sm px-3 py-1 transition-all duration-300 ${
                updateAnimation ? 'scale-110 shadow-md' : ''
              }`}
            >
              {currentStatus.status.charAt(0).toUpperCase() + currentStatus.status.slice(1)}
            </Badge>
            {currentStatus.paymentStatus && (
              <div className="mt-2">
                <span className="text-xs text-gray-600">Payment: </span>
                <Badge variant="outline" className="text-xs">
                  {currentStatus.paymentStatus}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Update Information */}
        <div className="text-sm text-gray-600 space-y-2">
          {lastUpdateTime && (
            <div className="flex justify-between items-center">
              <span>Last Update:</span>
              <span className="font-medium">{lastUpdateTime}</span>
            </div>
          )}
          {currentStatus.updatedAt && (
            <div className="flex justify-between items-center">
              <span>System Update:</span>
              <span className="font-medium">
                {new Date(currentStatus.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Real-time Indicator */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-sm text-gray-600">Real-time Updates:</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className={`text-xs ${connected ? 'text-green-600' : 'text-gray-500'}`}>
              {connected ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Manual Refresh Button for fallback */}
        {!connected && (
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Refresh Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RealTimeOrderStatus;