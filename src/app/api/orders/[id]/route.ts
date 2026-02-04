import { NextRequest, NextResponse } from 'next/server';
import { OrderService, GuestOrder } from '../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/orders/[id] - Get single guest order by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Validate ID
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid order ID'
        },
        { status: 400 }
      );
    }

    const result = await OrderService.getGuestOrderById(orderId);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: 'Guest order not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching guest order by id:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch guest order',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update guest order
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate ID
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid order ID'
        },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await OrderService.getGuestOrderById(orderId);

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message: 'Guest order not found'
        },
        { status: 404 }
      );
    }

    // Filter only allowed fields
    const allowedFields = [
      'user_name', 'user_city', 'email', 'mobile', 'whatsapp_number',
      'amount', 'delivery_charges', 'discount', 'service_fee', 'redeem_amount',
      'shipping_charges', 'over_weight_fee', 'total', 'address', 'delivery_type', 'card_type',
      'payment_type', 'payment_status', 'vat_number', 'awb_id', 'status', 'order_status'
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid fields to update'
        },
        { status: 400 }
      );
    }

    const result = await OrderService.updateGuestOrder(orderId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Guest order updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating guest order:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update guest order',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete guest order
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Validate ID
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid order ID'
        },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await OrderService.getGuestOrderById(orderId);

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message: 'Guest order not found'
        },
        { status: 404 }
      );
    }

    // Delete the order
    const deleted = await OrderService.deleteGuestOrder(orderId);
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to delete guest order'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Guest order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting guest order:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete guest order',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}