'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Truck, 
  Clock, 
  Bell, 
  BellOff, 
  RefreshCw,
  ExternalLink,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface LiveTrackingData {
  trackingNumber: string;
  carrier: string;
  status: string;
  location: string;
  estimatedDelivery: string;
  lastUpdated: string;
  deliveryProgress: number;
  trackingUrl?: string;
  isLive: boolean;
}

interface LiveTrackingWidgetProps {
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  onTrackingUpdate?: (data: LiveTrackingData) => void;
  className?: string;
}

export function LiveTrackingWidget({
  orderId,
  trackingNumber,
  carrier = 'shiprocket',
  onTrackingUpdate,
  className = ''
}: LiveTrackingWidgetProps) {
  const [trackingData, setTrackingData] = useState<LiveTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null);

  // Fetch tracking data
  const fetchTrackingData = async () => {
    if (!trackingNumber) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/delivery/track/${trackingNumber}?carrier=${carrier}`);
      const result = await response.json();

      if (result.success) {
        const newData = result.data as LiveTrackingData;
        setTrackingData(newData);

        // Check if status has changed and notify
        if (trackingData && newData.status !== trackingData.status && notificationsEnabled) {
          showStatusChangeNotification(newData.status, newData.location);
          setLastNotificationTime(new Date());
        }

        onTrackingUpdate?.(newData);
      }
    } catch (error) {
      // Failed to fetch tracking data
    } finally {
      setIsLoading(false);
    }
  };

  // Show browser notification for status change
  const showStatusChangeNotification = (status: string, location: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Order Status Updated', {
        body: `Your order is now ${status}${location ? ` at ${location}` : ''}`,
        icon: '/icons/package.png',
        tag: `order-${orderId}`
      });
    } else {
      toast.success(`Order status updated: ${status}${location ? ` at ${location}` : ''}`);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled for order updates');
      }
    }
  };

  // Auto-refresh tracking data
  useEffect(() => {
    if (!trackingNumber) return;

    // Initial fetch
    fetchTrackingData();

    // Set up polling
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 2 * 60 * 1000); // Poll every 2 minutes

    return () => clearInterval(interval);
  }, [trackingNumber, carrier]);

  // Handle notification toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && 'Notification' in window && Notification.permission !== 'granted') {
      await requestNotificationPermission();
    }
    setNotificationsEnabled(enabled);
  };

  if (!trackingNumber) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Tracking information will appear here once your order is shipped</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Live Tracking
            {trackingData?.isLive && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTrackingData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {trackingData ? (
          <>
            {/* Current Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    trackingData.status === 'Delivered' ? 'bg-green-500' :
                    trackingData.status === 'Out for Delivery' ? 'bg-orange-500' :
                    trackingData.status === 'In Transit' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></div>
                  <h3 className="font-semibold text-gray-900">{trackingData.status}</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  {trackingData.deliveryProgress}% Complete
                </Badge>
              </div>
              {trackingData.location && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Current location: {trackingData.location}
                </p>
              )}
            </div>

            {/* Delivery Estimate */}
            {trackingData.estimatedDelivery && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Estimated Delivery
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-900">
                  {new Date(trackingData.estimatedDelivery).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              {trackingData.trackingUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(trackingData.trackingUrl, '_blank')}
                  className="h-10"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Track on {trackingData.carrier}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('tel:+91-1800-123-4567')}
                className="h-10"
              >
                <Phone className="w-4 h-4 mr-1" />
                Call Support
              </Button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {notificationsEnabled ? (
                  <Bell className="w-4 h-4 text-blue-500" />
                ) : (
                  <BellOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-medium">
                  Status Notifications
                </span>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Last updated: {new Date(trackingData.lastUpdated).toLocaleString('en-IN')}
              {lastNotificationTime && (
                <span className="block mt-1">
                  Last notification: {lastNotificationTime.toLocaleTimeString('en-IN')}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className={`w-8 h-8 mx-auto mb-3 ${isLoading ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-full h-full text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {isLoading ? 'Loading tracking information...' : 'Unable to load tracking data'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for using live tracking
export function useLiveTracking(orderId: string, trackingNumber?: string, carrier?: string) {
  const [trackingData, setTrackingData] = useState<LiveTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async () => {
    if (!trackingNumber) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/delivery/track/${trackingNumber}?carrier=${carrier}`);
      const result = await response.json();

      if (result.success) {
        setTrackingData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [trackingNumber, carrier]);

  return {
    trackingData,
    isLoading,
    error,
    refetch: fetchTracking
  };
}