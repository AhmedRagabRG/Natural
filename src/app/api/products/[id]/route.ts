import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/utils/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const productId = parseInt(id);

    // Validate ID parameter
    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Create cache key for single product
    const cacheKey = CACHE_KEYS.PRODUCT_BY_ID(productId);
    
    // Check cache first
    const cachedProduct = cache.get(cacheKey);
    if (cachedProduct) {
      return NextResponse.json(cachedProduct);
    }

    const product = await ProductService.getProductById(productId);

    if (!product) {
      const errorResult = { 
        success: false,
        error: {
          message: 'Product not found'
        }
      };
      // Cache 404 result for 1 minute to avoid repeated DB queries
      cache.set(cacheKey, errorResult, 60 * 1000);
      return NextResponse.json(errorResult, { status: 404 });
    }

    const result = {
      success: true,
      data: product
    };

    // Cache product for 5 minutes
    cache.set(cacheKey, result, 5 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}