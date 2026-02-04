import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = params;
    const { searchParams } = new URL(request.url);
    
    const categoryIdNum = parseInt(categoryId);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'product_id';
    const order = searchParams.get('order') || 'ASC';
    const lang = searchParams.get('lang') || 'en';

    // Validate category ID
    if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
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

    // Validate language parameter
    if (!['en', 'ar'].includes(lang)) {
      return NextResponse.json(
        { error: 'Invalid language parameter. Must be en or ar' },
        { status: 400 }
      );
    }

    const result = await ProductService.getProductsByCategory(categoryIdNum, {
      page,
      limit,
      sort,
      order,
      lang
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}