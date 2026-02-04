import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, items } = body;

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order ID and items are required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current order details
      const [orderRows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM af_guestorders WHERE order_id = ?',
        [orderId]
      );

      if (orderRows.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      const currentOrder = orderRows[0];

      // Calculate new items total
      let additionalAmount = 0;
      let additionalWeight = 0;

      for (const item of items) {
        const itemTotal = item.price * item.quantity;
        additionalAmount += itemTotal;
        additionalWeight += (item.weight || 0) * item.quantity;
      }

      // Calculate new shipping if needed (based on new total weight)
      const currentWeight = 0; // We'd need to calculate from existing items
      const newTotalWeight = currentWeight + additionalWeight;
      
      // Calculate new shipping based on new subtotal
      const newSubtotal = (currentOrder.amount || 0) + additionalAmount;
      let newShipping = 0;
      if (newSubtotal <= 100) {
        newShipping = 10;
      } else if (newSubtotal <= 200) {
        newShipping = 4;
      }

      // Calculate over weight fee
      const overWeightFee = newTotalWeight > 8 ? Math.floor(newTotalWeight - 8) * 1 : 0;

      // Calculate new total
      const newTotal = newSubtotal + newShipping + overWeightFee + (currentOrder.service_fee || 0) - (currentOrder.discount || 0) - (currentOrder.redeem_amount || 0);

      // Update order totals
      await connection.execute(
        `UPDATE af_guestorders 
         SET amount = ?, 
             shipping_charges = ?, 
             delivery_charges = ?,
             total = ?
         WHERE order_id = ?`,
        [newSubtotal, newShipping, newShipping, newTotal, orderId]
      );

      // Insert new order items
      for (const item of items) {
        await connection.execute(
          `INSERT INTO af_guestorder_items 
           (order_id, product_id, price, quantity, total, tracking_id, item_status, is_paid)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            parseInt(item.id),
            item.price,
            item.quantity,
            item.price * item.quantity,
            '', // tracking_id (empty for now)
            0,  // item_status (0 = pending)
            0   // is_paid (0 = unpaid)
          ]
        );
      }

      // Calculate additional points earned (3 points per AED)
      const additionalPoints = Math.floor(additionalAmount * 3);
      
      // Add earned points to database if mobile exists
      if (currentOrder.mobile && additionalPoints > 0) {
        await connection.execute(
          'INSERT INTO af_pointredeems (mobile, redeem_points, status, created_at) VALUES (?, ?, ?, NOW())',
          [currentOrder.mobile, -additionalPoints, 2]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          itemsAdded: items.length,
          additionalAmount,
          newTotal,
          pointsEarned: additionalPoints
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error adding items to order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add items to order' },
      { status: 500 }
    );
  }
}
