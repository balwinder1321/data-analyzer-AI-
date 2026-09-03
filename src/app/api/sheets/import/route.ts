// Google Sheets URL Import Route
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseCSV } from '@/lib/parsers/csv';
import { db, COLLECTIONS, DBDataset } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, sheetName } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'A valid Google Sheets URL is required' }, { status: 400 });
    }

    let csvUrl = url.trim();

    // Check if it's a standard Google Docs spreadsheet URL
    // Format: https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid={gid}
    const match = csvUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const spreadsheetId = match[1];
      let gid = '0';
      const gidMatch = csvUrl.match(/[#&?]gid=([0-9]+)/);
      if (gidMatch) {
        gid = gidMatch[1];
      }
      csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    }

    // Fetch the CSV export from Google Sheets
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'AR-Analytics-Agent/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Unable to download sheet (${response.status}). Ensure the Google Sheet sharing setting is set to "Anyone with the link can view".`,
        },
        { status: 400 }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    // Check if Google returned an HTML login page instead of CSV
    if (contentType.includes('text/html') || text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com')) {
      return NextResponse.json(
        {
          error: 'The Google Sheet is private. Please set link sharing to "Anyone with the link can view" to import.',
        },
        { status: 400 }
      );
    }

    // Parse CSV data
    const parsed = parseCSV(text);
    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: 'The Google Sheet contains no data rows' }, { status: 400 });
    }

    const name = sheetName?.trim() || `Google Sheet — ${new Date().toLocaleDateString()}`;

    const dataset = db.create<DBDataset>(COLLECTIONS.DATASETS, {
      name,
      source: 'GOOGLE_SHEET',
      sourceMetadata: JSON.stringify({ originalUrl: url, importedAt: new Date().toISOString() }),
      columns: JSON.stringify(parsed.columns.map((c) => c.name)),
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
    console.error('Google Sheets import error:', error);
    return NextResponse.json({ error: 'Failed to import Google Sheet. Please check the URL.' }, { status: 500 });
  }
}
