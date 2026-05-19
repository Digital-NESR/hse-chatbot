import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const PRODUCTION_URL = 'https://hsechatbot.nesr.com';

export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid multipart form data.' }, { status: 400 });
    }

    const file       = formData.get('file');
    const sourceName = formData.get('source_name');
    const country    = formData.get('country');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing or invalid file field.' }, { status: 400 });
    }
    if (typeof sourceName !== 'string' || !sourceName.trim()) {
      return NextResponse.json({ error: 'Missing source_name field.' }, { status: 400 });
    }
    if (typeof country !== 'string' || !country.trim()) {
      return NextResponse.json({ error: 'Missing country field.' }, { status: 400 });
    }

    const fileName = file.name;
    const fileType = fileName.split('.').pop()?.toLowerCase() ?? 'bin';

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Upload received:', { fileName, sourceName, country, fileSize: buffer.length });

    let result;
    try {
      result = await pool.query<{ id: string }>(
        `INSERT INTO documents (file_name, file_type, source_name, country, file_size, file_data)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [fileName, fileType, sourceName.trim(), country.trim(), buffer.length, buffer],
      );
    } catch (err) {
      console.error('[POST /api/upload] DB error:', err);
      return NextResponse.json({ error: 'Database error.' }, { status: 500 });
    }

    const id          = result.rows[0].id;
    const source_link = `${PRODUCTION_URL}/api/files/${id}`;

    return NextResponse.json({ id, source_link }, { status: 201 });
  } catch (error) {
    console.error('Upload API error:', error);
    return Response.json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
