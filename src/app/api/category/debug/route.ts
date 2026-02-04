import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await CategoryService.getAllCategoriesDebug();

    return NextResponse.json({
      success: true,
      data: result.categories,
      total_items: result.total_items
    });
  } catch (error) {
    console.error('Error fetching categories (debug):', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}