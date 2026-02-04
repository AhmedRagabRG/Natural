import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { category_url: string } }
) {
  try {
    const { category_url } = params;
    const { searchParams } = new URL(request.url);
    const include_subcategories = searchParams.get('include_subcategories') === 'true';

    if (!category_url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category URL is required' 
        },
        { status: 400 }
      );
    }

    const category = await CategoryService.getCategoryByUrl(category_url, include_subcategories);

    if (!category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category by URL:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}