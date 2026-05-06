import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// TODO: Update the n8n "Build source_link" node to use this route's URL pattern:
//   https://hse-chatbot-one.vercel.app/api/files/{id}
// so that Pinecone metadata and the documents table both point here.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CONTENT_TYPES: Record<string, string> = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.ms-excel',
  txt:  'text/plain',
};

// PDF opens inline in the browser; everything else forces a download.
const INLINE_TYPES = new Set(['pdf']);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 });
  }

  let result;
  try {
    result = await pool.query<{
      file_name: string;
      file_type: string;
      file_data: Buffer;
    }>(
      'SELECT file_name, file_type, file_data FROM documents WHERE id = $1',
      [id],
    );
  } catch (err) {
    console.error('[GET /api/files/[id]] DB error:', err);
    return NextResponse.json({ error: 'Database error.' }, { status: 500 });
  }

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  const { file_name, file_type, file_data } = result.rows[0];
  const ext = file_type.toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';

  // Sanitise file_name for the Content-Disposition header value.
  const safeName = file_name.replace(/[^\w.\-\s]/g, '_');
  const disposition = INLINE_TYPES.has(ext)
    ? `inline; filename="${safeName}"`
    : `attachment; filename="${safeName}"`;

  // pg returns BYTEA as a Node.js Buffer (subclass of Uint8Array) — pass directly.
  return new Response(new Uint8Array(file_data), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': disposition,
      'Content-Length': String(file_data.byteLength),
      'Cache-Control': 'private, max-age=300',
    },
  });
}
