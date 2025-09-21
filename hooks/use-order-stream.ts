'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type OrderStreamEventType = 'created' | 'updated' | 'deleted' | 'ping';

export interface OrderStreamEvent<T = any> {
  type: OrderStreamEventType;
  data: T;
}

interface UseOrderStreamOptions {
  orderId?: string;
  orderNumber?: string;
  enableToasts?: boolean;
}

export function useOrderStream(options: UseOrderStreamOptions) {
  const { orderId, orderNumber, enableToasts = true } = options;
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<OrderStreamEvent | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const filterFn = useMemo(() => {
    return (payload: any) => {
      if (!payload) return false;
      if (orderId && payload.id && String(payload.id) === String(orderId)) return true;
      if (orderNumber && payload.orderNumber && String(payload.orderNumber) === String(orderNumber)) return true;
      return false;
    };
  }, [orderId, orderNumber]);

  useEffect(() => {
    const es = new EventSource('/api/orders/stream');
    esRef.current = es;

    es.addEventListener('open', () => {
      setConnected(true);
      if (enableToasts) toast.success('Live updates connected');
    });

    es.addEventListener('error', () => {
      setConnected(false);
      if (enableToasts) toast.error('Live updates connection lost');
    });

    es.addEventListener('ping', () => {
      // keep-alive
    });

    ['created', 'updated', 'deleted'].forEach((evt) => {
      es.addEventListener(evt, (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (!orderId && !orderNumber) {
            setLastEvent({ type: evt as OrderStreamEventType, data: payload });
            return;
          }
          if (filterFn(payload)) {
            const eventObj: OrderStreamEvent = { type: evt as OrderStreamEventType, data: payload };
            setLastEvent(eventObj);
            if (enableToasts && evt === 'updated') {
              toast.info(`Order ${payload.orderNumber || payload.id} updated to ${payload.status}`);
            }
          }
        } catch {}
      });
    });

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [filterFn, orderId, orderNumber, enableToasts]);

  return { connected, lastEvent };
}