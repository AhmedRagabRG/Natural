import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '../../../../lib/db';
import { cache } from '../../../../utils/cache';

// GET /api/products/top-sellers - Get top selling products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const lang = searchParams.get('lang') || 'en';

    const cacheKey = `products:top-sellers:${limit}:${lang}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        {
          success: false,
          message: 'Limit must be between 1 and 50'
        },
        { status: 400 }
      );
    }

    const topSellers = await ProductService.getTopSellers(limit, lang);

    const result = {
      success: true,
      data: {
        products: topSellers,
        total_items: topSellers.length
      }
    };

    cache.set(cacheKey, result, 3 * 60 * 1000);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching top sellers:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch top sellers',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}