import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Table: af_pointredeems (id, mobile, redeem_points, status, created_at)
// GET: /api/points?mobile=9715xxxxxxx
// POST: /api/points { mobile, redeem_points, status }
// PUT: /api/points { mobile, redeem_points, status }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get('mobile');
    if (!mobile) {
      return NextResponse.json({ error: 'mobile is required' }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT id, mobile, redeem_points AS redeemPoints, status, created_at AS createdAt FROM af_pointredeems WHERE mobile = ? ORDER BY created_at DESC',
      [mobile]
    );

    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error('GET /api/points error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, redeem_points, status } = body || {};

    if (!mobile || typeof redeem_points !== 'number') {
      return NextResponse.json({ error: 'mobile and redeem_points are required' }, { status: 400 });
    }

    // Special handling for earned points (negative redeem_points, status = 2)
    if (redeem_points < 0 && status === 2) {
      // Check if there's an existing earned points record for this mobile
      const [existingRows]: any = await pool.query(
        'SELECT id, redeem_points FROM af_pointredeems WHERE mobile = ? AND status = 2 ORDER BY created_at DESC LIMIT 1',
        [mobile]
      );

      if (existingRows.length > 0) {
        // Update existing earned points record by adding the new points
        const existingRecord = existingRows[0];
        const newTotalPoints = existingRecord.redeem_points + redeem_points; // Both negative, so this adds them
        
        await pool.query(
          'UPDATE af_pointredeems SET redeem_points = ?, created_at = NOW() WHERE id = ?',
          [newTotalPoints, existingRecord.id]
        );

        return NextResponse.json({ 
          id: existingRecord.id, 
          mobile, 
          redeem_points: newTotalPoints, 
          status,
          action: 'updated_existing_earned_points'
        });
      }
    }

    // Default behavior: create new record (for redemptions or first-time earned points)
    const [result]: any = await pool.query(
      'INSERT INTO af_pointredeems (mobile, redeem_points, status, created_at) VALUES (?, ?, ?, NOW())',
      [mobile, redeem_points, status ?? 1]
    );

    return NextResponse.json({ 
      id: result.insertId, 
      mobile, 
      redeem_points, 
      status: status ?? 1,
      action: 'created_new_record'
    });
  } catch (err: any) {
    console.error('POST /api/points error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, redeem_points, status } = body || {};

    if (!mobile) {
      return NextResponse.json({ error: 'mobile is required' }, { status: 400 });
    }

    // Update the latest record for this mobile (by created_at desc)
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

    if (typeof redeem_points === 'number') {
      fields.push('redeem_points = ?');
      values.push(redeem_points);
    }
    if (typeof status !== 'undefined') {
      fields.push('status = ?');
      values.push(status);
    }

    if (!fields.length) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(id);

    await pool.query(`UPDATE af_pointredeems SET ${fields.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ id, mobile, redeem_points, status });
  } catch (err: any) {
    console.error('PUT /api/points error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}