import { NextRequest, NextResponse } from 'next/server';
import { OrderService, GuestOrder } from '../../../lib/db';

interface GuestOrderQueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  order?: string;
  email?: string;
  mobile?: string;
  status?: string;
}

// GET /api/orders - List guest orders with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams: GuestOrderQueryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
      email: searchParams.get('email') || undefined,
      mobile: searchParams.get('mobile') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const page = parseInt(queryParams.page || '1', 10);
    const limit = parseInt(queryParams.limit || '10', 10);
    const offset = (page - 1) * limit;

    const requestedSortField = (queryParams.sort || 'order_id').toString();
    const requestedSortOrder = (queryParams.order || 'DESC').toString().toUpperCase();

    const allowedSortFields = ['order_id', 'created_at', 'total', 'status'];
    const sortField = allowedSortFields.includes(requestedSortField)
      ? requestedSortField
      : 'order_id';

    const sortOrder = requestedSortOrder === 'ASC' ? 'ASC' : 'DESC';

    const result = await OrderService.getAllGuestOrders({
      page,
      limit,
      sort: sortField,
      order: sortOrder,
      status: queryParams.status,
      search: queryParams.email || queryParams.mobile
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching guest orders:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch guest orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new guest order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.user_name || !body.email || !body.mobile || !body.address) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: user_name, email, mobile, address'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email format'
        },
        { status: 400 }
      );
    }

    // Create the guest order
    const orderData = {
      user_name: body.user_name,
      user_city: body.user_city || null,
      email: body.email,
      mobile: body.mobile,
      whatsapp_number: body.whatsapp_number || null,
      amount: body.amount || 0,
      delivery_charges: body.delivery_charges || 0,
      discount: body.discount || 0,
      service_fee: body.service_fee || 0,
      redeem_amount: body.redeem_amount || 0,
      shipping_charges: body.shipping_charges || 0,
      over_weight_fee: body.over_weight_fee || 0,
      total: body.total || 0,
      address: body.address || null,
      delivery_type: body.delivery_type || '1',
      card_type: body.card_type || null,
      payment_type: body.payment_type || '1',
      payment_status: body.payment_status || '0',
      vat_number: body.vat_number || null,
      awb_id: body.awb_id || null,
      status: body.status || '1',
      order_status: body.order_status || null
    };

    // Filter out null values to avoid sending them to database
    const filteredOrderData = Object.fromEntries(
      Object.entries(orderData).filter(([_, value]) => value !== null)
    );

    const result = await OrderService.createGuestOrder(filteredOrderData);

    return NextResponse.json(
      {
        success: true,
        message: 'Guest order created successfully',
        data: result
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating guest order:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create guest order',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}