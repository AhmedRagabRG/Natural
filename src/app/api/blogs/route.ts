import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'DESC';
    const status = searchParams.get('status') || 'published';
    const category_id = searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined;
    const search = searchParams.get('search') || undefined;

    const result = await BlogService.getAllBlogs({
      page,
      limit,
      sort,
      order,
      status,
      category_id,
      search
    });

    return NextResponse.json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch blogs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}