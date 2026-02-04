import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

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

// GET /api/orders/items/[id] - Get single order item by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Validate ID
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid item ID'
        },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          oi.*,
          COALESCE(oi.name, p.name) as product_name,
          p.product_code,
          p.images as product_images,
          go.user_name,
          go.email
        FROM af_guestorder_items oi
        LEFT JOIN af_products p ON oi.product_id = p.product_id
        LEFT JOIN af_guestorders go ON oi.order_id = go.order_id
        WHERE oi.id = ?
      `;
      
      const [rows] = await connection.execute(query, [itemId]);
      const item = (rows as OrderItem[])[0];

      if (!item) {
        return NextResponse.json(
          {
            success: false,
            message: 'Order item not found'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: item
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching order item by id:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch order item',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/orders/items/[id] - Update order item
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate ID
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid item ID'
        },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Check if item exists
      const checkQuery = 'SELECT id FROM af_guestorder_items WHERE id = ?';
      const [existingItem] = await connection.execute(checkQuery, [itemId]);

      if ((existingItem as { id: number }[]).length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Order item not found'
          },
          { status: 404 }
        );
      }

      // Filter only allowed fields
      const allowedFields = [
        'product_id', 'name', 'price', 'quantity', 'total', 'tracking_id',
        'item_status', 'is_paid', 'pay_vendor', 'pay_vendor_status'
      ];

      const updateFields: string[] = [];
      const updateValues: (string | number)[] = [];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(body[field]);
        }
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'No valid fields to update'
          },
          { status: 400 }
        );
      }

      // Add item ID as the last parameter
      updateValues.push(itemId);

      const updateQuery = `
        UPDATE af_guestorder_items 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await connection.execute(updateQuery, updateValues);

      // Get the updated item with product details
      const selectQuery = `
        SELECT 
          oi.*,
          COALESCE(oi.name, p.name) as product_name,
          p.product_code,
          p.images as product_images
        FROM af_guestorder_items oi
        LEFT JOIN af_products p ON oi.product_id = p.product_id
        WHERE oi.id = ?
      `;
      
      const [updatedItem] = await connection.execute(selectQuery, [itemId]);

      return NextResponse.json({
        success: true,
        message: 'Order item updated successfully',
        data: (updatedItem as OrderItem[])[0]
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating order item:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update order item',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/items/[id] - Delete order item
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Validate ID
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid item ID'
        },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Check if item exists
      const checkQuery = 'SELECT id FROM af_guestorder_items WHERE id = ?';
      const [existingItem] = await connection.execute(checkQuery, [itemId]);

      if ((existingItem as { id: number }[]).length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Order item not found'
          },
          { status: 404 }
        );
      }

      // Delete the item
      const deleteQuery = 'DELETE FROM af_guestorder_items WHERE id = ?';
      const [result] = await connection.execute(deleteQuery, [itemId]);
      
      const affectedRows = (result as { affectedRows: number }).affectedRows;
      
      if (affectedRows === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to delete order item'
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Order item deleted successfully'
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error deleting order item:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete order item',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}