import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const blogs = await BlogService.getFeaturedBlogs(limit);

    return NextResponse.json({
      success: true,
      message: 'Featured blogs retrieved successfully',
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch featured blogs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}