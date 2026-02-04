import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/db';
import { cache, CACHE_KEYS } from '@/utils/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const sort = searchParams.get('sort') || 'product_id';
    const order = searchParams.get('order') || 'ASC';
    const category_id = searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined;
    const subcategory_id = searchParams.get('subcategory_id') ? parseInt(searchParams.get('subcategory_id')!) : undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search') || undefined;
    const min_price = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined;
    const max_price = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined;
    const lang = searchParams.get('lang') || 'en';

    // Create cache key based on all parameters
    const cacheKey = `products:${JSON.stringify({
      page, limit, sort, order, category_id, subcategory_id, 
      featured, status, search, min_price, max_price, lang
    })}`;

    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Validate pagination parameters if provided
    if ((page !== undefined && page < 1) || (limit !== undefined && (limit < 1 || limit > 100))) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Validate sort field
    const allowedSortFields = ['product_id', 'name', 'price', 'created_at'];
    if (!allowedSortFields.includes(sort)) {
      return NextResponse.json(
        { error: 'Invalid sort field' },
        { status: 400 }
      );
    }

    // Validate order
    if (!['ASC', 'DESC'].includes(order.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid order parameter' },
        { status: 400 }
      );
    }

    const result = await ProductService.getAllProducts({
      page,
      limit,
      sort,
      order,
      category_id,
      subcategory_id,
      featured,
      status,
      search,
      min_price,
      max_price,
      lang
    });

    // Cache the result for 3 minutes (products change frequently)
    cache.set(cacheKey, result, 3 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}