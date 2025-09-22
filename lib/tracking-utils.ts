/**
 * Tracking Utilities
 * Shared functions for real-time tracking functionality
 */

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();
// Store connection status separately 
const connectionStatus = new Map<string, string>();

// Broadcast update to all connections for a specific order
export function broadcastOrderUpdate(orderId: string, update: any) {
  connections.forEach((controller, connectionId) => {
    if (connectionId.startsWith(orderId)) {
      try {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'order_update',
          data: update,
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        console.error('Failed to broadcast update:', error);
        connections.delete(connectionId);
      }
    }
  });
}

// Get connections map (for use in the route file)
export function getConnections() {
  return connections;
}

// Status tracking functions
export function getConnectionStatus(connectionId: string): string | undefined {
  return connectionStatus.get(connectionId);
}

export function setConnectionStatus(connectionId: string, status: string): void {
  connectionStatus.set(connectionId, status);
}

export function deleteConnectionStatus(connectionId: string): void {
  connectionStatus.delete(connectionId);
}

// Helper function to get status change message
export function getStatusChangeMessage(status: string, location?: string): string {
  const messages: Record<string, string> = {
    'Order Placed': 'Your order has been placed successfully',
    'Picked Up': `Package has been picked up${location ? ` from ${location}` : ''}`,
    'In Transit': `Your package is in transit${location ? ` and currently at ${location}` : ''}`,
    'Out for Delivery': `Your package is out for delivery${location ? ` from ${location}` : ''}`,
    'Delivered': `Your package has been delivered${location ? ` at ${location}` : ''}`,
    'Exception': `There's an update about your delivery${location ? ` at ${location}` : ''}`
  };

  return messages[status] || `Order status updated: ${status}${location ? ` at ${location}` : ''}`;
}