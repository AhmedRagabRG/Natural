import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/db';

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
          message: 'Invalid blog ID'
        },
        { status: 400 }
      );
    }

    const blog = await BlogService.getBlogById(id);

    if (!blog) {
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
      message: 'Blog retrieved successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch blog',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}