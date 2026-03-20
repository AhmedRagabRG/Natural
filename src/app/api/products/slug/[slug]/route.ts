import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/utils/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    if (!decodedSlug) {
      return NextResponse.json(
        { error: 'Invalid product URL' },
        { status: 400 }
      );
    }

    const cacheKey = CACHE_KEYS.PRODUCT_BY_URL(decodedSlug);
    const cachedProduct = cache.get(cacheKey);
    if (cachedProduct) {
      return NextResponse.json(cachedProduct);
    }

    const product = await ProductService.getProductByUrl(decodedSlug);

    if (!product) {
      const errorResult = {
        success: false,
        error: {
          message: 'Product not found'
        }
      };
      cache.set(cacheKey, errorResult, 60 * 1000);
      return NextResponse.json(errorResult, { status: 404 });
    }

    const result = {
      success: true,
      data: product
    };

    cache.set(cacheKey, result, 5 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
