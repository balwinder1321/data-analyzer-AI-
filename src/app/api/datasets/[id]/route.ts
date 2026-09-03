// Single Dataset API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, COLLECTIONS, DBDataset, DBAnalysisRun, DBInsight, DBAnomaly } from '@/lib/db';

// GET /api/datasets/[id] — Get full dataset with analysis
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const dataset = db.findById<DBDataset>(COLLECTIONS.DATASETS, id);
    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Get latest analysis run
    const runs = db.findMany<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, r => r.datasetId === id);
    const latestRun = runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

    // Get insights and anomalies
    const insights = db.findMany<DBInsight>(COLLECTIONS.INSIGHTS, i => i.datasetId === id);
    const anomalies = db.findMany<DBAnomaly>(COLLECTIONS.ANOMALIES, a => a.datasetId === id);

    // Parse data for preview (limited rows)
    let previewRows = [];
    if (dataset.data) {
      const allRows = JSON.parse(dataset.data);
      previewRows = allRows.slice(0, 100);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: dataset.id,
        name: dataset.name,
        source: dataset.source,
        rowCount: dataset.rowCount,
        status: dataset.status,
        columns: dataset.columns ? JSON.parse(dataset.columns) : [],
        createdAt: dataset.createdAt,
        previewRows,
        analysis: latestRun ? {
          status: latestRun.status,
          profile: latestRun.profile ? JSON.parse(latestRun.profile) : null,
          quality: latestRun.quality ? JSON.parse(latestRun.quality) : null,
          kpis: latestRun.kpis ? JSON.parse(latestRun.kpis) : null,
          trends: latestRun.trends ? JSON.parse(latestRun.trends) : null,
          correlations: latestRun.correlations ? JSON.parse(latestRun.correlations) : null,
          executiveSummary: latestRun.executiveSummary,
          completedAt: latestRun.completedAt,
        } : null,
        insights,
        anomalies,
      },
    });
  } catch (error) {
    console.error('Dataset fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: 500 });
  }
}

// DELETE /api/datasets/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    db.deleteMany<DBAnalysisRun>(COLLECTIONS.ANALYSIS_RUNS, r => r.datasetId === id);
    db.deleteMany<DBInsight>(COLLECTIONS.INSIGHTS, i => i.datasetId === id);
    db.deleteMany<DBAnomaly>(COLLECTIONS.ANOMALIES, a => a.datasetId === id);
    db.delete(COLLECTIONS.DATASETS, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dataset delete error:', error);
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 });
  }
}
