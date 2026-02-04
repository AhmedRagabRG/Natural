import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Validate code parameter
    if (!code || code.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = await CouponService.useCoupon(code.trim());

    if (!result.valid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'message' in result ? result.message : 'Invalid coupon' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon used successfully',
      data: result.coupon
    });
  } catch (error) {
    console.error('Error using coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}