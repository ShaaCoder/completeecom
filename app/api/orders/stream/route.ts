// Server-Sent Events stream for order updates
import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { createErrorResponse } from '@/lib/api-helpers';
import { addClient, removeClient, SSEController } from '@/lib/sse';

export async function GET(request: NextRequest) {
  try {
    const stream = new ReadableStream<Uint8Array>({
      start(controller: SSEController) {
        const id = addClient(controller);
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
          removeClient(id);
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

