// AI Analyst API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, COLLECTIONS, DBDataset } from '@/lib/db';
import { profileDataset, getDateColumns } from '@/lib/analytics/profiler';
import { generateAnalysis } from '@/lib/ai/gemini';
import { DataRow } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, datasetId, history } = await req.json();

    if (!message || !datasetId) {
      return NextResponse.json({ error: 'Message and datasetId are required' }, { status: 400 });
    }

    // Get dataset
    const dataset = db.findById<DBDataset>(COLLECTIONS.DATASETS, datasetId);
    if (!dataset || !dataset.data) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    const rows: DataRow[] = JSON.parse(dataset.data);
    const profile = profileDataset(rows);
    const dateCols = getDateColumns(profile);
    const dateColumn = dateCols.length > 0 ? dateCols[0].name : undefined;

    const result = await generateAnalysis(
      message,
      rows,
      profile,
      dateColumn,
      history
    );

    return NextResponse.json({
      success: true,
      data: {
        response: result.text,
        toolCalls: result.toolCalls.map(tc => ({
          name: tc.name,
          status: 'complete',
        })),
      },
    });
  } catch (error) {
    console.error('AI Analyst error:', error);
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 });
  }
}
