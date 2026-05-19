import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const sql = `
        SELECT
            COUNT(*)                                                        AS total,
            COUNT(CASE WHEN file_type = 'pdf'     THEN 1 END)              AS pdf,
            COUNT(CASE WHEN file_type = 'docx'    THEN 1 END)              AS docx,
            COUNT(CASE WHEN file_type = 'xlsx'    THEN 1 END)              AS xlsx,
            COUNT(CASE WHEN file_type = 'txt'     THEN 1 END)              AS txt,
            COUNT(CASE WHEN country = 'global'    THEN 1 END)              AS global,
            COUNT(CASE WHEN country = 'algeria'   THEN 1 END)              AS algeria,
            COUNT(CASE WHEN country = 'oman'      THEN 1 END)              AS oman,
            COUNT(CASE WHEN country = 'ksa'       THEN 1 END)              AS ksa,
            COUNT(CASE WHEN country = 'egypt'     THEN 1 END)              AS egypt,
            COUNT(CASE WHEN country = 'iraq'      THEN 1 END)              AS iraq,
            COUNT(CASE WHEN country = 'kuwait'    THEN 1 END)              AS kuwait,
            COUNT(CASE WHEN country = 'uae'       THEN 1 END)              AS uae,
            COUNT(CASE WHEN country = 'abudhabi'  THEN 1 END)              AS abudhabi,
            COUNT(CASE WHEN country = 'qatar'     THEN 1 END)              AS qatar,
            COUNT(CASE WHEN country = 'bahrain'   THEN 1 END)              AS bahrain,
            COUNT(CASE WHEN country = 'libya'     THEN 1 END)              AS libya,
            COUNT(CASE WHEN country = 'nigeria'   THEN 1 END)              AS nigeria,
            COUNT(CASE WHEN uploaded_at > NOW() - INTERVAL '7 days' THEN 1 END) AS recent,
            COALESCE(SUM(file_size) / 1048576.0, 0)                        AS total_size_mb
        FROM documents;
    `;

    try {
        const result = await pool.query(sql);
        const row = result.rows[0];

        const num = (v: unknown) => parseInt(String(v), 10) || 0;

        return NextResponse.json({
            total:         num(row.total),
            byType: {
                pdf:  num(row.pdf),
                docx: num(row.docx),
                xlsx: num(row.xlsx),
                txt:  num(row.txt),
            },
            byCountry: {
                global:   num(row.global),
                algeria:  num(row.algeria),
                oman:     num(row.oman),
                ksa:      num(row.ksa),
                egypt:    num(row.egypt),
                iraq:     num(row.iraq),
                kuwait:   num(row.kuwait),
                uae:      num(row.uae),
                abudhabi: num(row.abudhabi),
                qatar:    num(row.qatar),
                bahrain:  num(row.bahrain),
                libya:    num(row.libya),
                nigeria:  num(row.nigeria),
            },
            recentUploads: num(row.recent),
            totalSizeMB:   parseFloat(parseFloat(row.total_size_mb).toFixed(1)),
        });
    } catch (err) {
        console.error('[GET /api/documents/stats] DB error:', err);
        return NextResponse.json({ error: 'Database error.' }, { status: 500 });
    }
}
