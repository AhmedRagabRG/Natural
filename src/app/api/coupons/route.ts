import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') ? parseInt(searchParams.get('status')!) : undefined;
    const search = searchParams.get('search') || undefined;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const result = await CouponService.getAllCoupons({
      page,
      limit,
      status,
      search
    });

    return NextResponse.json({
      success: true,
      data: result.coupons,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, discount, coupon_code, numberoftime, expire_date, status } = body;

    // Validate required fields
    if (!name || !description || discount === undefined || !coupon_code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, discount, coupon_code' },
        { status: 400 }
      );
    }

    // Validate discount
    if (typeof discount !== 'number' || discount < 0) {
      return NextResponse.json(
        { error: 'Discount must be a positive number' },
        { status: 400 }
      );
    }

    const coupon = await CouponService.createCoupon({
      name,
      description,
      discount,
      coupon_code,
      numberoftime,
      expire_date,
      status
    });

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    
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