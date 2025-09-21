'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, CreditCard, Truck, Wifi, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning' | 'checking';
  message: string;
  responseTime?: number;
  lastChecked?: string;
  details?: any;
}

interface SystemHealth {
  database: HealthCheck;
  api: HealthCheck;
  payment: HealthCheck;
  delivery: HealthCheck;
  overall: 'healthy' | 'unhealthy' | 'warning';
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth>({
    database: { name: 'Database', status: 'checking', message: 'Checking...' },
    api: { name: 'API', status: 'checking', message: 'Checking...' },
    payment: { name: 'Payment Gateway', status: 'checking', message: 'Checking...' },
    delivery: { name: 'Delivery Partners', status: 'checking', message: 'Checking...' },
    overall: 'warning',
  });
  
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const checkDatabaseHealth = async (): Promise<HealthCheck> => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/health/database');
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        return {
          name: 'Database',
          status: 'healthy',
          message: 'MongoDB connection is healthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: data.data,
        };
      } else {
        return {
          name: 'Database',
          status: 'unhealthy',
          message: data.message || 'Database connection failed',
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        name: 'Database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkAPIHealth = async (): Promise<HealthCheck> => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/health/api');
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        return {
          name: 'API',
          status: 'healthy',
          message: 'All API endpoints are responding',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: data.data,
        };
      } else {
        return {
          name: 'API',
          status: 'unhealthy',
          message: data.message || 'API health check failed',
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        name: 'API',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'API check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkPaymentHealth = async (): Promise<HealthCheck> => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/health/payment');
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        return {
          name: 'Payment Gateway',
          status: 'healthy',
          message: 'Payment gateways are operational',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: data.data,
        };
      } else {
        return {
          name: 'Payment Gateway',
          status: 'warning',
          message: data.message || 'Some payment gateways may be unavailable',
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        name: 'Payment Gateway',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Payment check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkDeliveryHealth = async (): Promise<HealthCheck> => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/health/delivery');
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.success) {
        return {
          name: 'Delivery Partners',
          status: 'healthy',
          message: 'Delivery partners are operational',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: data.data,
        };
      } else {
        return {
          name: 'Delivery Partners',
          status: 'warning',
          message: data.message || 'Some delivery partners may be unavailable',
          responseTime,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        name: 'Delivery Partners',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Delivery check failed',
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const runHealthChecks = async () => {
    setIsChecking(true);
    
    // Set all to checking state
    setHealth(prev => ({
      ...prev,
      database: { ...prev.database, status: 'checking', message: 'Checking...' },
      api: { ...prev.api, status: 'checking', message: 'Checking...' },
      payment: { ...prev.payment, status: 'checking', message: 'Checking...' },
      delivery: { ...prev.delivery, status: 'checking', message: 'Checking...' },
    }));

    try {
      const [databaseHealth, apiHealth, paymentHealth, deliveryHealth] = await Promise.all([
        checkDatabaseHealth(),
        checkAPIHealth(),
        checkPaymentHealth(),
        checkDeliveryHealth(),
      ]);

      // Determine overall health
      const statuses = [databaseHealth.status, apiHealth.status, paymentHealth.status, deliveryHealth.status];
      let overall: 'healthy' | 'unhealthy' | 'warning' = 'healthy';
      
      if (statuses.includes('unhealthy')) {
        overall = 'unhealthy';
      } else if (statuses.includes('warning')) {
        overall = 'warning';
      }

      setHealth({
        database: databaseHealth,
        api: apiHealth,
        payment: paymentHealth,
        delivery: deliveryHealth,
        overall,
      });

      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Healthy</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-500">Unhealthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'checking':
        return <Badge className="bg-blue-500">Checking</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };

  return (
    <div>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">System Health Dashboard</h1>
              <p className="text-gray-600">Monitor the health of all system components</p>
              {lastUpdate && (
                <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdate}</p>
              )}
            </div>
            <Button 
              onClick={runHealthChecks} 
              disabled={isChecking}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(health.overall)}
              Overall System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getStatusBadge(health.overall)}
              <span className="text-lg">
                {health.overall === 'healthy' && 'All systems operational'}
                {health.overall === 'warning' && 'Some systems need attention'}
                {health.overall === 'unhealthy' && 'Critical issues detected'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Component Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.database.status)}
                  {getStatusBadge(health.database.status)}
                </div>
                <p className="text-sm text-gray-600">{health.database.message}</p>
                {health.database.responseTime && (
                  <p className="text-xs text-gray-500">
                    Response time: {health.database.responseTime}ms
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="w-5 h-5" />
                API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.api.status)}
                  {getStatusBadge(health.api.status)}
                </div>
                <p className="text-sm text-gray-600">{health.api.message}</p>
                {health.api.responseTime && (
                  <p className="text-xs text-gray-500">
                    Response time: {health.api.responseTime}ms
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.payment.status)}
                  {getStatusBadge(health.payment.status)}
                </div>
                <p className="text-sm text-gray-600">{health.payment.message}</p>
                {health.payment.responseTime && (
                  <p className="text-xs text-gray-500">
                    Response time: {health.payment.responseTime}ms
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="w-5 h-5" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.delivery.status)}
                  {getStatusBadge(health.delivery.status)}
                </div>
                <p className="text-sm text-gray-600">{health.delivery.message}</p>
                {health.delivery.responseTime && (
                  <p className="text-xs text-gray-500">
                    Response time: {health.delivery.responseTime}ms
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Health Details</CardTitle>
                <CardDescription>MongoDB connection and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {health.database.details ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Connection Status</h4>
                        <p className="text-sm text-gray-600">{health.database.details.status}</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Database Name</h4>
                        <p className="text-sm text-gray-600">{health.database.details.name}</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Collections</h4>
                        <p className="text-sm text-gray-600">{health.database.details.collections?.length || 0}</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Models</h4>
                        <p className="text-sm text-gray-600">{health.database.details.models?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No detailed information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>API Health Details</CardTitle>
                <CardDescription>REST API endpoints status and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {health.api.details ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Environment</h4>
                        <p className="text-sm text-gray-600">{health.api.details.environment}</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Version</h4>
                        <p className="text-sm text-gray-600">{health.api.details.version}</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Uptime</h4>
                        <p className="text-sm text-gray-600">{health.api.details.uptime}s</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Memory Usage</h4>
                        <p className="text-sm text-gray-600">{health.api.details.memory?.percentage}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No detailed information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Details</CardTitle>
                <CardDescription>Payment provider status and configuration</CardDescription>
              </CardHeader>
              <CardContent>
                {health.payment.details ? (
                  <div className="space-y-4">
                    {health.payment.details.providers?.map((provider: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">{provider.name}</h4>
                          {getStatusBadge(provider.status)}
                        </div>
                        <p className="text-sm text-gray-600">{provider.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No detailed information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Partner Details</CardTitle>
                <CardDescription>Shipping provider status and availability</CardDescription>
              </CardHeader>
              <CardContent>
                {health.delivery.details ? (
                  <div className="space-y-4">
                    {health.delivery.details.providers?.map((provider: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">{provider.name}</h4>
                          {getStatusBadge(provider.status)}
                        </div>
                        <p className="text-sm text-gray-600">{provider.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No detailed information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}