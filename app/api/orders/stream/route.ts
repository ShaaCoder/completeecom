// Server-Sent Events stream for order updates
import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { createErrorResponse } from '@/lib/api-helpers';

// Simple in-memory broadcaster
type Client = { id: number; controller: ReadableStreamDefaultController };
const clients: Client[] = [];
let clientSeq = 1;

export async function GET(request: NextRequest) {
  try {
    const stream = new ReadableStream({
      start(controller) {
        const client: Client = { id: clientSeq++, controller };
        clients.push(client);
        // Send initial ping
        controller.enqueue(new TextEncoder().encode(`event: ping\ndata: connected\n\n`));

        // Heartbeat every 20s
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(`event: ping\ndata: heartbeat\n\n`));
          } catch {}
        }, 20000);

        // Close handler
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          const idx = clients.findIndex(c => c.id === client.id);
          if (idx >= 0) clients.splice(idx, 1);
          try { controller.close(); } catch {}
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return createErrorResponse('Failed to open orders stream', 500, 'SSE Error');
  }
}

// Helper to emit events from other routes
export function emitOrderEvent(type: 'created' | 'updated' | 'deleted', payload: any) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  const message = new TextEncoder().encode(data);
  clients.forEach(c => {
    try { c.controller.enqueue(message); } catch {}
  });
}


