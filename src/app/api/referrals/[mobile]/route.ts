import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: /api/referrals/{mobile}
export async function GET(_req: NextRequest, context: { params: any }) {
  try {
    const params = await context.params;
    const mobile = params?.mobile?.replace(/\D/g, '');
    if (!mobile) return NextResponse.json({ error: 'mobile is required' }, { status: 400 });

    const [rows]: any = await pool.query(
      'SELECT id, order_id, name, number, created_at FROM af_order_referrals WHERE number = ? ORDER BY created_at DESC',
      [mobile]
    );

    return NextResponse.json({ data: rows || [] });
  } catch (err: any) {
    console.error('GET /api/referrals/[mobile] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}