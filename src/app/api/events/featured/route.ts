import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Validate limit parameter
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (1-50)' },
        { status: 400 }
      );
    }

    const events = await EventService.getFeaturedEvents(limit);

    return NextResponse.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}