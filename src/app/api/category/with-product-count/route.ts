import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const categories = await CategoryService.getCategoriesWithProductCount();

    return NextResponse.json({
      success: true,
      data: categories
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