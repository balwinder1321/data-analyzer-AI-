// File Upload API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseCSV } from '@/lib/parsers/csv';
import { parseXLSX } from '@/lib/parsers/xlsx';
import { db, COLLECTIONS, DBDataset } from '@/lib/db';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    // Validate file type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      return NextResponse.json({ error: `Unsupported file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}` }, { status: 400 });
    }

    let parsed;
    try {
      if (ext === '.csv') {
        const text = await file.text();
        parsed = parseCSV(text);
      } else if (ext === '.xlsx' || ext === '.xls') {
        const buffer = await file.arrayBuffer();
        parsed = parseXLSX(buffer);
      } else {
        return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
      }
    } catch (parseError) {
      return NextResponse.json({
        error: 'Failed to parse file. Please check the file format.',
        details: process.env.NODE_ENV === 'development' ? String(parseError) : undefined,
      }, { status: 400 });
    }

    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: 'The file contains no data rows.' }, { status: 400 });
    }

    // Create dataset
    const name = file.name.replace(/\.[^/.]+$/, '');
    const dataset = db.create<DBDataset>(COLLECTIONS.DATASETS, {
      name,
      source: 'UPLOAD',
      sourceMetadata: JSON.stringify({ filename: file.name, size: file.size, type: file.type }),
      columns: JSON.stringify(parsed.columns.map(c => c.name)),
      rowCount: parsed.rowCount,
      status: 'READY',
      data: JSON.stringify(parsed.rows),
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: dataset.id,
        name: dataset.name,
        rowCount: parsed.rowCount,
        columns: parsed.columns,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
