// Simple in-memory SSE broadcaster usable across API routes
// Note: This uses in-process memory; suitable for single-instance/node runtime.
// For multi-instance deployments, use a shared pub/sub (Redis, etc.).

export type OrderEventType = 'created' | 'updated' | 'deleted'

// Ensure we use the proper controller generic so TS/dom lib is happy
// We stream Uint8Array chunks
export type SSEController = ReadableStreamDefaultController<Uint8Array>

type Client = { id: number; controller: SSEController }

let clients: Client[] = []
let clientSeq = 1

export function addClient(controller: SSEController): number {
  const id = clientSeq++
  clients.push({ id, controller })
  return id
}

export function removeClient(id: number): void {
  const idx = clients.findIndex((c) => c.id === id)
  if (idx >= 0) clients.splice(idx, 1)
}

export function emitOrderEvent(type: OrderEventType, payload: any): void {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`
  const message = new TextEncoder().encode(data)
  clients.forEach((c) => {
    try {
      c.controller.enqueue(message)
    } catch {}
  })
}
