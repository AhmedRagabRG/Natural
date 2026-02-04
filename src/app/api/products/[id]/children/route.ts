import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const children = await ProductService.getChildProducts(productId);

    return NextResponse.json({
      success: true,
      children,
      count: children.length
    });
  } catch (error) {
    console.error('Error fetching child products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
