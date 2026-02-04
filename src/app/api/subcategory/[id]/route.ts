import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid subcategory ID' 
        },
        { status: 400 }
      );
    }

    const subcategory = await CategoryService.getSubcategoryById(id);

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
    console.error('Error fetching subcategory:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}