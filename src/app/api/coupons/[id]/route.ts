import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Invalid coupon ID' },
        { status: 400 }
      );
    }

    const coupon = await CouponService.getCouponById(id);

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Invalid coupon ID' },
        { status: 400 }
      );
    }

    // Validate discount if provided
    if (body.discount !== undefined && (typeof body.discount !== 'number' || body.discount < 0)) {
      return NextResponse.json(
        { error: 'Discount must be a positive number' },
        { status: 400 }
      );
    }

    const coupon = await CouponService.updateCoupon(id, body);

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    
    if (error instanceof Error && error.message === 'Coupon code already exists') {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Validate ID parameter
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Invalid coupon ID' },
        { status: 400 }
      );
    }

    const deleted = await CouponService.deleteCoupon(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}