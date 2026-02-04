import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const blogs = await BlogService.getRecentBlogs(limit);

    return NextResponse.json({
      success: true,
      message: 'Recent blogs retrieved successfully',
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching recent blogs:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch recent blogs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}