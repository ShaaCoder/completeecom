'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Clock, 
  CreditCard, 
  Calendar,
  MapPin,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Hand,
  Circle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface TrackingEvent {
  status: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
  icon: string;
  location?: string;
  isLive?: boolean;
  remarks?: string;
}

interface TrackingData {
  trackingNumber?: string;
  carrier?: string;
  currentStatus: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  lastUpdated: string;
  trackingUrl?: string;
  isLiveTracking: boolean;
  trackingError?: string;
  deliveryProgress?: number;
  customerActions?: string[];
}

interface EnhancedOrderTrackingTimelineProps {
  orderId: string;
  timeline: TrackingEvent[];
  trackingData?: TrackingData;
  onRefresh?: () => Promise<void>;
  className?: string;
}

// Icon mapping for different status types
const iconComponents = {
  'check-circle': CheckCircle,
  'package': Package,
  'truck': Truck,
  'clock': Clock,
  'credit-card': CreditCard,
  'calendar': Calendar,
  'map-pin': MapPin,
  'alert-triangle': AlertTriangle,
  'hand': Hand,
  'circle': Circle,
};

export function EnhancedOrderTrackingTimeline({
  orderId,
  timeline,
  trackingData,
  onRefresh,
  className = ''
}: EnhancedOrderTrackingTimelineProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Auto-refresh functionality
  useEffect(() => {
    if (!trackingData?.isLiveTracking || !onRefresh) return;
    
    const interval = setInterval(async () => {
      try {
        await onRefresh();
        setLastRefresh(new Date());
      } catch (error) {
        // Auto-refresh failed
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes for live tracking

    return () => clearInterval(interval);
  }, [trackingData?.isLiveTracking, onRefresh]);

  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
      toast.success('Tracking information updated');
    } catch (error) {
      toast.error('Failed to refresh tracking information');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    return iconComponents[iconName as keyof typeof iconComponents] || Circle;
  };

  const getStatusColor = (event: TrackingEvent) => {
    if (event.completed) return 'bg-green-500 text-white';
    if (event.current) return 'bg-blue-500 text-white';
    return 'bg-gray-200 text-gray-500';
  };

  const getConnectorColor = (completed: boolean) => {
    return completed ? 'bg-green-500' : 'bg-gray-200';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tracking Header */}
      {trackingData && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Live Tracking
                {trackingData.isLiveTracking && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Live
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {trackingData.trackingUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(trackingData.trackingUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Track on {trackingData.carrier}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            {trackingData.deliveryProgress !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Delivery Progress</span>
                  <span>{trackingData.deliveryProgress}%</span>
                </div>
                <Progress value={trackingData.deliveryProgress} className="h-2" />
              </div>
            )}

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Status:</span>
                <p className="font-medium">{trackingData.currentStatus}</p>
              </div>
              {trackingData.currentLocation && (
                <div>
                  <span className="text-gray-600">Current Location:</span>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {trackingData.currentLocation}
                  </p>
                </div>
              )}
              {trackingData.estimatedDelivery && (
                <div>
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <p className="font-medium">
                    {new Date(trackingData.estimatedDelivery).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <span>
                Last updated: {new Date(trackingData.lastUpdated).toLocaleString('en-IN')}
              </span>
              {lastRefresh && (
                <span>Auto-refreshed: {lastRefresh.toLocaleTimeString('en-IN')}</span>
              )}
            </div>

            {/* Tracking Error */}
            {trackingData.trackingError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">{trackingData.trackingError}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tracking information available</p>
              </div>
            ) : (
              timeline.map((event, index) => {
                const IconComponent = getIconComponent(event.icon);
                const isLast = index === timeline.length - 1;

                return (
                  <div key={index} className="flex items-start gap-4 relative">
                    {/* Timeline Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative z-10 ${getStatusColor(event)}`}>
                      <IconComponent className="w-5 h-5" />
                      {event.isLive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </div>

                    {/* Timeline Connector */}
                    {!isLast && (
                      <div className={`absolute left-5 top-12 w-0.5 h-6 ${getConnectorColor(event.completed)}`} />
                    )}

                    {/* Timeline Content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium flex items-center gap-2 ${
                            event.completed || event.current ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {event.status}
                            {event.current && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Current
                              </Badge>
                            )}
                            {event.isLive && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Live
                              </Badge>
                            )}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            event.completed || event.current ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {event.description}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                          {event.remarks && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              {event.remarks}
                            </p>
                          )}
                        </div>
                        {event.timestamp && (
                          <div className="flex-shrink-0 text-xs text-gray-500 ml-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(event.timestamp).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="mt-1">
                              {new Date(event.timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Actions */}
      {trackingData?.customerActions && trackingData.customerActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trackingData.customerActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Handle action clicks
                    if (action === 'Contact Support') {
                      window.open('tel:+91-1800-123-4567');
                    } else if (action === 'Track Package' && trackingData.trackingUrl) {
                      window.open(trackingData.trackingUrl, '_blank');
                    } else {
                      toast.info(`${action} feature coming soon`);
                    }
                  }}
                >
                  {action}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}