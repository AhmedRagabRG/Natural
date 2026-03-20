import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/lib/db';
import { cache } from '@/utils/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    if (!decodedSlug) {
      return NextResponse.json(
        { error: 'Invalid event URL' },
        { status: 400 }
      );
    }

    const cacheKey = `event:slug:${decodedSlug}`;
    const cachedEvent = cache.get(cacheKey);
    if (cachedEvent) {
      return NextResponse.json(cachedEvent);
    }

    const event = await EventService.getEventByUrl(decodedSlug);

    if (!event) {
      const notFoundResult = {
        success: false,
        error: {
          message: 'Event not found'
        }
      };
      cache.set(cacheKey, notFoundResult, 60 * 1000);
      return NextResponse.json(notFoundResult, { status: 404 });
    }

    const result = {
      success: true,
      data: event
    };

    cache.set(cacheKey, result, 5 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching event by slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
