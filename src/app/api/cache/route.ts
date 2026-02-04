import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/utils/cache';

// GET /api/cache - Get cache statistics
export async function GET() {
  try {
    const stats = cache.getStats();
    return NextResponse.json({
      success: true,
      data: {
        cacheSize: stats.size,
        cachedKeys: stats.keys,
        message: `Cache contains ${stats.size} items`
      }
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/cache - Clear all cache
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key) {
      // Delete specific cache key
      const deleted = cache.delete(key);
      return NextResponse.json({
        success: true,
        message: deleted ? `Cache key '${key}' deleted` : `Cache key '${key}' not found`
      });
    } else {
      // Clear all cache
      cache.clear();
      return NextResponse.json({
        success: true,
        message: 'All cache cleared successfully'
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/cache/cleanup - Manual cleanup of expired items
export async function POST() {
  try {
    const statsBefore = cache.getStats();
    cache.cleanup();
    const statsAfter = cache.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        itemsBefore: statsBefore.size,
        itemsAfter: statsAfter.size,
        itemsRemoved: statsBefore.size - statsAfter.size,
        message: `Cleanup completed. Removed ${statsBefore.size - statsAfter.size} expired items`
      }
    });
  } catch (error) {
    console.error('Error during cache cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}