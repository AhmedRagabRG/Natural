import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid blog ID'
        },
        { status: 400 }
      );
    }

    const relatedBlogs = await BlogService.getRelatedBlogs(id, limit);

    if (relatedBlogs === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Blog not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Related blogs retrieved successfully',
      data: relatedBlogs
    });
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch related blogs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}