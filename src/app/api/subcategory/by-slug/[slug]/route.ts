import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subcategory slug is required' 
        },
        { status: 400 }
      );
    }

    const subcategory = await CategoryService.getSubcategoryByUrl(slug);

    if (!subcategory) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subcategory not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    console.error('Error fetching subcategory by slug:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
