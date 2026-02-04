import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Validate code parameter
    if (!code || code.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 400 }
      );
    }

    const validation = await CouponService.validateCoupon(code.trim());

    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          message: validation.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon is valid',
      data: validation.coupon
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}