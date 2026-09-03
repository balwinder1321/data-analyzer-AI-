// Dataset CRUD API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, COLLECTIONS, DBDataset, DBAnalysisRun, DBInsight, DBAnomaly } from '@/lib/db';
import { generateDemoDataset } from '@/lib/demo/dataset';

// GET /api/datasets — List all datasets for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const datasets = db.findMany<DBDataset>(COLLECTIONS.DATASETS, d => d.userId === session.user!.id);
    
    // Enrich with latest analysis run info
    const enriched = datasets.map(d => {
      const runs = db.findMany<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, r => r.datasetId === d.id);
      const latestRun = runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
      return {
        ...d,
        data: undefined, // Don't send raw data in list
        latestAnalysis: latestRun ? {
          status: latestRun.status,
          completedAt: latestRun.completedAt,
        } : null,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Dataset list error:', error);
    return NextResponse.json({ error: 'Failed to list datasets' }, { status: 500 });
  }
}

// POST /api/datasets — Create dataset (used after upload/import)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, source, data, columns, rowCount, sourceMetadata } = body;

    if (!name || !data) {
      return NextResponse.json({ error: 'Name and data are required' }, { status: 400 });
    }

    const dataset = db.create<DBDataset>(COLLECTIONS.DATASETS, {
      name,
      source: source || 'UPLOAD',
      sourceMetadata: sourceMetadata ? JSON.stringify(sourceMetadata) : undefined,
      columns: columns ? JSON.stringify(columns) : undefined,
      rowCount: rowCount || 0,
      status: 'READY',
      data: typeof data === 'string' ? data : JSON.stringify(data),
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, data: { id: dataset.id, name: dataset.name } });
  } catch (error) {
    console.error('Dataset create error:', error);
    return NextResponse.json({ error: 'Failed to create dataset' }, { status: 500 });
  }
}
