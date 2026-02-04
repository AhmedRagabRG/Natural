import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Table: af_order_referrals (id, order_id, name, number, created_at)
// POST: /api/referrals  { order_id, name, number }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, name, number } = body || {};

    if (order_id === undefined || order_id === null || !name || !number) {
      return NextResponse.json({ error: 'order_id, name and number are required' }, { status: 400 });
    }

    const numericOrderId = Number(order_id);
    if (!Number.isInteger(numericOrderId)) {
      return NextResponse.json({ error: 'order_id must be an integer id from DB (not awb_id)' }, { status: 400 });
    }

    // Basic normalization for number: keep digits only
    const normalizedNumber = String(number).replace(/\D/g, '');

    const [result]: any = await pool.query(
      'INSERT INTO af_order_referrals (`order_id`, `name`, `number`, `created_at`) VALUES (?, ?, ?, NOW())',
      [numericOrderId, name, normalizedNumber]
    );

    return NextResponse.json({
      id: result.insertId,
      order_id,
      name,
      number: normalizedNumber,
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('POST /api/referrals error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}