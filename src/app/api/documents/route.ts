import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const country = searchParams.get('country')?.trim() || '';
  const search  = searchParams.get('search')?.trim()  || '';

  // Build a safe parameterised query — never interpolate user input directly.
  const conditions: string[] = [];
  const values: unknown[]    = [];
  let   n = 1; // parameter counter

  if (country) {
    conditions.push(`country = $${n++}`);
    values.push(country);
  }

  if (search) {
    // Reuse the same $N for both columns — PostgreSQL allows duplicate references.
    conditions.push(`(file_name ILIKE $${n} OR source_name ILIKE $${n})`);
    values.push(`%${search}%`);
    n++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT id, file_name, file_type, source_name, country, file_size, uploaded_at
    FROM documents
    ${where}
    ORDER BY uploaded_at DESC
  `;

  try {
    const result = await pool.query(sql, values);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[GET /api/documents] DB error:', err);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }
}
