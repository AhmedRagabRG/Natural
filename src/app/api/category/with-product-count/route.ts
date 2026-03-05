import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const categories = await CategoryService.getCategoriesForHomepage();

    return NextResponse.json({
      success: true,
      data: categories
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching categories with product count:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}