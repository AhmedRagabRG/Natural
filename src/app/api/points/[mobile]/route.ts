import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Optional: endpoint to update by mobile via /api/points/{mobile}
export async function PUT(_req: NextRequest, context: { params: any }) {
  try {
    const params = await context.params;
    const mobile = params?.mobile;
    const body = await _req.json();
    const { redeem_points, status } = body || {};

    if (!mobile) {
      return NextResponse.json({ error: 'mobile is required' }, { status: 400 });
    }

    const [rows]: any = await pool.query(
      'SELECT id FROM af_pointredeems WHERE mobile = ? ORDER BY created_at DESC LIMIT 1',
      [mobile]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'No record found for this mobile' }, { status: 404 });
    }

    const id = rows[0].id as number;

    const fields: string[] = [];
    const values: any[] = [];
    if (typeof redeem_points === 'number') { fields.push('redeem_points = ?'); values.push(redeem_points); }
    if (typeof status !== 'undefined') { fields.push('status = ?'); values.push(status); }

    if (!fields.length) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(id);
    await pool.query(`UPDATE af_pointredeems SET ${fields.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ id, mobile, redeem_points, status });
  } catch (err: any) {
    console.error('PUT /api/points/[mobile] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}