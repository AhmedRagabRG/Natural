import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '../../../../lib/db';

interface GuestOrderQueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  order?: string;
  email?: string;
  mobile?: string;
  status?: string;
  payment_status?: string;
  order_status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

// GET /api/orders/guest - List guest orders with pagination and filters
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
      payment_status: searchParams.get('payment_status') || undefined,
      order_status: searchParams.get('order_status') || undefined,
      search: searchParams.get('search') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    };

    const page = parseInt(queryParams.page || '1', 10);
    const limit = parseInt(queryParams.limit || '10', 10);

    const requestedSortField = (queryParams.sort || 'order_id').toString();
    const requestedSortOrder = (queryParams.order || 'DESC').toString().toUpperCase();

    const allowedSortFields = ['order_id', 'created_at', 'total', 'status', 'payment_status', 'order_status'];
    const sortField = allowedSortFields.includes(requestedSortField)
      ? requestedSortField
      : 'order_id';

    const sortOrder = requestedSortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Build search parameter - prioritize mobile, then email, then general search
    const searchTerm = queryParams.mobile || queryParams.email || queryParams.search;

    const result = await OrderService.getAllGuestOrders({
      page,
      limit,
      sort: sortField,
      order: sortOrder,
      status: queryParams.status,
      payment_status: queryParams.payment_status,
      order_status: queryParams.order_status,
      search: searchTerm,
      start_date: queryParams.start_date,
      end_date: queryParams.end_date
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

// POST /api/orders/guest - Create a new guest order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['user_name', 'email', 'mobile', 'amount', 'total'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            message: `Missing required field: ${field}`
          },
          { status: 400 }
        );
      }
    }

    // Filter only allowed fields
    const allowedFields = [
      'user_name', 'user_city', 'email', 'mobile', 'whatsapp_number',
      'amount', 'delivery_charges', 'discount', 'service_fee', 'redeem_amount',
      'shipping_charges', 'over_weight_fee', 'total', 'address', 'delivery_type', 'card_type',
      'payment_type', 'payment_status', 'vat_number', 'awb_id', 'status', 'order_status'
    ];

    // Convert string values to integers for database fields
    const processedData = { ...body };
    
    // Convert payment_type: 'cash' -> 1, 'card' -> 2, or keep as integer
    if (typeof processedData.payment_type === 'string') {
      if (processedData.payment_type === 'cash') {
        processedData.payment_type = 1;
      } else if (processedData.payment_type === 'card') {
        processedData.payment_type = 2;
      } else {
        processedData.payment_type = parseInt(processedData.payment_type) || 1;
      }
    }
    
    // Convert payment_status: 'pending' -> 0, 'success' -> 1, 'failed' -> 2, or keep as integer
    if (typeof processedData.payment_status === 'string') {
      if (processedData.payment_status === 'pending') {
        processedData.payment_status = 0;
      } else if (processedData.payment_status === 'success') {
        processedData.payment_status = 1;
      } else if (processedData.payment_status === 'failed') {
        processedData.payment_status = 2;
      } else {
        processedData.payment_status = parseInt(processedData.payment_status) || 0;
      }
    }
    
    // Convert status: 'pending' -> 0, 'placed' -> 1, 'dispatched' -> 2, etc., or keep as integer
    if (typeof processedData.status === 'string') {
      const statusMap: { [key: string]: number } = {
        'pending': 0,
        'placed': 1,
        'dispatched': 2,
        'on_the_way': 3,
        'completed': 4,
        'cancelled': 5
      };
      processedData.status = statusMap[processedData.status] !== undefined 
        ? statusMap[processedData.status] 
        : parseInt(processedData.status) || 0;
    }

    // Create the guest order
    const order = await OrderService.createGuestOrder(processedData);

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        data: order
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating guest order:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}