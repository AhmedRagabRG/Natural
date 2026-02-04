import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const sort = searchParams.get('sort') || 'cat_priority';
    const order = searchParams.get('order') || 'ASC';
    const status = searchParams.get('status') || undefined;
    const include_subcategories = searchParams.get('include_subcategories') === 'true';
    const parent_id = searchParams.get('parent_id') ? parseInt(searchParams.get('parent_id')!) : undefined;

    // Validate pagination parameters if provided
    if ((page !== undefined && page < 1) || (limit !== undefined && (limit < 1 || limit > 100))) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const result = await CategoryService.getAllCategories({
      page,
      limit,
      sort,
      order,
      status,
      include_subcategories,
      parent_id
    });

    return NextResponse.json({
      success: true,
      data: result.categories,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}