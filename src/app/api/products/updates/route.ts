import { NextRequest, NextResponse } from 'next/server';
import { cache, CACHE_KEYS } from '../../../../utils/cache';

// Store for SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// GET endpoint for Server-Sent Events
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || Math.random().toString(36);

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      connections.add(controller);
      
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: Date.now()
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(data));
      
      // Clean up when connection closes
      request.signal.addEventListener('abort', () => {
        connections.delete(controller);
        try {
          controller.close();
        } catch (e) {
          // Connection already closed
        }
      });
    },
    
    cancel(controller) {
      connections.delete(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// POST endpoint to trigger product updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Clear relevant cache entries
    if (type === 'product_updated' || type === 'product_created' || type === 'product_deleted') {
      // Clear all product-related cache
      cache.delete(CACHE_KEYS.PRODUCTS_ALL);
      cache.delete(CACHE_KEYS.PRODUCTS_FEATURED);
      
      // Clear category-specific cache if category_id is provided
      if (data?.category_id) {
        cache.delete(CACHE_KEYS.PRODUCTS_BY_CATEGORY(data.category_id));
      }
      
      // Clear specific product cache if product_id is provided
      if (data?.product_id) {
        cache.delete(CACHE_KEYS.PRODUCT_BY_ID(data.product_id));
      }
      
      // Clear search cache (simplified - in production you might want to be more specific)
      const cacheStats = cache.getStats();
      cacheStats.keys.forEach(key => {
        if (key.startsWith('products:search:')) {
          cache.delete(key);
        }
      });
    }

    // Broadcast update to all connected clients
    const message = `data: ${JSON.stringify({
      type,
      data,
      timestamp: Date.now()
    })}\n\n`;
    
    const encodedMessage = new TextEncoder().encode(message);
    
    // Send to all connected clients
    const deadConnections: ReadableStreamDefaultController[] = [];
    
    for (const controller of connections) {
      try {
        controller.enqueue(encodedMessage);
      } catch (error) {
        // Connection is dead, mark for removal
        deadConnections.push(controller);
      }
    }
    
    // Clean up dead connections
    deadConnections.forEach(controller => {
      connections.delete(controller);
    });

    return NextResponse.json({
      success: true,
      message: 'Update broadcasted successfully',
      activeConnections: connections.size
    });
    
  } catch (error) {
    console.error('Error broadcasting product update:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast update' },
      { status: 500 }
    );
  }
}

// Utility function to broadcast updates (can be called from other parts of the app)
export function broadcastProductUpdate(type: string, data: unknown) {
  const message = `data: ${JSON.stringify({
    type,
    data,
    timestamp: Date.now()
  })}\n\n`;
  
  const encodedMessage = new TextEncoder().encode(message);
  
  const deadConnections: ReadableStreamDefaultController[] = [];
  
  for (const controller of connections) {
    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      deadConnections.push(controller);
    }
  }
  
  // Clean up dead connections
  deadConnections.forEach(controller => {
    connections.delete(controller);
  });
  
  return connections.size;
}