import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '../../../../lib/db';
import pool from '../../../../lib/db';

// GET /api/orders/stats - Get order statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const connection = await pool.getConnection();
    
    try {
      let dateFilter = '';
      const queryParams: (string | number)[] = [];
      let paramIndex = 1;

      if (startDate && endDate) {
        dateFilter = `WHERE created_at BETWEEN ? AND ?`;
        queryParams.push(
          new Date(startDate).getTime() / 1000,
          new Date(endDate).getTime() / 1000
        );
        paramIndex += 2;
      } else {
        const daysAgo = parseInt(period, 10) || 30;
        const startTimestamp = Math.floor((Date.now() - (daysAgo * 24 * 60 * 60 * 1000)) / 1000);
        dateFilter = `WHERE created_at >= ?`;
        queryParams.push(startTimestamp);
        paramIndex++;
      }

      // Total orders count
      const totalOrdersQuery = `SELECT COUNT(*) as total FROM af_guestorders ${dateFilter}`;
      const [totalOrdersResult] = await connection.execute(totalOrdersQuery, queryParams);
      const totalOrders = (totalOrdersResult as { total: number }[])[0].total;

      // Total revenue
      const totalRevenueQuery = `SELECT SUM(total) as revenue FROM af_guestorders ${dateFilter}`;
      const [totalRevenueResult] = await connection.execute(totalRevenueQuery, queryParams);
      const totalRevenue = (totalRevenueResult as { revenue: number | null }[])[0].revenue || 0;

      // Average order value
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Orders by status
      const ordersByStatusQuery = `
        SELECT 
          CASE 
            WHEN status = 0 THEN 'pending'
            WHEN status = 1 THEN 'placed'
            WHEN status = 2 THEN 'dispatched'
            WHEN status = 3 THEN 'on_the_way'
            WHEN status = 4 THEN 'completed'
            WHEN status = 5 THEN 'cancelled'
            ELSE 'unknown'
          END as status_name,
          COUNT(*) as count
        FROM af_guestorders 
        ${dateFilter}
        GROUP BY status
      `;
      const [ordersByStatusResult] = await connection.execute(ordersByStatusQuery, queryParams);

      // Orders by payment status
      const ordersByPaymentQuery = `
        SELECT 
          CASE 
            WHEN payment_status = 0 THEN 'pending'
            WHEN payment_status = 1 THEN 'success'
            WHEN payment_status = 2 THEN 'failed'
            ELSE 'unknown'
          END as payment_status_name,
          COUNT(*) as count
        FROM af_guestorders 
        ${dateFilter}
        GROUP BY payment_status
      `;
      const [ordersByPaymentResult] = await connection.execute(ordersByPaymentQuery, queryParams);

      // Daily orders (last 7 days)
      const dailyOrdersQuery = `
        SELECT 
          DATE(FROM_UNIXTIME(created_at)) as date,
          COUNT(*) as orders,
          SUM(total) as revenue
        FROM af_guestorders 
        WHERE created_at >= ?
        GROUP BY DATE(FROM_UNIXTIME(created_at))
        ORDER BY date DESC
        LIMIT 7
      `;
      const last7DaysTimestamp = Math.floor((Date.now() - (7 * 24 * 60 * 60 * 1000)) / 1000);
      const [dailyOrdersResult] = await connection.execute(dailyOrdersQuery, [last7DaysTimestamp]);

      // Top customers by order count
      const topCustomersQuery = `
        SELECT 
          user_name,
          email,
          COUNT(*) as order_count,
          SUM(total) as total_spent
        FROM af_guestorders 
        ${dateFilter}
        GROUP BY user_name, email
        ORDER BY order_count DESC
        LIMIT 10
      `;
      const [topCustomersResult] = await connection.execute(topCustomersQuery, queryParams);

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            total_orders: totalOrders,
            total_revenue: Number(totalRevenue.toFixed(2)),
            average_order_value: Number(avgOrderValue.toFixed(2))
          },
          orders_by_status: ordersByStatusResult,
          orders_by_payment_status: ordersByPaymentResult,
          daily_orders: dailyOrdersResult,
          top_customers: topCustomersResult
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching order statistics:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch order statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}