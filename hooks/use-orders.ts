'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Order } from '@/types';
import { OrderResponse } from '@/types/order';
interface UseOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}
interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
export function useOrders(params: { page?: number; limit?: number; status?: string } = {}, options: { pollIntervalMs?: number } = {}) {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null); // ✅ fix
  const pollIntervalMs = options.pollIntervalMs ?? 0;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getOrders(params);

      if (response.success) {
        setOrders(response.data || []);
        setPagination(response.pagination || null); // ✅ works now
      } else {
        setError(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [params.page, params.limit, params.status]);

  // Polling
  useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs <= 0) return;
    const id = setInterval(() => {
      fetchOrders();
    }, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs, params.page, params.limit, params.status]);

  // SSE client: refetch on order events
  useEffect(() => {
    const source = new EventSource('/api/orders/stream');
    const handler = () => {
      fetchOrders();
    };
    source.addEventListener('created', handler);
    source.addEventListener('updated', handler);
    source.addEventListener('deleted', handler);
    // graceful close on unmount
    return () => {
      try {
        source.close();
      } catch {}
    };
  }, []);

  return { orders, loading, error, pagination, refetch: fetchOrders };
}
export function useOrder(id: string, options: { pollIntervalMs?: number } = {}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalMs = options.pollIntervalMs ?? 0;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.getOrderById(id);
        
        if (response.success) {
          setOrder(response.data);
        } else {
          setError(response.message || 'Order not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  // Polling
  useEffect(() => {
    if (!id || !pollIntervalMs || pollIntervalMs <= 0) return;
    const idTimer = setInterval(() => {
      // fire and forget; internal fetch handles loading states
      (async () => {
        try { await apiClient.getOrderById(id); } catch {}
      })();
    }, pollIntervalMs);
    return () => clearInterval(idTimer);
  }, [id, pollIntervalMs]);

  // SSE client: refetch this order on updates/deletes
  useEffect(() => {
    if (!id) return;
    const source = new EventSource('/api/orders/stream');
    const onUpdate = (ev: MessageEvent) => {
      try {
        const data = JSON.parse((ev as any).data || '{}');
        if (data?.id === id || data?.orderNumber === id) {
          // refetch
          (async () => {
            try {
              const response = await apiClient.getOrderById(id);
              if (response.success) setOrder(response.data);
            } catch {}
          })();
        }
      } catch {}
    };
    source.addEventListener('updated', onUpdate);
    source.addEventListener('deleted', onUpdate);
    return () => {
      try { source.close(); } catch {}
    };
  }, [id]);

  return { order, loading, error };
}

export async function createOrder(orderData: {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  couponCode?: string;
}) {
  return apiClient.createOrder(orderData);
}

export async function cancelOrder(id: string, reason?: string) {
  return apiClient.cancelOrder(id, reason);
}

export async function updateOrderStatus(id: string, updates: { status?: string; paymentStatus?: string; trackingNumber?: string; carrier?: string; expectedDeliveryAt?: string; shippedAt?: string; deliveredAt?: string; paymentAt?: string; confirmedAt?: string }) {
  return apiClient.updateOrder(id, updates);
}