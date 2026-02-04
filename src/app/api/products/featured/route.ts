import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/utils/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '10');
    const lang = searchParams.get('lang') || 'en';

    // Validate limit parameter
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate language parameter
    if (!['en', 'ar'].includes(lang)) {
      return NextResponse.json(
        { error: 'Invalid language parameter. Must be en or ar' },
        { status: 400 }
      );
    }

    // Create cache key for featured products
    const cacheKey = `${CACHE_KEYS.PRODUCTS_FEATURED}:${limit}:${lang}`;
    
    // Check cache first
    const cachedProducts = cache.get(cacheKey);
    if (cachedProducts) {
      return NextResponse.json(cachedProducts);
    }

    const products = await ProductService.getFeaturedProducts(limit, lang);
    
    const result = {
      success: true,
      data: products
    };

    // Cache featured products for 5 minutes
    cache.set(cacheKey, result, 5 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}