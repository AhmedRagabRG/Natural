import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// Types for Order Items
interface OrderItem {
  id?: number;
  order_id: number;
  product_id: number;
  name?: string;
  price: number;
  quantity: number;
  total: number;
  tracking_id: string;
  item_status?: number;
  is_paid?: number;
  pay_vendor?: number;
  pay_vendor_status?: number;
  created_at?: number;
}

// GET /api/orders/items - Get order items with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    
    const orderId = searchParams.get('order_id');
    const productId = searchParams.get('product_id');
    const itemStatus = searchParams.get('item_status');
    const isPaid = searchParams.get('is_paid');
    const trackingId = searchParams.get('tracking_id');

    const connection = await pool.getConnection();
    
    try {
      let whereClause = 'WHERE 1=1';
      const queryParams: (string | number)[] = [];

      if (orderId) {
        whereClause += ` AND order_id = ?`;
        queryParams.push(parseInt(orderId, 10));
      }

      if (productId) {
        whereClause += ` AND product_id = ?`;
        queryParams.push(parseInt(productId, 10));
      }

      if (itemStatus !== null && itemStatus !== undefined) {
        whereClause += ` AND item_status = ?`;
        queryParams.push(parseInt(itemStatus, 10));
      }

      if (isPaid !== null && isPaid !== undefined) {
        whereClause += ` AND is_paid = ?`;
        queryParams.push(parseInt(isPaid, 10));
      }

      if (trackingId) {
        whereClause += ` AND tracking_id LIKE ?`;
        queryParams.push(`%${trackingId}%`);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM af_guestorder_items ${whereClause}`;
      const [countResult] = await connection.execute(countQuery, queryParams);
      const total = (countResult as { total: number }[])[0].total;

      // Get paginated results with product details
      const selectQuery = `
        SELECT 
          oi.*,
          COALESCE(oi.name, p.name) as product_name,
          p.product_code,
          p.images as product_images
        FROM af_guestorder_items oi
        LEFT JOIN af_products p ON oi.product_id = p.product_id
        ${whereClause}
        ORDER BY oi.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [items] = await connection.execute(selectQuery, [...queryParams, limit, offset]);

      return NextResponse.json({
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching order items:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch order items',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/orders/items - Create new order item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
      const requiredFields = ['order_id', 'product_id', 'price', 'quantity', 'total', 'tracking_id'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }

      // Validate name field if provided
      if (body.name && typeof body.name !== 'string') {
        return NextResponse.json(
          { error: 'Name must be a string' },
          { status: 400 }
        );
      }

    const connection = await pool.getConnection();
    
    try {
      // Check if order exists
      const orderCheckQuery = 'SELECT order_id FROM af_guestorders WHERE order_id = ?';
      const [orderExists] = await connection.execute(orderCheckQuery, [body.order_id]);
      
      if ((orderExists as { order_id: number }[]).length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Order not found'
          },
          { status: 404 }
        );
      }

      // Check if product exists and get product name if not provided
      const productCheckQuery = 'SELECT product_id, name FROM af_products WHERE product_id = ?';
      const [productExists] = await connection.execute(productCheckQuery, [body.product_id]);
      
      if ((productExists as { product_id: number; name: string }[]).length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Product not found'
          },
          { status: 404 }
        );
      }

      // Use provided name or get from product
      const productName = body.name || (productExists as { product_id: number; name: string }[])[0].name;

      // Create the order item
      const now = new Date();
      const insertQuery = `
        INSERT INTO af_guestorder_items (
          order_id, product_id, price, quantity, total, tracking_id,
          item_status, is_paid, pay_vendor, pay_vendor_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        body.order_id,
        body.product_id,
        body.price,
        body.quantity,
        body.total,
        body.tracking_id,
        body.item_status || 0,
        body.is_paid || 0,
        body.pay_vendor || 0,
        body.pay_vendor_status || 0,
        now
      ];

      const [result] = await connection.execute(insertQuery, values);
      const insertId = (result as { insertId: number }).insertId;

      // Get the created item with product details
      const selectQuery = `
        SELECT 
          oi.*,
          p.name as product_name,
          p.product_code,
          p.images as product_images
        FROM af_guestorder_items oi
        LEFT JOIN af_products p ON oi.product_id = p.product_id
        WHERE oi.id = ?
      `;
      
      const [createdItem] = await connection.execute(selectQuery, [insertId]);

      return NextResponse.json(
        {
          success: true,
          message: 'Order item created successfully',
          data: (createdItem as OrderItem[])[0]
        },
        { status: 201 }
      );

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating order item:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create order item',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}